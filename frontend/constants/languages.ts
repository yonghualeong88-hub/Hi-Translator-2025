import { Language } from '@/types/global';

// 支持的语言列表
export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'zh-CN',
    name: '中文',
    nativeName: '中文',
    flag: '🇨🇳',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'ja',
    name: '日本語',
    nativeName: '日本語',
    flag: '🇯🇵',
  },
  {
    code: 'ko',
    name: '한국어',
    nativeName: '한국어',
    flag: '🇰🇷',
  },
  {
    code: 'es',
    name: 'Español',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  {
    code: 'de',
    name: 'Deutsch',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
  {
    code: 'ru',
    name: 'Русский',
    nativeName: 'Русский',
    flag: '🇷🇺',
  },
  {
    code: 'pt',
    name: 'Português',
    nativeName: 'Português',
    flag: '🇵🇹',
  },
  {
    code: 'it',
    name: 'Italiano',
    nativeName: 'Italiano',
    flag: '🇮🇹',
  },
  {
    code: 'ar',
    name: 'العربية',
    nativeName: 'العربية',
    flag: '🇸🇦',
  },
  {
    code: 'hi',
    name: 'हिन्दी',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
  },
];

// 语言代码到语音合成语言的映射
export const SPEECH_LANGUAGE_MAP: Record<string, string> = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  'en': 'en',
  'ja': 'ja',
  'ko': 'ko',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'ru': 'ru',
  'pt': 'pt',
  'it': 'it',
  'ar': 'ar',
  'hi': 'hi',
};

// 语言代码到Google Translate API的映射
export const GOOGLE_TRANSLATE_LANGUAGE_MAP: Record<string, string> = {
  'zh-CN': 'zh-cn',
  'zh-TW': 'zh-tw',
  'en': 'en',
  'ja': 'ja',
  'ko': 'ko',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'ru': 'ru',
  'pt': 'pt',
  'it': 'it',
  'ar': 'ar',
  'hi': 'hi',
};

// 语言代码到Azure Translator的映射
export const AZURE_TRANSLATOR_LANGUAGE_MAP: Record<string, string> = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  'en': 'en',
  'ja': 'ja',
  'ko': 'ko',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'ru': 'ru',
  'pt': 'pt',
  'it': 'it',
  'ar': 'ar',
  'hi': 'hi',
};

// 常用语言对
export const COMMON_LANGUAGE_PAIRS = [
  { from: 'zh-CN', to: 'en', name: '中文 → 英文' },
  { from: 'en', to: 'zh-CN', name: '英文 → 中文' },
  { from: 'zh-CN', to: 'ja', name: '中文 → 日文' },
  { from: 'ja', to: 'zh-CN', name: '日文 → 中文' },
  { from: 'zh-CN', to: 'ko', name: '中文 → 韩文' },
  { from: 'ko', to: 'zh-CN', name: '韩文 → 中文' },
  { from: 'en', to: 'es', name: '英文 → 西班牙文' },
  { from: 'es', to: 'en', name: '西班牙文 → 英文' },
  { from: 'en', to: 'fr', name: '英文 → 法文' },
  { from: 'fr', to: 'en', name: '法文 → 英文' },
  { from: 'en', to: 'de', name: '英文 → 德文' },
  { from: 'de', to: 'en', name: '德文 → 英文' },
];

// 语言检测阈值
export const LANGUAGE_DETECTION_THRESHOLDS = {
  MIN_CONFIDENCE: 0.7,
  MIN_TEXT_LENGTH: 3,
  MAX_TEXT_LENGTH: 1000,
};

// 翻译质量等级
export const TRANSLATION_QUALITY_LEVELS = {
  EXCELLENT: { min: 0.9, label: '优秀', color: '#10B981' },
  GOOD: { min: 0.8, label: '良好', color: '#3B82F6' },
  FAIR: { min: 0.7, label: '一般', color: '#F59E0B' },
  POOR: { min: 0.0, label: '较差', color: '#EF4444' },
};

