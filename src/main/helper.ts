import { Canvas, ExportFormat, Image } from 'skia-canvas';
import { CanvasRenderingContext2D as SkiaCanvasRenderingContext2D } from 'skia-canvas';

export interface StarRating {
  ES: string;
  NOR: string;
  HARD: string;
  EXP: string;
  EXP_PLUS: string;
}

export interface MapInfo {
  metadata: {
    songAuthorName: string;
    songName: string;
    songSubName: string;
    levelAuthorName: string;
    duration: number;
    bpm: number;
  };
  id: string;
  versions: {
    coverURL: string;
    hash: string;
  }[];
}

export interface NewStarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EXP: string;
  EXP_PLUS: string;
}

export interface OldStarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EXP: string;
  EXP_PLUS: string;
}

export async function loadImage(urlOrBuffer: string | ArrayBuffer): Promise<Image> {
  let buffer;
  if (typeof urlOrBuffer === 'string') {
    const response = await fetch(urlOrBuffer);
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

export async function generateCard(data: MapInfo, starRatings: StarRating, useBackground: boolean): Promise<string> {
  const canvas = new Canvas(900, 300);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 900, 300);
  ctx.roundRect(0, 0, 900, 300, 20);
  ctx.clip();
  const img = await loadImage(data.versions[0].coverURL);

  if (useBackground) {
    ctx.filter = 'blur(10px)';
    ctx.drawImage(img, 0, 0, 900, 300);
    ctx.filter = 'none';
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
  ctx.font = '24px Heebo, sans-serif';

  const authorName = data.metadata.songAuthorName;
  const displayAuthorName = truncateText(ctx, authorName, maxWidth);
  ctx.fillText(displayAuthorName, 320, 55);

  ctx.font = 'bold 30px Heebo, sans-serif';
  const songName = data.metadata.songName;
  const displaySongName = truncateText(ctx, songName, maxWidth);
  ctx.fillText(displaySongName, 320, 90);

  ctx.font = '20px Heebo, sans-serif';
  const subName = data.metadata.songSubName;
  const displaySubName = truncateText(ctx, subName, maxWidth);
  ctx.fillText(displaySubName, 320, 120);

  ctx.font = '20px Heebo, sans-serif';
  const levelAuthorName = `Mapped by ${data.metadata.levelAuthorName}`;
  const displayLevelAuthorName = truncateText(ctx, levelAuthorName, maxWidth);
  ctx.fillText(displayLevelAuthorName, 320, 180);

  // Convert and display duration
  const durationFormatted = formatDuration(data.metadata.duration);
  ctx.textAlign = 'right';
  ctx.font = '20px Heebo, sans-serif';
  ctx.fillText(`Map Code:`, 860, 55);
  ctx.font = '20px Heebo, sans-serif';
  ctx.fillText(`${data.id}`, 860, 75);
  ctx.font = '20px Heebo, sans-serif';
  ctx.fillText(`BPM:`, 860, 105);
  ctx.font = '20px Heebo, sans-serif';
  ctx.fillText(`${data.metadata.bpm}`, 860, 130);
  ctx.font = '20px Heebo, sans-serif';
  ctx.fillText(`Song Duration:`, 860, 160);
  ctx.font = '20px Heebo, sans-serif';
  ctx.fillText(`${durationFormatted}`, 860, 180);

  ctx.font = '20px Heebo, sans-serif';
  ctx.textAlign = 'center';

  // Define the star ratings with their respective colors
  const ratings = [
    { rating: starRatings.ES, color: 'rgb(22 163 74)' },
    { rating: starRatings.NOR, color: 'rgb(59 130 246)' },
    { rating: starRatings.HARD, color: 'rgb(249 115 22)' },
    { rating: starRatings.EXP, color: 'rgb(220 38 38)' },
    { rating: starRatings.EXP_PLUS, color: 'rgb(126 34 206)' }
  ];

  let x = 300;

  ratings.forEach(({ rating, color }) => {
    if (rating) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, 220, rating === 'Unranked' || rating === 'Qualified' ? 120 : 100, 50, 10);
      ctx.fill();
      ctx.closePath();

      ctx.fillStyle = 'white';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 20px Heebo, sans-serif';
      ctx.fillText(`${rating}${rating !== 'Unranked' && rating !== 'Qualified' ? ' ★' : ''}`, x + (rating === 'Unranked' || rating === 'Qualified' ? 60 : 50), 245);
      x += rating === 'Unranked' || rating === 'Qualified' ? 130 : 110;
    }
  });

  return canvas.toDataURL('image/png' as ExportFormat);
}

