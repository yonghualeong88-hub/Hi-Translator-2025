import { TranslationAPIResponse, AppError } from '@/types/global';
import { ErrorHandler, ERROR_CODES } from '@/utils/errorHandler';
import { NETWORK_CONFIG } from '@/constants/config';
import { withTimeout, retry } from '@/utils/helpers';

// API配置
const API_CONFIG = {
  GOOGLE_TRANSLATE: {
    BASE_URL: 'https://translation.googleapis.com/language/translate/v2',
    TIMEOUT: 10000,
  },
  AZURE_TRANSLATOR: {
    BASE_URL: 'https://api.cognitive.microsofttranslator.com/translate',
    TIMEOUT: 10000,
  },
  LOCAL_TRANSLATOR: {
    BASE_URL: 'http://localhost:3001/api/translate',
    TIMEOUT: 5000,
  },
} as const;

// 翻译引擎类型
export type TranslationEngine = 'google' | 'azure' | 'local';

// 翻译请求参数
export interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
  engine?: TranslationEngine;
}

// Google Translate API服务
class GoogleTranslateService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(request: TranslationRequest): Promise<TranslationAPIResponse> {
    try {
      const response = await withTimeout(
        fetch(`${API_CONFIG.GOOGLE_TRANSLATE.BASE_URL}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: request.text,
            source: request.fromLanguage,
            target: request.toLanguage,
            format: 'text',
          }),
        }),
        API_CONFIG.GOOGLE_TRANSLATE.TIMEOUT
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Google Translate API error');
      }

      const translation = data.data.translations[0];
      
      return {
        success: true,
        data: {
          translatedText: translation.translatedText,
          confidence: 0.95, // Google Translate通常有很高的置信度
          detectedLanguage: translation.detectedSourceLanguage || request.fromLanguage,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.TRANSLATION_FAILED,
          message: ErrorHandler.handleError(error).message,
        },
      };
    }
  }
}

// Azure Translator API服务
class AzureTranslatorService {
  private apiKey: string;
  private region: string;

  constructor(apiKey: string, region: string) {
    this.apiKey = apiKey;
    this.region = region;
  }

  async translate(request: TranslationRequest): Promise<TranslationAPIResponse> {
    try {
      const url = `${API_CONFIG.AZURE_TRANSLATOR.BASE_URL}?api-version=3.0&from=${request.fromLanguage}&to=${request.toLanguage}`;
      
      const response = await withTimeout(
        fetch(url, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Ocp-Apim-Subscription-Region': this.region,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ text: request.text }]),
        }),
        API_CONFIG.AZURE_TRANSLATOR.TIMEOUT
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Azure Translator API error');
      }

      const translation = data[0].translations[0];
      
      return {
        success: true,
        data: {
          translatedText: translation.text,
          confidence: 0.9, // Azure Translator的置信度
          detectedLanguage: data[0].detectedLanguage?.language || request.fromLanguage,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.TRANSLATION_FAILED,
          message: ErrorHandler.handleError(error).message,
        },
      };
    }
  }
}

// 本地翻译服务（模拟）
class LocalTranslatorService {
  async translate(request: TranslationRequest): Promise<TranslationAPIResponse> {
    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // 模拟翻译结果
      const mockTranslations: Record<string, Record<string, string>> = {
        'zh-CN': {
          'en': 'Hello, the weather is nice today, perfect for a walk.',
          'ja': 'こんにちは、今日はとてもいい天気で、散歩に最適です。',
          'ko': '안녕하세요, 오늘 날씨가 좋아서 산책하기에 완벽합니다.',
          'es': 'Hola, el clima está muy bien hoy, perfecto para dar un paseo.',
          'fr': 'Bonjour, le temps est très beau aujourd\'hui, parfait pour une promenade.',
          'de': 'Hallo, das Wetter ist heute sehr schön, perfekt für einen Spaziergang.',
          'ru': 'Привет, сегодня очень хорошая погода, идеально для прогулки.',
        },
        'en': {
          'zh-CN': '你好，今天天气很好，适合出门散步。',
          'ja': 'こんにちは、今日はとてもいい天気で、散歩に最適です。',
          'ko': '안녕하세요, 오늘 날씨가 좋아서 산책하기에 완벽합니다.',
          'es': 'Hola, el clima está muy bien hoy, perfecto para dar un paseo.',
          'fr': 'Bonjour, le temps est très beau aujourd\'hui, parfait pour une promenade.',
          'de': 'Hallo, das Wetter ist heute sehr schön, perfekt für einen Spaziergang.',
          'ru': 'Привет, сегодня очень хорошая погода, идеально для прогулки.',
        },
        'ja': {
          'zh-CN': '你好，今天天气很好，适合出门散步。',
          'en': 'Hello, the weather is nice today, perfect for a walk.',
          'ko': '안녕하세요, 오늘 날씨가 좋아서 산책하기에 완벽합니다.',
        },
        'ko': {
          'zh-CN': '你好，今天天气很好，适合出门散步。',
          'en': 'Hello, the weather is nice today, perfect for a walk.',
          'ja': 'こんにちは、今日はとてもいい天気で、散歩に最適です。',
        },
      };

      const translatedText = mockTranslations[request.fromLanguage]?.[request.toLanguage] || 
        `Translation of "${request.text}" from ${request.fromLanguage} to ${request.toLanguage}`;

      return {
        success: true,
        data: {
          translatedText,
          confidence: 0.85 + Math.random() * 0.15, // 85-100% 置信度
          detectedLanguage: request.fromLanguage,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.TRANSLATION_FAILED,
          message: ErrorHandler.handleError(error).message,
        },
      };
    }
  }
}

// 翻译服务管理器
export class TranslationService {
  private googleService?: GoogleTranslateService;
  private azureService?: AzureTranslatorService;
  private localService: LocalTranslatorService;
  private defaultEngine: TranslationEngine;

  constructor(
    googleApiKey?: string,
    azureApiKey?: string,
    azureRegion?: string,
    defaultEngine: TranslationEngine = 'local'
  ) {
    this.defaultEngine = defaultEngine;
    this.localService = new LocalTranslatorService();
    
    if (googleApiKey) {
      this.googleService = new GoogleTranslateService(googleApiKey);
    }
    
    if (azureApiKey && azureRegion) {
      this.azureService = new AzureTranslatorService(azureApiKey, azureRegion);
    }
  }

  // 设置默认翻译引擎
  setDefaultEngine(engine: TranslationEngine): void {
    this.defaultEngine = engine;
  }

  // 获取可用的翻译引擎
  getAvailableEngines(): TranslationEngine[] {
    const engines: TranslationEngine[] = ['local'];
    
    if (this.googleService) {
      engines.push('google');
    }
    
    if (this.azureService) {
      engines.push('azure');
    }
    
    return engines;
  }

  // 翻译文本
  async translate(request: TranslationRequest): Promise<TranslationAPIResponse> {
    const engine = request.engine || this.defaultEngine;
    
    // 验证输入
    if (!request.text || request.text.trim().length === 0) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.INVALID_TEXT,
          message: '请输入要翻译的文本',
        },
      };
    }

    if (request.text.length > 5000) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.TEXT_TOO_LONG,
          message: '文本长度不能超过5000个字符',
        },
      };
    }

    // 尝试使用指定的翻译引擎
    try {
      let result: TranslationAPIResponse;

      switch (engine) {
        case 'google':
          if (!this.googleService) {
            throw new Error('Google Translate服务未配置');
          }
          result = await this.googleService.translate(request);
          break;
          
        case 'azure':
          if (!this.azureService) {
            throw new Error('Azure Translator服务未配置');
          }
          result = await this.azureService.translate(request);
          break;
          
        case 'local':
        default:
          result = await this.localService.translate(request);
          break;
      }

      // 如果翻译失败且不是本地引擎，尝试使用备用引擎
      if (!result.success && engine !== 'local') {
        console.warn(`翻译引擎 ${engine} 失败，尝试使用本地引擎`);
        result = await this.localService.translate(request);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.TRANSLATION_FAILED,
          message: ErrorHandler.handleError(error).message,
        },
      };
    }
  }

  // 批量翻译
  async translateBatch(
    requests: TranslationRequest[]
  ): Promise<TranslationAPIResponse[]> {
    const results: TranslationAPIResponse[] = [];
    
    // 限制并发请求数量
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(request => this.translate(request))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  // 检测语言
  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      // 简单的语言检测逻辑
      const chineseRegex = /[\u4e00-\u9fff]/;
      const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
      const koreanRegex = /[\uac00-\ud7af]/;
      const cyrillicRegex = /[\u0400-\u04ff]/;

      if (chineseRegex.test(text)) {
        return { language: 'zh-CN', confidence: 0.9 };
      } else if (japaneseRegex.test(text)) {
        return { language: 'ja', confidence: 0.9 };
      } else if (koreanRegex.test(text)) {
        return { language: 'ko', confidence: 0.9 };
      } else if (cyrillicRegex.test(text)) {
        return { language: 'ru', confidence: 0.9 };
      } else {
        return { language: 'en', confidence: 0.8 };
      }
    } catch (error) {
      return { language: 'en', confidence: 0.5 };
    }
  }
}

// 创建翻译服务实例
export const createTranslationService = (
  googleApiKey?: string,
  azureApiKey?: string,
  azureRegion?: string,
  defaultEngine: TranslationEngine = 'local'
): TranslationService => {
  return new TranslationService(googleApiKey, azureApiKey, azureRegion, defaultEngine);
};

// 默认翻译服务实例
export const translationService = createTranslationService();
