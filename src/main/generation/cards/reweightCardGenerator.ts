import { Canvas, ExportFormat } from 'skia-canvas';
import { loadImage, truncateText } from '../utils/imageUtils';
import { MapInfo, OldStarRatings, NewStarRatings } from '../types/interfaces';
import { loadTorusProFonts, getFontFamily } from '../utils/canvasUtils';
import log from 'electron-log';



export async function generateReweightCard(data: MapInfo, oldStarRatings: OldStarRatings, newStarRatings: NewStarRatings, chosenDiff: keyof OldStarRatings): Promise<string> {
  // Load fonts before generating card
  await loadTorusProFonts();
  
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
  
  // Use Light weight for author name
  ctx.font = `300 24px ${getFontFamily('TorusPro')}`;
  const authorName = data.metadata.songAuthorName;
  const displayAuthorName = truncateText(ctx, authorName, maxWidth);
  ctx.fillText(displayAuthorName, 290, 55);

  // Use Bold weight for song name (most prominent)
  ctx.font = `700 30px ${getFontFamily('TorusPro')}`;
  const songName = data.metadata.songName;
  const displaySongName = truncateText(ctx, songName, maxWidth);
  ctx.fillText(displaySongName, 290, 90);

  // Use Regular weight for sub name
  ctx.font = `400 20px ${getFontFamily('TorusPro')}`;
  const subName = data.metadata.songSubName;
  const displaySubName = truncateText(ctx, subName, maxWidth);
  ctx.fillText(displaySubName, 290, 120);

  // Use Medium weight for mapper credit
  ctx.font = `500 20px ${getFontFamily('TorusPro')}`;
  const levelAuthorName = `Mapped by ${data.metadata.levelAuthorName}`;
  const displayLevelAuthorName = truncateText(ctx, levelAuthorName, maxWidth);
  ctx.fillText(displayLevelAuthorName, 290, 150);

  // Display additional info
  ctx.textAlign = 'right';
  // Use Medium weight for labels
  ctx.font = `500 20px ${getFontFamily('TorusPro')}`;
  ctx.fillText(`Map Code:`, 730, 55);
  // Use SemiBold weight for the ID
  ctx.font = `600 20px ${getFontFamily('TorusPro')}`;
  ctx.fillText(`${data.id}`, 730, 75);

  ctx.font = `500 20px ${getFontFamily('TorusPro')}`;
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
    case 'EX':
      color = 'rgb(220 38 38)';
      break;
    case 'EXP':
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
    // Use Bold weight for rating text
    ctx.font = `700 20px ${getFontFamily('TorusPro')}`;
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
    // Use Bold weight for rating text
    ctx.font = `700 20px ${getFontFamily('TorusPro')}`;
    ctx.fillText(`${newRating} ★`, x + 250, 200);
  }

  return canvas.toDataURL('image/png' as ExportFormat);
}
