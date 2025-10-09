// 语言映射适配器 - 将应用语言代码映射到离线翻译支持的语言
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

// 离线翻译支持的语言列表（基于您的语言选择器）
// 扩展支持更多常用语言，与语言选择器保持一致
const OFFLINE_SUPPORTED_LANGUAGES = [
  // 亚洲语言
  'zh-CN', // 中文（简体）
  'zh-TW', // 中文（繁体）
  'zh',    // ✅ ML Kit 中文码（兼容）
  'ja',    // 日语
  'ko',    // 韩语
  'hi',    // 印地语
  'th',    // 泰语
  'vi',    // 越南语
  'id',    // 印尼语
  'ms',    // 马来语
  'tl',    // 菲律宾语
  'bn',    // 孟加拉语
  'ur',    // 乌尔都语
  'ta',    // 泰米尔语
  'te',    // 泰卢固语
  'gu',    // 古吉拉特语
  'kn',    // 卡纳达语
  'ml',    // 马拉雅拉姆语
  'pa',    // 旁遮普语
  'or',    // 奥里亚语
  'as',    // 阿萨姆语
  'my',    // 缅甸语
  'km',    // 高棉语
  'lo',    // 老挝语
  'si',    // 僧伽罗语
  'ne',    // 尼泊尔语
  'bo',    // 藏语
  'mn',    // 蒙古语
  'ka',    // 格鲁吉亚语
  'hy',    // 亚美尼亚语
  'az',    // 阿塞拜疆语
  'kk',    // 哈萨克语
  'ky',    // 吉尔吉斯语
  'uz',    // 乌兹别克语
  'tg',    // 塔吉克语
  'ps',    // 普什图语
  'sd',    // 信德语
  'ug',    // 维吾尔语
  
  // 欧洲语言
  'en',    // 英语
  'es',    // 西班牙语
  'fr',    // 法语
  'de',    // 德语
  'ru',    // 俄语
  'pt',    // 葡萄牙语
  'it',    // 意大利语
  'nl',    // 荷兰语
  'pl',    // 波兰语
  'sv',    // 瑞典语
  'no',    // 挪威语
  'da',    // 丹麦语
  'fi',    // 芬兰语
  'cs',    // 捷克语
  'hu',    // 匈牙利语
  'ro',    // 罗马尼亚语
  'bg',    // 保加利亚语
  'hr',    // 克罗地亚语
  'sk',    // 斯洛伐克语
  'sl',    // 斯洛文尼亚语
  'lt',    // 立陶宛语
  'lv',    // 拉脱维亚语
  'et',    // 爱沙尼亚语
  'el',    // 希腊语
  'tr',    // 土耳其语
  'uk',    // 乌克兰语
  'be',    // 白俄罗斯语
  'mk',    // 马其顿语
  'sr',    // 塞尔维亚语
  'bs',    // 波斯尼亚语
  'sq',    // 阿尔巴尼亚语
  'mt',    // 马耳他语
  'is',    // 冰岛语
  'ga',    // 爱尔兰语
  'cy',    // 威尔士语
  'eu',    // 巴斯克语
  'ca',    // 加泰罗尼亚语
  'gl',    // 加利西亚语
  
  // 中东和非洲语言
  'ar',    // 阿拉伯语
  'fa',    // 波斯语
  'he',    // 希伯来语
  'am',    // 阿姆哈拉语
  'ha',    // 豪萨语
  'sw',    // 斯瓦希里语
  'yo',    // 约鲁巴语
  'ig',    // 伊博语
  'xh',    // 科萨语
  'zu',    // 祖鲁语
  'af',    // 南非荷兰语
];

