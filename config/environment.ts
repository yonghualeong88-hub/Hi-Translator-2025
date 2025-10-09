// 环境配置管理
import { Platform } from 'react-native';

// 获取API基础URL
export const getApiBaseUrl = (): string => {
  // 优先使用环境变量
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl) {
    console.log('[API Config] Using environment variable API_URL:', apiUrl);
    return apiUrl;
  }

  // 检查是否使用本地IP
  const useLocalIP = process.env.EXPO_PUBLIC_USE_LOCAL_IP === 'true';
  const devIP = process.env.EXPO_PUBLIC_DEV_IP || '10.49.143.104';
  const port = process.env.EXPO_PUBLIC_API_PORT || '3001';

  let finalUrl: string;
  if (Platform.OS !== 'web') {
    // 移动端（Android/iOS）自动使用本地IP地址
    finalUrl = `http://${devIP}:${port}`;
    console.log('[API Config] Using local IP for mobile device:', finalUrl);
  } else {
    // Web端使用localhost
    finalUrl = `http://localhost:${port}`;
    console.log('[API Config] Using localhost for web:', finalUrl);
  }
  
  return finalUrl;
};

// API配置
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  
  // API端点
  ENDPOINTS: {
    OCR: '/api/ocr',
    TRANSLATE: '/api/translate',
    VOICE_TRANSLATE: '/api/voice-translate',
    SPEECH_TO_TEXT: '/api/speech-to-text',
    TTS: '/api/tts',
  },
};

// 获取完整的API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// 调试日志
export const debugLog = (message: string, data?: any) => {
  if (API_CONFIG.DEBUG_MODE) {
    console.log(`[API Debug] ${message}`, data);
  }
};
