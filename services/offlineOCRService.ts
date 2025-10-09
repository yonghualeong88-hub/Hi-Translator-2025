// 离线OCR服务 - 基于 ML Kit 文本识别
import { mlKitOCRService } from './mlKitOCRService';

export interface OfflineOCRResult {
  success: boolean;
  texts: Array<{
    id: string;
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
    ocrImageSize?: {
      width: number;
      height: number;
    };
  }>;
  error?: string;
}

class OfflineOCRService {
  /**
   * 使用 ML Kit 进行离线文本识别
   */
  async recognizeText(imagePath: string): Promise<OfflineOCRResult> {
    try {
      console.log('📸 开始离线OCR识别:', imagePath);

      // ✅ 检查 ML Kit OCR 模块是否可用
      const isAvailable = await mlKitOCRService.isAvailable();
      if (!isAvailable) {
        throw new Error('ML Kit OCR 模块未初始化。请确认应用已正确编译并安装了原生模块。');
      }

      // ✅ 使用 ML Kit 进行文本识别
      const result = await mlKitOCRService.recognizeText(imagePath);

      if (result.texts && result.texts.length > 0) {
        console.log(`✅ ML Kit OCR识别成功，识别到 ${result.texts.length} 个文本块`);

        // 转换为标准格式
        const texts = result.texts.map((text, index) => ({
          id: `mlkit-${index}`,
          text: text.text,
          confidence: text.confidence,
          bbox: text.bounds || {
            x0: 0,
            y0: 0,
            x1: 100,
            y1: 50,
          },
          ocrImageSize: result.imageSize, // ✅ 传递 ML Kit 实际处理的图片尺寸
        }));

        return {
          success: true,
          texts,
          ocrImageSize: result.imageSize, // ✅ 也在顶层传递
        };
      } else {
        console.warn('⚠️ ML Kit OCR未识别到文本');
        return {
          success: false,
          texts: [],
          error: '未识别到文本',
        };
      }
    } catch (error) {
      console.error('❌ 离线OCR识别失败:', error);
      return {
        success: false,
        texts: [],
        error: error instanceof Error ? error.message : 'OCR识别失败',
      };
    }
  }

  /**
   * 检查离线OCR是否可用
   */
  async isOfflineOCRAvailable(): Promise<boolean> {
    return await mlKitOCRService.isAvailable();
  }
}

export const offlineOCRService = new OfflineOCRService();
