export const LANGUAGE_DISPLAY_NAMES = {
  'zh-CN': '简体中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'th': 'ไทย',
  'vi': 'Tiếng Việt',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'it': 'Italiano',
  'pt': 'Português',
  'ru': 'Русский',
  'ar': 'العربية',
  'tr': 'Türkçe',
  'nl': 'Nederlands',
  'pl': 'Polski',
  'fil': 'Filipino',
} as const;

export type SupportedLanguageCode = keyof typeof LANGUAGE_DISPLAY_NAMES;

// Helper function to get display name
export const getLanguageDisplayName = (code: SupportedLanguageCode): string => {
  return LANGUAGE_DISPLAY_NAMES[code] || code;
};

// Helper function to check if language is RTL
export const isRTL = (code: SupportedLanguageCode): boolean => {
  return code === 'ar';
};

// Get all supported language codes
export const getSupportedLanguageCodes = (): SupportedLanguageCode[] => {
  return Object.keys(LANGUAGE_DISPLAY_NAMES) as SupportedLanguageCode[];
};
