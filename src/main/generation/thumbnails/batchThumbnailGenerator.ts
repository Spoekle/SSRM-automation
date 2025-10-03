import { Canvas, ExportFormat } from 'skia-canvas';
import { loadImage } from '../utils/imageUtils';
import {
  calculateCropDimensions,
  applyBackgroundTransform,
  drawCroppedImage,
  loadAllerFonts,
  loadLogo,
  setupShadow,
  getFontFamily,
  BackgroundTransform
} from '../utils/canvasUtils';
import log from 'electron-log';



export async function generateBatchThumbnail(
  backgroundUrl: string, 
  month: string, 
  backgroundTransform?: BackgroundTransform
): Promise<string> {
    // Load fonts before generating thumbnail
    await loadAllerFonts();
    
    const canvas = new Canvas(1920, 1080);
    const ctx = canvas.getContext('2d');

    const backgroundImg = await loadImage(backgroundUrl);
    const logoImg = await loadLogo();

    ctx.save();
    
    // Calculate crop dimensions to maintain 16:9 aspect ratio
    const cropDimensions = calculateCropDimensions(backgroundImg.width, backgroundImg.height);
    
    // Apply background transformations if provided
    if (backgroundTransform) {
        applyBackgroundTransform(ctx, backgroundTransform, 1920, 1080);
    }
    
    // Draw the cropped image to maintain 16:9 aspect ratio
    drawCroppedImage(ctx, backgroundImg, cropDimensions, 0, 0, 1920, 1080);
    ctx.restore(); // Restore context after drawing background
    
    ctx.shadowBlur = 20;
    if (logoImg) {
        ctx.drawImage(logoImg, 191, 250, 1538, 262);
    }
    
    // Setup shadow and text styling
    setupShadow(ctx);
    ctx.filter = 'none';
    ctx.textAlign = 'center';
    ctx.font = `130px ${getFontFamily('Aller')}`;
    ctx.fillStyle = 'white';
    ctx.fillText(month, 960, 760);

    return canvas.toDataURL('image/png' as ExportFormat);
}