// 语言包大小估算（MB）
const LANGUAGE_PACK_SIZES: Record<string, number> = {
  // 亚洲语言
  'zh-CN': 25, 'zh-TW': 25, 'ja': 28, 'ko': 26, 'hi': 27, 'th': 25, 'vi': 24, 'id': 23,
  'ms': 22, 'tl': 23, 'bn': 26, 'ur': 24, 'ta': 25, 'te': 25, 'gu': 24, 'kn': 24,
  'ml': 25, 'pa': 24, 'or': 24, 'as': 23, 'my': 26, 'km': 25, 'lo': 24, 'si': 24,
  'ne': 23, 'bo': 26, 'mn': 24, 'ka': 22, 'hy': 21, 'az': 22, 'kk': 23, 'ky': 22,
  'uz': 22, 'tg': 22, 'ps': 24, 'sd': 23, 'ug': 25,
  
  // 欧洲语言
  'en': 20, 'es': 22, 'fr': 24, 'de': 23, 'ru': 29, 'pt': 22, 'it': 23, 'nl': 21,
  'pl': 24, 'sv': 20, 'no': 20, 'da': 19, 'fi': 22, 'cs': 23, 'hu': 24, 'ro': 23,
  'bg': 23, 'hr': 22, 'sk': 22, 'sl': 21, 'lt': 22, 'lv': 21, 'et': 21, 'el': 24,
  'tr': 23, 'uk': 28, 'be': 27, 'mk': 22, 'sr': 23, 'bs': 22, 'sq': 21, 'mt': 20,
  'is': 19, 'ga': 18, 'cy': 18, 'eu': 20, 'ca': 21, 'gl': 20,
  
  // 中东和非洲语言
  'ar': 30, 'fa': 26, 'he': 22, 'am': 23, 'ha': 20, 'sw': 21, 'yo': 20, 'ig': 20, 'xh': 21,
  'zu': 21, 'af': 19,
};

// 检查语言是否支持离线翻译
export const isOfflineTranslationSupported = (
  fromLang: string, 
  toLang: string
): boolean => {
  // 排除自动检测
  if (fromLang === 'auto' || toLang === 'auto') {
    return false;
  }
  
  // ✅ 先映射为 ML Kit 语言码，再检查是否在支持列表中
  const mlKitFromLang = mapToMlKitLangCode(fromLang);
  const mlKitToLang = mapToMlKitLangCode(toLang);
  
  // 检查映射后的语言码或原语言码是否在支持列表中
  const fromSupported = OFFLINE_SUPPORTED_LANGUAGES.includes(fromLang) || 
                        OFFLINE_SUPPORTED_LANGUAGES.includes(mlKitFromLang);
  const toSupported = OFFLINE_SUPPORTED_LANGUAGES.includes(toLang) || 
                      OFFLINE_SUPPORTED_LANGUAGES.includes(mlKitToLang);
  
  return fromSupported && toSupported;
};

// 获取支持离线翻译的语言列表
export const getOfflineSupportedLanguages = () => {
  return SUPPORTED_LANGUAGES.filter(lang => 
    OFFLINE_SUPPORTED_LANGUAGES.includes(lang.code)
  );
};

// 获取语言包大小
export const getLanguagePackSize = (languageCode: string): number => {
  return LANGUAGE_PACK_SIZES[languageCode] || 25; // 默认25MB
};

// 语言包信息接口
export interface LanguagePackInfo {
  languageCode: string;
  languageName: string;
  nativeName: string;
  size: number; // MB
  isDownloaded: boolean;
  downloadProgress: number;
  isDownloading: boolean;
}

// 获取所有可用的语言包信息
export const getAllLanguagePackInfos = (): LanguagePackInfo[] => {
  return getOfflineSupportedLanguages().map(lang => ({
    languageCode: lang.code,
    languageName: lang.name,
    nativeName: lang.nativeName,
    size: getLanguagePackSize(lang.code),
    isDownloaded: false, // 这个需要从存储中读取
    downloadProgress: 0,
    isDownloading: false,
  }));
};

// 语言包存储键
export const LANGUAGE_PACK_STORAGE_KEY = 'downloaded_language_packs';

// 语言码映射：应用语言码 → ML Kit 语言码
// ML Kit 不识别 zh-CN/zh-TW，只识别 zh
export const mapToMlKitLangCode = (lang: string): string => {
  const map: Record<string, string> = {
    'zh-CN': 'zh',
    'zh-TW': 'zh',
    'en-US': 'en',
    'en-GB': 'en',
    'pt-BR': 'pt',
    'pt-PT': 'pt',
    'es-ES': 'es',
    'es-MX': 'es',
  };
  return map[lang] || lang;
};

// 反向映射：ML Kit 语言码 → 应用默认语言码
export const mapFromMlKitLangCode = (mlKitLang: string): string => {
  const reverseMap: Record<string, string> = {
    'zh': 'zh-CN',
    'en': 'en',
    'pt': 'pt',
    'es': 'es',
  };
  return reverseMap[mlKitLang] || mlKitLang;
};

// 翻译模式类型
export type TranslationMode = 'online' | 'offline' | 'auto';
