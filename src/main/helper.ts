import { Canvas, Image, FontLibrary } from 'skia-canvas';
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

    const truncateText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
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
      ? truncateText(ctx, authorName, maxWidth)
      : authorName;
    ctx.fillText(displayAuthorName, 320, 55);

    ctx.font = 'bold 30px Avenir-Black';
    // Check if Song Name needs truncation
    const songName = data.metadata.songName;
    const displaySongName = ctx.measureText(songName).width > maxWidth
      ? truncateText(ctx, songName, maxWidth)
      : songName;
    ctx.fillText(displaySongName, 320, 90);

    ctx.font = '20px Avenir';
    // Check if Song Sub Name needs truncation
    const subName = data.metadata.songSubName;
    const displaySubName = ctx.measureText(subName).width > maxWidth
      ? truncateText(ctx, subName, maxWidth)
      : subName;
    ctx.fillText(displaySubName, 320, 120);

    ctx.font = '20px Avenir-Light';
    // Check if Level Author Name needs truncation
    const levelAuthorName = `Mapped by ${data.metadata.levelAuthorName}`;
    const displayLevelAuthorName = ctx.measureText(levelAuthorName).width > maxWidth
      ? truncateText(ctx, levelAuthorName, maxWidth)
      : levelAuthorName;
    ctx.fillText(displayLevelAuthorName, 320, 180);

    // Convert and display duration
    const durationFormatted = formatDuration(data.metadata.duration);
    ctx.textAlign = 'right';
    ctx.font = '20px Avenir-Black';
    ctx.fillText(`BSR:`, 860, 55);
    ctx.font = '20px Avenir-Light';
    ctx.fillText(`${data.id}`, 860, 85);
    ctx.font = '20px Avenir-Black';
    ctx.fillText(`Song Duration:`, 860, 150);
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

    return canvas.toDataURL('image/png');
}
