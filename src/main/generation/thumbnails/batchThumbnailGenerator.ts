import { Canvas, ExportFormat, FontLibrary } from 'skia-canvas';
import { loadImage, loadLocalImage } from '../utils/imageUtils';
import log from 'electron-log';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

interface CropDimensions {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

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

const logoPath = getAssetPath('thumbnails', 'SSRB_Logo.png');

/**
 * Calculate crop dimensions to maintain 16:9 aspect ratio
 * @param imageWidth Original image width
 * @param imageHeight Original image height
 * @returns Crop dimensions for center cropping
 */
function calculateCropDimensions(imageWidth: number, imageHeight: number): CropDimensions {
  const targetAspectRatio = 16 / 9;
  const imageAspectRatio = imageWidth / imageHeight;
  
  let cropWidth: number;
  let cropHeight: number;
  let cropX: number;
  let cropY: number;
  
  if (imageAspectRatio > targetAspectRatio) {
    cropHeight = imageHeight;
    cropWidth = imageHeight * targetAspectRatio;
    cropX = (imageWidth - cropWidth) / 2;
    cropY = 0;
  } else {
    cropWidth = imageWidth;
    cropHeight = imageWidth / targetAspectRatio;
    cropX = 0;
    cropY = (imageHeight - cropHeight) / 2;
  }
  
  return {
    sx: cropX,
    sy: cropY,
    sw: cropWidth,
    sh: cropHeight
  };
}

async function loadFonts() {
  if (fontsLoaded) return;
  
  try {
    // Get the correct path to the fonts directory
    const fontsPath = getAssetPath('fonts', 'Aller_It.ttf');
    log.info(`Attempting to load font from: ${fontsPath}`);
    
    // Check if font file exists
    if (!fs.existsSync(fontsPath)) {
      log.error(`Font file does not exist at: ${fontsPath}`);
      return;
    }
    
    log.info(`Font file exists, size: ${fs.statSync(fontsPath).size} bytes`);
    
    // Use FontLibrary.use with font family name and array of paths
    const fonts = FontLibrary.use('Aller', [fontsPath]);
    fontsLoaded = true;
    log.info('Custom font loaded successfully:', fonts);
    console.log('Custom font loaded successfully:', fonts);
    
    // Also try to list available families to verify
    const families = FontLibrary.families;
    log.info('Available font families:', families);
  } catch (error) {
    log.error('Error loading custom font:', error);
    console.error('Error loading custom font:', error);
  }
}

export async function generateBatchThumbnail(
  backgroundUrl: string, 
  month: string, 
  backgroundTransform?: { scale: number; x: number; y: number }
): Promise<string> {
    // Load fonts before generating thumbnail
    await loadFonts();
    
    const canvas = new Canvas(1920, 1080);
    const ctx = canvas.getContext('2d');

    let backgroundImg = null;

    backgroundImg = await loadImage(backgroundUrl);

    
    let logoImg = null;
    try {
        log.info(`Attempting to load logo from: ${logoPath}`);
        
        // Check if logo file exists
        if (!fs.existsSync(logoPath)) {
            log.error(`Logo file does not exist at: ${logoPath}`);
            logoImg = null;
        } else {
            log.info(`Logo file exists, size: ${fs.statSync(logoPath).size} bytes`);
            logoImg = await loadLocalImage(logoPath);
            log.info(`Successfully loaded logo from: ${logoPath}`);
        }
    } catch (error) {
        log.error('Error loading logo from', logoPath, ':', error);
        logoImg = null;
    }

    ctx.save();
    
    // Calculate crop dimensions to maintain 16:9 aspect ratio
    const cropDimensions = calculateCropDimensions(backgroundImg.width, backgroundImg.height);
    
    // Apply background transformations if provided
    if (backgroundTransform) {
        // Calculate the center of the canvas for scaling from center
        const centerX = 1920 / 2;
        const centerY = 1080 / 2;
        
        // Translate to center, apply scale and custom translation, then translate back
        ctx.translate(centerX + backgroundTransform.x, centerY + backgroundTransform.y);
        ctx.scale(backgroundTransform.scale, backgroundTransform.scale);
        ctx.translate(-centerX, -centerY);
    }
    
    // Draw the cropped image to maintain 16:9 aspect ratio
    // ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
    // sx, sy, sw, sh = source rectangle (crop area)
    // dx, dy, dw, dh = destination rectangle (canvas area)
    ctx.drawImage(
        backgroundImg,
        cropDimensions.sx, cropDimensions.sy, cropDimensions.sw, cropDimensions.sh, // source (crop)
        0, 0, 1920, 1080 // destination (canvas)
    );
    ctx.restore(); // Restore context after drawing background
    
    ctx.shadowBlur = 20;
    if (logoImg) {
        ctx.drawImage(logoImg, 191, 250, 1538, 262);
    }
    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    ctx.filter = 'none';
    ctx.textAlign = 'center';
    const fontFamily = 'Aller, "Segoe UI", Arial, sans-serif';
    ctx.font = `130px ${fontFamily}`;

    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    // Fill text with white
    ctx.fillStyle = 'white';
    ctx.fillText(month, 960, 760);

    return canvas.toDataURL('image/png' as ExportFormat);
}