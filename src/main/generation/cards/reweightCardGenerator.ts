import { Canvas, ExportFormat } from 'skia-canvas';
import { loadImage, truncateText } from '../utils/imageUtils';
import { MapInfo, OldStarRatings, NewStarRatings } from '../types/interfaces';
import { loadTorusProFonts, getFontFamily } from '../utils/canvasUtils';

export async function generateReweightCard(data: MapInfo, oldStarRatings: OldStarRatings, newStarRatings: NewStarRatings, chosenDiff: keyof OldStarRatings): Promise<string> {
  // Load fonts before generating card
  await loadTorusProFonts();
  
  const canvas = new Canvas(600, 270);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 600, 270);
  ctx.save();

  // Draw the semi-transparent background
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.roundRect(0, 0, 600, 270, 40);
  ctx.fill();
  ctx.closePath();

  // Background glow for buff/nerf
  let glowColor = '';
  const oldRatingValue = parseFloat(oldStarRatings[chosenDiff]);
  const newRatingValue = parseFloat(newStarRatings[chosenDiff]);

  if (newRatingValue > oldRatingValue) {
    glowColor = 'rgba(22, 163, 74, 0.1)'; // Green for buff
  } else if (newRatingValue < oldRatingValue) {
    glowColor = 'rgba(220, 38, 38, 0.1)'; // Red for nerf
  }

  if (glowColor) {
    ctx.filter = 'blur(20px)';
    ctx.beginPath();
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.roundRect(40, 40, 520, 190, 20);
    ctx.fill();
    ctx.closePath();
    ctx.filter = 'none';
  }
  
  // Draw the rounded cover image
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 10;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.roundRect(20, 20, 230, 230, 20);
  ctx.clip();
  const img = await loadImage(data.versions[0].coverURL);
  ctx.drawImage(img, 20, 20, 230, 230);
  ctx.restore();

  // Draw metadata text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';

  const maxWidth = 300;
  
  // Use Light weight for author name
  ctx.font = `300 24px ${getFontFamily('TorusPro')}`;
  const authorName = data.metadata.songAuthorName;
  const displayAuthorName = truncateText(ctx, authorName, maxWidth);
  ctx.fillText(displayAuthorName, 270, 55);

  // Use Bold weight for song name (most prominent)
  ctx.font = `700 30px ${getFontFamily('TorusPro')}`;
  const songName = data.metadata.songName;
  const displaySongName = truncateText(ctx, songName, maxWidth);
  ctx.fillText(displaySongName, 270, 90);

  // Use Regular weight for sub name
  ctx.font = `400 20px ${getFontFamily('TorusPro')}`;
  ctx.fillStyle = 'rgb(200, 200, 200)';
  const subName = data.metadata.songSubName;
  const displaySubName = truncateText(ctx, subName, maxWidth);
  ctx.fillText(displaySubName, 270, 120);

  // Use Medium weight for mapper credit
  ctx.font = `500 20px ${getFontFamily('TorusPro')}`;
  ctx.fillStyle = 'white';
  const levelAuthorName = `Mapped by ${data.metadata.levelAuthorName}`;
  const displayLevelAuthorName = truncateText(ctx, levelAuthorName, maxWidth);
  ctx.fillText(displayLevelAuthorName, 270, 170);

  // Display additional info
  // ctx.textAlign = 'right';
  // Use Medium weight for labels
  // ctx.font = `500 20px ${getFontFamily('TorusPro')}`;
  // ctx.fillText(`Map Code:`, 580, 55);
  // Use SemiBold weight for the ID
  // ctx.font = `600 20px ${getFontFamily('TorusPro')}`;
  // ctx.fillText(`${data.id}`, 580, 75);

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
    case 'EX':
      color = 'rgb(220 38 38)';
      break;
    case 'EXP':
      color = 'rgb(126 34 206)';
      break;
    default:
      color = 'gray';
  }

  let arrowColor = 'gray';
  if (newRatingValue > oldRatingValue) {
    arrowColor = 'rgb(22 163 74)';
  } else if (newRatingValue < oldRatingValue) {
    arrowColor = 'rgb(220 38 38)';
  }

  const rating = oldStarRatings[chosenDiff];
  const newRating = newStarRatings[chosenDiff];

  if (rating && newRating) {
    // Position for rating display (centered horizontally in the right panel)
    const centerX = 405; 
    const yPos = 218;

    // Old rating
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(centerX - 135, yPos - 17, 100, 34, 10);
    ctx.fill();
    ctx.closePath();

    // Old rating text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 24px ${getFontFamily('TorusPro')}`;
    ctx.fillText(`${rating}★`, centerX - 85, yPos);
    ctx.restore();

    // Arrow between ratings
    ctx.save();
    ctx.fillStyle = arrowColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 30px ${getFontFamily('TorusPro')}`;
    ctx.fillText('▶', centerX, yPos);
    ctx.restore();

    // New rating
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(centerX + 35, yPos - 17, 100, 34, 10);
    ctx.fill();
    ctx.closePath();

    // New rating text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 24px ${getFontFamily('TorusPro')}`;
    ctx.fillText(`${newRating}★`, centerX + 85, yPos);
    ctx.restore();
  }

  return canvas.toDataURL('image/png' as ExportFormat);
}
