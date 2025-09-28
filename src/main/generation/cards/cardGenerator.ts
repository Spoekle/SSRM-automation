import { Canvas, ExportFormat, FontLibrary, loadImage as skiaLoadImage } from 'skia-canvas';
import { MapInfo, StarRating } from '../types/interfaces';
import { loadImage, formatDuration, truncateText } from '../utils/imageUtils';
import log from 'electron-log';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

let fontsLoaded = false;

function getAssetPath(...paths: string[]): string {
  let RESOURCES_PATH;
  
  if (app.isPackaged) {
    RESOURCES_PATH = path.join(process.resourcesPath, 'assets');
  } else {
    RESOURCES_PATH = path.join(app.getAppPath(), 'assets');
  }
  
  const fullPath = path.join(RESOURCES_PATH, ...paths);
  log.info(`Asset path resolved to: ${fullPath}`);
  return fullPath;
}

async function loadFonts() {
  if (fontsLoaded) return;
  
  try {
    const fontsPath = getAssetPath('fonts/Torus.Pro');
    const fontFiles = [
      path.join(fontsPath, 'TorusPro-Bold.ttf'),
      path.join(fontsPath, 'TorusPro-BoldItalic.ttf'),
      path.join(fontsPath, 'TorusPro-Heavy.ttf'),
      path.join(fontsPath, 'TorusPro-HeavyItalic.ttf'),
      path.join(fontsPath, 'TorusPro-Italic.ttf'),
      path.join(fontsPath, 'TorusPro-Light.ttf'),
      path.join(fontsPath, 'TorusPro-LightItalic.ttf'),
      path.join(fontsPath, 'TorusPro-Regular.ttf'),
      path.join(fontsPath, 'TorusPro-SemiBold.ttf'),
      path.join(fontsPath, 'TorusPro-SemiBoldItalic.ttf'),
      path.join(fontsPath, 'TorusPro-Thin.ttf'),
      path.join(fontsPath, 'TorusPro-ThinItalic.ttf')
      
    ];
    log.info(`Attempting to load fonts from: ${fontsPath}`);
    
    if (!fs.existsSync(fontsPath)) {
      log.error(`Fonts directory does not exist at: ${fontsPath}`);
      return;
    }
    
    log.info(`Fonts directory exists`);
    
    const fonts = FontLibrary.use('TorusPro', fontFiles);
    fontsLoaded = true;
    log.info('Custom font loaded successfully:', fonts);
    
    const family = FontLibrary.family('TorusPro');
    log.info('Available font families:', family);
  } catch (error) {
    log.error('Error loading custom font:', error);
  }
}

// SVG icon loading and rendering
let iconCache: { [key: string]: any } = {};

async function loadSVGIcon(iconName: string): Promise<any> {
  if (iconCache[iconName]) {
    return iconCache[iconName];
  }
  
  try {
    const iconPath = getAssetPath('icons', `${iconName}.svg`);
    if (fs.existsSync(iconPath)) {
      const icon = await skiaLoadImage(iconPath);
      iconCache[iconName] = icon;
      return icon;
    } else {
      log.warn(`Icon not found: ${iconPath}`);
      return null;
    }
  } catch (error) {
    log.error(`Error loading icon ${iconName}:`, error);
    return null;
  }
}

async function drawIcon(ctx: any, iconName: string, x: number, y: number, size: number = 16) {
  const icon = await loadSVGIcon(iconName);
  if (icon) {
    ctx.save();
    // Apply white tint to the icon by using composite operation
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(icon, x, y, size, size);
    ctx.restore();
  }
}

