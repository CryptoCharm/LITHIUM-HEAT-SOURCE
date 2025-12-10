export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT_2_3 = '2:3',
  LANDSCAPE_3_2 = '3:2',
  PORTRAIT_3_4 = '3:4',
  LANDSCAPE_4_3 = '4:3',
  PORTRAIT_9_16 = '9:16',
  LANDSCAPE_16_9 = '16:9',
}

export enum ImageResolution {
  RES_1K = '1K',
  RES_2K = '2K',
  RES_4K = '4K',
}

export interface GeneratedImage {
  id: string;
  url: string; // Base64 data URL
  prompt: string;
  timestamp: number;
  resolution: ImageResolution;
  aspectRatio: AspectRatio;
}

export interface TaskGroup {
  id: string;
  type: 'SUITE' | 'RESTORE';
  status: 'processing' | 'completed' | 'failed';
  timestamp: number;
  images: GeneratedImage[];
  error?: string;
  originalInput?: string; // Base64 of input image if any
  inputPrompt?: string;
}

export interface GeminiConfig {
  prompt: string;
  image?: string; // Base64
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
  count: number;
  mode: 'SUITE' | 'RESTORE';
}