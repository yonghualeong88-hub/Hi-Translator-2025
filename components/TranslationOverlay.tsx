// 翻译覆盖层组件 - 在相机画面上显示翻译结果
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { TranslationOverlay as TranslationOverlayType } from '../types/camera';

interface TranslationOverlayProps {
  overlays: TranslationOverlayType[];
  enableSmartMode?: boolean; // 是否启用智能模式
  maxOverlays?: number; // 最大显示数量
}

export const TranslationOverlay: React.FC<TranslationOverlayProps> = ({
  overlays,
  enableSmartMode = false,
  maxOverlays = 10,
}) => {
  const { colors } = useTheme();

  if (overlays.length === 0) {
    return null;
  }

  // 🎯 智能模式：限制显示数量
  const displayOverlays = enableSmartMode && overlays.length > maxOverlays 
    ? overlays.slice(0, maxOverlays)
    : overlays;

  return (
    // 🎯 参考Flutter的Stack Text Overlay结构
    <View style={styles.container} pointerEvents="box-none">
      {displayOverlays.map((overlay) => {
        // 🎯 智能字体大小计算 - 更精确的匹配
        const baseFontSize = overlay.fontSize || overlay.position.height * 0.8;
        const textLength = overlay.translatedText.length;
        const widthBasedFontSize = overlay.position.width / (textLength * 0.5);
        
        // 🎯 根据文本长度和位置大小动态调整
        let fontSize;
        if (textLength <= 10) {
          // 短文本：使用较大字体
          fontSize = Math.min(baseFontSize, overlay.position.height * 0.9);
        } else if (textLength <= 20) {
          // 中等文本：平衡字体大小
          fontSize = Math.min(baseFontSize, widthBasedFontSize);
        } else {
          // 长文本：使用较小字体确保完整显示
          fontSize = Math.max(8, Math.min(baseFontSize * 0.8, widthBasedFontSize));
        }
        
        // 🎯 确保字体大小在合理范围内
        fontSize = Math.max(8, Math.min(fontSize, overlay.position.height * 0.95));
        
        // console.log('🎨 渲染TextOverlay:', {
        //   text: overlay.originalText,
        //   translatedText: overlay.translatedText,
        //   position: overlay.position,
        //   baseFontSize: baseFontSize,
        //   widthBasedFontSize: widthBasedFontSize,
        //   finalFontSize: fontSize,
        //   ocrFontSize: overlay.fontSize
        // });
        
        return (
          <View
            key={overlay.id}
            style={[
              styles.overlayContainer,
              {
                left: overlay.position.x,
                top: overlay.position.y,
                // 🎯 完全匹配原文字的宽度和高度
                width: overlay.position.width,
                height: overlay.position.height,
                // 🎯 调试：显示红色边框
                borderWidth: __DEV__ ? 2 : 0,
                borderColor: __DEV__ ? 'red' : 'transparent',
              },
            ]}
            pointerEvents="none"
          >
            {/* 🎯 真正的文字替换效果 - 完全遮盖原文字 */}
            <View style={styles.textReplacementContainer}>
              {/* 背景遮罩 - 完全覆盖原文，支持主题适配 */}
              <View style={[
                styles.backgroundMask,
                { 
                  backgroundColor: colors.surface || 'rgba(0, 0, 0, 0.7)',
                  // 🎯 确保完全覆盖原文
                  width: '100%',
                  height: '100%',
                }
              ]} />
              
              {/* 翻译文字 - 智能字体大小和自适应换行 */}
              <Text 
                style={[
                  styles.replacementText,
                  { 
                    fontSize: fontSize,
                    maxWidth: overlay.position.width - 4,
                    // 🎯 确保文本居中显示
                    textAlign: 'center',
                    lineHeight: fontSize * 1.2,
                  }
                ]}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.4}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {overlay.translatedText}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // 🎯 参考Android的FrameLayout和iOS的CALayer overlay容器
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // 确保覆盖层在相机预览之上
    zIndex: 1000,
    // Android 层级支持
    ...(Platform.OS === 'android' && { elevation: 10 }),
  },
  // 🎯 参考Android的TextView和iOS的CATextLayer定位
  overlayContainer: {
    position: 'absolute',
    // 确保每个覆盖层都在最上层
    zIndex: 1001,
    // Android 层级支持
    ...(Platform.OS === 'android' && { elevation: 11 }),
  },
  // 🎯 文字替换容器 - 自适应尺寸
  textReplacementContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  // 🎯 背景遮罩 - 完全覆盖原文
  backgroundMask: {
    position: 'absolute',
    top: 0, // 完全覆盖
    left: 0,
    right: 0,
    bottom: 0, // 完全覆盖
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // 提高不透明度，确保完全遮盖
    borderRadius: 2, // 减少圆角，更贴合文字
    // 添加轻微的内阴影，增强遮盖效果
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  // 🎯 替换文字 - 优化的字体和阴影
  replacementText: {
    fontWeight: '600', // 稍微减轻字重，更清晰
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 2, // 减少内边距，更贴合
    paddingVertical: 1,
    
    // 增强的文字阴影确保可读性
    textShadowColor: 'rgba(0, 0, 0, 1)', // 完全黑色阴影
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    
    // 字体优化
    includeFontPadding: false,
    lineHeight: undefined, // 让系统自动计算行高
    
    // 支持多行显示
    flexWrap: 'wrap',
    
    // 🎯 确保文字清晰可读
    letterSpacing: 0.5,
  },
});
