// 修复版 cloudOCRService.ts - 处理文件权限问题
import { DetectedText } from '@/types/camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { translateText } from './translationService';

// 🎯 使用 Google Cloud Vision API
const GOOGLE_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';

if (!GOOGLE_VISION_API_KEY) {
  console.warn('⚠️ GOOGLE_VISION_API_KEY 环境变量未设置，OCR功能可能无法正常工作');
}

const GOOGLE_VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;
const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10MB 限制（Google Vision支持更大文件）
const REQUEST_TIMEOUT = 15000; // 15秒超时

// 存储压缩信息用于坐标转换
let compressionInfo: {
  originalWidth: number;
  originalHeight: number;
  compressedWidth: number;
  compressedHeight: number;
} | null = null;

/**
 * 带超时的 fetch 请求
 */
const fetchWithTimeout = (url: string, options: any, timeout: number): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`请求超时 (${timeout}ms)`));
    }, timeout);

    fetch(url, options)
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

/**
 * 文本预处理 - 清理和标准化 OCR 文本
 */
const preprocessOCRText = (text: string): string => {
  if (!text) return '';
  
  // 🧹 基础清理
  let cleaned = text
    .replace(/\s+/g, ' ') // 合并多个空白字符
    .trim(); // 去除首尾空白
  
  // 🔧 修复常见的OCR错误
  cleaned = cleaned
    .replace(/[|]/g, 'I') // 竖线经常被误识别为字母I
    .replace(/[0]/g, 'O') // 数字0在特定上下文中可能是字母O
    .replace(/\b(\d+)\s*([a-zA-Z])\b/g, '$1$2') // 数字和字母之间的空格
    .replace(/\b([a-zA-Z])\s*(\d+)\b/g, '$1$2') // 字母和数字之间的空格
    .replace(/\s*([.!?])\s*/g, '$1 ') // 标点符号后的空格标准化
    .replace(/\s*([,;:])\s*/g, '$1 ') // 逗号、分号、冒号后的空格
    .replace(/\s+/g, ' ') // 再次合并多余空格
    .trim();
  
  // 🎯 过滤无效文本
  if (cleaned.length < 2) return ''; // 太短的文本
  if (/^[^a-zA-Z\u4e00-\u9fff]+$/.test(cleaned)) return ''; // 纯符号文本
  
  return cleaned;
};

/**
 * 优化 OCR 结果 - 减少过度分割
 */
const optimizeOCRResults = (ocrResults: any): string[] => {
  const parsedText = ocrResults.ParsedResults?.[0]?.ParsedText;
  if (!parsedText) return [];
  
  // 按行分割，但不过度分割单词
  const lines = parsedText.split('\n').filter((line: string) => line.trim().length > 0);
  
  // 合并相似的文本块，避免重复翻译
  const processedLines = lines.map((line: string) => preprocessOCRText(line));
  const uniqueTexts = Array.from(new Set(processedLines)) as string[];
  
  console.log('✅ 优化后的文本:', uniqueTexts);
  return uniqueTexts;
};

/**
 * 智能文本优化 - 优先翻译完整句子
 */
const prioritizeTranslationTexts = (texts: string[]): string[] => {
  // 🧹 清理空白 & 去重
  const uniqueTexts = Array.from(new Set(
    texts.map(t => t.trim()).filter(t => t.length > 0)
  ));

  // console.log('🧹 文本清理结果:', {
  //   原始数量: texts.length,
  //   清理后数量: uniqueTexts.length,
  //   去重数量: texts.length - uniqueTexts.length
  // });

  // 🎯 智能打分函数：结合长度、单词数、标点
  const score = (text: string): number => {
    const lengthScore = text.length;
    const wordScore = text.split(/\s+/).length * 5;
    const punctuationScore = (text.match(/[。.!?]/g) || []).length * 10;
    const totalScore = lengthScore + wordScore + punctuationScore;
    
    // console.log('📊 文本评分:', {
    //   文本: text.substring(0, 20) + (text.length > 20 ? '...' : ''),
    //   长度分: lengthScore,
    //   单词分: wordScore,
    //   标点分: punctuationScore,
    //   总分: totalScore
    // });
    
    return totalScore;
  };

  // 🎯 按分数降序排序
  const prioritizedTexts = uniqueTexts.sort((a, b) => score(b) - score(a));
  
  // 🎯 智能保留短文本：重要的UI文本
  const importantShortTexts = prioritizedTexts.filter(text => {
    const isShort = text.length <= 10;
    const hasImportantKeywords = /^(ok|yes|no|cancel|save|delete|edit|add|remove|start|stop|menu|home|back|next|previous|search|login|logout|submit|reset|close|open|help|info|warning|error|success)$/i.test(text);
    const isUILabel = /^[A-Z][a-z]+$/.test(text); // 首字母大写的单词
    const isButtonText = /^[A-Z\s]+$/.test(text); // 全大写或标题格式
    
    return isShort && (hasImportantKeywords || isUILabel || isButtonText);
  });
  
  // 🎯 重新排序：长文本优先，但保留重要短文本
  const finalTexts = [
    ...prioritizedTexts.filter(text => text.length > 10), // 长文本优先
    ...importantShortTexts // 重要短文本
  ];
  
  // console.log('🎯 最终排序结果:', finalTexts.map((text, index) => ({
  //   排名: index + 1,
  //   文本: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
  //   分数: score(text),
  //   类型: text.length <= 10 ? '短文本' : '长文本'
  // })));

  return finalTexts;
};

