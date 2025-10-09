// 通用翻译功能类型定义 - 优化重用版
export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ScreenPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedText {
  id: string;
  text: string;
  confidence: number;
  bbox: BoundingBox;
  translation?: string;
  translatedText?: string; // 添加翻译文字字段
  language?: string;
  sourceLanguage?: string;
  originalImageSize?: { width: number; height: number }; // 添加原始图片尺寸
  ocrImageSize?: { width: number; height: number }; // ML Kit OCR 处理的图片尺寸
  fontSize?: number; // 从OCR bounding box计算出的字体大小
}

export interface TranslationOverlay {
  id: string;
  originalText: string;
  translatedText: string;
  position: ScreenPosition;
  confidence: number;
  textItemId?: string;
  fontSize?: number; // OCR计算的字体大小
}

export interface TranslationResult {
  detectedTexts: DetectedText[];
  overlays: TranslationOverlay[];
  imageUri?: string;
  timestamp: Date;
}

export interface ProcessingState {
  isActive: boolean;
  isProcessing: boolean;
  error: string | null;
  hasPermission: boolean;
  isStarting?: boolean;
}

// OCR相关类型
export interface OCRResult {
  text: string;
  confidence: number;
  bounding: BoundingBox;
}

export interface OCRService {
  detectText(imageUri: string): Promise<OCRResult[]>;
}

// 翻译服务相关类型
export interface TranslationService {
  translateText(text: string, fromLanguage: string, toLanguage: string): Promise<string>;
  translateBatch(texts: string[], fromLanguage: string, toLanguage: string): Promise<string[]>;
}

// 语言相关类型
export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

// 配置相关类型
export interface TranslationConfig {
  targetLanguage: string;
  sourceLanguage?: string;
  autoDetectLanguage: boolean;
  confidenceThreshold: number;
  maxTextLength: number;
}

// 错误相关类型
export interface TranslationError {
  code: string;
  message: string;
  details?: any;
  timestamp?: Date;
}

// 性能相关类型
export interface PerformanceMetrics {
  ocrTime: number;
  translationTime: number;
  totalTime: number;
  memoryUsage?: number;
}

// 缓存相关类型
export interface TranslationCache {
  key: string;
  result: TranslationResult;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
}

// Google Lens 风格的类型定义
export interface CameraPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GoogleLensDetectedText {
  id: string;
  text: string;
  confidence: number;
  boundingBox: CameraPosition;
  translatedText?: string;
  language?: string;
}

export interface CameraState {
  isActive: boolean;
  hasPermission: boolean;
  isProcessing: boolean;
  error: string | null;
}

export interface GoogleLensConfig {
  detectionMode: 'photo';
  translationEnabled: boolean;
  overlayStyle: 'replace' | 'highlight';
  targetLanguage: string;
}

// 所有类型已通过 interface 导出，无需重复导出