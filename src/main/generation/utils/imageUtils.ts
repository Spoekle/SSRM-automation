import { Image } from 'skia-canvas';
import { CanvasRenderingContext2D as SkiaCanvasRenderingContext2D } from 'skia-canvas';
import fs from 'fs';

// Re-export types from canvasUtils for backwards compatibility
export type { CropDimensions, BackgroundTransform } from './canvasUtils';

export async function loadImage(urlOrBuffer: string | ArrayBuffer): Promise<Image> {
  let buffer;
  if (typeof urlOrBuffer === 'string') {
    // Handle relative URLs by converting them to absolute URLs
    const url = urlOrBuffer.startsWith('/') ? `http://localhost:1212${urlOrBuffer}` : urlOrBuffer;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    buffer = Buffer.from(urlOrBuffer);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/png;base64,${buffer.toString('base64')}`;
  });
}

export async function loadLocalImage(filePath: string): Promise<Image> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, buffer) => {
      if (err) {
        reject(err);
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `data:image/png;base64,${buffer.toString('base64')}`;
    });
  });
}

export function formatDuration(seconds = 0): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function truncateText(ctx: SkiaCanvasRenderingContext2D, text: string, maxWidth: number): string {
  const ellipsis = '…';
  let truncatedText = text;

  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  while (truncatedText.length > 0 && ctx.measureText(truncatedText + ellipsis).width > maxWidth) {
    truncatedText = truncatedText.slice(0, -1);
  }

  return truncatedText.length > 0 ? truncatedText + ellipsis : ellipsis;
}
