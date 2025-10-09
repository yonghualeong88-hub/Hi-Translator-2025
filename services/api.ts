// services/api.ts
// 统一的 API 调用服务

import { API_CONFIG } from '../config/apiConfig';

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface OCRResult {
  text: string;
  bounding: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  confidence?: number;
}

export interface OCRResponse {
  success: boolean;
  results: OCRResult[];
  error?: string;
}

export interface TranslationResult {
  success: boolean;
  translatedText: string;
  originalText: string;
  sourceLanguage?: string;
  targetLanguage: string;
  error?: string;
}

export interface BatchTranslationResponse {
  success: boolean;
  results: TranslationResult[];
  error?: string;
}

/**
 * 调用后端 OCR API
 * @param imageBase64 base64 编码的图片数据
 * @returns OCR 识别结果
 */
export const callOcrApi = async (imageBase64: string): Promise<OCRResponse> => {
  try {
    console.log('🔍 调用 OCR API...');

    const response = await fetch(`${API_BASE_URL}/api/ocr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
        imageBase64,
          }),
    });

      if (!response.ok) {
      throw new Error(`OCR API 请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
    if (!data.success) {
      throw new Error(data.error || 'OCR 识别失败');
      }

    console.log('✅ OCR API 调用成功，识别到', data.results.length, '个文本块');
      
      return {
        success: true,
      results: data.results,
      };
    } catch (error) {
    console.error('❌ OCR API 调用失败:', error);
      return {
        success: false,
      results: [],
      error: error instanceof Error ? error.message : 'OCR API 调用失败',
    };
  }
};

/**
 * 调用后端翻译 API（单个文本）
 * @param text 要翻译的文本
 * @param targetLanguage 目标语言
 * @param sourceLanguage 源语言（可选）
 * @returns 翻译结果
 */
export const callTranslateApi = async (
  text: string,
  targetLanguage: string = 'zh-CN',
  sourceLanguage?: string
): Promise<TranslationResult> => {
  try {
    console.log('🌐 调用翻译 API:', text, '->', targetLanguage);

    const response = await fetch(`${API_BASE_URL}/api/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
      body: JSON.stringify({
        texts: text,
        targetLanguage,
        sourceLanguage,
        isBatch: false,
      }),
    });

      if (!response.ok) {
      throw new Error(`翻译 API 请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
    if (!data.success) {
      throw new Error(data.error || '翻译失败');
      }

    console.log('✅ 翻译 API 调用成功:', text, '->', data.translatedText);
      
      return {
        success: true,
      translatedText: data.translatedText,
      originalText: data.originalText,
      sourceLanguage: data.sourceLanguage,
      targetLanguage: data.targetLanguage,
      };
    } catch (error) {
    console.error('❌ 翻译 API 调用失败:', error);
      return {
        success: false,
      translatedText: text,
      originalText: text,
      targetLanguage,
      error: error instanceof Error ? error.message : '翻译 API 调用失败',
    };
  }
};

/**
 * 调用后端翻译 API（批量文本）
 * @param texts 要翻译的文本数组
 * @param targetLanguage 目标语言
 * @param sourceLanguage 源语言（可选）
 * @returns 批量翻译结果
 */
export const callBatchTranslateApi = async (
  texts: string[],
  targetLanguage: string = 'zh-CN',
  sourceLanguage?: string
): Promise<TranslationResult[]> => {
  try {
    console.log('🌐 调用批量翻译 API:', texts.length, '个文本');
    console.log('📝 翻译文本内容:', texts);
    console.log('🎯 目标语言:', targetLanguage, '源语言:', sourceLanguage);

    const response = await fetch(`${API_BASE_URL}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
        targetLanguage,
        sourceLanguage,
        isBatch: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`批量翻译 API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '批量翻译失败');
    }

    console.log('✅ 批量翻译 API 调用成功');

    return data.results;
    } catch (error) {
    console.error('❌ 批量翻译 API 调用失败:', error);
    
    // 如果批量翻译失败，回退到单个翻译
    const results: TranslationResult[] = [];
    for (const text of texts) {
      const result = await callTranslateApi(text, targetLanguage, sourceLanguage);
      results.push(result);
    }
    return results;
  }
};