/**
 * 批量翻译请求 - 减少网络请求次数
 */
const batchTranslateTexts = async (
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = 'auto'
): Promise<any[]> => {
  if (!texts.length) return [];

  try {
    console.log('🚀 开始批量翻译:', { 
      文本数量: texts.length, 
      sourceLanguage, 
      targetLanguage,
      文本预览: texts.slice(0, 3).map(t => t.substring(0, 20))
    });
    
    const GOOGLE_TRANSLATE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY || '';
    
    // 🎯 检查是否有Google API Key，如果没有则使用现有翻译服务
    if (!GOOGLE_TRANSLATE_API_KEY) {
      console.log('⚠️ 未配置Google Translate API Key，使用现有翻译服务');
      return await translateViaExistingService(texts, targetLanguage, sourceLanguage);
    }
    
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;

    // 🎯 使用正确的Google Translation API格式
    const requestBody = {
      q: texts, // 支持数组输入
      target: targetLanguage,
      ...(sourceLanguage !== 'auto' && { source: sourceLanguage }),
      format: 'text',
    };

    // console.log('📤 发送翻译请求:', {
    //   url: url.replace(GOOGLE_TRANSLATE_API_KEY, '***'),
    //   requestBody: {
    //     ...requestBody,
    //     q: requestBody.q.map(t => t.substring(0, 20) + '...')
    //   }
    // });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Google Translation API 错误: ${response.status} - ${errorText}`);
      
      // 🎯 如果Google API失败，回退到现有翻译服务
      if (response.status === 403 || response.status === 401) {
        console.log('🔄 Google API Key无效，回退到现有翻译服务');
        return await translateViaExistingService(texts, targetLanguage, sourceLanguage);
      }
      
      throw new Error(`Google Translation API 错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📥 翻译API响应:', {
      状态: '成功',
      翻译数量: data.data?.translations?.length || 0
    });

    // 🎯 返回和输入texts对应的翻译数组
    const translations = data.data.translations.map((t: any, index: number) => ({
      originalText: texts[index],
      translatedText: t.translatedText,
      success: true,
      sourceLanguage: t.detectedSourceLanguage || sourceLanguage,
      targetLanguage: targetLanguage
    }));

    console.log('✅ 批量翻译完成:', {
      成功数量: translations.length,
      翻译预览: translations.slice(0, 2).map((t: any) => ({
        原文: t.originalText.substring(0, 20),
        译文: t.translatedText.substring(0, 20)
      }))
    });

    return translations;
  } catch (error) {
    console.error('❌ 批量翻译失败:', error);
    
    // 🎯 回退到单个翻译
    console.log('🔄 回退到单个翻译模式');
    return await translateIndividually(texts, targetLanguage, sourceLanguage);
  }
};

/**
 * 通过现有翻译服务进行翻译
 */
const translateViaExistingService = async (
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = 'auto'
): Promise<any[]> => {
  try {
    console.log('🔄 使用现有翻译服务:', { 
      文本数量: texts.length, 
      sourceLanguage, 
      targetLanguage 
    });
    
    // 使用已导入的翻译服务
    // translateText 已经在文件顶部静态导入
    
    // 逐个翻译文本
    const results = [];
    for (const text of texts) {
      try {
        const result = await translateText(text, sourceLanguage, targetLanguage);
        results.push({
          originalText: text,
          translatedText: result.translatedText,
          success: result.success,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage
        });
  } catch (error) {
        console.warn(`⚠️ 翻译失败: "${text}"`, error);
        results.push({
          originalText: text,
          translatedText: text, // 使用原文作为fallback
          success: false,
          error: error instanceof Error ? error.message : '翻译失败',
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage
        });
      }
    }
    
    console.log('✅ 现有翻译服务完成:', {
      成功数量: results.filter(r => r.success).length,
      总数量: results.length
    });
    
    return results;
  } catch (error) {
    console.error('❌ 现有翻译服务失败:', error);
    throw error;
  }
};

/**
 * 单个翻译回退方案
 */
const translateIndividually = async (texts: string[], targetLanguage: string, sourceLanguage?: string): Promise<any[]> => {
  const results = [];
  for (const text of texts) {
    try {
      const result = await translateText(text, sourceLanguage || 'auto', targetLanguage);
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
};

/**
 * 处理 TextOverlay 数据，提取准确的坐标信息
 */
const processTextOverlayResults = (ocrData: any, originalImageSize: {width: number, height: number}) => {
  const parsedResults = ocrData.ParsedResults?.[0];
  if (!parsedResults?.TextOverlay?.Lines) {
    console.log('⚠️ 未找到 TextOverlay 数据');
    return [];
  }

  console.log('📊 处理 TextOverlay 数据:', {
    linesCount: parsedResults.TextOverlay.Lines.length,
    originalImageSize: originalImageSize,
    compressionInfo: compressionInfo
  });

  return parsedResults.TextOverlay.Lines.map((line: any, index: number) => {
    // 计算边界框（OCR返回的坐标）
    const words = line.Words || [];
    if (words.length === 0) {
      console.log('⚠️ 行没有单词数据:', line);
      return null;
    }

    let x0 = Math.min(...words.map((word: any) => word.Left));
    let y0 = Math.min(...words.map((word: any) => word.Top));
    let x1 = Math.max(...words.map((word: any) => word.Left + word.Width));
    let y1 = Math.max(...words.map((word: any) => word.Top + word.Height));

    // 🎯 关键！如果图片被压缩了，需要将OCR坐标转换回原始照片坐标
    if (compressionInfo) {
      const scaleX = compressionInfo.originalWidth / compressionInfo.compressedWidth;
      const scaleY = compressionInfo.originalHeight / compressionInfo.compressedHeight;
      
      x0 = x0 * scaleX;
      y0 = y0 * scaleY;
      x1 = x1 * scaleX;
      y1 = y1 * scaleY;
      
      console.log(`📐 坐标转换回原始尺寸 ${index}:`, {
        text: line.LineText,
        OCR坐标: { x0: Math.min(...words.map((word: any) => word.Left)), y0: Math.min(...words.map((word: any) => word.Top)) },
        转换比例: { scaleX, scaleY },
        原始照片坐标: { x0, y0, x1, y1 }
      });
    }

    // 🎯 计算文字高度（像素），用于推算字体大小
    const textHeight = y1 - y0;
    // 字体大小通常是文字高度的 0.7-0.8 倍（考虑行高）
    const estimatedFontSize = Math.round(textHeight * 0.75);

    console.log(`📝 处理行 ${index}:`, {
      text: line.LineText,
      finalBbox: { x0, y0, x1, y1 },
      textHeight: textHeight,
      estimatedFontSize: estimatedFontSize,
      wordsCount: words.length
    });

    return {
      id: `realtime-${Date.now()}-${index}`,
      text: line.LineText,
      translatedText: '', // 会在翻译后更新
      bbox: {
        x0: x0,
        y0: y0, 
        x1: x1,
        y1: y1,
      },
      confidence: line.WordsOverlap ? 0.8 : 0.9,
      // 保存原始照片尺寸用于坐标转换
      originalImageSize: originalImageSize,
      // 🎯 新增：保存计算出的字体大小
      fontSize: estimatedFontSize
    };
  }).filter(Boolean); // 过滤掉 null 值
};

/**
 * 处理 OCR 结果 - 完整的优化流程（支持 TextOverlay）
 */
/**
 * 处理 Google Cloud Vision API 的响应
 */
const processGoogleVisionResults = async (
  textAnnotations: any[],
  targetLanguage: string,
  originalImageSize: {width: number, height: number},
  sourceLanguage?: string
): Promise<DetectedText[]> => {
  try {
    console.log('🔄 处理 Google Vision 结果...', { 
      annotationsCount: textAnnotations.length,
      sourceLanguage, 
      targetLanguage 
    });
    
    // 跳过第一个annotation（完整文本），处理单词/短语级别的annotations
    const wordAnnotations = textAnnotations.slice(1);
    
    // 🎯 将相邻的词组合成行
    const lines: Array<{text: string, bbox: any, words: any[]}> = [];
    let currentLine: {text: string, bbox: any, words: any[]} | null = null;
    
    // 🎯 计算平均行高，用于更准确的换行判定
    const wordHeights = wordAnnotations.map(annotation => {
      const vertices = annotation.boundingPoly.vertices;
      const y0 = Math.min(...vertices.map((v: any) => v.y || 0));
      const y1 = Math.max(...vertices.map((v: any) => v.y || 0));
      return y1 - y0;
    });
    const avgWordHeight = wordHeights.reduce((sum, height) => sum + height, 0) / wordHeights.length;
    console.log('📏 平均单词高度:', Math.round(avgWordHeight));
    
    for (const annotation of wordAnnotations) {
      const text = annotation.description;
      const vertices = annotation.boundingPoly.vertices;

      // 🎯 正确提取边界框坐标
      const x0 = Math.min(...vertices.map((v: any) => v.x || 0));
      const x1 = Math.max(...vertices.map((v: any) => v.x || 0));
      const y0 = Math.min(...vertices.map((v: any) => v.y || 0));
      const y1 = Math.max(...vertices.map((v: any) => v.y || 0));

      const bbox = { x0, y0, x1, y1 };

      // 🎯 改进的换行判定：使用平均行高和更稳定的阈值
      const currentWordHeight = y1 - y0;
      const lineHeightThreshold = Math.max(avgWordHeight * 0.7, currentWordHeight * 0.7);
      
      if (
        !currentLine ||
        Math.abs(y0 - currentLine.bbox.y0) > lineHeightThreshold
      ) {
        if (currentLine) {
          lines.push(currentLine);
          console.log('🔄 创建新行:', {
            单词: text,
            当前Y: y0,
            上一行Y: currentLine.bbox.y0,
            差异: Math.abs(y0 - currentLine.bbox.y0),
            阈值: lineHeightThreshold
          });
        }

        currentLine = {
          text,
          bbox: { ...bbox },
          words: [annotation]
        };
      } else {
        // 🎯 完整更新边界框：包括左边界和上边界
        currentLine.text += ' ' + text;
        currentLine.bbox.x0 = Math.min(currentLine.bbox.x0, x0);
        currentLine.bbox.y0 = Math.min(currentLine.bbox.y0, y0);
        currentLine.bbox.x1 = Math.max(currentLine.bbox.x1, x1);
        currentLine.bbox.y1 = Math.max(currentLine.bbox.y1, y1);
        currentLine.words.push(annotation);
      }
    }
    
    // 添加最后一行
    if (currentLine) {
      lines.push(currentLine);
    }
    
    console.log(`📊 组合成 ${lines.length} 行文本`);
    
    // 🎯 调试：显示每行的详细信息
    lines.forEach((line, index) => {
      console.log(`📝 第${index + 1}行:`, {
        文本: line.text,
        边界框: line.bbox,
        单词数: line.words.length
      });
    });
    
    // 🎯 文本预处理：清理和标准化
    const textsToTranslate = lines.map(line => {
      let cleanText = line.text;
      
      // 移除多余的空白字符
      cleanText = cleanText.replace(/\s+/g, ' ').trim();
      
      // 修复常见的OCR错误
      cleanText = cleanText
        .replace(/[|]/g, 'I') // 竖线经常被误识别为字母I
        .replace(/[0]/g, 'O') // 数字0在特定上下文中可能是字母O
        .replace(/\b(\d+)\s*([a-zA-Z])\b/g, '$1$2') // 数字和字母之间的空格
        .replace(/\b([a-zA-Z])\s*(\d+)\b/g, '$1$2'); // 字母和数字之间的空格
      
      // 保留原始文本用于调试
      if (cleanText !== line.text) {
        console.log('🧹 文本清理:', {
          原文: line.text,
          清理后: cleanText
        });
      }
      
      return cleanText;
    });
    
    console.log('📝 预处理后的文本:', textsToTranslate);
    
    // 🎯 智能语言检测和翻译决策
    let translationResults;
    
    if (sourceLanguage === 'auto') {
      // 🎯 智能语言检测：更精确的语言识别
      const shouldTranslate = textsToTranslate.some(text => {
        // 移除空格和标点符号，只分析实际字符
        const cleanText = text.replace(/[\s\p{P}]/gu, '');
        if (cleanText.length === 0) return false;
        
        // 检测各种语言字符
        const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
        const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length; // 平假名+片假名
        const koreanChars = (text.match(/[\uac00-\ud7af]/g) || []).length; // 韩文
        const arabicChars = (text.match(/[\u0600-\u06ff]/g) || []).length; // 阿拉伯文
        const cyrillicChars = (text.match(/[\u0400-\u04ff]/g) || []).length; // 西里尔文
        const latinChars = (text.match(/[a-zA-Z]/g) || []).length; // 拉丁文
        
        const totalChars = cleanText.length;
        
        // 计算各语言占比
        const chineseRatio = chineseChars / totalChars;
        const japaneseRatio = japaneseChars / totalChars;
        const koreanRatio = koreanChars / totalChars;
        const arabicRatio = arabicChars / totalChars;
        const cyrillicRatio = cyrillicChars / totalChars;
        const latinRatio = latinChars / totalChars;
        
        console.log('🔍 语言检测详情:', {
          text: text.substring(0, 20),
          chinese: `${(chineseRatio * 100).toFixed(1)}%`,
          japanese: `${(japaneseRatio * 100).toFixed(1)}%`,
          korean: `${(koreanRatio * 100).toFixed(1)}%`,
          arabic: `${(arabicRatio * 100).toFixed(1)}%`,
          cyrillic: `${(cyrillicRatio * 100).toFixed(1)}%`,
          latin: `${(latinRatio * 100).toFixed(1)}%`
        });
        
        // 如果主要是中文、日文、韩文，不翻译
        if (chineseRatio > 0.6 || japaneseRatio > 0.3 || koreanRatio > 0.3) {
          return false;
        }
        
        // 如果主要是拉丁文、阿拉伯文、西里尔文，需要翻译
        if (latinRatio > 0.5 || arabicRatio > 0.5 || cyrillicRatio > 0.5) {
          return true;
        }
        
        // 混合文本：如果拉丁文占比 > 30%，尝试翻译
        return latinRatio > 0.3;
      });
      
      if (shouldTranslate) {
        console.log('🔍 自动检测：文本需要翻译，开始批量翻译');
        translationResults = await batchTranslateTexts(textsToTranslate, targetLanguage, 'auto');
      } else {
        console.log('🔍 自动检测：检测到中文文本，跳过翻译');
        // 对于中文文本，直接使用原文作为翻译结果
        translationResults = textsToTranslate.map(text => ({
          originalText: text,
          translatedText: text,
          success: true,
          sourceLanguage: 'zh',
          targetLanguage: targetLanguage
        }));
      }
    } else {
      // 手动指定源语言模式：直接翻译
      console.log(`🌍 使用指定源语言 "${sourceLanguage}" 进行翻译`);
      translationResults = await batchTranslateTexts(textsToTranslate, targetLanguage, sourceLanguage);
    }
    
    // 生成最终结果
    const detectedTexts: DetectedText[] = lines.map((line, index) => {
      const translation = Array.isArray(translationResults) 
        ? translationResults[index] 
        : translationResults;
      
      let finalTranslatedText = translation?.translatedText || line.text;
      
      // 🎯 翻译后处理：优化翻译结果
      if (translation?.translatedText) {
        // 保持原文的格式（大小写、标点等）
        const originalText = line.text;
        const translatedText = translation.translatedText;
        
        // 如果原文全大写，翻译结果也保持大写
        if (originalText === originalText.toUpperCase() && originalText.length > 1) {
          finalTranslatedText = translatedText.toUpperCase();
        }
        // 如果原文首字母大写，翻译结果也首字母大写
        else if (originalText[0] === originalText[0].toUpperCase()) {
          finalTranslatedText = translatedText.charAt(0).toUpperCase() + translatedText.slice(1);
        }
        
        // 保持原文的标点符号
        const originalPunctuation = originalText.match(/[.!?;:,]/g);
        if (originalPunctuation && originalPunctuation.length > 0) {
          const lastPunctuation = originalPunctuation[originalPunctuation.length - 1];
          if (!finalTranslatedText.endsWith(lastPunctuation)) {
            finalTranslatedText = finalTranslatedText.replace(/[.!?;:,]*$/, '') + lastPunctuation;
          }
        }
        
        console.log('✨ 翻译优化:', {
          原文: originalText,
          翻译: translation.translatedText,
          优化后: finalTranslatedText
        });
      }
      
      // 🎯 坐标需要根据压缩比例调整回原始尺寸
      const scaleX = originalImageSize.width / (compressionInfo?.compressedWidth || originalImageSize.width);
      const scaleY = originalImageSize.height / (compressionInfo?.compressedHeight || originalImageSize.height);
      
      const finalBbox = {
        x0: line.bbox.x0 * scaleX,
        y0: line.bbox.y0 * scaleY,
        x1: line.bbox.x1 * scaleX,
        y1: line.bbox.y1 * scaleY,
      };
      
      // 计算字体大小
      const textHeight = finalBbox.y1 - finalBbox.y0;
      const fontSize = Math.round(textHeight * 0.8);
      
      return {
        id: `text_${index}`,
        text: line.text,
        translatedText: finalTranslatedText,
        bbox: finalBbox,
        confidence: 0.9,
        fontSize: fontSize,
        originalImageSize: {
          width: originalImageSize.width,
          height: originalImageSize.height
        }
      };
    });
    
    console.log(`✅ Google Vision 处理完成，生成 ${detectedTexts.length} 个检测结果`);
    return detectedTexts;
    
  } catch (error) {
    console.error('❌ 处理 Google Vision 结果失败:', error);
    return [];
  }
};

const processOCRResults = async (
  ocrData: any, 
  targetLanguage: string, 
  originalImageSize?: {width: number, height: number},
  sourceLanguage?: string
): Promise<DetectedText[]> => {
  try {
    console.log('🔄 开始处理 OCR 结果...', { sourceLanguage, targetLanguage });
    
    // 1. 尝试使用 TextOverlay 数据（如果可用）
    if (originalImageSize && ocrData.ParsedResults?.[0]?.TextOverlay?.Lines) {
      console.log('🎯 使用 TextOverlay 数据');
      const textOverlayResults = processTextOverlayResults(ocrData, originalImageSize);
      
      if (textOverlayResults.length > 0) {
        // 提取文本进行翻译
        const textsToTranslate = textOverlayResults.map((item: any) => item.text);
        console.log('📝 需要翻译的文本:', textsToTranslate);
        
        // 批量翻译 - 传入源语言参数
        const translationResults = await batchTranslateTexts(textsToTranslate, targetLanguage, sourceLanguage);
        
        // 合并翻译结果
        const finalResults: DetectedText[] = textOverlayResults.map((item: any, index: number) => {
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
        
        console.log('✅ TextOverlay 处理完成，生成', finalResults.length, '个检测结果');
        return finalResults;
      }
    }
    
    // 2. 回退到原有的文本处理流程
    console.log('🔄 回退到文本处理流程');
    
    // 提取并清理 OCR 文本
    const rawText = ocrData.ParsedResults?.[0]?.ParsedText || '';
    const cleanedText = preprocessOCRText(rawText);
    console.log('📝 原始文本:', rawText);
    console.log('🧹 清理后文本:', cleanedText);
    
    // 智能分割文本
    const textSegments = optimizeOCRResults(ocrData);
    
    if (textSegments.length === 0) {
      console.log('⚠️ 未检测到有效文本');
      return [];
    }
    
    // 去重和排序
    const uniqueTexts = [...new Set(textSegments)];
    const prioritizedTexts = prioritizeTranslationTexts(uniqueTexts);
    
    console.log('🎯 最终翻译文本:', prioritizedTexts);
    
    // 批量翻译 - 传入源语言参数
    const translationResults = await batchTranslateTexts(prioritizedTexts, targetLanguage, sourceLanguage);
    
    // 处理翻译结果格式
    let processedResults: any[] = [];
    
    if (Array.isArray(translationResults)) {
      processedResults = translationResults;
    } else if (translationResults && typeof translationResults === 'object') {
      processedResults = [translationResults];
    } else {
      console.warn('⚠️ 翻译结果格式不正确，使用默认格式');
      processedResults = prioritizedTexts.map((text, index) => ({
        originalText: text,
        translatedText: text,
        success: false,
        error: '格式错误'
      }));
    }
    
    // 构建检测结果（使用默认坐标）
    const detectedTexts: DetectedText[] = processedResults.map((result, index) => ({
      id: `optimized-${index}`,
      text: result.originalText || prioritizedTexts[index] || '',
      confidence: 0.9,
      bbox: {
        x0: 50 + (index * 200),
        y0: 100 + (index * 50),
        x1: 300 + (index * 200),
        y1: 130 + (index * 50),
      },
      translatedText: result.translatedText || result.originalText || prioritizedTexts[index] || '',
      language: targetLanguage,
    }));
    
    console.log('✅ OCR 结果处理完成，生成', detectedTexts.length, '个检测结果');
    return detectedTexts;
  } catch (error) {
    console.log('❌ OCR 结果处理失败:', error);
    throw error;
  }
};

/**
 * 转换 OCR 坐标到原始图片坐标
 */
const convertCoordinates = (bbox: { x0: number; y0: number; x1: number; y1: number }) => {
  if (!compressionInfo) {
    return bbox; // 如果没有压缩信息，返回原坐标
  }
  
  const scaleX = compressionInfo.originalWidth / compressionInfo.compressedWidth;
  const scaleY = compressionInfo.originalHeight / compressionInfo.compressedHeight;
  
  return {
    x0: Math.round(bbox.x0 * scaleX),
    y0: Math.round(bbox.y0 * scaleY),
    x1: Math.round(bbox.x1 * scaleX),
    y1: Math.round(bbox.y1 * scaleY),
  };
};

/**
 * 压缩图片以符合 OCR API 大小限制
 */
const compressImageForOCR = async (imageUri: string, originalImageSize?: {width: number, height: number}): Promise<string> => {
  try {
    console.log('🗜️ 开始压缩图片:', imageUri);
    
    // 检查文件大小
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    const fileSize = (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : 0;
    console.log('📏 原始文件大小:', Math.round(fileSize / 1024), 'KB');
    
    // 获取原始图片尺寸
    const origWidth = originalImageSize?.width || 1920;
    const origHeight = originalImageSize?.height || 1080;
    
    // 🎯 强制压缩：目标是确保文件小于1MB，同时保留足够清晰度
    // 策略：最大边不超过1200px，质量30%
    const maxDimension = 1200;
    const scale = Math.min(maxDimension / Math.max(origWidth, origHeight), 1);
    const targetWidth = Math.round(origWidth * scale);
    const targetHeight = Math.round(origHeight * scale);
    
    console.log('🗜️ 压缩参数:', {
      原始尺寸: { origWidth, origHeight },
      原始文件大小: Math.round(fileSize / 1024) + 'KB',
      压缩比例: scale,
      目标尺寸: { targetWidth, targetHeight }
    });
    
    // 压缩图片
    const compressedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: targetWidth, height: targetHeight } }],
      { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // 保存压缩信息
    compressionInfo = {
      originalWidth: origWidth,
      originalHeight: origHeight,
      compressedWidth: targetWidth,
      compressedHeight: targetHeight,
    };
    
    // 检查压缩后的文件大小
    const compressedFileInfo = await FileSystem.getInfoAsync(compressedImage.uri);
    const compressedSize = (compressedFileInfo.exists && 'size' in compressedFileInfo) ? compressedFileInfo.size : 0;
    console.log('✅ 压缩完成:', {
      原始大小: Math.round(fileSize / 1024) + 'KB',
      压缩后大小: Math.round(compressedSize / 1024) + 'KB'
    });
    
    // 如果还是太大，降低质量再压缩
    if (compressedSize > MAX_FILE_SIZE) {
      console.warn('⚠️ 需要进一步压缩，降低质量到15%');
      const secondCompressed = await ImageManipulator.manipulateAsync(
        compressedImage.uri,
        [],  // 不调整尺寸，只降低质量
        { compress: 0.15, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // 更新压缩信息（尺寸不变）
      compressionInfo = {
        originalWidth: origWidth,
        originalHeight: origHeight,
        compressedWidth: targetWidth,
        compressedHeight: targetHeight,
      };
      
      const finalFileInfo = await FileSystem.getInfoAsync(secondCompressed.uri);
      const finalSize = (finalFileInfo.exists && 'size' in finalFileInfo) ? finalFileInfo.size : 0;
      console.log('✅ 二次压缩完成:', Math.round(finalSize / 1024) + 'KB');
      
      return secondCompressed.uri;
    }
    
    return compressedImage.uri;
  } catch (error) {
    console.error('❌ 图片压缩失败:', error);
    // 压缩失败时返回原图片
    return imageUri;
  }
};

/**
 * 修复文件访问权限 - 将私有文件复制到可访问位置
 * 按照最佳实践优化压缩流程
 */
const prepareImageForOCR = async (originalImageUri: string, originalImageSize?: {width: number, height: number}): Promise<string> => {
  try {
    console.log('🔄 准备图片用于 OCR:', originalImageUri, originalImageSize);
    
    // 1. 确保文件路径有正确的 URI scheme
    let normalizedUri = originalImageUri;
    if (!originalImageUri.startsWith('file://') && !originalImageUri.startsWith('content://') && !originalImageUri.startsWith('http')) {
      normalizedUri = `file://${originalImageUri}`;
      console.log('🔧 添加 file:// scheme:', normalizedUri);
    }
    
    // 2. 检查文件是否存在
    const fileInfo = await FileSystem.getInfoAsync(normalizedUri);
    console.log('📁 文件信息:', {
      originalUri: originalImageUri,
      normalizedUri: normalizedUri,
      exists: fileInfo.exists,
      size: (fileInfo.exists && 'size' in fileInfo) ? fileInfo.size : 0,
      isDirectory: fileInfo.isDirectory,
      modificationTime: (fileInfo.exists && 'modificationTime' in fileInfo) ? fileInfo.modificationTime : undefined
    });
    
    // 如果文件不存在，尝试直接使用原文件路径
    if (!fileInfo.exists) {
      console.warn('⚠️ 文件信息显示不存在，但尝试直接使用原路径');
      return normalizedUri;
    }

    // 3. 先压缩图片（传入真实的原始尺寸）
    console.log('🗜️ 开始压缩图片以符合 OCR API 限制...');
    const compressedImage = await compressImageForOCR(normalizedUri, originalImageSize);
    
    // 4. 检查压缩后的文件大小
    const compressedFileInfo = await FileSystem.getInfoAsync(compressedImage);
    const compressedSize = (compressedFileInfo.exists && 'size' in compressedFileInfo) ? compressedFileInfo.size : 0;
    console.log('📏 压缩后文件大小:', Math.round(compressedSize / 1024), 'KB');
    
    if (compressedSize > MAX_FILE_SIZE) {
      console.warn('⚠️ 压缩后图片仍然过大，尝试进一步处理');
      // 这里可以添加更激进的压缩策略或降级方案
      throw new Error(`压缩后文件仍然过大: ${Math.round(compressedSize / 1024)}KB > ${Math.round(MAX_FILE_SIZE / 1024)}KB`);
    }
    
    // 5. 复制到临时目录（保持原有逻辑）
    const tempDir = `${FileSystem.cacheDirectory}ocr_temp/`;
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    
    const tempUri = `${tempDir}ocr_${Date.now()}.jpg`;
    await FileSystem.copyAsync({
      from: compressedImage,
      to: tempUri
    });
    
    console.log('✅ 图片准备完成:', tempUri);
    return tempUri;
  } catch (error) {
    console.error('❌ 图片预处理失败:', error);
    // 如果准备失败，尝试直接使用原文件路径（带正确的 scheme）
    const fallbackUri = originalImageUri.startsWith('file://') ? originalImageUri : `file://${originalImageUri}`;
    console.log('🔄 尝试直接使用原文件路径:', fallbackUri);
    return fallbackUri;
  }
};

