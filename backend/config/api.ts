// API配置
export const API_CONFIG = {
  // 本地开发环境 - 统一使用端口3001
  LOCAL_URL: 'http://localhost:3001/api',
  
  // 生产环境（如果需要）
  PRODUCTION_URL: 'https://your-domain.com/api',
  
  // 当前使用的API URL
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api',
  
  // 超时设置
  TIMEOUT: 30000, // 30秒
  
  // 重试设置
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1秒
};
