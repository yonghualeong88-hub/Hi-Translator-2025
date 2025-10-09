import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Clock, Copy, Trash2 } from 'lucide-react-native';
import SpeakButton from './SpeakButton';

/**
 * 翻译历史记录项接口
 */
interface TranslationItem {
  id: string;
  source: string;
  target: string;
  fromLanguage: string;
  toLanguage: string;
  timestamp: Date;
  confidence: number;
  buttonColor: 'cyan' | 'pink';
  recordedLanguage: string;
}

/**
 * 翻译历史组件属性接口
 * 
 * @param translationHistory - 翻译历史记录数组
 * @param colors - 主题颜色配置
 * @param playingItemId - 当前播放的项目ID
 * @param onPlayTranslation - 播放翻译音频回调
 * @param onCopyToClipboard - 复制到剪贴板回调
 * @param onDeleteTranslation - 删除翻译记录回调
 * @param getLanguageName - 获取语言名称函数
 * @param formatTime - 格式化时间函数
 */
interface TranslationHistoryProps {
  translationHistory: TranslationItem[];
  colors: any;
  playingItemId: string | null;
  onPlayTranslation: (text: string, language: string, itemId: string) => void;
  onCopyToClipboard: (text: string) => void;
  onDeleteTranslation: (id: string) => void;
  getLanguageName: (code: string) => string;
  formatTime: (timestamp: Date) => string;
}

export default function TranslationHistory({
  translationHistory,
  colors,
  playingItemId,
  onPlayTranslation,
  onCopyToClipboard,
  onDeleteTranslation,
  getLanguageName,
  formatTime,
}: TranslationHistoryProps) {
  if (translationHistory.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          请点击底部录音按钮进行翻译
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {translationHistory.map((item) => {
        // 原文使用第一个语音按钮颜色，翻译结果使用第二个语音按钮颜色
        const originalColor = item.buttonColor === 'cyan' ? colors.voiceButton1 : colors.voiceButton2;
        const translatedColor = item.buttonColor === 'cyan' ? colors.voiceButton2 : colors.voiceButton1;
        
        return (
          <View key={item.id} style={[styles.translationCard, { backgroundColor: colors.card }]}>
            <View style={styles.itemHeader}>
              <View style={styles.languagePair}>
                <Text style={[styles.languageText, { color: originalColor }]}>
                  {getLanguageName(item.fromLanguage)}
                </Text>
                <Text style={[styles.languageText, { color: colors.textSecondary }]}> → </Text>
                <Text style={[styles.languageText, { color: translatedColor }]}>
                  {getLanguageName(item.toLanguage)}
                </Text>
              </View>
              <View style={styles.timeContainer}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            </View>

            <View style={styles.textSection}>
              <Text style={[styles.originalText, { color: originalColor }]}>
                {item.source}
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.translatedText, { color: translatedColor }]}>
                {item.target}
              </Text>
            </View>

            <View style={styles.actionBar}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onPlayTranslation(item.target, item.toLanguage, item.id)}
              >
                <SpeakButton
                  isSpeaking={playingItemId === item.id}
                  size={18}
                  color={translatedColor}
                  activeColor={translatedColor}
                  disabled={false}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onCopyToClipboard(item.target)}
              >
                <Copy size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onDeleteTranslation(item.id)}
              >
                <Trash2 size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150, // 增加滚动范围，为底部导航栏预留更多空间
  },
  translationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  languagePair: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
  },
  textSection: {
    marginBottom: 12,
  },
  originalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  translatedText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
});
