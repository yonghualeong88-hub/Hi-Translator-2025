// backend/pages/api/translate.ts
import { NextApiRequest, NextApiResponse } from 'next';

// Next.js 自动加载环境变量，无需手动配置

// 配置 API 路由
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 增加请求体大小限制到 10MB
    },
  },
};

// Google Cloud Translation API 配置
// 从环境变量中读取API密钥，确保安全性
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const TRANSLATE_API_URL = process.env.TRANSLATE_API_URL || "https://translation.googleapis.com/language/translate/v2";

// 检查API密钥是否存在
if (!GOOGLE_TRANSLATE_API_KEY) {
  console.error('❌ GOOGLE_TRANSLATE_API_KEY 环境变量未设置');
}

interface TranslationResult {
  success: boolean;
  translatedText: string;
  originalText: string;
  sourceLanguage?: string;
  targetLanguage: string;
  error?: string;
}

interface BatchTranslationResult {
  success: boolean;
  results: TranslationResult[];
  error?: string;
}

// 翻译缓存
const translationCache: { [key: string]: string } = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TranslationResult | BatchTranslationResult>
) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      translatedText: '',
      originalText: '',
      targetLanguage: '',
      error: '只支持 POST 请求'
    });
  }

  try {
    // 检查API密钥是否配置
    if (!GOOGLE_TRANSLATE_API_KEY) {
      return res.status(500).json({
        success: false,
        translatedText: '',
        originalText: '',
        targetLanguage: '',
        error: '翻译服务配置错误：缺少API密钥'
      });
    }

    const { texts, targetLanguage = 'zh-CN', sourceLanguage, isBatch = false } = req.body;

    if (!texts) {
      return res.status(400).json({
        success: false,
        translatedText: '',
        originalText: '',
        targetLanguage,
        error: '缺少翻译文本'
      });
    }

    // 如果是批量翻译
    if (isBatch && Array.isArray(texts)) {
      return await handleBatchTranslation(texts, targetLanguage, sourceLanguage, res);
    }

    // 单个文本翻译
    const text = Array.isArray(texts) ? texts[0] : texts;
    return await handleSingleTranslation(text, targetLanguage, sourceLanguage, res);

  } catch (error) {
    console.error('❌ 翻译失败:', error);
    
    return res.status(500).json({
      success: false,
      translatedText: '',
      originalText: '',
      targetLanguage: '',
      error: error instanceof Error ? error.message : '翻译失败',
    });
  }
}

// 处理单个文本翻译
async function handleSingleTranslation(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | undefined,
  res: NextApiResponse<TranslationResult>
) {
  try {
    // 检查缓存
    const cacheKey = `${text}_${sourceLanguage || 'auto'}_${targetLanguage}`;
    if (translationCache[cacheKey]) {
      console.log('📦 使用翻译缓存:', text);
      return res.status(200).json({
        success: true,
        translatedText: translationCache[cacheKey],
        originalText: text,
        targetLanguage,
        sourceLanguage,
      });
    }

    console.log('🌐 开始翻译:', text, '->', targetLanguage);

    const requestBody: any = {
      q: text,
      target: targetLanguage,
      format: 'text',
    };

    // 只有当源语言不是 'auto' 时才添加 source 参数
    if (sourceLanguage && sourceLanguage !== 'auto') {
      requestBody.source = sourceLanguage;
    }

    const response = await fetch(
      `${TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google Translate API 错误详情:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        requestBody: requestBody
      });
      throw new Error(`翻译 API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`翻译 API 错误: ${data.error.message}`);
    }

    const translation = data.data.translations[0];
    const translatedText = translation.translatedText;
    const detectedSourceLanguage = translation.detectedSourceLanguage;

    // 缓存翻译结果
    translationCache[cacheKey] = translatedText;

    console.log('✅ 翻译完成:', text, '->', translatedText);

    return res.status(200).json({
      success: true,
      translatedText,
      originalText: text,
      sourceLanguage: detectedSourceLanguage,
      targetLanguage,
    });

  } catch (error) {
    console.error('❌ 单个翻译失败:', error);
    
    return res.status(500).json({
      success: false,
      translatedText: text,
      originalText: text,
      targetLanguage,
      error: error instanceof Error ? error.message : '翻译失败',
    });
  }
}

// 处理批量文本翻译
async function handleBatchTranslation(
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string | undefined,
  res: NextApiResponse<BatchTranslationResult>
) {
  try {
    console.log('🌐 开始批量翻译:', texts.length, '个文本');

    const results: TranslationResult[] = [];

    // 并发翻译，但限制并发数量避免 API 限制
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => 
        handleSingleTranslationPromise(text, targetLanguage, sourceLanguage)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 添加延迟避免 API 限制
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('✅ 批量翻译完成');

    return res.status(200).json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('❌ 批量翻译失败:', error);
    
    return res.status(500).json({
      success: false,
      results: [],
      error: error instanceof Error ? error.message : '批量翻译失败',
    });
  }
}

// 单个翻译的 Promise 版本（用于批量处理）
async function handleSingleTranslationPromise(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | undefined
): Promise<TranslationResult> {
  try {
    // 检查缓存
    const cacheKey = `${text}_${sourceLanguage || 'auto'}_${targetLanguage}`;
    if (translationCache[cacheKey]) {
      return {
        success: true,
        translatedText: translationCache[cacheKey],
        originalText: text,
        targetLanguage,
        sourceLanguage,
      };
    }

    const requestBody: any = {
      q: text,
      target: targetLanguage,
      format: 'text',
    };

    // 只有当源语言不是 'auto' 时才添加 source 参数
    if (sourceLanguage && sourceLanguage !== 'auto') {
      requestBody.source = sourceLanguage;
    }

    const response = await fetch(
      `${TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google Translate API 错误详情 (批量):', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        requestBody: requestBody,
        text: text
      });
      throw new Error(`翻译 API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`翻译 API 错误: ${data.error.message}`);
    }

    const translation = data.data.translations[0];
    const translatedText = translation.translatedText;
    const detectedSourceLanguage = translation.detectedSourceLanguage;

    // 缓存翻译结果
    translationCache[cacheKey] = translatedText;

    return {
      success: true,
      translatedText,
      originalText: text,
      sourceLanguage: detectedSourceLanguage,
      targetLanguage,
    };

  } catch (error) {
    return {
      success: false,
      translatedText: text,
      originalText: text,
      targetLanguage,
      error: error instanceof Error ? error.message : '翻译失败',
    };
  }
}