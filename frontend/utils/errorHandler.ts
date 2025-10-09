import { ERROR_CONFIG } from '@/constants/config';
import { AppError } from '@/types/global';

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  TRANSLATION = 'TRANSLATION_ERROR',
  AUDIO = 'AUDIO_ERROR',
  STORAGE = 'STORAGE_ERROR',
  PERMISSION = 'PERMISSION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

// 错误代码映射
export const ERROR_CODES = {
  // 网络错误
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_QUOTA_EXCEEDED: 'API_QUOTA_EXCEEDED',
  
  // 翻译错误
  TRANSLATION_FAILED: 'TRANSLATION_FAILED',
  UNSUPPORTED_LANGUAGE: 'UNSUPPORTED_LANGUAGE',
  INVALID_TEXT: 'INVALID_TEXT',
  TRANSLATION_TIMEOUT: 'TRANSLATION_TIMEOUT',
  
  // 音频错误
  RECORDING_FAILED: 'RECORDING_FAILED',
  PLAYBACK_FAILED: 'PLAYBACK_FAILED',
  AUDIO_PERMISSION_DENIED: 'AUDIO_PERMISSION_DENIED',
  AUDIO_DEVICE_UNAVAILABLE: 'AUDIO_DEVICE_UNAVAILABLE',
  
  // 存储错误
  STORAGE_FULL: 'STORAGE_FULL',
  DATA_CORRUPTED: 'DATA_CORRUPTED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  IMPORT_FAILED: 'IMPORT_FAILED',
  
  // 权限错误
  CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
  MICROPHONE_PERMISSION_DENIED: 'MICROPHONE_PERMISSION_DENIED',
  STORAGE_PERMISSION_DENIED: 'STORAGE_PERMISSION_DENIED',
  
  // 验证错误
  INVALID_INPUT: 'INVALID_INPUT',
  TEXT_TOO_LONG: 'TEXT_TOO_LONG',
  TEXT_TOO_SHORT: 'TEXT_TOO_SHORT',
  INVALID_LANGUAGE_CODE: 'INVALID_LANGUAGE_CODE',
} as const;

// 错误消息映射
export const ERROR_MESSAGES: Record<string, string> = {
  // 网络错误
  [ERROR_CODES.NETWORK_TIMEOUT]: '网络连接超时，请检查网络设置',
  [ERROR_CODES.NETWORK_UNAVAILABLE]: '网络不可用，请检查网络连接',
  [ERROR_CODES.API_RATE_LIMIT]: 'API调用频率过高，请稍后重试',
  [ERROR_CODES.API_QUOTA_EXCEEDED]: 'API配额已用完，请稍后重试',
  
  // 翻译错误
  [ERROR_CODES.TRANSLATION_FAILED]: '翻译失败，请重试',
  [ERROR_CODES.UNSUPPORTED_LANGUAGE]: '不支持的语言',
  [ERROR_CODES.INVALID_TEXT]: '无效的文本内容',
  [ERROR_CODES.TRANSLATION_TIMEOUT]: '翻译超时，请重试',
  
  // 音频错误
  [ERROR_CODES.RECORDING_FAILED]: '录音失败，请重试',
  [ERROR_CODES.PLAYBACK_FAILED]: '播放失败，请重试',
  [ERROR_CODES.AUDIO_PERMISSION_DENIED]: '需要录音权限才能使用语音功能',
  [ERROR_CODES.AUDIO_DEVICE_UNAVAILABLE]: '音频设备不可用',
  
  // 存储错误
  [ERROR_CODES.STORAGE_FULL]: '存储空间不足',
  [ERROR_CODES.STORAGE_PERMISSION_DENIED]: '需要存储权限',
  [ERROR_CODES.DATA_CORRUPTED]: '数据损坏，请重新导入',
  [ERROR_CODES.EXPORT_FAILED]: '导出失败，请重试',
  [ERROR_CODES.IMPORT_FAILED]: '导入失败，请检查文件格式',
  
  // 权限错误
  [ERROR_CODES.CAMERA_PERMISSION_DENIED]: '需要相机权限',
  [ERROR_CODES.MICROPHONE_PERMISSION_DENIED]: '需要麦克风权限',
  
  // 验证错误
  [ERROR_CODES.INVALID_INPUT]: '输入内容无效',
  [ERROR_CODES.TEXT_TOO_LONG]: '文本长度超过限制',
  [ERROR_CODES.TEXT_TOO_SHORT]: '文本长度不足',
  [ERROR_CODES.INVALID_LANGUAGE_CODE]: '无效的语言代码',
};

