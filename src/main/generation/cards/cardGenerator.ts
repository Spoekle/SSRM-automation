import { Canvas, ExportFormat } from 'skia-canvas';
import { MapInfo, StarRating } from '../types/interfaces';
import { loadImage, formatDuration, truncateText } from '../utils/imageUtils';

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
    { rating: starRatings.EX, color: 'rgb(220 38 38)' },
    { rating: starRatings.EXP, color: 'rgb(126 34 206)' }
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