/**
 * 将标准语言代码转换为OCR.space API支持的语言代码
 */
const getOCRLanguageCode = (languageCode: string): string => {
  const languageMap: Record<string, string> = {
    'en': 'eng',           // English
    'zh-CN': 'chs',        // Chinese Simplified
    'zh': 'chs',           // Chinese
    'zh-TW': 'cht',        // Chinese Traditional
    'ja': 'jpn',           // Japanese
    'ko': 'kor',           // Korean
    'es': 'spa',           // Spanish
    'fr': 'fre',           // French
    'de': 'ger',           // German
    'it': 'ita',           // Italian
    'pt': 'por',           // Portuguese
    'ru': 'rus',           // Russian
    'ar': 'ara',           // Arabic
    'th': 'tha',           // Thai
    'vi': 'vie',           // Vietnamese
    'nl': 'dut',           // Dutch
    'pl': 'pol',           // Polish
    'tr': 'tur',           // Turkish
    // 更多语言可以根据需要添加
  };
  
  return languageMap[languageCode] || 'eng'; // 默认使用英文
};

/**
 * 使用云 OCR 服务识别图片中的文字（修复版）
 */
export const detectTextFromImage = async (
  imageUri: string, 
  imageSize?: {width: number, height: number},
  sourceLanguage?: string,  // 源语言（图片中的语言）
  targetLanguage?: string   // 目标语言（用于后续翻译）
): Promise<DetectedText[]> => {
  let preparedImageUri = imageUri; // 初始化变量
  
  try {
    console.log('🖼️ 开始云 OCR 识别流程', { imageSize, sourceLanguage, targetLanguage });
    
    // 准备图片（压缩、复制到可访问位置）- 传入真实的原始尺寸
    preparedImageUri = await prepareImageForOCR(imageUri, imageSize);
    console.log('🔄 开始读取图片文件:', preparedImageUri);
    const base64Image = await FileSystem.readAsStringAsync(preparedImageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('📊 图片已转换为 base64, 长度:', base64Image.length);
    
    if (!base64Image || base64Image.length === 0) {
      throw new Error('图片文件为空或无法读取');
    }

    // 🎯 使用 Google Cloud Vision API 进行文本检测
    console.log('🌐 使用 Google Cloud Vision API 进行 OCR 识别');

    // 准备 Google Vision API 请求体
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 50
            }
          ],
          imageContext: {
            languageHints: [sourceLanguage || 'en', 'zh', 'ja', 'ko'] // 支持多语言
          }
        }
      ]
    };

    console.log('🚀 发送请求到 Google Cloud Vision API...');
    
    const response = await fetchWithTimeout(GOOGLE_VISION_API_URL, {
          method: 'POST',
          headers: {
        'Content-Type': 'application/json',
          },
      body: JSON.stringify(requestBody),
        }, REQUEST_TIMEOUT);
        
    console.log('📡 Google Cloud Vision API 响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google Cloud Vision API 错误:', { status: response.status, error: errorText });
      throw new Error(`Google Cloud Vision API 错误: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Google Cloud Vision API 响应数据:', data);

    // 清理临时文件
    try {
      await FileSystem.deleteAsync(preparedImageUri);
    } catch (cleanupError) {
      console.warn('⚠️ 清理临时文件失败:', cleanupError);
    }

    // 🎯 处理 Google Cloud Vision API 响应
    if (!data.responses || data.responses.length === 0 || !data.responses[0].textAnnotations) {
      console.log('⚠️ Google Vision API 未检测到文字');
      return getFallbackDetections('OCR 未检测到文字', imageSize);
    }

    const textAnnotations = data.responses[0].textAnnotations;
    
    // 第一个annotation是整个文本，跳过它
    if (textAnnotations.length <= 1) {
      console.log('⚠️ 没有足够的文本注释');
      return getFallbackDetections('OCR 未检测到文字', imageSize);
    }

    // 🎯 使用原始照片尺寸
    const ocrImageSize = imageSize || {
      width: compressionInfo?.originalWidth || 1920,
      height: compressionInfo?.originalHeight || 1080
    };
    
    console.log('🎯 处理 Google Vision 识别结果，图片尺寸:', ocrImageSize);
    
    // 🎯 处理Google Vision响应并翻译
    const detectedTexts = await processGoogleVisionResults(
      textAnnotations, 
      targetLanguage || 'zh-CN', 
      ocrImageSize, 
      sourceLanguage
    );

    console.log(`✅ Google Cloud Vision OCR 完成，检测到 ${detectedTexts.length} 个文字区域`);
    return detectedTexts;
  } catch (error) {
    // 如果是网络错误，不显示错误日志（可能是离线模式）
    if (error instanceof Error && error.message.includes('Network request failed')) {
      console.warn('⚠️ 云 OCR 网络不可用，可能是离线模式');
    } else {
      console.error('❌ 云 OCR 识别失败:', error);
    }
    
    // 清理临时文件（如果创建了）
    if (preparedImageUri !== imageUri) {
      try {
        await FileSystem.deleteAsync(preparedImageUri);
      } catch (cleanupError) {
        console.warn('⚠️ 清理临时文件失败:', cleanupError);
      }
    }
    
    return getFallbackDetections(`OCR 失败: ${error}`, imageSize);
  }
};

/**
 * 降级 OCR 检测（当云服务失败时使用）
 */
const getFallbackDetections = (reason: string, imageSize?: {width: number, height: number}): DetectedText[] => {
  console.log(`🔄 使用降级 OCR 数据，原因: ${reason}`);
  
  // 🎯 使用真实的照片尺寸，而不是硬编码的1920×1080
  const realWidth = imageSize?.width || 1920;
  const realHeight = imageSize?.height || 1080;
  
  console.log('📐 演示数据使用的尺寸:', { realWidth, realHeight });
  
  return [
    {
      id: 'fallback-1',
      text: '拍摄的真实文字将显示在这里',
      confidence: 0.9,
      bbox: { x0: 50, y0: 200, x1: 350, y1: 240 },
      originalImageSize: { width: realWidth, height: realHeight },  // 使用真实尺寸
    },
    {
      id: 'fallback-2', 
      text: '当前使用演示数据，云 OCR 服务暂时不可用',
      confidence: 0.85,
      bbox: { x0: 50, y0: 250, x1: 400, y1: 290 },
      originalImageSize: { width: realWidth, height: realHeight },
    },
    {
      id: 'fallback-3',
      text: `错误原因: ${reason.substring(0, 30)}...`,
      confidence: 0.8,
      bbox: { x0: 50, y0: 300, x1: 400, y1: 340 },
      originalImageSize: { width: realWidth, height: realHeight },
    },
  ];
};

/**
 * 完整的图片翻译流程 - 优化版（支持图片尺寸和源语言）
 */
export const translateImageText = async (
  imageUri: string,
  targetLanguage: string,
  imageSize?: {width: number, height: number},
  sourceLanguage?: string  // 源语言（图片中的语言）
): Promise<DetectedText[]> => {
  try {
    console.log('🖼️ 开始图片翻译流程（优化版）', { sourceLanguage, targetLanguage });
    
    // 1. OCR 识别（传入源语言和目标语言）
    const detectedTexts = await detectTextFromImage(imageUri, imageSize, sourceLanguage, targetLanguage);
    
    if (detectedTexts.length === 0) {
      console.log('⚠️ 未检测到可翻译的文字');
      return [];
    }

    console.log('📝 检测到的文字:', detectedTexts.map(t => t.text));
    console.log('🎯 图片翻译流程完成（优化版）');
    return detectedTexts;
  } catch (error) {
    console.error('❌ 图片翻译流程失败:', error);
    return getFallbackDetections(`流程错误: ${error}`, imageSize);
  }
};
