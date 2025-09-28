import { Canvas, ExportFormat, FontLibrary } from 'skia-canvas';
import { formatDuration, truncateText, loadImage } from '../utils/imageUtils';
import { CardConfig, StarRating } from '../types/interfaces';
import log from 'electron-log';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

let fontsLoaded = false;

// Get the correct path to assets based on whether app is packaged or not
function getAssetPath(...paths: string[]): string {
  let RESOURCES_PATH;
  
  if (app.isPackaged) {
    RESOURCES_PATH = path.join(process.resourcesPath, 'assets');
  } else {
    // In development, use the app's path which should be the project directory
    RESOURCES_PATH = path.join(app.getAppPath(), 'assets');
  }
  
  const fullPath = path.join(RESOURCES_PATH, ...paths);
  log.info(`Asset path resolved to: ${fullPath}`);
  return fullPath;
}

async function loadFonts() {
  if (fontsLoaded) return;
  
  try {
    // Get the correct path to the fonts directory
    const fontsPath = getAssetPath('fonts');
    
    // Load Aller font
    const allerPath = path.join(fontsPath, 'Aller_It.ttf');
    log.info(`Attempting to load Aller font from: ${allerPath}`);
    
    if (fs.existsSync(allerPath)) {
      log.info(`Aller font file exists, size: ${fs.statSync(allerPath).size} bytes`);
      FontLibrary.use('Aller', [allerPath]);
      log.info('Aller font loaded successfully');
    } else {
      log.error(`Aller font file does not exist at: ${allerPath}`);
    }
    
    // Load Jura font family with multiple weights
    const juraFontFiles = [
      path.join(fontsPath, 'Jura-Light.ttf'),
      path.join(fontsPath, 'Jura-Regular.ttf'),
      path.join(fontsPath, 'Jura-Medium.ttf'),
      path.join(fontsPath, 'Jura-SemiBold.ttf'),
      path.join(fontsPath, 'Jura-Bold.ttf')
    ];
    
    log.info(`Attempting to load Jura fonts from: ${fontsPath}`);
    
    // Check if fonts directory exists
    if (fs.existsSync(fontsPath)) {
      log.info(`Fonts directory exists`);
      // Use FontLibrary.use with font family name and array of font file paths
      const juraFonts = FontLibrary.use('Jura', juraFontFiles);
      log.info('Jura font family loaded successfully:', juraFonts);
    } else {
      log.error(`Fonts directory does not exist at: ${fontsPath}`);
    }
    
    fontsLoaded = true;
    
    // Also try to list available families to verify
    const families = FontLibrary.families;
    log.info('Available font families:', families);
  } catch (error) {
    log.error('Error loading custom fonts:', error);
    console.error('Error loading custom fonts:', error);
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export async function generateCardFromConfig(
  config: CardConfig,
  data?: { [key: string]: any },
  starRatings?: StarRating,
  useBackground?: boolean
): Promise<string> {
  // Load fonts before generating card
  await loadFonts();
  
  if (data) {
    data.starRatings = starRatings;
    data.useBackground = useBackground;
    if (data.metadata && data.metadata.duration) {
      data.durationFormatted = formatDuration(data.metadata.duration);
    }
  }
  log.info('Loaded config:', config);
  const canvas = new Canvas(config.width, config.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'transparent';

  const cardRadius = config.cardCornerRadius;
  log.info('Using cardCornerRadius:', cardRadius);
  ctx.fillRect(0, 0, config.width, config.height);
  ctx.roundRect(0, 0, config.width, config.height, cardRadius);
  ctx.clip();

  // BACKGROUND RENDERING
  if (useBackground && config.background.type === 'cover' && data && config.background.srcField) {
    const bgSrc = getNestedValue(data, config.background.srcField);
    if (bgSrc) {
      const bgImg = await loadImage(bgSrc);
      const blurValue = config.background.blur;
      ctx.filter = `blur(${blurValue}px)`;
      ctx.drawImage(bgImg, 0, 0, config.width, config.height);
      ctx.filter = 'none';
    }
  } else {
    // Otherwise, use provided background config (color or gradient)
    if (config.background.type === 'color' && config.background.color) {
      ctx.fillStyle = config.background.color;
      ctx.fillRect(0, 0, config.width, config.height);
    }
  }

  ctx.save();

  // Render each component from the config
  for (const comp of config.components) {
    switch (comp.type) {
      case 'roundedRect': {
        ctx.beginPath();
        if (comp.shadow) {
          ctx.shadowColor = comp.shadow.color;
          ctx.shadowOffsetX = comp.shadow.offsetX;
          ctx.shadowOffsetY = comp.shadow.offsetY;
          ctx.shadowBlur = comp.shadow.blur;
        }
        ctx.fillStyle = comp.fillStyle || 'transparent';
        ctx.roundRect(comp.x, comp.y, comp.width || 0, comp.height || 0, comp.cornerRadius || 0);
        ctx.fill();
        ctx.closePath();
        break;
      }
      case 'text': {
        let text = comp.text || '';
        // Replace tokens with nested values (e.g., {metadata.songName})
        if (data) {
          text = text.replace(/{([^}]+)}/g, (_, key) => getNestedValue(data, key) || '');
        }
        ctx.font = comp.font || '24px sans-serif';
        ctx.fillStyle = comp.fillStyle || 'black';
        ctx.textAlign = comp.textAlign || 'left';
        const displayText = comp.maxWidth ? truncateText(ctx, text, comp.maxWidth) : text;
        ctx.fillText(displayText, comp.x, comp.y);
        break;
      }
      case 'image': {
        // Use comp.imageUrl directly; if missing and srcField exists, use that value from API data.
        let imageUrl = comp.imageUrl;
        if (!imageUrl && comp.srcField && data) {
          imageUrl = getNestedValue(data, comp.srcField);
        }
        if (imageUrl) {
          try {
            const img = await loadImage(imageUrl);
            const drawWidth = comp.width || img.width;
            const drawHeight = comp.height || img.height;
            if (comp.clip) {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(comp.x, comp.y, drawWidth, drawHeight, comp.cornerRadius || 10);
              ctx.clip();
              ctx.drawImage(img, comp.x, comp.y, drawWidth, drawHeight);
              ctx.restore();
            } else {
              ctx.drawImage(img, comp.x, comp.y, drawWidth, drawHeight);
            }
          } catch (error) {
            log.error('Error loading image for component:', comp, error);
          }
        }
        break;
      }
      case 'starRating': {
        if (comp.ratings) {
          let currentX = comp.x;
          for (const ratingObj of comp.ratings) {
            let ratingValue = ratingObj.rating;
            if (data && ratingValue && ratingValue.startsWith('{') && ratingValue.endsWith('}')) {
              const key = ratingValue.slice(1, -1);
              ratingValue = getNestedValue(data, key);
            }
            if (ratingValue !== undefined && ratingValue !== null && ratingValue !== '') {
              ctx.fillStyle = ratingObj.color;
              const rectWidth =
                ratingValue === 'Unranked' || ratingValue === 'Qualified'
                  ? (comp.specialWidth || 120)
                  : (comp.defaultWidth || 100);
              ctx.beginPath();
              ctx.roundRect(currentX, comp.y, rectWidth, comp.height || 50, 10);
              ctx.fill();
              ctx.closePath();

              ctx.fillStyle = 'white';
              ctx.textBaseline = 'middle';
              ctx.textAlign = 'center';
              ctx.font = comp.font || 'bold 20px sans-serif';
              ctx.fillText(
                `${ratingValue}${ratingValue !== 'Unranked' && ratingValue !== 'Qualified' ? ' ★' : ''}`,
                currentX + rectWidth / 2,
                comp.y + ((comp.height || 50) / 2)
              );
              currentX +=
                ratingValue === 'Unranked' || ratingValue === 'Qualified'
                  ? (comp.specialSpacing || 130)
                  : (comp.defaultSpacing || 110);
            }
          }
        }
        break;
      }
      default:
        log.warn('Unknown component type:', comp.type);
        break;
    }
  }

  return canvas.toDataURL('image/png' as ExportFormat);
}
