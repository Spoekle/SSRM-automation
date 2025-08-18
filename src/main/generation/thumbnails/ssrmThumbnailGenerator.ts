import { Canvas, ExportFormat, Path2D } from 'skia-canvas';
import { loadImage, truncateText } from '../utils/imageUtils';
import { MapInfo, StarRating } from '../types/interfaces';
import log from 'electron-log';

export async function generateSsrmThumbnail(data: MapInfo, chosenDiff: keyof StarRating, starRatings: StarRating, backgroundUrl: string): Promise<string> {
  const canvas = new Canvas(1920, 1080);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
  gradient.addColorStop(0, 'blue');
  gradient.addColorStop(1, 'red');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1920, 1080);

  // Load cover image
  const coverImg = await loadImage(data.versions[0].coverURL);

  // Load background image
  let backgroundImg = null;
  try {
    backgroundImg = await loadImage(backgroundUrl);
  } catch (error) {
    log.error('Error loading background:', error);
    backgroundImg = coverImg;
  }

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(20, 20, 1880, 1040, 50);
  ctx.clip();

  // Draw background with blur effect
  ctx.filter = 'blur(10px)';
  if (backgroundImg) {
    ctx.drawImage(backgroundImg, 0, 0, 1920, 1080);
  } else {
    ctx.drawImage(coverImg, 0, 0, 1920, 1080);
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
  ctx.drawImage(coverImg, 75, 495, 510, 510);
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
    case 'EX':
      color = 'rgb(220 38 38)';
      difficulty = 'Expert';
      break;
    case 'EXP':
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
    ctx.fillText(`${difficulty} ${rating}${rating !== 'Unranked' && rating !== 'Qualified' ? ' ★' : ''}`, x + 255, 410);
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
