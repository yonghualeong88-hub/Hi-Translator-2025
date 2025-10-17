import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onFinish: () => void;
}

export default function CustomSplashScreen({ onFinish }: CustomSplashScreenProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onFinish();
      }, 300); // 淡出动画时间
    }, 2000); // 显示2秒

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/app_logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* App Name */}
        <Text style={[styles.appName, { color: '#FFFFFF' }]}>
          {t('about.appName', 'Speak to Translator')}
        </Text>
        
        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: '#CCCCCC' }]}>
          {t('about.slogan', '让沟通无界限')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.8,
  },
});
