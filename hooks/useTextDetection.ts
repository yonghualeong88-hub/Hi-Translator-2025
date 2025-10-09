// 修复版 useTextDetection.ts - 智能选择OCR服务：离线模式用离线OCR，在线模式用云OCR
import { translateImageText } from '@/services/cloudOCRService';
import { offlineOCRService } from '@/services/offlineOCRService';
import { DetectedText } from '@/types/camera';
import { useCallback, useState } from 'react';

interface UseTextDetectionProps {
  targetLanguage: string;
}

export const useTextDetection = ({ targetLanguage }: UseTextDetectionProps) => {
  const [detectedTexts, setDetectedTexts] = useState<DetectedText[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // 🎯 图片处理流程 - 智能选择OCR服务：离线模式用离线OCR，在线模式用云OCR
  const processImage = useCallback(async (
    imageUri: string, 
    imageSize?: {width: number, height: number},
    sourceLanguage?: string  // 源语言（图片中的语言）
  ) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setLastError(null);
    
    try {
      console.log('📸 开始处理拍摄的图片 - 智能选择OCR服务', { sourceLanguage, targetLanguage });
      
      // 首先尝试离线OCR（仅当网络不可用时）
      try {
        // 检查网络状态，只有在离线时才使用离线OCR
        const { translationModeManager } = await import('@/services/translationModeManager');
        const modeState = translationModeManager.getCurrentState();
        
        console.log('🔍 当前翻译模式状态:', modeState);
        console.log('🔍 网络状态:', modeState.isOnline);
        console.log('🔍 用户设置模式:', modeState.mode);
        console.log('🔍 实际模式:', modeState.actualMode);
        
        // 临时强制检测：如果云OCR会失败，说明网络有问题，应该使用离线OCR
        const shouldUseOfflineOCR = modeState.actualMode === 'offline';
        
        if (shouldUseOfflineOCR) {
          console.log('🤖 离线模式：尝试使用离线OCR服务...');
          const offlineResult = await offlineOCRService.recognizeText(imageUri);
          
          if (offlineResult.success && offlineResult.texts.length > 0) {
            console.log(`✅ 离线OCR识别成功，检测到 ${offlineResult.texts.length} 个文本块`);
            
            // 离线模式下需要手动翻译识别到的文本
            const { offlineTranslationService } = await import('@/services/offlineTranslationService');
            
            const detectedTexts: DetectedText[] = [];
            for (const text of offlineResult.texts) {
              try {
                // ✅ 离线模式下，源语言默认为 'en'（ML Kit OCR 主要识别英文）
                const actualSourceLang = (!sourceLanguage || sourceLanguage === 'auto') ? 'en' : sourceLanguage;
                
                // 对每个识别到的文本进行离线翻译
                const translationResult = await offlineTranslationService.translateOffline(
                  text.text, 
                  actualSourceLang, 
                  targetLanguage
                );
                
                // ✅ 使用 ML Kit OCR 返回的实际图片尺寸，如果没有则使用传入的 imageSize
                const actualImageSize = text.ocrImageSize || imageSize || { width: 1536, height: 2048 };
                
                detectedTexts.push({
                  id: `offline-${detectedTexts.length}`,
                  text: text.text,
                  translatedText: translationResult.success ? translationResult.translatedText : text.text,
                  confidence: text.confidence,
                  bbox: text.bbox || { x0: 0, y0: 0, x1: 100, y1: 50 },
                  originalImageSize: actualImageSize,
                  ocrImageSize: text.ocrImageSize, // ✅ 传递 ML Kit OCR 图片尺寸
                });
              } catch (translationError) {
                console.warn('⚠️ 离线翻译失败，使用原文:', translationError);
                
                // ✅ 使用 ML Kit OCR 返回的实际图片尺寸
                const actualImageSize = text.ocrImageSize || imageSize || { width: 1536, height: 2048 };
                
                detectedTexts.push({
                  id: `offline-${detectedTexts.length}`,
                  text: text.text,
                  translatedText: text.text,
                  confidence: text.confidence,
                  bbox: text.bbox || { x0: 0, y0: 0, x1: 100, y1: 50 },
                  originalImageSize: actualImageSize,
                  ocrImageSize: text.ocrImageSize, // ✅ 传递 ML Kit OCR 图片尺寸
                });
              }
            }
            
            setDetectedTexts(detectedTexts);
            console.log('✅ 离线OCR+翻译处理完成');
            return;
          }
        }
      } catch (offlineError) {
        console.warn('⚠️ 离线OCR失败，尝试云OCR:', offlineError);
      }
      
      // 在线模式或离线OCR失败时，使用云OCR（原有逻辑）
      console.log('🌐 尝试使用云OCR服务...');
      const translatedTexts = await translateImageText(imageUri, targetLanguage, imageSize, sourceLanguage);
      
      setDetectedTexts(translatedTexts);
      
      console.log('✅ 图片处理完成', {
        textCount: translatedTexts.length,
        hasRealText: !translatedTexts.some(text => 
          text.text.includes('演示数据') || text.text.includes('错误原因')
        )
      });
    } catch (error) {
      console.error('❌ 图片处理失败:', error);
      setLastError(error instanceof Error ? error.message : '未知错误');
      setDetectedTexts([]);
    } finally {
      setIsProcessing(false);
    }
  }, [targetLanguage, isProcessing]);

  // 检查是否使用真实 OCR 数据
  const isUsingRealOCR = detectedTexts.length > 0 && 
    !detectedTexts.some(text => 
      text.text.includes('演示数据') || 
      text.text.includes('错误原因') ||
      text.text.includes('拍摄的真实文字')
    );

  // 清空检测结果
  const clearDetections = useCallback(() => {
    setDetectedTexts([]);
    setLastError(null);
  }, []);

  return {
    detectedTexts,
    setDetectedTexts,
    isProcessing,
    isUsingRealOCR,
    lastError,
    processImage,
    clearDetections,
  };
};

