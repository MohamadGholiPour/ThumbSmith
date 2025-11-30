
export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT_3_4 = "3:4",
  LANDSCAPE_4_3 = "4:3",
  PORTRAIT_9_16 = "9:16",
  LANDSCAPE_16_9 = "16:9",
  WIDE_21_9 = "21:9"
}

export type ImageResolution = '1K' | '2K' | '4K';
export type Language = 'en' | 'fa';

export interface PromptSegments {
  subject: string;
  action: string;
  environment: string;
  lighting: string;
  composition: string;
}

export interface GeneratedPrompt {
  title: string;
  promptText: string;
  visualStyle: string;
  reasoning?: string;
  segments?: PromptSegments;
}

export interface ThumbnailHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  aspectRatio: AspectRatio;
  timestamp: number;
}

export type TextPosition = 'Top Left' | 'Top Center' | 'Top Right' | 'Middle Left' | 'Center' | 'Middle Right' | 'Bottom Left' | 'Bottom Center' | 'Bottom Right';
export type TextColor = 'White' | 'Yellow' | 'Red' | 'Green' | 'Blue' | 'Black' | 'Neon Pink' | 'Gold';

export interface ThumbnailElements {
  // Text Section
  addText: boolean;
  aiOptimizeText: boolean; 
  textMode: 'AI Generated' | 'Custom';
  customText: string;
  textLanguage: 'English' | 'Persian';
  fontStyle: string;
  textEffect: string;
  textPosition: TextPosition;
  textColor: TextColor;

  // Background Section
  backgroundMode: 'Standard' | 'Blurred' | 'Solid White' | 'Green Screen' | 'Detailed Environment';
  aiOptimizeBackground: boolean; 

  // Framing & Camera
  shotType: 'Extreme Close-Up' | 'Medium Shot' | 'Wide Shot' | 'Low Angle' | 'Selfie Style' | 'Overhead';
  aiOptimizeFraming: boolean; 

  // Vibe & Lighting
  highSaturation: boolean;
  expression: 'Surprised' | 'Happy' | 'Serious' | 'Neutral' | 'Scared' | 'Angry';
  lighting: 'Studio' | 'Neon' | 'Natural' | 'Dramatic' | 'Golden Hour';
  aiOptimizeLighting: boolean; 
  
  // Character Reference
  faceVisibility: 'Show Face' | 'Faceless'; // NEW
  characterImage?: string; // base64
  characterDescription?: string; // AI generated description of the face
  characterPosition: 'Left' | 'Center' | 'Right';

  customInstructions: string;
  aiAutoSettings: boolean; // Global master toggle
}

export interface GeneratorPreset {
  id: string;
  name: string;
  topic: string;
  activeCategory: string; 
  style: string;
  referenceUrl?: string;
  gameName: string;
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
  negativePrompt: string;
  elements: ThumbnailElements;
}

export enum Tab {
  GENERATOR = 'generator',
  ANALYZER = 'analyzer',
  REMAKER = 'remaker',
  GALLERY = 'gallery'
}
