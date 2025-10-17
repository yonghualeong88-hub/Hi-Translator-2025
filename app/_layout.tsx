import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler'; // ⚠️ 必须在最顶部
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../i18n'; // Initialize i18n
import CustomSplashScreen from '@/components/CustomSplashScreen';

// Buffer polyfill for docx library
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// 阻止自动隐藏 Splash（防止白屏）
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDark } = useTheme();
  
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  // ✅ 修改任务 3: 在 App 启动时初始化离线翻译服务
  useEffect(() => {
    const initializeServices = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        
        // ✅ 一次性数据迁移：zh-CN → zh（适配 ML Kit 格式）
        const stored = await AsyncStorage.getItem('downloaded_language_packs');
        if (stored) {
          const oldPacks = JSON.parse(stored);
          const needsMigration = oldPacks.some((p: string) => p.includes('-'));
          
          if (needsMigration) {
            console.log('🔄 迁移语言包数据格式:', oldPacks);
            
            // 映射规则
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
            
            // 转换并去重
            const newPacks = [...new Set(oldPacks.map((p: string) => map[p] || p))];
            await AsyncStorage.setItem('downloaded_language_packs', JSON.stringify(newPacks));
            
            console.log('✅ 迁移完成:', oldPacks, '→', newPacks);
          }
        }
        
        const { offlineTranslationService } = await import('@/services/offlineTranslationService');
        const { translationModeManager } = await import('@/services/translationModeManager');
        
        // 先初始化 translationModeManager
        await translationModeManager.init();
        console.log('✅ TranslationModeManager 初始化完成');
        
        // 再初始化 offlineTranslationService
        await offlineTranslationService.initialize();
        console.log('✅ OfflineTranslationService 初始化完成');
        
        // ✅ 所有初始化完成后，隐藏原生 Splash Screen
        await SplashScreen.hideAsync();
        console.log('✅ Splash Screen 已隐藏');
        
        // 显示自定义启动画面
        setShowCustomSplash(true);
      } catch (error) {
        console.error('❌ 服务初始化失败:', error);
        // 即使初始化失败，也要隐藏 Splash
        await SplashScreen.hideAsync();
      }
    };
    
    initializeServices();
  }, []);

  const handleSplashFinish = () => {
    setShowCustomSplash(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <ThemeProvider>
            {showCustomSplash ? (
              <CustomSplashScreen onFinish={handleSplashFinish} />
            ) : (
              <AppContent />
            )}
          </ThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
