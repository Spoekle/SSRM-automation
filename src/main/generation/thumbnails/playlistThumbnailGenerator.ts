import { Canvas, ExportFormat } from 'skia-canvas';
import { loadImage } from '../utils/imageUtils';
import {
  calculateSquareCropDimensions,
  applyBackgroundTransform,
  drawCroppedImage,
  loadAllerFonts,
  loadLogo,
  setupShadow,
  getFontFamily,
  calculateAdaptiveFontSize,
  BackgroundTransform
} from '../utils/canvasUtils';
import log from 'electron-log';



export async function generatePlaylistThumbnail(
  backgroundUrl: string, 
  month: string, 
  backgroundTransform?: BackgroundTransform
): Promise<string> {
    // Load fonts before generating thumbnail
    await loadAllerFonts();
    
    // Create a 512x512 canvas for playlist thumbnails
    const canvas = new Canvas(512, 512);
    const ctx = canvas.getContext('2d');

    const backgroundImg = await loadImage(backgroundUrl);
    const logoImg = await loadLogo();

    ctx.save();
    
    // Calculate crop dimensions to maintain 1:1 (square) aspect ratio
    const cropDimensions = calculateSquareCropDimensions(backgroundImg.width, backgroundImg.height);
    
    // Apply background transformations if provided
    if (backgroundTransform) {
        applyBackgroundTransform(ctx, backgroundTransform, 512, 512);
    }
    
    // Draw the cropped image to maintain 1:1 (square) aspect ratio
    drawCroppedImage(ctx, backgroundImg, cropDimensions, 0, 0, 512, 512);
    ctx.restore(); // Restore context after drawing background
    
    // Draw logo at the top (scaled down for 512x512)
    ctx.shadowBlur = 10;
    if (logoImg) {
        const scale = 0.30;
        const logoWidth = 1538 * scale;
        const logoHeight = 262 * scale;
        const logoX = (512 - logoWidth) / 2;

        ctx.drawImage(logoImg, logoX, 50, logoWidth, logoHeight);
    }

    // Setup shadow and text styling
    setupShadow(ctx, { blur: 5, offsetX: 2, offsetY: 2 });
    ctx.filter = 'none';
    ctx.textAlign = 'center';
    
    // Calculate appropriate font size based on text length and canvas size
    const fontFamily = getFontFamily('Aller');
    const fontSize = calculateAdaptiveFontSize(ctx, month, 450, 54, 16, fontFamily);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = 'white';
    
    // Position text in the lower portion of the canvas
    const textY = 460; // Position from top
    ctx.fillText(month, 256, textY); // Center horizontally at 256 (half of 512)

    return canvas.toDataURL('image/png' as ExportFormat);
}