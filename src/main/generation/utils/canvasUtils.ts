import { FontLibrary } from 'skia-canvas';
import { CanvasRenderingContext2D as SkiaCanvasRenderingContext2D } from 'skia-canvas';
import { loadLocalImage } from './imageUtils';
import log from 'electron-log';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export interface CropDimensions {
  sx: number; // source x
  sy: number; // source y
  sw: number; // source width
  sh: number; // source height
}

export interface BackgroundTransform {
  scale: number;
  x: number;
  y: number;
}

// Font loading state
let allerFontsLoaded = false;
let torusProFontsLoaded = false;
let juraFontsLoaded = false;

/**
 * Get the correct path to assets based on whether app is packaged or not
 */
export function getAssetPath(...paths: string[]): string {
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

/**
 * Calculate crop dimensions to maintain 16:9 aspect ratio
 */
export function calculateCropDimensions(imageWidth: number, imageHeight: number): CropDimensions {
  const targetAspectRatio = 16 / 9;
  const imageAspectRatio = imageWidth / imageHeight;
  
  let cropWidth: number;
  let cropHeight: number;
  let cropX: number;
  let cropY: number;
  
  if (imageAspectRatio > targetAspectRatio) {
    // Image is wider than 16:9, crop horizontally
    cropHeight = imageHeight;
    cropWidth = imageHeight * targetAspectRatio;
    cropX = (imageWidth - cropWidth) / 2;
    cropY = 0;
  } else {
    // Image is taller than 16:9, crop vertically
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

/**
 * Calculate crop dimensions to maintain 1:1 (square) aspect ratio
 */
export function calculateSquareCropDimensions(imageWidth: number, imageHeight: number): CropDimensions {
  const cropSize = Math.min(imageWidth, imageHeight);
  const cropX = (imageWidth - cropSize) / 2;
  const cropY = (imageHeight - cropSize) / 2;
  
  return {
    sx: cropX,
    sy: cropY,
    sw: cropSize,
    sh: cropSize
  };
}

/**
 * Apply background transform to canvas context
 */
export function applyBackgroundTransform(
  ctx: SkiaCanvasRenderingContext2D,
  transform: BackgroundTransform,
  canvasWidth: number,
  canvasHeight: number
): void {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  // Translate to center, apply scale and custom translation, then translate back
  ctx.translate(centerX + transform.x, centerY + transform.y);
  ctx.scale(transform.scale, transform.scale);
  ctx.translate(-centerX, -centerY);
}

/**
 * Draw a cropped image maintaining aspect ratio
 */
export function drawCroppedImage(
  ctx: SkiaCanvasRenderingContext2D,
  image: any,
  cropDimensions: CropDimensions,
  dx: number,
  dy: number,
  dw: number,
  dh: number
): void {
  ctx.drawImage(
    image,
    cropDimensions.sx, cropDimensions.sy, cropDimensions.sw, cropDimensions.sh, // source (crop)
    dx, dy, dw, dh // destination
  );
}

/**
 * Load Aller font family
 */
export async function loadAllerFonts(): Promise<void> {
  if (allerFontsLoaded) return;
  
  try {
    const fontsPath = getAssetPath('fonts', 'Aller_It.ttf');
    log.info(`Attempting to load Aller font from: ${fontsPath}`);
    
    if (!fs.existsSync(fontsPath)) {
      log.error(`Aller font file does not exist at: ${fontsPath}`);
      return;
    }
    
    log.info(`Aller font file exists, size: ${fs.statSync(fontsPath).size} bytes`);
    
    const fonts = FontLibrary.use('Aller', [fontsPath]);
    allerFontsLoaded = true;
    log.info('Aller font loaded successfully:', fonts);
    
    const families = FontLibrary.families;
    log.info('Available font families:', families);
  } catch (error) {
    log.error('Error loading Aller font:', error);
    console.error('Error loading Aller font:', error);
  }
}

/**
 * Load TorusPro font family with all weights
 */
export async function loadTorusProFonts(): Promise<void> {
  if (torusProFontsLoaded) return;
  
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
    
    log.info(`Attempting to load TorusPro fonts from: ${fontsPath}`);
    
    if (!fs.existsSync(fontsPath)) {
      log.error(`TorusPro fonts directory does not exist at: ${fontsPath}`);
      return;
    }
    
    log.info(`TorusPro fonts directory exists`);
    
    const fonts = FontLibrary.use('TorusPro', fontFiles);
    torusProFontsLoaded = true;
    log.info('TorusPro font family loaded successfully:', fonts);
    
    const family = FontLibrary.family('TorusPro');
    log.info('TorusPro font family details:', family);
  } catch (error) {
    log.error('Error loading TorusPro fonts:', error);
  }
}

/**
 * Load Jura font family with multiple weights
 */
export async function loadJuraFonts(): Promise<void> {
  if (juraFontsLoaded) return;
  
  try {
    const fontsPath = getAssetPath('fonts');
    const juraFontFiles = [
      path.join(fontsPath, 'Jura-Light.ttf'),
      path.join(fontsPath, 'Jura-Regular.ttf'),
      path.join(fontsPath, 'Jura-Medium.ttf'),
      path.join(fontsPath, 'Jura-SemiBold.ttf'),
      path.join(fontsPath, 'Jura-Bold.ttf')
    ];
    
    log.info(`Attempting to load Jura fonts from: ${fontsPath}`);
    
    if (!fs.existsSync(fontsPath)) {
      log.error(`Fonts directory does not exist at: ${fontsPath}`);
      return;
    }
    
    log.info(`Fonts directory exists`);
    const juraFonts = FontLibrary.use('Jura', juraFontFiles);
    juraFontsLoaded = true;
    log.info('Jura font family loaded successfully:', juraFonts);
  } catch (error) {
    log.error('Error loading Jura fonts:', error);
    console.error('Error loading Jura fonts:', error);
  }
}

/**
 * Load and cache logo image
 */
let logoCache: any = null;
export async function loadLogo(): Promise<any> {
  if (logoCache) return logoCache;
  
  try {
    const logoPath = getAssetPath('thumbnails', 'SSRB_Logo.png');
    log.info(`Attempting to load logo from: ${logoPath}`);
    
    if (!fs.existsSync(logoPath)) {
      log.error(`Logo file does not exist at: ${logoPath}`);
      return null;
    }
    
    log.info(`Logo file exists, size: ${fs.statSync(logoPath).size} bytes`);
    logoCache = await loadLocalImage(logoPath);
    log.info(`Successfully loaded logo from: ${logoPath}`);
    return logoCache;
  } catch (error) {
    log.error('Error loading logo:', error);
    return null;
  }
}

/**
 * Setup shadow properties on canvas context
 */
export function setupShadow(
  ctx: SkiaCanvasRenderingContext2D,
  options: {
    color?: string;
    blur?: number;
    offsetX?: number;
    offsetY?: number;
  } = {}
): void {
  ctx.shadowColor = options.color || 'rgba(0, 0, 0, 1)';
  ctx.shadowBlur = options.blur || 10;
  ctx.shadowOffsetX = options.offsetX || 4;
  ctx.shadowOffsetY = options.offsetY || 4;
}

/**
 * Clear shadow properties on canvas context
 */
export function clearShadow(ctx: SkiaCanvasRenderingContext2D): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Get font family string with fallbacks
 */
export function getFontFamily(primary: string): string {
  return `${primary}, "Segoe UI", Arial, sans-serif`;
}

/**
 * Calculate adaptive font size to fit text within max width
 */
export function calculateAdaptiveFontSize(
  ctx: SkiaCanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startingFontSize: number,
  minFontSize: number = 16,
  fontFamily: string = 'sans-serif'
): number {
  let fontSize = startingFontSize;
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  while (ctx.measureText(text).width > maxWidth && fontSize > minFontSize) {
    fontSize -= 2;
    ctx.font = `${fontSize}px ${fontFamily}`;
  }
  
  return fontSize;
}