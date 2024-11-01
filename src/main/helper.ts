import { Canvas, ExportFormat, Image } from 'skia-canvas';
import { CanvasRenderingContext2D as SkiaCanvasRenderingContext2D } from 'skia-canvas';

interface StarRating {
    ES: string;
    NOR: string;
    HARD: string;
    EXP: string;
    EXP_PLUS: string;
}

interface MapInfo {
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



async function loadImage(url: string): Promise<Image> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const buffer = Buffer.from(await response.arrayBuffer());
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = `data:image/png;base64,${buffer.toString('base64')}`;
    });
}

function formatDuration(seconds = 0): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export async function generateCard(data: MapInfo, starRatings: StarRating): Promise<string> {

    const canvas = new Canvas(900, 300);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 900, 300);
    ctx.roundRect(0, 0, 900, 300, 20);
    ctx.clip();

    // Apply blur filter and load the cover image
    ctx.filter = 'blur(10px)';
    const img = await loadImage(data.versions[0].coverURL);
    ctx.drawImage(img, 0, 0, 900, 300);
    ctx.filter = 'none';
    ctx.save();

    // Draw the rounded cover image
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 10;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.roundRect(20, 20, 260, 260, 10); // Rounded corners for the cover
    ctx.clip();
    ctx.drawImage(img, 20, 20, 260, 260); // Draw the cover image
    ctx.restore();

    // Draw the rounded rectangle for the semi-transparent background
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Semi-transparent black
    ctx.roundRect(300, 20, 580, 180, 10); // Rounded corners for background
    ctx.fill(); // Fill the rounded background
    ctx.closePath();

    // Draw the metadata text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';

    const truncateText = (ctx: SkiaCanvasRenderingContext2D, text: string, maxWidth: number): string => {
      const ellipsis = '...';
      let truncatedText = text;

      // Check if text width exceeds the maxWidth
      while (ctx.measureText(truncatedText + ellipsis).width > maxWidth) {
        truncatedText = truncatedText.slice(0, -1);
      }

      return truncatedText + ellipsis;
    };

    // Maximum width for text
    const maxWidth = 480;

    // Set up the canvas context
    ctx.font = '24px Avenir';

    // Check if Song Author Name needs truncation
    const authorName = data.metadata.songAuthorName;
    const displayAuthorName = ctx.measureText(authorName).width > maxWidth
      ? truncateText(ctx as SkiaCanvasRenderingContext2D, authorName, maxWidth)
      : authorName;
    ctx.fillText(displayAuthorName, 320, 55);

    ctx.font = 'bold 30px Avenir-Black';
    // Check if Song Name needs truncation
    const songName = data.metadata.songName;
    const displaySongName = ctx.measureText(songName).width > maxWidth
      ? truncateText(ctx as SkiaCanvasRenderingContext2D, songName, maxWidth)
      : songName;
    ctx.fillText(displaySongName, 320, 90);

    ctx.font = '20px Avenir';
    // Check if Song Sub Name needs truncation
    const subName = data.metadata.songSubName;
    const displaySubName = ctx.measureText(subName).width > maxWidth
      ? truncateText(ctx as SkiaCanvasRenderingContext2D, subName, maxWidth)
      : subName;
    ctx.fillText(displaySubName, 320, 120);

    ctx.font = '20px Avenir-Light';
    // Check if Level Author Name needs truncation
    const levelAuthorName = `Mapped by ${data.metadata.levelAuthorName}`;
    const displayLevelAuthorName = ctx.measureText(levelAuthorName).width > maxWidth
      ? truncateText(ctx as SkiaCanvasRenderingContext2D, levelAuthorName, maxWidth)
      : levelAuthorName;
    ctx.fillText(displayLevelAuthorName, 320, 180);

    // Convert and display duration
    const durationFormatted = formatDuration(data.metadata.duration);
    ctx.textAlign = 'right';
    ctx.font = '20px Avenir-Black';
    ctx.fillText(`Map Code:`, 860, 55);
    ctx.font = '20px Avenir-Light';
    ctx.fillText(`${data.id}`, 860, 75);
    ctx.font = '20px Avenir-Black';
    ctx.fillText(`BPM:`, 860, 105);
    ctx.font = '20px Avenir-Light';
    ctx.fillText(`${data.metadata.bpm}`, 860, 130);
    ctx.font = '20px Avenir-Black';
    ctx.fillText(`Song Duration:`, 860, 160);
    ctx.font = '20px Avenir-Light';
    ctx.fillText(`${durationFormatted}`, 860, 180);

    ctx.font = '20px Avenir';
    ctx.textAlign = 'center';

    // Define the star ratings with their respective colors
    const ratings = [
      { rating: starRatings.ES, color: 'rgb(22 163 74)' },
      { rating: starRatings.NOR, color: 'rgb(59 130 246)' },
      { rating: starRatings.HARD, color: 'rgb(249 115 22)' },
      { rating: starRatings.EXP, color: 'rgb(220 38 38)' },
      { rating: starRatings.EXP_PLUS, color: 'rgb(126 34 206)' }
    ];

    let x = 300; // Initial x position

    // Loop through the ratings and draw each one if not empty
    ratings.forEach(({ rating, color }) => {
      if (rating) {
          ctx.fillStyle = color;
          ctx.beginPath();
          if (rating === 'Unranked') {
              ctx.roundRect(x, 220, 120, 50, 10);
          }
          else {
              ctx.roundRect(x, 220, 100, 50, 10);
          }
          ctx.fill();
          ctx.closePath();

          // Draw the text
          ctx.fillStyle = 'white';
          ctx.textBaseline = 'middle'
          ctx.font = 'bold 20px Avenir-Black';
          if (rating === 'Unranked') {
              ctx.fillText(`${rating}`, x + 60, 245);
              x += 130;
          } else {
              ctx.fillText(`${rating} ★`, x + 50, 245);
              x += 110;
          }
      }
    });

    return canvas.toDataURL('image/png' as ExportFormat);
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

