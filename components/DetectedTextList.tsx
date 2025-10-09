// 检测文本列表组件 - 显示所有检测到的文字和翻译结果
import { useTheme } from '@/contexts/ThemeContext';
import { Check, Copy, RotateCcw } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DetectedText } from '../types/camera';

interface DetectedTextListProps {
  detectedTexts: DetectedText[];
  onCopyText: (text: string) => void;
  copiedText: string | null;
  isTranslating: boolean;
  onRetranslate?: (textItem: DetectedText) => void;
}

export const DetectedTextList: React.FC<DetectedTextListProps> = ({
  detectedTexts,
  onCopyText,
  copiedText,
  isTranslating,
  onRetranslate,
}) => {
  const { colors } = useTheme();

  if (detectedTexts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          未检测到文字
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          请将相机对准包含文字的区域
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          检测到的文字 ({detectedTexts.length})
        </Text>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {detectedTexts.map((textItem, index) => {
          const isCopied = copiedText === (textItem.translation || textItem.text);
          
          return (
            <View
              key={textItem.id}
              style={[styles.textItem, { backgroundColor: colors.card }]}
            >
              {/* 文字内容 */}
              <View style={styles.textContent}>
                <Text style={[styles.originalText, { color: colors.text }]}>
                  {textItem.text}
                </Text>
                
                {textItem.translation && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.translatedText, { color: colors.primary }]}>
                      {textItem.translation}
                    </Text>
                  </>
                )}
                
                {/* 置信度 */}
                <View style={styles.confidenceContainer}>
                  <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
                    置信度: {Math.round(textItem.confidence)}%
                  </Text>
                </View>
              </View>
              
              {/* 操作按钮 */}
              <View style={styles.actionButtons}>
                {/* 复制按钮 */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.surface },
                    isCopied && { backgroundColor: colors.success },
                  ]}
                  onPress={() => onCopyText(textItem.translation || textItem.text)}
                >
                  {isCopied ? (
                    <Check size={16} color="#FFFFFF" />
                  ) : (
                    <Copy size={16} color={colors.text} />
                  )}
                </TouchableOpacity>
                
                {/* 重新翻译按钮 */}
                {onRetranslate && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.surface },
                    ]}
                    onPress={() => onRetranslate(textItem)}
                    disabled={isTranslating}
                  >
                    <RotateCcw 
                      size={16} 
                      color={isTranslating ? colors.textSecondary : colors.text} 
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  textItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textContent: {
    flex: 1,
    marginBottom: 12,
  },
  originalText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  translatedText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
