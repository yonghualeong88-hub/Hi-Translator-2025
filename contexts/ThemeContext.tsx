import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  autoPlayVoiceTranslation: boolean;
  setAutoPlayVoiceTranslation: (enabled: boolean) => void;
  autoPlayTextTranslation: boolean;
  setAutoPlayTextTranslation: (enabled: boolean) => void;
  useHighQualityTTS: boolean;
  setUseHighQualityTTS: (enabled: boolean) => void;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    primary: string;
    primaryText: string;
    border: string;
    shadow: string;
    error: string;
    success: string;
    warning: string;
    voiceButton1: string;
    voiceButton2: string;
  };
}

const lightColors = {
  background: '#F8FAFC',
  surface: '#F1F5F9',
  card: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#64748B',
  primary: '#3B82F6',
  primaryText: '#FFFFFF',
  border: '#CBD5E1',
  shadow: '#000000',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  voiceButton1: '#8B5CF6', // 深紫色
  voiceButton2: '#FF8C00', // 橙色
};

const darkColors = {
  background: '#111827',
  surface: '#1F2937',
  card: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  primary: '#3B82F6',
  primaryText: '#FFFFFF',
  border: '#4B5563',
  shadow: '#000000',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  voiceButton1: '#00CED1', // 深青色（保持原有）
  voiceButton2: '#FF69B4', // 粉色（保持原有）
};


const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('auto');
  const [autoPlayVoiceTranslation, setAutoPlayVoiceTranslationState] = useState<boolean>(true); // 默认开启
  const [autoPlayTextTranslation, setAutoPlayTextTranslationState] = useState<boolean>(false); // 默认关闭
  const [useHighQualityTTS, setUseHighQualityTTSState] = useState<boolean>(false); // 默认关闭，节省成本
  const [isSettingsLoaded, setIsSettingsLoaded] = useState<boolean>(false);
  
  const isDark = theme === 'dark' || (theme === 'auto' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [voiceTranslationSetting, textTranslationSetting, highQualityTTSSetting] = await Promise.all([
          AsyncStorage.getItem('autoPlayVoiceTranslation'),
          AsyncStorage.getItem('autoPlayTextTranslation'),
          AsyncStorage.getItem('useHighQualityTTS')
        ]);
        
        // 只有当用户明确关闭时才设置为false，否则保持默认值
        if (voiceTranslationSetting !== null) {
          setAutoPlayVoiceTranslationState(voiceTranslationSetting === 'true');
        }
        
        if (textTranslationSetting !== null) {
          setAutoPlayTextTranslationState(textTranslationSetting === 'true');
        }
        
        if (highQualityTTSSetting !== null) {
          setUseHighQualityTTSState(highQualityTTSSetting === 'true');
        }
        
        setIsSettingsLoaded(true);
      } catch (error) {
        console.error('加载设置失败:', error);
        setIsSettingsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // 保存主题设置到本地存储
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // 这里可以保存到 AsyncStorage
  };


  // 保存自动播放语音翻译设置
  const setAutoPlayVoiceTranslation = async (enabled: boolean) => {
    setAutoPlayVoiceTranslationState(enabled);
    try {
      await AsyncStorage.setItem('autoPlayVoiceTranslation', enabled.toString());
    } catch (error) {
      console.error('保存语音翻译自动播放设置失败:', error);
    }
  };

  // 保存自动播放文本翻译设置
  const setAutoPlayTextTranslation = async (enabled: boolean) => {
    setAutoPlayTextTranslationState(enabled);
    try {
      await AsyncStorage.setItem('autoPlayTextTranslation', enabled.toString());
    } catch (error) {
      console.error('保存文本翻译自动播放设置失败:', error);
    }
  };

  // 保存高质量TTS设置
  const setUseHighQualityTTS = async (enabled: boolean) => {
    setUseHighQualityTTSState(enabled);
    try {
      await AsyncStorage.setItem('useHighQualityTTS', enabled.toString());
    } catch (error) {
      console.error('保存高质量TTS设置失败:', error);
    }
  };


  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDark, 
      setTheme, 
      autoPlayVoiceTranslation,
      setAutoPlayVoiceTranslation,
      autoPlayTextTranslation,
      setAutoPlayTextTranslation,
      useHighQualityTTS,
      setUseHighQualityTTS,
      colors 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}