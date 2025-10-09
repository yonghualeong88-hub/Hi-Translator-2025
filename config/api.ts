// config/api.ts
export const API_CONFIG = {
  // 开发环境
  DEVELOPMENT: {
    BASE_URL: "http://10.49.143.104:3001", // 你的电脑IP
    TIMEOUT: 30000, // 增加到30秒，因为OpenAI调用需要更多时间
  },
  
  // 生产环境
  PRODUCTION: {
    BASE_URL: "https://your-production-api.com",
    TIMEOUT: 10000,
  },
  
  // 本地开发
  LOCAL: {
    BASE_URL: "http://localhost:3001",
    TIMEOUT: 30000, // 增加到30秒
  }
};

// 根据环境选择配置
const getApiConfig = () => {
  if (__DEV__) {
    // 开发环境，优先使用局域网IP，如果不可用则使用localhost
    return API_CONFIG.DEVELOPMENT;
  }
  return API_CONFIG.PRODUCTION;
};

export const API_BASE = getApiConfig().BASE_URL;
export const API_TIMEOUT = getApiConfig().TIMEOUT;

// 网络检测函数
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('网络连接检查失败:', error);
    return false;
  }
};
