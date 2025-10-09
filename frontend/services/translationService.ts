// 前端翻译服务 - 调用后端API
const API_BASE_URL = 'http://localhost:3001/api';

export interface TranslationResult {
  translatedText: string;
  confidence: number;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
}

export interface TranslationError {
  code: string;
  message: string;
}

/**
 * 翻译文本
 */
export const translateText = async (
  text: string,
  fromLanguage: string,
  toLanguage: string
): Promise<TranslationResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'translate',
        text,
        fromLanguage,
        toLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || '翻译失败');
    }

    return data.data;
  } catch (error) {
    console.error('翻译失败:', error);
    throw {
      code: 'TRANSLATION_ERROR',
      message: error instanceof Error ? error.message : '翻译失败，请检查网络连接或稍后重试',
    } as TranslationError;
  }
};

/**
 * 检测文本语言
 */
export const detectLanguage = async (text: string): Promise<LanguageDetectionResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'detect',
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || '语言检测失败');
    }

    return data.data;
  } catch (error) {
    console.error('语言检测失败:', error);
    throw {
      code: 'DETECTION_ERROR',
      message: error instanceof Error ? error.message : '语言检测失败，请检查网络连接或稍后重试',
    } as TranslationError;
  }
};

/**
 * 智能翻译（自动检测语言）
 */
export const smartTranslate = async (
  text: string,
  targetLanguage: string
): Promise<TranslationResult & { detectedLanguage: string }> => {
  try {
    // 首先检测语言
    const detectionResult = await detectLanguage(text);
    const detectedLanguage = detectionResult.detectedLanguage;
    
    // 如果检测到的语言与目标语言相同，直接返回原文
    if (detectedLanguage === targetLanguage) {
      return {
        translatedText: text,
        confidence: 1.0,
        sourceLanguage: detectedLanguage,
        targetLanguage,
        detectedLanguage,
      };
    }
    
    // 进行翻译
    const translationResult = await translateText(text, detectedLanguage, targetLanguage);
    
    return {
      ...translationResult,
      detectedLanguage,
    };
  } catch (error) {
    console.error('智能翻译失败:', error);
    throw {
      code: 'SMART_TRANSLATION_ERROR',
      message: error instanceof Error ? error.message : '智能翻译失败，请检查网络连接或稍后重试',
    } as TranslationError;
  }
};

/**
 * 获取支持的语言列表
 */
export const getSupportedLanguages = (): Record<string, string> => {
  return {
    'zh-CN': '中文',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'th': 'ไทย',
    'vi': 'Tiếng Việt',
    'id': 'Bahasa Indonesia',
    'ms': 'Bahasa Melayu',
    'tl': 'Filipino',
    'tr': 'Türkçe',
    'pl': 'Polski',
    'nl': 'Nederlands',
    'sv': 'Svenska',
    'da': 'Dansk',
    'no': 'Norsk',
    'fi': 'Suomi',
    'cs': 'Čeština',
    'hu': 'Magyar',
    'ro': 'Română',
    'bg': 'Български',
    'hr': 'Hrvatski',
    'sk': 'Slovenčina',
    'sl': 'Slovenščina',
    'et': 'Eesti',
    'lv': 'Latviešu',
    'lt': 'Lietuvių',
    'el': 'Ελληνικά',
    'he': 'עברית',
    'fa': 'فارسی',
    'ur': 'اردو',
    'bn': 'বাংলা',
    'ta': 'தமிழ்',
    'te': 'తెలుగు',
    'ml': 'മലയാളം',
    'kn': 'ಕನ್ನಡ',
    'gu': 'ગુજરાતી',
    'pa': 'ਪੰਜਾਬੀ',
    'or': 'ଓଡ଼ିଆ',
    'as': 'অসমীয়া',
    'ne': 'नेपाली',
    'si': 'සිංහල',
    'my': 'မြန်မာ',
    'km': 'ខ្មែរ',
    'lo': 'ລາວ',
    'ka': 'ქართული',
    'am': 'አማርኛ',
    'sw': 'Kiswahili',
    'zu': 'IsiZulu',
    'af': 'Afrikaans',
    'sq': 'Shqip',
    'az': 'Azərbaycan',
    'be': 'Беларуская',
    'bs': 'Bosanski',
    'ca': 'Català',
    'cy': 'Cymraeg',
    'eu': 'Euskera',
    'gl': 'Galego',
    'is': 'Íslenska',
    'ga': 'Gaeilge',
    'mk': 'Македонски',
    'mt': 'Malti',
    'sr': 'Српски',
    'uk': 'Українська',
    'uz': 'Oʻzbek',
    'kk': 'Қазақ',
    'ky': 'Кыргызча',
    'tg': 'Тоҷикӣ',
    'tk': 'Türkmen',
    'mn': 'Монгол',
    'bo': 'བོད་ཡིག',
    'dz': 'རྫོང་ཁ',
    'jw': 'Basa Jawa',
    'su': 'Basa Sunda',
    'ceb': 'Cebuano',
    'haw': 'ʻŌlelo Hawaiʻi',
    'mg': 'Malagasy',
    'ny': 'Chichewa',
    'sn': 'ChiShona',
    'st': 'Sesotho',
    'tn': 'Setswana',
    'ts': 'Xitsonga',
    've': 'Tshivenḓa',
    'xh': 'IsiXhosa',
    'yo': 'Yorùbá',
    'ig': 'Igbo',
    'ha': 'Hausa',
    'ff': 'Fulfulde',
    'wo': 'Wolof',
    'rw': 'Kinyarwanda',
    'rn': 'Kirundi',
    'so': 'Soomaali',
    'om': 'Afaan Oromoo',
    'ti': 'ትግርኛ',
    'ss': 'SiSwati',
    'nr': 'IsiNdebele',
    'nso': 'Sesotho sa Leboa'
  };
};

/**
 * 获取语言名称
 */
export const getLanguageName = (code: string): string => {
  const languages = getSupportedLanguages();
  return languages[code] || code;
};

/**
 * 验证语言代码
 */
export const isValidLanguageCode = (code: string): boolean => {
  const languages = getSupportedLanguages();
  return code in languages;
};

/**
 * 获取语言代码建议
 */
export const getLanguageCodeSuggestions = (input: string): string[] => {
  const suggestions: string[] = [];
  const lowerInput = input.toLowerCase();
  const languages = getSupportedLanguages();
  
  for (const [code, name] of Object.entries(languages)) {
    if (name.toLowerCase().includes(lowerInput) || code.toLowerCase().includes(lowerInput)) {
      suggestions.push(code);
    }
  }
  
  return suggestions.slice(0, 10); // 返回前10个建议
};
