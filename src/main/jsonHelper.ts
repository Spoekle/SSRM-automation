export interface CardComponentConfig {
  type: 'text' | 'image' | 'roundedRect' | 'starRating';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  font?: string;
  fillStyle?: string;
  maxWidth?: number;
  textAlign?: CanvasTextAlign;

  // For roundedRect
  cornerRadius?: number;
  shadow?: {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
  };

  // For image
  imageUrl?: string;
  srcField?: string;
  clip?: boolean; // whether to clip image to rounded rect shape

  // For starRating
  ratings?: { label: string; rating: string; color: string }[];
  defaultWidth?: number;
  specialWidth?: number;
  defaultSpacing?: number;
  specialSpacing?: number;
}

export interface CardBackgroundConfig {
  type: 'color' | 'gradient' | 'cover';  // added "cover"
  color?: string;
  // For cover type background
  srcField?: string;
  blur?: number;
}

export interface CardConfig {
  width: number;
  height: number;
  cardCornerRadius: number;
  background: CardBackgroundConfig;
  components: CardComponentConfig[];
  configName?: string;
}

import { Canvas, ExportFormat } from 'skia-canvas';
import { formatDuration, truncateText, loadImage, StarRating } from './helper';

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export async function generateCardFromConfig(
  config: CardConfig,
  data?: { [key: string]: any },
  starRatings?: StarRating,
  useBackground?: boolean
): Promise<string> {
  if (data) {
    data.starRatings = starRatings;
    data.useBackground = useBackground;
    if (data.metadata && data.metadata.duration) {
      data.durationFormatted = formatDuration(data.metadata.duration);
    }
  }
  console.log('Loaded config:', config);
  const canvas = new Canvas(config.width, config.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'transparent';

  const cardRadius = config.cardCornerRadius;
  console.log('Using cardCornerRadius:', cardRadius);
  ctx.fillRect(0, 0, config.width, config.height);
  ctx.roundRect(0, 0, config.width, config.height, cardRadius);
  ctx.clip();

  // BACKGROUND RENDERING
  if (useBackground && config.background.type === 'cover' && data && config.background.srcField) {
    const bgSrc = getNestedValue(data, config.background.srcField);
    if (bgSrc) {
      const bgImg = await loadImage(bgSrc);
      const blurValue = config.background.blur;
      ctx.filter = `blur(${blurValue}px)`;
      ctx.drawImage(bgImg, 0, 0, config.width, config.height);
      ctx.filter = 'none';
    }
  } else {
    // Otherwise, use provided background config (color or gradient)
    if (config.background.type === 'color' && config.background.color) {
      ctx.fillStyle = config.background.color;
      ctx.fillRect(0, 0, config.width, config.height);
    }
  }

  ctx.save();

  // Render each component from the config
  for (const comp of config.components) {
    switch (comp.type) {
      case 'roundedRect': {
        ctx.beginPath();
        if (comp.shadow) {
          ctx.shadowColor = comp.shadow.color;
          ctx.shadowOffsetX = comp.shadow.offsetX;
          ctx.shadowOffsetY = comp.shadow.offsetY;
          ctx.shadowBlur = comp.shadow.blur;
        }
        ctx.fillStyle = comp.fillStyle || 'transparent';
        ctx.roundRect(comp.x, comp.y, comp.width || 0, comp.height || 0, comp.cornerRadius || 0);
        ctx.fill();
        ctx.closePath();
        break;
      }
      case 'text': {
        let text = comp.text || '';
        if (data) {
          text = text.replace(/{([^}]+)}/g, (_, key) => getNestedValue(data, key) || '');
        }
        ctx.font = comp.font || '24px sans-serif';
        ctx.fillStyle = comp.fillStyle || 'black';
        ctx.textAlign = comp.textAlign || 'left';
        ctx.textBaseline = 'middle';
        const displayText = comp.maxWidth ? truncateText(ctx, text, comp.maxWidth) : text;
        const textY = comp.height ? comp.y + comp.height / 2 : comp.y;
        ctx.fillText(displayText, comp.x, textY);
        break;
      }
      case 'image': {
        // Use comp.imageUrl directly; if missing and srcField exists, use that value from API data.
        let imageUrl = comp.imageUrl;
        if (!imageUrl && comp.srcField && data) {
          imageUrl = getNestedValue(data, comp.srcField);
        }
        if (imageUrl) {
          try {
            const img = await loadImage(imageUrl);
            const drawWidth = comp.width || img.width;
            const drawHeight = comp.height || img.height;
            if (comp.clip) {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(comp.x, comp.y, drawWidth, drawHeight, comp.cornerRadius || 10);
              ctx.clip();
              ctx.drawImage(img, comp.x, comp.y, drawWidth, drawHeight);
              ctx.restore();
            } else {
              ctx.drawImage(img, comp.x, comp.y, drawWidth, drawHeight);
            }
          } catch (error) {
            console.error('Error loading image for component:', comp, error);
          }
        }
        break;
      }
      case 'starRating': {
        if (comp.ratings) {
          let currentX = comp.x;
          for (const ratingObj of comp.ratings) {
            let ratingValue = ratingObj.rating;
            if (data && ratingValue && ratingValue.startsWith('{') && ratingValue.endsWith('}')) {
              const key = ratingValue.slice(1, -1);
              ratingValue = getNestedValue(data, key);
            }
            if (ratingValue !== undefined && ratingValue !== null && ratingValue !== '') {
              ctx.fillStyle = ratingObj.color;
              const rectWidth =
                ratingValue === 'Unranked' || ratingValue === 'Qualified'
                  ? (comp.specialWidth || 120)
                  : (comp.defaultWidth || 100);
              ctx.beginPath();
              ctx.roundRect(currentX, comp.y, rectWidth, comp.height || 50, 10);
              ctx.fill();
              ctx.closePath();

              ctx.fillStyle = 'white';
              ctx.textBaseline = 'middle';
              ctx.textAlign = 'center';
              ctx.font = comp.font || 'bold 20px sans-serif';
              ctx.fillText(
                `${ratingValue}${ratingValue !== 'Unranked' && ratingValue !== 'Qualified' ? ' ★' : ''}`,
                currentX + rectWidth / 2,
                comp.y + ((comp.height || 50) / 2)
              );
              currentX +=
                ratingValue === 'Unranked' || ratingValue === 'Qualified'
                  ? (comp.specialSpacing || 130)
                  : (comp.defaultSpacing || 110);
            }
          }
        }
        break;
      }
      default:
        console.warn('Unknown component type:', comp.type);
        break;
    }
  }

  return canvas.toDataURL('image/png' as ExportFormat);
}
