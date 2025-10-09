import { Language, TranslationResult, TranslationAPIResponse } from '@/types/global';

// 支持的语言列表
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'zh-CN', name: '中文', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: '日本語', nativeName: '日本語' },
  { code: 'ko', name: '한국어', nativeName: '한국어' },
  { code: 'es', name: 'Español', nativeName: 'Español' },
  { code: 'fr', name: 'Français', nativeName: 'Français' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch' },
  { code: 'ru', name: 'Русский', nativeName: 'Русский' },
];

// 语言代码映射
export const LANGUAGE_CODE_MAP: Record<string, string> = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  'en': 'en',
  'ja': 'ja',
  'ko': 'ko',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'ru': 'ru',
};

// 获取语言名称
export const getLanguageName = (code: string): string => {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language?.name || code;
};

// 获取语言本地名称
export const getLanguageNativeName = (code: string): string => {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language?.nativeName || code;
};

// 检查是否支持该语言
export const isLanguageSupported = (code: string): boolean => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
};

// 模拟翻译API调用
export const translateText = async (
  text: string,
  fromLanguage: string,
  toLanguage: string
): Promise<TranslationAPIResponse> => {
  try {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // 模拟翻译结果
    const mockTranslations: Record<string, Record<string, string>> = {
      'zh-CN': {
        'en': 'Hello, the weather is nice today, perfect for a walk.',
        'ja': 'こんにちは、今日はとてもいい天気で、散歩に最適です。',
        'ko': '안녕하세요, 오늘 날씨가 좋아서 산책하기에 완벽합니다.',
        'es': 'Hola, el clima está muy bien hoy, perfecto para dar un paseo.',
        'fr': 'Bonjour, le temps est très beau aujourd\'hui, parfait pour une promenade.',
        'de': 'Hallo, das Wetter ist heute sehr schön, perfekt für einen Spaziergang.',
        'ru': 'Привет, сегодня очень хорошая погода, идеально для прогулки.',
      },
      'en': {
        'zh-CN': '你好，今天天气很好，适合出门散步。',
        'ja': 'こんにちは、今日はとてもいい天気で、散歩に最適です。',
        'ko': '안녕하세요, 오늘 날씨가 좋아서 산책하기에 완벽합니다.',
        'es': 'Hola, el clima está muy bien hoy, perfecto para dar un paseo.',
        'fr': 'Bonjour, le temps est très beau aujourd\'hui, parfait pour une promenade.',
        'de': 'Hallo, das Wetter ist heute sehr schön, perfekt für einen Spaziergang.',
        'ru': 'Привет, сегодня очень хорошая погода, идеально для прогулки.',
      },
      'ja': {
        'zh-CN': '你好，今天天气很好，适合出门散步。',
        'en': 'Hello, the weather is nice today, perfect for a walk.',
        'ko': '안녕하세요, 오늘 날씨가 좋아서 산책하기에 완벽합니다.',
      },
      'ko': {
        'zh-CN': '你好，今天天气很好，适合出门散步。',
        'en': 'Hello, the weather is nice today, perfect for a walk.',
        'ja': 'こんにちは、今日はとてもいい天気で、散歩に最適です。',
      },
    };

    const translatedText = mockTranslations[fromLanguage]?.[toLanguage] || 
      `Translation of "${text}" from ${getLanguageName(fromLanguage)} to ${getLanguageName(toLanguage)}`;

    return {
      success: true,
      data: {
        translatedText,
        confidence: 0.85 + Math.random() * 0.15, // 85-100% 置信度
        detectedLanguage: fromLanguage,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'TRANSLATION_ERROR',
        message: '翻译服务暂时不可用，请稍后重试',
      },
    };
  }
};

// 检测语言
export const detectLanguage = async (text: string): Promise<string> => {
  try {
    // 简单的语言检测逻辑
    const chineseRegex = /[\u4e00-\u9fff]/;
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
    const koreanRegex = /[\uac00-\ud7af]/;
    const cyrillicRegex = /[\u0400-\u04ff]/;

    if (chineseRegex.test(text)) {
      return 'zh-CN';
    } else if (japaneseRegex.test(text)) {
      return 'ja';
    } else if (koreanRegex.test(text)) {
      return 'ko';
    } else if (cyrillicRegex.test(text)) {
      return 'ru';
    } else {
      return 'en'; // 默认为英文
    }
  } catch (error) {
    return 'en';
  }
};

// 验证翻译文本
export const validateTranslationText = (text: string): { isValid: boolean; error?: string } => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: '请输入要翻译的文本' };
  }

  if (text.length > 5000) {
    return { isValid: false, error: '文本长度不能超过5000个字符' };
  }

  // 检查是否包含特殊字符或恶意内容
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return { isValid: false, error: '文本包含不安全的内容' };
    }
  }

  return { isValid: true };
};

// 格式化翻译结果
export const formatTranslationResult = (
  originalText: string,
  translatedText: string,
  fromLanguage: string,
  toLanguage: string
): TranslationResult => {
  return {
    originalText: originalText.trim(),
    translatedText: translatedText.trim(),
    fromLanguage,
    toLanguage,
    timestamp: new Date(),
    confidence: 0.9,
  };
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

// 获取推荐的目标语言
export const getRecommendedTargetLanguages = (sourceLanguage: string): string[] => {
  const recommendations: Record<string, string[]> = {
    'zh-CN': ['en', 'ja', 'ko'],
    'en': ['zh-CN', 'es', 'fr', 'de'],
    'ja': ['zh-CN', 'en', 'ko'],
    'ko': ['zh-CN', 'en', 'ja'],
    'es': ['en', 'fr', 'pt'],
    'fr': ['en', 'es', 'de'],
    'de': ['en', 'fr', 'es'],
    'ru': ['en', 'de', 'fr'],
  };

  return recommendations[sourceLanguage] || ['en'];
};
