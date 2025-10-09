// 增强版 TextOverlay.tsx
import { DetectedText } from '@/types/camera';
import React from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TextOverlayProps {
  detectedTexts: DetectedText[];
  isProcessing: boolean;
  overlayStyle: 'replace' | 'highlight';
  isUsingRealOCR: boolean;
  lastError?: string | null;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  detectedTexts,
  isProcessing,
  overlayStyle,
  isUsingRealOCR,
  lastError,
}) => {
  // 🎯 显示处理状态
  if (isProcessing) {
    return (
      <View style={styles.container} pointerEvents="none">
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>正在识别图片中的文字...</Text>
          <Text style={styles.processingSubtext}>使用云 OCR 服务</Text>
        </View>
      </View>
    );
  }

  // 🎯 显示错误信息
  if (lastError && detectedTexts.length === 0) {
    return (
      <View style={styles.container} pointerEvents="none">
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>❌ OCR 服务暂时不可用</Text>
          <Text style={styles.errorText}>{lastError}</Text>
          <Text style={styles.errorHint}>请检查网络连接后重试</Text>
        </View>
      </View>
    );
  }

  // 🎯 显示指引信息
  if (detectedTexts.length === 0) {
    return (
      <View style={styles.container} pointerEvents="none">
        <View style={styles.instructionOverlay}>
          <Text style={styles.instructionTitle}>📷 相机翻译</Text>
          <Text style={styles.instructionText}>对准文字拍照进行实时翻译</Text>
          <Text style={styles.instructionSubtext}>支持书籍、标牌、文档等文字</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {/* OCR 来源状态指示器 */}
      <View style={[
        styles.statusIndicator,
        isUsingRealOCR ? styles.realOCRIndicator : styles.fallbackIndicator
      ]}>
        <Text style={styles.statusText}>
          {isUsingRealOCR ? '☁️ 云 OCR - 真实文字' : '📱 演示数据'}
        </Text>
      </View>
      
      {/* 文字覆盖层 */}
      {detectedTexts.map((text) => (
        <View
          key={text.id}
          style={[
            styles.textOverlay,
            {
              left: text.bbox.x0,
              top: text.bbox.y0,
              width: Math.max(120, text.bbox.x1 - text.bbox.x0),
              height: Math.max(35, text.bbox.y1 - text.bbox.y0),
              backgroundColor: isUsingRealOCR 
                ? 'rgba(0, 0, 0, 0.85)' 
                : 'rgba(245, 158, 11, 0.9)',
              borderColor: isUsingRealOCR ? '#10B981' : '#F59E0B',
              borderWidth: 2,
            },
          ]}
        >
          <Text style={[
            styles.overlayText,
            !isUsingRealOCR && styles.fallbackText
          ]}>
            {text.translatedText || text.text}
          </Text>
          {!isUsingRealOCR && text.text.includes('演示数据') && (
            <Text style={styles.demoHint}>演示版本</Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  processingOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 280,
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  processingSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 300,
  },
  errorTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  errorHint: {
    color: 'white',
    fontSize: 12,
    fontStyle: 'italic',
  },
  instructionOverlay: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 280,
  },
  instructionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  realOCRIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderColor: '#10B981',
  },
  fallbackIndicator: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    borderColor: '#F59E0B',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  textOverlay: {
    position: 'absolute',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  overlayText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  fallbackText: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  demoHint: {
    color: '#374151',
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
