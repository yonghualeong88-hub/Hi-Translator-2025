import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguage, 
  getLanguageDisplayName, 
  getLanguageName,
  isRTL,
  changeLanguage,
  getCurrentLanguage,
  DEFAULT_LANGUAGE
} from '../i18n';
import { LANGUAGE_DISPLAY_NAMES } from '../config/languageMap';

interface I18nContextType {
  // Current language
  currentLanguage: SupportedLanguage;
  isRTL: boolean;
  
  // Language switching
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  
  // Language information
  getLanguageDisplayName: (code: SupportedLanguage) => string;
  getLanguageName: (code: SupportedLanguage) => string;
  isRTLForLanguage: (code: SupportedLanguage) => boolean;
  
  // Available languages
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  languageDisplayNames: typeof LANGUAGE_DISPLAY_NAMES;
  
  // Translation function
  t: (key: string, options?: any) => string;
  
  // Loading state
  isLanguageLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isLanguageLoading, setIsLanguageLoading] = useState(true);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng as SupportedLanguage);
      setIsLanguageLoading(false);
    };

    // Set initial language
    setCurrentLanguage(getCurrentLanguage());
    setIsLanguageLoading(false);

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const handleChangeLanguage = async (language: SupportedLanguage) => {
    setIsLanguageLoading(true);
    try {
      await changeLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLanguageLoading(false);
    }
  };

  const contextValue: I18nContextType = {
    currentLanguage,
    isRTL: isRTL(currentLanguage),
    changeLanguage: handleChangeLanguage,
    getLanguageDisplayName,
    getLanguageName,
    isRTLForLanguage: isRTL,
    supportedLanguages: SUPPORTED_LANGUAGES,
    languageDisplayNames: LANGUAGE_DISPLAY_NAMES,
    t,
    isLanguageLoading,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
