// 智能翻译覆盖层组件 - 解决文章翻译拥挤问题
import { useTheme } from '@/contexts/ThemeContext';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TranslationOverlay as TranslationOverlayType } from '../types/camera';

interface SmartTranslationOverlayProps {
  overlays: TranslationOverlayType[];
  enableSmartMerge?: boolean; // 是否启用智能合并
  enableDensityAdjustment?: boolean; // 是否启用密度调整
  maxOverlaysPerScreen?: number; // 每屏最大覆盖层数量
}

export const SmartTranslationOverlay: React.FC<SmartTranslationOverlayProps> = ({
  overlays,
  enableSmartMerge = true,
  enableDensityAdjustment = true,
  maxOverlaysPerScreen = 8,
}) => {
  const { colors } = useTheme();
  const [optimizedOverlays, setOptimizedOverlays] = useState<TranslationOverlayType[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [screenSize, setScreenSize] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenSize(window);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    let processed = [...overlays];

    // 1. 智能合并相邻文本（暂时禁用）
    // if (enableSmartMerge && overlays.length > 3) {
    //   processed = optimizeTextOverlays(processed);
    // }

    // 2. 密度调整（暂时禁用）
    // if (enableDensityAdjustment) {
    //   processed = adjustOverlaySpacing(processed);
    // }

    // 3. 限制显示数量
    if (processed.length > maxOverlaysPerScreen && !showAll) {
      // 按重要性排序（文本长度、位置等）
      processed = processed
        .sort((a, b) => {
          const scoreA = a.translatedText.length + (a.position.width * a.position.height);
          const scoreB = b.translatedText.length + (b.position.width * b.position.height);
          return scoreB - scoreA;
        })
        .slice(0, maxOverlaysPerScreen);
    }

    setOptimizedOverlays(processed);
  }, [overlays, enableSmartMerge, enableDensityAdjustment, maxOverlaysPerScreen, showAll]);

  if (optimizedOverlays.length === 0) {
    return null;
  }

  const hasMoreOverlays = overlays.length > maxOverlaysPerScreen && !showAll;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {optimizedOverlays.map((overlay) => {
        // 🎯 智能字体大小计算
        const baseFontSize = overlay.fontSize || overlay.position.height * 0.75;
        const widthBasedFontSize = overlay.position.width / (overlay.translatedText.length * 0.6);
        const fontSize = Math.min(
          Math.max(10, baseFontSize), // 降低最小字体大小
          Math.max(8, widthBasedFontSize)
        );
        
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
                // 🎯 调试：显示不同颜色的边框
                borderWidth: __DEV__ ? 2 : 0,
                borderColor: __DEV__ ? (overlay.id.startsWith('merged_') ? 'blue' : 'red') : 'transparent',
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.textReplacementContainer}>
              {/* 背景遮罩 - 更贴合文字 */}
              <View style={[
                styles.backgroundMask,
                { backgroundColor: colors.surface || 'rgba(0, 0, 0, 0.4)' }
              ]} />
              
              {/* 翻译文字 - 支持多行 */}
              <Text 
                style={[
                  styles.replacementText,
                  { 
                    fontSize: fontSize,
                    maxWidth: overlay.position.width - 8,
                  }
                ]}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.4} // 允许更小的字体
                numberOfLines={3} // 支持更多行
              >
                {overlay.translatedText}
              </Text>
            </View>
          </View>
        );
      })}

      {/* 显示更多按钮 */}
      {hasMoreOverlays && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(true)}
        >
          <Text style={styles.showMoreText}>
            显示更多翻译 ({overlays.length - maxOverlaysPerScreen} 个)
          </Text>
        </TouchableOpacity>
      )}

      {/* 折叠按钮 */}
      {showAll && hasMoreOverlays && (
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={() => setShowAll(false)}
        >
          <Text style={styles.collapseText}>折叠</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    ...(Platform.OS === 'android' && { elevation: 10 }),
  },
  overlayContainer: {
    position: 'absolute',
    zIndex: 1001,
    ...(Platform.OS === 'android' && { elevation: 11 }),
  },
  textReplacementContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backgroundMask: {
    position: 'absolute',
    top: 1, // 进一步减少边距
    left: 0,
    right: 0,
    bottom: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 3, // 更小的圆角
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  replacementText: {
    fontWeight: '600', // 稍微减轻字重
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 3, // 减少内边距
    paddingVertical: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    includeFontPadding: false,
    lineHeight: undefined,
    flexWrap: 'wrap',
  },
  showMoreButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1002,
  },
  showMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  collapseButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1002,
  },
  collapseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