export async function generateCard(data: MapInfo, starRatings: StarRating, useBackground: boolean): Promise<string> {
  // Load fonts before generating card
  await loadFonts();
  
  const canvas = new Canvas(900, 300);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 900, 300);
  ctx.roundRect(0, 0, 900, 300, 20);
  ctx.clip();
  const img = await loadImage(data.versions[0].coverURL);

  if (useBackground) {
    ctx.filter = 'blur(10px)';
    // Scale the square image to cover the entire canvas while maintaining aspect ratio
    const canvasWidth = 900;
    const canvasHeight = 300;
    const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;
    
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
    ctx.filter = 'none';
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.roundRect(0, 0, 900, 300, 20);
    ctx.fill();
    ctx.closePath();
  }

  ctx.save();

  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 10;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.roundRect(20, 20, 260, 260, 10);
  ctx.clip();
  ctx.drawImage(img, 20, 20, 260, 260);
  ctx.restore();

  // Draw the rounded rectangle for the semi-transparent background
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.roundRect(300, 20, 580, 180, 10);
  ctx.fill();
  ctx.closePath();

  // Draw the metadata text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';

  const maxWidth = 480;
  
  // Use Light weight for author name
  ctx.font = '400 24px TorusPro, "Segoe UI", Arial, sans-serif';
  const authorName = data.metadata.songAuthorName;
  const displayAuthorName = truncateText(ctx, authorName, maxWidth);
  ctx.fillText(displayAuthorName, 320, 55);

  // Use Bold weight for song name (most prominent)
  ctx.font = '800 30px TorusPro, "Segoe UI", Arial, sans-serif';
  const songName = data.metadata.songName;
  const displaySongName = truncateText(ctx, songName, maxWidth);
  ctx.fillText(displaySongName, 320, 90);

  // Use Regular weight for sub name
  ctx.font = '500 20px TorusPro, "Segoe UI", Arial, sans-serif';
  const subName = data.metadata.songSubName;
  const displaySubName = truncateText(ctx, subName, maxWidth);
  ctx.fillText(displaySubName, 320, 120);

  // Use Medium weight for mapper credit
  ctx.font = '600 20px TorusPro, "Segoe UI", Arial, sans-serif';
  const levelAuthorName = `Mapped by ${data.metadata.levelAuthorName}`;
  const displayLevelAuthorName = truncateText(ctx, levelAuthorName, maxWidth);
  ctx.fillText(displayLevelAuthorName, 320, 180);

  // Convert and display duration
  const durationFormatted = formatDuration(data.metadata.duration);
  ctx.textAlign = 'right';
  
  // Use SemiBold weight for metadata numbers
  ctx.font = '400 24px TorusPro, sans-serif';
  
  // Draw icons and text for metadata
  const defaultIconSize = 18;
  
  // ID with key icon
  ctx.fillText(`${data.id}`, 845, 55);
  await drawIcon(ctx, 'key', 850, 39, defaultIconSize);
  
  // BPM with metronome icon (using larger size)
  ctx.fillText(`${data.metadata.bpm}`, 845, 80);
  await drawIcon(ctx, 'metronome', 850, 63, defaultIconSize);
  
  // Duration with clock icon
  ctx.fillText(`${durationFormatted}`, 845, 105);
  await drawIcon(ctx, 'clock', 850, 88, defaultIconSize);


  ctx.textAlign = 'center';

  const ratings = [
    { rating: starRatings.ES, color: 'rgb(22 163 74)' },
    { rating: starRatings.NOR, color: 'rgb(59 130 246)' },
    { rating: starRatings.HARD, color: 'rgb(249 115 22)' },
    { rating: starRatings.EX, color: 'rgb(220 38 38)' },
    { rating: starRatings.EXP, color: 'rgb(126 34 206)' }
  ];

  let x = 300;

  ratings.forEach(({ rating, color }) => {
    if (rating) {
      const isWide = rating === 'Unranked' || rating === 'Qualified';
      const boxWidth = 107;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, 220, boxWidth, 50, 10);
      ctx.fill();
      ctx.closePath();

      ctx.fillStyle = 'white';
      ctx.textBaseline = 'middle';
      // Use SemiBold for rating text
      ctx.font = isWide ? '600 16px TorusPro, "Segoe UI", Arial, sans-serif' : '600 20px TorusPro, "Segoe UI", Arial, sans-serif';
      ctx.fillText(`${rating}${!isWide ? ' ★' : ''}`, x + boxWidth / 2, 244);

      x += 118;
    }
  });

  return canvas.toDataURL('image/png' as ExportFormat);
}
