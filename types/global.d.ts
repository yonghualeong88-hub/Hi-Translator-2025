// Global type definitions for HLTransslater

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

// Translation related types
export interface TranslationResult {
  originalText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  timestamp: Date;
  confidence?: number;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

export interface TranslationHistoryItem {
  id: string;
  originalText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  timestamp: Date;
  mode: 'voice' | 'text' | 'dual';
}

// Audio related types
export interface AudioRecording {
  uri: string;
  duration: number;
  size: number;
}

export interface SpeechOptions {
  language: string;
  pitch?: number;
  rate?: number;
  volume?: number;
}

// Settings types
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  autoPlay: boolean;
  saveHistory: boolean;
  hapticFeedback: boolean;
  highQualityAudio: boolean;
  defaultFromLanguage: string;
  defaultToLanguage: string;
  translationEngine: 'google' | 'azure' | 'local';
}

// API response types
export interface TranslationAPIResponse {
  success: boolean;
  data?: {
    translatedText: string;
    confidence: number;
    detectedLanguage?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Navigation types
export type RootStackParamList = {
  '(tabs)': undefined;
  '+not-found': undefined;
};

export type TabParamList = {
  index: undefined;
  history: undefined;
  settings: undefined;
};

// Theme types
export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryText: string;
  border: string;
  shadow: string;
  error: string;
  success: string;
  warning: string;
}

// Utility types
export type TranslationMode = 'voice' | 'text' | 'dual';
export type Theme = 'light' | 'dark' | 'auto';

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp?: Date;
  type?: string;
}

// Storage types
export interface StorageData {
  settings: AppSettings;
  history: TranslationHistoryItem[];
  favorites: string[];
}


export { };

