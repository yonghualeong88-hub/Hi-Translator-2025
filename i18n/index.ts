import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { LANGUAGE_DISPLAY_NAMES, type SupportedLanguageCode } from '../config/languageMap';

// Language resources
const resources = {
  en: {
    translation: require('../locales/en.json'),
  },
  'zh-CN': {
    translation: require('../locales/zh-CN.json'),
  },
  ja: {
    translation: require('../locales/ja.json'),
  },
  ko: {
    translation: require('../locales/ko.json'),
  },
  th: {
    translation: require('../locales/th.json'),
  },
  vi: {
    translation: require('../locales/vi.json'),
  },
  es: {
    translation: require('../locales/es.json'),
  },
  fr: {
    translation: require('../locales/fr.json'),
  },
  de: {
    translation: require('../locales/de.json'),
  },
  it: {
    translation: require('../locales/it.json'),
  },
  pt: {
    translation: require('../locales/pt.json'),
  },
  ru: {
    translation: require('../locales/ru.json'),
  },
  ar: {
    translation: require('../locales/ar.json'),
  },
  tr: {
    translation: require('../locales/tr.json'),
  },
  nl: {
    translation: require('../locales/nl.json'),
  },
  pl: {
    translation: require('../locales/pl.json'),
  },
  fil: {
    translation: require('../locales/fil.json'),
  },
};

// Supported languages with display names
export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// RTL languages
const RTL_LANGUAGES = ['ar'];

// Language detection and storage
const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // First, try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLanguage)) {
        callback(savedLanguage);
        return;
      }

      // If no saved language, detect system language
      const systemLocales = Localization.getLocales();
      const systemLanguage = systemLocales[0]?.languageCode;

      // Map system language to supported language
      let detectedLanguage: SupportedLanguage = DEFAULT_LANGUAGE;
      
      if (systemLanguage) {
        // Direct match
        const supportedCodes = SUPPORTED_LANGUAGES.map(lang => lang.code);
        if (supportedCodes.includes(systemLanguage as SupportedLanguage)) {
          detectedLanguage = systemLanguage as SupportedLanguage;
        } else {
          // Try to find a close match
          const languageMap: Record<string, SupportedLanguage> = {
            'zh': 'zh-CN',
            'zh-Hans': 'zh-CN',
            'ja': 'ja',
            'ko': 'ko',
            'th': 'th',
            'vi': 'vi',
            'es': 'es',
            'fr': 'fr',
            'de': 'de',
            'it': 'it',
            'pt': 'pt',
            'ru': 'ru',
            'ar': 'ar',
            'tr': 'tr',
            'nl': 'nl',
            'pl': 'pl',
            'fil': 'fil',
            'tl': 'fil',
          };
          
          detectedLanguage = languageMap[systemLanguage] || DEFAULT_LANGUAGE;
        }
      }

      // Save detected language
      await AsyncStorage.setItem('app_language', detectedLanguage);
      callback(detectedLanguage);
    } catch (error) {
      console.error('Language detection failed:', error);
      callback(DEFAULT_LANGUAGE);
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('app_language', lng);
    } catch (error) {
      console.error('Failed to cache language:', error);
    }
  },
};

// Initialize i18next
i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    debug: __DEV__,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
    
    // Language detection options
    detection: {
      order: ['asyncStorage', 'device'],
      caches: ['asyncStorage'],
    },
  });

// Helper functions
export const getLanguageDisplayName = (code: SupportedLanguage): string => {
  return LANGUAGE_DISPLAY_NAMES[code] || code;
};

export const getLanguageName = (code: SupportedLanguage): string => {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return language?.name || code;
};

export const isRTL = (code: SupportedLanguage): boolean => {
  return RTL_LANGUAGES.includes(code);
};

export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem('app_language', language);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

export const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language as SupportedLanguage) || DEFAULT_LANGUAGE;
};

export default i18n;
