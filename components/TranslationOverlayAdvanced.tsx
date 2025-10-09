// 进阶版翻译覆盖层组件 - 支持模糊背景和动画效果
import { useTheme } from '@/contexts/ThemeContext';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { TranslationOverlay as TranslationOverlayType } from '../types/camera';

interface TranslationOverlayAdvancedProps {
  overlays: TranslationOverlayType[];
  enableBlur?: boolean; // 是否启用模糊背景
  enableAnimation?: boolean; // 是否启用淡入动画
}

export const TranslationOverlayAdvanced: React.FC<TranslationOverlayAdvancedProps> = ({
  overlays,
  enableBlur = false,
  enableAnimation = true,
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 淡入动画
  useEffect(() => {
    if (enableAnimation && overlays.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [overlays.length, enableAnimation, fadeAnim]);

  if (overlays.length === 0) {
    return null;
  }

  const OverlayComponent = enableAnimation ? Animated.View : View;

  return (
    <OverlayComponent 
      style={[
        styles.container,
        enableAnimation && { opacity: fadeAnim }
      ]} 
      pointerEvents="box-none"
    >
      {overlays.map((overlay) => {
        // 🎯 智能字体大小计算 - 结合高度和宽度
        const baseFontSize = overlay.fontSize || overlay.position.height * 0.75;
        const widthBasedFontSize = overlay.position.width / (overlay.translatedText.length * 0.6);
        const fontSize = Math.min(
          Math.max(12, baseFontSize), // 最小12px，最大为OCR计算的大小
          Math.max(8, widthBasedFontSize) // 根据宽度调整，最小8px
        );
        
        // console.log('🎨 渲染高级TextOverlay:', {
        //   text: overlay.originalText,
        //   translatedText: overlay.translatedText,
        //   position: overlay.position,
        //   baseFontSize: baseFontSize,
        //   widthBasedFontSize: widthBasedFontSize,
        //   finalFontSize: fontSize,
        //   enableBlur,
        //   enableAnimation
        // });
        
        return (
          <View
            key={overlay.id}
            style={[
              styles.overlayContainer,
              {
                left: overlay.position.x,
                top: overlay.position.y,
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
              {/* 背景遮罩 - 支持模糊效果 */}
              {enableBlur ? (
                // 模糊背景 (需要安装 expo-blur)
                <View style={[styles.backgroundMask, styles.blurBackground]} />
              ) : (
                // 普通背景遮罩
                <View style={[
                  styles.backgroundMask,
                  { backgroundColor: colors.surface || 'rgba(0, 0, 0, 0.4)' }
                ]} />
              )}
              
              {/* 翻译文字 - 智能字体大小和自适应换行 */}
              <Text 
                style={[
                  styles.replacementText,
                  { 
                    fontSize: fontSize,
                    maxWidth: overlay.position.width - 8, // 避免超出边界
                  }
                ]}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.5}
                numberOfLines={2}
              >
                {overlay.translatedText}
              </Text>
            </View>
          </View>
        );
      })}
    </OverlayComponent>
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
  // 🎯 背景遮罩 - 更贴合文字的高度
  backgroundMask: {
    position: 'absolute',
    top: 2, // 减少顶部边距
    left: 0,
    right: 0,
    bottom: 2, // 减少底部边距
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 降低不透明度，更自然
    borderRadius: 4,
    // 添加轻微的内阴影，增强遮盖效果
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  // 🎯 模糊背景样式 (需要 expo-blur)
  blurBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // 半透明白色
    // 注意：实际的模糊效果需要在 BlurView 组件中实现
    // 这里只是样式占位
  },
  // 🎯 替换文字 - 优化的字体和阴影
  replacementText: {
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    
    // 增强的文字阴影确保可读性
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    
    // 字体优化
    includeFontPadding: false,
    lineHeight: undefined, // 让系统自动计算行高
    
    // 支持多行显示
    flexWrap: 'wrap',
  },
});

// 使用示例：
// <TranslationOverlayAdvanced 
//   overlays={detectedTexts} 
//   enableBlur={true} 
//   enableAnimation={true} 
// />
