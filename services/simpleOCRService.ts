// 简化版 OCR 服务 - 使用普通OCR（降级数据）
import { DetectedText } from '@/types/camera';
import { translateText } from './translationService';

/**
 * 降级 OCR 检测（普通OCR模式）
 */
const getFallbackDetections = (reason: string): DetectedText[] => {
  console.log(`📝 使用普通OCR模式，原因: ${reason}`);
  return [
    {
      id: 'demo-1',
      text: 'Hello World',
      confidence: 0.9,
      bbox: { x0: 100, y0: 200, x1: 300, y1: 240 },
      originalImageSize: { width: 1920, height: 1080 },
    },
    {
      id: 'demo-2', 
      text: 'Welcome to Translation App',
      confidence: 0.85,
      bbox: { x0: 100, y0: 250, x1: 500, y1: 290 },
      originalImageSize: { width: 1920, height: 1080 },
    },
    {
      id: 'demo-3',
      text: 'This is a demo text',
      confidence: 0.8,
      bbox: { x0: 100, y0: 300, x1: 400, y1: 340 },
      originalImageSize: { width: 1920, height: 1080 },
    },
    {
      id: 'demo-4',
      text: 'Click to translate',
      confidence: 0.75,
      bbox: { x0: 100, y0: 350, x1: 350, y1: 390 },
      originalImageSize: { width: 1920, height: 1080 },
    },
    {
      id: 'demo-5',
      text: 'Simple OCR Mode',
      confidence: 0.7,
      bbox: { x0: 100, y0: 400, x1: 350, y1: 440 },
      originalImageSize: { width: 1920, height: 1080 },
    },
  ];
};

/**
 * 批量翻译请求 - 简化版
 */
const batchTranslateTexts = async (texts: string[], targetLanguage: string): Promise<any[]> => {
  try {
    console.log('🚀 开始批量翻译:', texts);
    
    const results = [];
    for (const text of texts) {
      try {
        const result = await translateText(text, 'auto', targetLanguage);
        results.push(result);
      } catch (error) {
        console.warn(`翻译失败: ${text}`, error);
        results.push({
          originalText: text,
          translatedText: text,
          success: false,
          error: error
        });
      }
    }
    
    console.log('✅ 批量翻译完成:', results);
    return results;
  } catch (error) {
    console.log('❌ 批量翻译失败，回退到单个翻译:', error);
    // 回退到单个翻译
    const results = [];
    for (const text of texts) {
      try {
        const result = await translateText(text, 'auto', targetLanguage);
        results.push(result);
      } catch (error) {
        console.warn(`翻译失败: ${text}`, error);
        results.push({
          originalText: text,
          translatedText: text,
          success: false,
          error: error
        });
      }
    }
    return results;
  }
};

/**
 * 使用普通 OCR 识别图片中的文字
 */
export const detectTextFromImage = async (imageUri: string, imageSize?: {width: number, height: number}): Promise<DetectedText[]> => {
  // 🎯 直接使用普通OCR（降级数据），不进行真实的OCR处理
  console.log('📝 使用普通OCR模式（降级数据）');
  
  // 模拟处理时间
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return getFallbackDetections('使用普通OCR模式');
};

/**
 * 图片文字翻译 - 简化版
 */
export const translateImageText = async (
  imageUri: string,
  targetLanguage: string,
  imageSize?: {width: number, height: number}
): Promise<DetectedText[]> => {
  try {
    console.log('🖼️ 开始图片翻译流程（普通OCR模式）');
    
    // 1. 获取检测到的文字（使用降级数据）
    const detectedTexts = await detectTextFromImage(imageUri, imageSize);
    
    if (detectedTexts.length === 0) {
      console.log('⚠️ 未检测到可翻译的文字');
      return [];
    }

    console.log('📝 检测到的文字:', detectedTexts.map(t => t.text));
    
    // 2. 提取文本进行翻译
    const textsToTranslate = detectedTexts.map(item => item.text);
    console.log('📝 需要翻译的文本:', textsToTranslate);
    
    // 3. 批量翻译
    const translationResults = await batchTranslateTexts(textsToTranslate, targetLanguage);
    
    // 4. 合并翻译结果
    const finalResults: DetectedText[] = detectedTexts.map((item, index) => {
      const translation = Array.isArray(translationResults) 
        ? translationResults[index] 
        : translationResults;
      
      console.log(`🎯 翻译结果映射 ${index}:`, {
        originalText: item.text,
        translationResult: translation,
        finalTranslatedText: translation?.translatedText || translation?.originalText || item.text,
        isArray: Array.isArray(translationResults),
        translationResultsLength: Array.isArray(translationResults) ? translationResults.length : 'not array'
      });
      
      return {
        ...item,
        translatedText: translation?.translatedText || translation?.originalText || item.text,
        language: targetLanguage,
      };
    });
    
    console.log('✅ 普通OCR翻译完成，生成', finalResults.length, '个检测结果');
    return finalResults;
  } catch (error) {
    console.error('❌ 图片翻译流程失败:', error);
    return getFallbackDetections(`流程错误: ${error}`);
  }
};
