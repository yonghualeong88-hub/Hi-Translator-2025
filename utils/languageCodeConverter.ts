// 语言代码转换工具
// 将前端使用的语言代码转换为各种API支持的语言代码

/**
 * 将前端语言代码转换为 Whisper API 支持的语言代码
 * Whisper API 使用 ISO 639-1 标准的两字母代码
 */
export const convertToWhisperLanguageCode = (languageCode: string): string => {
  const languageMap: Record<string, string> = {
    // 中文
    'zh-CN': 'zh',
    'zh-TW': 'zh',
    
    // 主要语言
    'en': 'en',
    'ja': 'ja',
    'ko': 'ko',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'it': 'it',
    'pt': 'pt',
    'ru': 'ru',
    'ar': 'ar',
    'hi': 'hi',
    'th': 'th',
    'vi': 'vi',
    'id': 'id',
    'ms': 'ms',
    'tl': 'tl',
    'tr': 'tr',
    
    // 欧洲语言
    'pl': 'pl',
    'nl': 'nl',
    'sv': 'sv',
    'da': 'da',
    'no': 'no',
    'fi': 'fi',
    'cs': 'cs',
    'hu': 'hu',
    'ro': 'ro',
    'bg': 'bg',
    'hr': 'hr',
    'sk': 'sk',
    'sl': 'sl',
    'et': 'et',
    'lv': 'lv',
    'lt': 'lt',
    'el': 'el',
    
    // 其他语言
    'he': 'he',
    'fa': 'fa',
    'ur': 'ur',
    'bn': 'bn',
    'ta': 'ta',
    'te': 'te',
    'ml': 'ml',
    'kn': 'kn',
    'gu': 'gu',
    'pa': 'pa',
    'or': 'or',
    'as': 'as',
    'ne': 'ne',
    'si': 'si',
    'my': 'my',
    'km': 'km',
    'lo': 'lo',
    'ka': 'ka',
    'am': 'am',
    'sw': 'sw',
    'zu': 'zu',
    'af': 'af',
    'sq': 'sq',
    'az': 'az',
    'be': 'be',
    'bs': 'bs',
    'ca': 'ca',
    'cy': 'cy',
    'eu': 'eu',
    'gl': 'gl',
    'is': 'is',
    'ga': 'ga',
    'mk': 'mk',
    'mt': 'mt',
    'sr': 'sr',
    'uk': 'uk',
    'uz': 'uz',
    'kk': 'kk',
    'ky': 'ky',
    'tg': 'tg',
    'tk': 'tk',
    'mn': 'mn',
    'bo': 'bo',
    'dz': 'dz',
    'jw': 'jw',
    'su': 'su',
    'ceb': 'ceb',
    'haw': 'haw',
  };
  
  return languageMap[languageCode] || 'en'; // 默认返回英语
};

/**
 * 检查语言代码是否被 Whisper API 支持
 */
export const isWhisperSupportedLanguage = (languageCode: string): boolean => {
  const whisperCode = convertToWhisperLanguageCode(languageCode);
  return whisperCode !== 'en' || languageCode === 'en';
};

/**
 * 获取支持的语言列表（仅显示 Whisper 支持的语言）
 */
export const getWhisperSupportedLanguages = (): string[] => {
  return [
    'zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'es', 'fr', 'de', 'it', 'pt', 'ru',
    'ar', 'hi', 'th', 'vi', 'id', 'ms', 'tl', 'tr', 'pl', 'nl', 'sv', 'da',
    'no', 'fi', 'cs', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'et', 'lv', 'lt',
    'el', 'he', 'fa', 'ur', 'bn', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'or',
    'as', 'ne', 'si', 'my', 'km', 'lo', 'ka', 'am', 'sw', 'zu', 'af', 'sq',
    'az', 'be', 'bs', 'ca', 'cy', 'eu', 'gl', 'is', 'ga', 'mk', 'mt', 'sr',
    'uk', 'uz', 'kk', 'ky', 'tg', 'tk', 'mn', 'bo', 'dz', 'jw', 'su', 'ceb',
    'haw'
  ];
};
