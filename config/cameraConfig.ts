// 通用翻译功能配置 - 优化重用版
export interface TranslationConfig {
  // 基础配置
  defaultTargetLanguage: string;
  defaultSourceLanguage: string;
  autoDetectLanguage: boolean;
  
  // 性能配置
  maxTextLength: number;
  confidenceThreshold: number;
  cacheEnabled: boolean;
  cacheTTL: number; // 缓存生存时间（毫秒）
  
  // OCR配置
  ocrEnabled: boolean;
  ocrConfidenceThreshold: number;
  maxOcrTexts: number;
  
  // 翻译配置
  translationTimeout: number; // 翻译超时时间（毫秒）
  retryAttempts: number; // 重试次数
  batchSize: number; // 批量翻译大小
  
  // 性能监控
  enablePerformanceMetrics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// 默认配置
export const defaultTranslationConfig: TranslationConfig = {
  defaultTargetLanguage: 'zh-CN',
  defaultSourceLanguage: 'auto',
  autoDetectLanguage: true,
  
  maxTextLength: 5000,
  confidenceThreshold: 0.7,
  cacheEnabled: true,
  cacheTTL: 300000, // 5分钟
  
  ocrEnabled: false, // 相机功能已移除
  ocrConfidenceThreshold: 0.8,
  maxOcrTexts: 10,
  
  translationTimeout: 10000, // 10秒
  retryAttempts: 3,
  batchSize: 5,
  
  enablePerformanceMetrics: true,
  logLevel: 'info',
};

// 高性能配置
export const performanceTranslationConfig: TranslationConfig = {
  ...defaultTranslationConfig,
  cacheEnabled: true,
  cacheTTL: 600000, // 10分钟
  batchSize: 10,
  retryAttempts: 2,
  enablePerformanceMetrics: true,
  logLevel: 'warn',
};

// 兼容性配置
export const compatibilityTranslationConfig: TranslationConfig = {
  ...defaultTranslationConfig,
  cacheEnabled: false,
  batchSize: 1,
  retryAttempts: 1,
  enablePerformanceMetrics: false,
  logLevel: 'error',
};

// 开发配置
export const developmentTranslationConfig: TranslationConfig = {
  ...defaultTranslationConfig,
  logLevel: 'debug',
  enablePerformanceMetrics: true,
  cacheEnabled: false,
};

// 获取当前配置
export const getTranslationConfig = (): TranslationConfig => {
  // 根据环境变量或用户设置选择配置
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return performanceTranslationConfig;
    case 'development':
      return developmentTranslationConfig;
    default:
      return defaultTranslationConfig;
  }
};

// 配置验证
export const validateTranslationConfig = (config: TranslationConfig): boolean => {
  return (
    config.maxTextLength > 0 &&
    config.confidenceThreshold >= 0 &&
    config.confidenceThreshold <= 1 &&
    config.cacheTTL > 0 &&
    config.translationTimeout > 0 &&
    config.retryAttempts >= 0 &&
    config.batchSize > 0
  );
};

// 配置合并
export const mergeTranslationConfig = (
  base: TranslationConfig,
  overrides: Partial<TranslationConfig>
): TranslationConfig => {
  return { ...base, ...overrides };
};