// 获取语言信息
export const getLanguageInfo = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

// 获取语言名称
export const getLanguageName = (code: string): string => {
  const language = getLanguageInfo(code);
  return language?.name || code;
};

// 获取语言本地名称
export const getLanguageNativeName = (code: string): string => {
  const language = getLanguageInfo(code);
  return language?.nativeName || code;
};

// 获取语言旗帜
export const getLanguageFlag = (code: string): string => {
  const language = getLanguageInfo(code);
  return language?.flag || '🌐';
};

// 检查是否支持该语言
export const isLanguageSupported = (code: string): boolean => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
};

// 获取语音合成语言代码
export const getSpeechLanguageCode = (code: string): string => {
  return SPEECH_LANGUAGE_MAP[code] || code;
};

// 获取Google Translate语言代码
export const getGoogleTranslateLanguageCode = (code: string): string => {
  return GOOGLE_TRANSLATE_LANGUAGE_MAP[code] || code;
};

// 获取Azure Translator语言代码
export const getAzureTranslatorLanguageCode = (code: string): string => {
  return AZURE_TRANSLATOR_LANGUAGE_MAP[code] || code;
};

// 获取推荐的目标语言
export const getRecommendedTargetLanguages = (sourceLanguage: string): string[] => {
  const recommendations: Record<string, string[]> = {
    'zh-CN': ['en', 'ja', 'ko', 'es', 'fr'],
    'en': ['zh-CN', 'es', 'fr', 'de', 'ru'],
    'ja': ['zh-CN', 'en', 'ko'],
    'ko': ['zh-CN', 'en', 'ja'],
    'es': ['en', 'fr', 'pt', 'it'],
    'fr': ['en', 'es', 'de', 'it'],
    'de': ['en', 'fr', 'es', 'ru'],
    'ru': ['en', 'de', 'fr'],
    'pt': ['es', 'en', 'fr'],
    'it': ['es', 'fr', 'en'],
    'ar': ['en', 'fr', 'es'],
    'hi': ['en', 'ur', 'bn'],
  };

  return recommendations[sourceLanguage] || ['en'];
};

// 获取语言对显示名称
export const getLanguagePairName = (fromLanguage: string, toLanguage: string): string => {
  const fromName = getLanguageName(fromLanguage);
  const toName = getLanguageName(toLanguage);
  return `${fromName} → ${toName}`;
};

// 检查是否为相同语言
export const isSameLanguage = (lang1: string, lang2: string): boolean => {
  return lang1 === lang2;
};

// 获取翻译质量等级
export const getTranslationQualityLevel = (confidence: number) => {
  if (confidence >= TRANSLATION_QUALITY_LEVELS.EXCELLENT.min) {
    return TRANSLATION_QUALITY_LEVELS.EXCELLENT;
  } else if (confidence >= TRANSLATION_QUALITY_LEVELS.GOOD.min) {
    return TRANSLATION_QUALITY_LEVELS.GOOD;
  } else if (confidence >= TRANSLATION_QUALITY_LEVELS.FAIR.min) {
    return TRANSLATION_QUALITY_LEVELS.FAIR;
  } else {
    return TRANSLATION_QUALITY_LEVELS.POOR;
  }
};

// 语言检测模式
export const LANGUAGE_DETECTION_MODES = {
  AUTO: 'auto',
  MANUAL: 'manual',
  HYBRID: 'hybrid',
} as const;

// 翻译引擎
export const TRANSLATION_ENGINES = {
  GOOGLE: 'google',
  AZURE: 'azure',
  LOCAL: 'local',
  CUSTOM: 'custom',
} as const;

// 默认语言设置
export const DEFAULT_LANGUAGE_SETTINGS = {
  SOURCE_LANGUAGE: 'zh-CN',
  TARGET_LANGUAGE: 'en',
  AUTO_DETECT: true,
  FALLBACK_LANGUAGE: 'en',
} as const;