export async function generateReweightCard(data: MapInfo, oldStarRatings: OldStarRatings, newStarRatings: NewStarRatings, chosenDiff: keyof OldStarRatings): Promise<string> {
  const canvas = new Canvas(800, 270);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 800, 270);
  ctx.save();

  // Draw the rounded cover image
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 10;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.roundRect(20, 20, 230, 230, 10);
  ctx.clip();
  const img = await loadImage(data.versions[0].coverURL);
  ctx.drawImage(img, 20, 20, 230, 230);
  ctx.restore();

  // Draw the semi-transparent background
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.roundRect(270, 20, 480, 230, 10);
  ctx.fill();
  ctx.closePath();

  // Draw metadata text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';

  const maxWidth = 380;
  ctx.font = '24px Heebo, sans-serif';

  const authorName = data.metadata.songAuthorName;
  const displayAuthorName = truncateText(ctx, authorName, maxWidth);
  ctx.fillText(displayAuthorName, 290, 55);

  ctx.font = 'bold 30px Heebo, sans-serif';
  const songName = data.metadata.songName;
  const displaySongName = truncateText(ctx, songName, maxWidth);
  ctx.fillText(displaySongName, 290, 90);

  ctx.font = '20px Heebo, sans-serif';
  const subName = data.metadata.songSubName;
  const displaySubName = truncateText(ctx, subName, maxWidth);
  ctx.fillText(displaySubName, 290, 120);

  ctx.font = '20px Heebo, sans-serif';
  const levelAuthorName = `Mapped by ${data.metadata.levelAuthorName}`;
  const displayLevelAuthorName = truncateText(ctx, levelAuthorName, maxWidth);
  ctx.fillText(displayLevelAuthorName, 290, 150);

  // Display additional info
  ctx.textAlign = 'right';
  ctx.font = '20px Heebo, sans-serif';
  ctx.fillText(`Map Code:`, 730, 55);
  ctx.font = '20px Heebo, sans-serif';
  ctx.fillText(`${data.id}`, 730, 75);

  ctx.font = '20px Heebo, sans-serif';
  ctx.textAlign = 'center';

  let color = '';
  switch (chosenDiff) {
    case 'ES':
      color = 'rgb(22 163 74)';
      break;
    case 'NOR':
      color = 'rgb(59 130 246)';
      break;
    case 'HARD':
      color = 'rgb(249 115 22)';
      break;
    case 'EXP':
      color = 'rgb(220 38 38)';
      break;
    case 'EXP_PLUS':
      color = 'rgb(126 34 206)';
      break;
    default:
      color = 'gray';
  }

  const oldRatingValue = parseFloat(oldStarRatings[chosenDiff]);
  const newRatingValue = parseFloat(newStarRatings[chosenDiff]);

  let arrowColor = 'gray';
  if (newRatingValue > oldRatingValue) {
    arrowColor = 'rgb(22 163 74)';
  } else if (newRatingValue < oldRatingValue) {
    arrowColor = 'rgb(220 38 38)';
  }

  const rating = oldStarRatings[chosenDiff];
  const newRating = newStarRatings[chosenDiff];

  let x = 360;

  if (rating) {
    // Draw combined rating rectangle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, 170, 100, 60, 10);
    ctx.fill();
    ctx.closePath();

    // Draw old rating text at the top
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px Heebo, sans-serif';
    ctx.fillText(`${rating} ★`, x + 50, 200);

    // Draw white rounded triangle pointing to the right
    ctx.fillStyle = arrowColor;
    ctx.beginPath();
    const triangleX = x + 140;
    const triangleY = 200;
    ctx.moveTo(triangleX, triangleY - 30);
    ctx.lineTo(triangleX + 10, triangleY - 30);
    ctx.lineTo(triangleX + 25, triangleY);
    ctx.lineTo(triangleX + 10, triangleY + 30);
    ctx.lineTo(triangleX, triangleY + 30);
    ctx.closePath();
    ctx.fill();

    // Draw new rating rectangle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 200, 170, 100, 60, 10);
    ctx.fill();
    ctx.closePath();

    // Draw new rating text at the bottom
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px Heebo, sans-serif';
    ctx.fillText(`${newRating} ★`, x + 250, 200);
  }

  return canvas.toDataURL('image/png' as ExportFormat);
}