// 错误日志
class ErrorLogger {
  private logs: AppError[] = [];
  private maxLogSize = ERROR_CONFIG.MAX_ERROR_LOG_SIZE;

  log(error: AppError): void {
    if (ERROR_CONFIG.LOG_ERRORS) {
      this.logs.push({
        ...error,
        timestamp: new Date(),
      });

      // 保持日志数量在限制内
      if (this.logs.length > this.maxLogSize) {
        this.logs = this.logs.slice(-this.maxLogSize);
      }

      // 在开发模式下打印到控制台
      if (ERROR_CONFIG.SHOW_ERROR_DETAILS) {
        console.error('Error logged:', error);
      }
    }
  }

  getLogs(): AppError[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getRecentErrors(count: number = 10): AppError[] {
    return this.logs.slice(-count);
  }
}

// 全局错误日志实例
export const errorLogger = new ErrorLogger();

// 创建错误对象
export const createError = (
  code: string,
  message?: string,
  details?: any,
  type: ErrorType = ErrorType.UNKNOWN
): AppError => {
  const errorMessage = message || ERROR_MESSAGES[code] || '未知错误';
  
  return {
    code,
    message: errorMessage,
    details,
    type,
    timestamp: new Date(),
  };
};

// 处理网络错误
export const handleNetworkError = (error: any): AppError => {
  if (error.code === 'NETWORK_ERROR') {
    return createError(ERROR_CODES.NETWORK_UNAVAILABLE, undefined, error, ErrorType.NETWORK);
  }
  
  if (error.code === 'TIMEOUT') {
    return createError(ERROR_CODES.NETWORK_TIMEOUT, undefined, error, ErrorType.NETWORK);
  }
  
  if (error.status === 429) {
    return createError(ERROR_CODES.API_RATE_LIMIT, undefined, error, ErrorType.NETWORK);
  }
  
  if (error.status === 403) {
    return createError(ERROR_CODES.API_QUOTA_EXCEEDED, undefined, error, ErrorType.NETWORK);
  }
  
  return createError(ERROR_CODES.NETWORK_UNAVAILABLE, error.message, error, ErrorType.NETWORK);
};

// 处理翻译错误
export const handleTranslationError = (error: any): AppError => {
  if (error.code === 'UNSUPPORTED_LANGUAGE') {
    return createError(ERROR_CODES.UNSUPPORTED_LANGUAGE, undefined, error, ErrorType.TRANSLATION);
  }
  
  if (error.code === 'INVALID_TEXT') {
    return createError(ERROR_CODES.INVALID_TEXT, undefined, error, ErrorType.TRANSLATION);
  }
  
  if (error.code === 'TIMEOUT') {
    return createError(ERROR_CODES.TRANSLATION_TIMEOUT, undefined, error, ErrorType.TRANSLATION);
  }
  
  return createError(ERROR_CODES.TRANSLATION_FAILED, error.message, error, ErrorType.TRANSLATION);
};

// 处理音频错误
export const handleAudioError = (error: any): AppError => {
  if (error.code === 'PERMISSION_DENIED') {
    return createError(ERROR_CODES.AUDIO_PERMISSION_DENIED, undefined, error, ErrorType.AUDIO);
  }
  
  if (error.code === 'RECORDING_FAILED') {
    return createError(ERROR_CODES.RECORDING_FAILED, undefined, error, ErrorType.AUDIO);
  }
  
  if (error.code === 'PLAYBACK_FAILED') {
    return createError(ERROR_CODES.PLAYBACK_FAILED, undefined, error, ErrorType.AUDIO);
  }
  
  return createError(ERROR_CODES.AUDIO_DEVICE_UNAVAILABLE, error.message, error, ErrorType.AUDIO);
};

// 处理存储错误
export const handleStorageError = (error: any): AppError => {
  if (error.code === 'STORAGE_FULL') {
    return createError(ERROR_CODES.STORAGE_FULL, undefined, error, ErrorType.STORAGE);
  }
  
  if (error.code === 'PERMISSION_DENIED') {
    return createError(ERROR_CODES.STORAGE_PERMISSION_DENIED, undefined, error, ErrorType.STORAGE);
  }
  
  if (error.code === 'DATA_CORRUPTED') {
    return createError(ERROR_CODES.DATA_CORRUPTED, undefined, error, ErrorType.STORAGE);
  }
  
  return createError(ERROR_CODES.EXPORT_FAILED, error.message, error, ErrorType.STORAGE);
};

// 处理权限错误
export const handlePermissionError = (permission: string): AppError => {
  switch (permission) {
    case 'camera':
      return createError(ERROR_CODES.CAMERA_PERMISSION_DENIED, undefined, { permission }, ErrorType.PERMISSION);
    case 'microphone':
      return createError(ERROR_CODES.MICROPHONE_PERMISSION_DENIED, undefined, { permission }, ErrorType.PERMISSION);
    case 'storage':
      return createError(ERROR_CODES.STORAGE_PERMISSION_DENIED, undefined, { permission }, ErrorType.PERMISSION);
    default:
      return createError(ERROR_CODES.INVALID_INPUT, `未知权限: ${permission}`, { permission }, ErrorType.PERMISSION);
  }
};

// 处理验证错误
export const handleValidationError = (field: string, value: any): AppError => {
  switch (field) {
    case 'text':
      if (!value || value.trim().length === 0) {
        return createError(ERROR_CODES.TEXT_TOO_SHORT, undefined, { field, value }, ErrorType.VALIDATION);
      }
      if (value.length > 5000) {
        return createError(ERROR_CODES.TEXT_TOO_LONG, undefined, { field, value }, ErrorType.VALIDATION);
      }
      break;
    case 'language':
      if (!value || typeof value !== 'string') {
        return createError(ERROR_CODES.INVALID_LANGUAGE_CODE, undefined, { field, value }, ErrorType.VALIDATION);
      }
      break;
    default:
      return createError(ERROR_CODES.INVALID_INPUT, `无效的${field}`, { field, value }, ErrorType.VALIDATION);
  }
  
  return createError(ERROR_CODES.INVALID_INPUT, `验证失败: ${field}`, { field, value }, ErrorType.VALIDATION);
};

// 通用错误处理函数
export const handleError = (error: any, context?: string): AppError => {
  let appError: AppError;

  // 如果已经是AppError类型，直接返回
  if (error.code && error.message && error.type) {
    appError = error as AppError;
  } else {
    // 根据错误类型创建相应的错误
    if (error.name === 'NetworkError' || error.message?.includes('network')) {
      appError = handleNetworkError(error);
    } else if (error.name === 'TranslationError' || error.message?.includes('translation')) {
      appError = handleTranslationError(error);
    } else if (error.name === 'AudioError' || error.message?.includes('audio')) {
      appError = handleAudioError(error);
    } else if (error.name === 'StorageError' || error.message?.includes('storage')) {
      appError = handleStorageError(error);
    } else {
      appError = createError(ERROR_CODES.INVALID_INPUT, error.message || '未知错误', error);
    }
  }

  // 添加上下文信息
  if (context) {
    appError.details = { ...appError.details, context };
  }

  // 记录错误
  errorLogger.log(appError);

  return appError;
};

// 错误恢复建议
export const getErrorRecoverySuggestions = (error: AppError): string[] => {
  const suggestions: Record<string, string[]> = {
    [ERROR_CODES.NETWORK_TIMEOUT]: [
      '检查网络连接',
      '尝试切换到其他网络',
      '稍后重试',
    ],
    [ERROR_CODES.NETWORK_UNAVAILABLE]: [
      '检查网络设置',
      '确保设备已连接到网络',
      '尝试重新连接',
    ],
    [ERROR_CODES.API_RATE_LIMIT]: [
      '等待几分钟后重试',
      '减少请求频率',
    ],
    [ERROR_CODES.TRANSLATION_FAILED]: [
      '检查文本内容',
      '尝试使用其他语言',
      '稍后重试',
    ],
    [ERROR_CODES.RECORDING_FAILED]: [
      '检查麦克风权限',
      '确保麦克风未被其他应用占用',
      '重启应用',
    ],
    [ERROR_CODES.STORAGE_FULL]: [
      '清理设备存储空间',
      '删除不需要的文件',
      '卸载不常用的应用',
    ],
  };

  return suggestions[error.code] || ['请稍后重试', '如果问题持续存在，请联系技术支持'];
};

// 导出所有错误处理函数
export const ErrorHandler = {
  createError,
  handleNetworkError,
  handleTranslationError,
  handleAudioError,
  handleStorageError,
  handlePermissionError,
  handleValidationError,
  handleError,
  getErrorRecoverySuggestions,
  logger: errorLogger,
};
