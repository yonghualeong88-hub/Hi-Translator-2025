// utils/networkDiagnostics.ts
// 网络诊断工具

import { API_CONFIG } from '../config/apiConfig';

/**
 * 测试网络连接
 */
export const testNetworkConnection = async (): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> => {
  try {
    console.log('🔍 开始网络连接测试...');
    console.log('📡 API 基础 URL:', API_CONFIG.BASE_URL);

    // 测试基本连接
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: 'test',
      }),
    });

    console.log('📊 响应状态:', response.status);
    console.log('📊 响应头:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📊 响应数据:', data);

    return {
      success: true,
      details: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      },
    };
  } catch (error) {
    console.error('❌ 网络连接测试失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络连接失败',
      details: error,
    };
  }
};

/**
 * 获取网络信息
 */
export const getNetworkInfo = () => {
  return {
    apiBaseUrl: API_CONFIG.BASE_URL,
    endpoints: API_CONFIG.ENDPOINTS,
    timeout: API_CONFIG.TIMEOUT,
  };
};

/**
 * 测试所有 API 端点
 */
export const testAllEndpoints = async (): Promise<{
  [key: string]: {
    success: boolean;
    error?: string;
  };
}> => {
  const results: any = {};

  // 测试 OCR 端点
  try {
    const ocrResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OCR}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: 'test',
      }),
    });

    results.ocr = {
      success: ocrResponse.ok,
      status: ocrResponse.status,
    };
  } catch (error) {
    results.ocr = {
      success: false,
      error: error instanceof Error ? error.message : 'OCR API 测试失败',
    };
  }

  // 测试翻译端点
  try {
    const translateResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRANSLATE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: 'test',
        targetLanguage: 'zh',
        isBatch: false,
      }),
    });

    results.translate = {
      success: translateResponse.ok,
      status: translateResponse.status,
    };
  } catch (error) {
    results.translate = {
      success: false,
      error: error instanceof Error ? error.message : '翻译 API 测试失败',
    };
  }

  return results;
};