export async function generateThumbnail(data: MapInfo, chosenDiff: keyof StarRating, starRatings: StarRating, processedBackground: string | ArrayBuffer | null): Promise<string> {
  const canvas = new Canvas(1920, 1080);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
  gradient.addColorStop(0, 'blue');
  gradient.addColorStop(1, 'red');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1920, 1080);

  console.log('Before loading cover image');
  const img = await loadImage(data.versions[0].coverURL);
  console.log('Cover image loaded');

  console.log('Before loading background image');
  let backgroundImg: Image | null = null;
  if (
    processedBackground &&
    typeof processedBackground === 'object' &&
    'thumbnail' in processedBackground &&
    typeof (processedBackground as any).thumbnail === 'string'
  ) {
    try {
      backgroundImg = await loadImage((processedBackground as any).thumbnail);
    } catch (error) {
      console.error('Failed to load background image from thumbnail, using cover image instead', error);
    }
  } else {
    console.log('Skipping background image loading');
  }

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(20, 20, 1880, 1040, 50);
  ctx.clip();

  ctx.filter = 'blur(10px)';
  if (backgroundImg) {
    ctx.drawImage(backgroundImg, 20, 20, 1880, 1040);
  } else {
    ctx.drawImage(img, 20, 20, 1880, 1040);
  }
  ctx.filter = 'none';

  // Draw the rounded rectangle for the background
  ctx.beginPath();
  ctx.fillStyle = 'rgba(20, 20, 20, 1)';
  ctx.roundRect(20, 20, 620, 1040, 50);
  ctx.fill();
  ctx.closePath();

  // Draw the rounded cover image
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 10;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.roundRect(75, 495, 510, 510, 50);
  ctx.clip();
  ctx.drawImage(img, 75, 495, 510, 510);
  ctx.restore();

  // Draw outline around the image
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(75, 495, 510, 510, 50);
  ctx.stroke();
  ctx.closePath();

  // Draw outline around the canvas
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(20, 20, 1880, 1040, 50);
  ctx.stroke();
  ctx.closePath();

  // Draw the metadata text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';

  const maxWidth = 580;
  ctx.font = '48px Heebo, sans-serif';

  const authorName = data.metadata.songAuthorName;
  const displayAuthorName = truncateText(ctx, authorName, maxWidth);
  ctx.fillText(displayAuthorName, 50, 95);

  ctx.font = 'bold 56px Heebo, sans-serif';
  const songName = data.metadata.songName;
  const displaySongName = truncateText(ctx, songName, maxWidth);
  ctx.fillText(displaySongName, 50, 160);

  ctx.font = '48px Heebo, sans-serif';
  const subName = data.metadata.songSubName;
  const displaySubName = truncateText(ctx, subName, maxWidth);
  ctx.fillText(displaySubName, 50, 220);

  ctx.font = '40px Heebo, sans-serif';
  const levelAuthorName = `Mapped by ${data.metadata.levelAuthorName}`;
  const displayLevelAuthorName = truncateText(ctx, levelAuthorName, maxWidth);
  ctx.fillText(displayLevelAuthorName, 50, 295);

  ctx.textAlign = 'center';

  let color = '';
  let difficulty = '';
  switch (chosenDiff) {
    case 'ES':
      color = 'rgb(22 163 74)';
      difficulty = 'Easy';
      break;
    case 'NOR':
      color = 'rgb(59 130 246)';
      difficulty = 'Normal';
      break;
    case 'HARD':
      color = 'rgb(249 115 22)';
      difficulty = 'Hard';
      break;
    case 'EXP':
      color = 'rgb(220 38 38)';
      difficulty = 'Expert';
      break;
    case 'EXP_PLUS':
      color = 'rgb(126 34 206)';
      difficulty = 'Expert+';
      break;
    default:
      color = 'gray';
  }

  const rating = starRatings[chosenDiff];

  let x = 75;

  if (rating) {
    // Draw combined rating rectangle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, 360, 510, 100, 25);
    ctx.fill();
    ctx.closePath();

    // Draw old rating text at the top
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 48px Heebo, sans-serif';
    ctx.fillText(`${difficulty} ${rating}`, x + 255, 410);
  }

  const dot = new Path2D();
  dot.arc(0, 0, 15, 0, 2 * Math.PI);
  dot.closePath();

  function drawDottedLine(x1: number, y1: number, x2: number, y2: number, color: string) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.setLineDash([]);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dotSpacing = 60;
    const dotCount = Math.floor(distance / dotSpacing);

    for (let i = 0; i <= dotCount; i++) {
      const t = i / dotCount;
      const x = x1 + t * dx;
      const y = y1 + t * dy;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      ctx.fill(dot);
      ctx.restore();
    }
  }

  drawDottedLine(640, 50, 640, 1030, color);

  return canvas.toDataURL('image/png' as ExportFormat);
}