export async function generateStarChange(data: MapInfo, oldStarRatings: OldStarRatings, newStarRatings: NewStarRatings, chosenDiff: keyof OldStarRatings): Promise<string> {
  const canvas = new Canvas(800, 300); // Increased canvas height
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 800, 300);
  ctx.roundRect(0, 0, 800, 300, 20);
  ctx.clip();
  ctx.save();

  // Draw the rounded cover image
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 10;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.roundRect(20, 20, 260, 260, 10);
  ctx.clip();
  const img = await loadImage(data.versions[0].coverURL);
  ctx.drawImage(img, 20, 20, 260, 260);
  ctx.restore();

  // Draw the semi-transparent background
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.roundRect(300, 20, 480, 260, 10);
  ctx.fill();
  ctx.closePath();

  // Draw metadata text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';

  const truncateText = (ctx: SkiaCanvasRenderingContext2D, text: string, maxWidth: number): string => {
    const ellipsis = '...';
    let truncatedText = text;
    while (ctx.measureText(truncatedText + ellipsis).width > maxWidth) {
      truncatedText = truncatedText.slice(0, -1);
    }
    return truncatedText + ellipsis;
  };

  const maxWidth = 380;
  ctx.font = '24px Avenir';
  const authorName = data.metadata.songAuthorName;
  const displayAuthorName = ctx.measureText(authorName).width > maxWidth
    ? truncateText(ctx, authorName, maxWidth)
    : authorName;
  ctx.fillText(displayAuthorName, 320, 55);

  ctx.font = 'bold 30px Avenir-Black';
  const songName = data.metadata.songName;
  const displaySongName = ctx.measureText(songName).width > maxWidth
    ? truncateText(ctx, songName, maxWidth)
    : songName;
  ctx.fillText(displaySongName, 320, 90);

  ctx.font = '20px Avenir';
  const subName = data.metadata.songSubName;
  const displaySubName = ctx.measureText(subName).width > maxWidth
    ? truncateText(ctx, subName, maxWidth)
    : subName;
  ctx.fillText(displaySubName, 320, 120);

  ctx.font = '20px Avenir-Light';
  const levelAuthorName = `Mapped by ${data.metadata.levelAuthorName}`;
  const displayLevelAuthorName = ctx.measureText(levelAuthorName).width > maxWidth
    ? truncateText(ctx, levelAuthorName, maxWidth)
    : levelAuthorName;
  ctx.fillText(displayLevelAuthorName, 320, 180);

  // Display additional info
  ctx.textAlign = 'right';
  ctx.font = '20px Avenir-Black';
  ctx.fillText(`BSR:`, 760, 55);
  ctx.font = '20px Avenir-Light';
  ctx.fillText(`${data.id}`, 760, 75);

  ctx.font = '20px Avenir';
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

  // Parse the ratings as floats for comparison
  const oldRatingValue = parseFloat(oldStarRatings[chosenDiff]);
  const newRatingValue = parseFloat(newStarRatings[chosenDiff]);

  // Determine the arrow color based on the rating difference
  let arrowColor = 'gray';
  if (newRatingValue > oldRatingValue) {
    arrowColor = 'rgb(22 163 74)'; // Green for increase
  } else if (newRatingValue < oldRatingValue) {
    arrowColor = 'rgb(220 38 38)'; // Red for decrease
  }

  // Get the old and new ratings for the chosen difficulty
  const rating = oldStarRatings[chosenDiff];
  const newRating = newStarRatings[chosenDiff];

  let x = 390; // Initial x position

  // Draw the rating if it exists
  if (rating) {
    // Draw combined rating rectangle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, 200, 100, 60, 10);
    ctx.fill();
    ctx.closePath();

    // Draw old rating text at the top
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px Avenir-Black';
    ctx.fillText(`${rating} ★`, x + 50, 230);

    // Draw white rounded triangle pointing to the right
    ctx.fillStyle = arrowColor;
    ctx.beginPath();
    const triangleX = x + 145;
    const triangleY = 230;
    ctx.moveTo(triangleX, triangleY - 20);
    ctx.lineTo(triangleX, triangleY + 20);
    ctx.lineTo(triangleX + 15, triangleY);
    ctx.closePath();
    ctx.fill();

    // Draw new rating rectangle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 200 , 200, 100, 60, 10);
    ctx.fill();
    ctx.closePath();

    // Draw new rating text at the bottom
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 20px Avenir-Black';
    ctx.fillText(`${newRating} ★`, x + 250, 230);
  }

  return canvas.toDataURL('image/png' as ExportFormat);
}
