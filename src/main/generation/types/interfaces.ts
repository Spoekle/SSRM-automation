export interface StarRating {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
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
  EX: string;
  EXP: string;
}

export interface OldStarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
}

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
