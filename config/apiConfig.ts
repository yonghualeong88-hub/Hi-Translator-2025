// config/apiConfig.ts
// 统一API配置 - 使用环境配置
export { API_CONFIG, getApiUrl, debugLog } from './environment';

// 开发环境配置
export const DEV_CONFIG = {
  // 是否启用调试日志
  ENABLE_DEBUG_LOGS: true,
  
  // 是否模拟网络延迟（用于测试）
  SIMULATE_NETWORK_DELAY: false,
  NETWORK_DELAY_MS: 1000,
};
