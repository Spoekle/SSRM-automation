import { Canvas, ExportFormat, FontLibrary } from 'skia-canvas';
import { loadImage } from '../utils/imageUtils';
import log from 'electron-log';

import logo from '../../../../assets/thumbnails/SSRB_Logo.png';
import Aller from '../../../../assets/fonts/Aller_It.ttf';

export async function generateBatchThumbnail(backgroundUrl: string, month: string): Promise<string> {
    // Register custom font (uncomment when you have a font file)
    try {
        FontLibrary.use('Aller', [Aller]);
        log.info('Custom font registered successfully');
    } catch (error) {
        log.error('Error registering custom font:', error);
    }

    const canvas = new Canvas(1920, 1080);
    const ctx = canvas.getContext('2d');

    let backgroundImg = null;

    backgroundImg = await loadImage(backgroundUrl);

    
    let logoImg = null;
    try {
        logoImg = await loadImage(logo);
        log.info(`Successfully loaded logo from: ${logo}`);
    } catch (error) {
        log.error('Error loading logo from', logo, ':', error);
        logoImg = null;
    }

    ctx.save();
    ctx.drawImage(backgroundImg, 0, 0, 1920, 1080);
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
    const fontFamily = 'Aller, sans-serif';
    ctx.font = `130px ${fontFamily}`;

    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    // Fill text with white
    ctx.fillStyle = 'white';
    ctx.fillText(month, 960, 760);

    ctx.restore();

    return canvas.toDataURL('image/png' as ExportFormat);
}