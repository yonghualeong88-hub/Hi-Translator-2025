import { NativeModules, Platform } from 'react-native';

/**
 * ML Kit OCR 文字识别结果
 */
export interface OCRTextResult {
  text: string;
  confidence: number;
  bounds?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OCRResult {
  texts: OCRTextResult[];
  totalBlocks: number;
  fullText: string;
  imageSize?: {
    width: number;
    height: number;
  };
}

/**
 * ML Kit OCR Native Module
 */
interface MLKitOCRNativeModule {
  recognizeText(imageUri: string): Promise<OCRResult>;
  isAvailable(): Promise<boolean>;
}

const { MLKitOCR } = NativeModules;

/**
 * ML Kit OCR 服务
 * 提供离线文字识别功能
 */
class MLKitOCRService {
  private nativeModule: MLKitOCRNativeModule | null = null;

  constructor() {
    if (Platform.OS === 'android' && MLKitOCR) {
      this.nativeModule = MLKitOCR as MLKitOCRNativeModule;
      console.log('✅ ML Kit OCR 模块已加载');
    } else {
      console.warn('⚠️ ML Kit OCR 模块不可用');
    }
  }

  /**
   * 检查 OCR 模块是否可用
   */
  async isAvailable(): Promise<boolean> {
    if (!this.nativeModule) {
      return false;
    }
    
    try {
      return await this.nativeModule.isAvailable();
    } catch (error) {
      console.error('检查 OCR 可用性失败:', error);
      return false;
    }
  }

  /**
   * 识别图片中的文字
   * @param imageUri 图片路径（支持 file:// 或本地路径）
   */
  async recognizeText(imageUri: string): Promise<OCRResult> {
    if (!this.nativeModule) {
      throw new Error('ML Kit OCR 模块未初始化');
    }

    try {
      console.log('📸 ML Kit OCR 识别开始:', imageUri);
      const result = await this.nativeModule.recognizeText(imageUri);
      console.log(`✅ ML Kit OCR 识别成功: ${result.texts.length} 个文本块`);
      if (result.imageSize) {
        console.log(`📐 ML Kit OCR 处理的图片尺寸: ${result.imageSize.width} x ${result.imageSize.height}`);
      }
      return result;
    } catch (error: any) {
      console.error('❌ ML Kit OCR 识别失败:', error);
      throw new Error(`OCR 识别失败: ${error.message || error}`);
    }
  }
}

// 单例导出
export const mlKitOCRService = new MLKitOCRService();

