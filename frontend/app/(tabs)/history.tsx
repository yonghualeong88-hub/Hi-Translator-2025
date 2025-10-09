import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Volume2, Copy, Trash2, Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';

interface HistoryItem {
  id: string;
  originalText: string;
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  timestamp: Date;
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [history] = useState<HistoryItem[]>([
    {
      id: '1',
      originalText: '你好，今天天气很好，适合出门散步。',
      translatedText: 'Hello, the weather is nice today, perfect for a walk.',
      fromLanguage: '中文',
      toLanguage: 'English',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      originalText: 'How are you doing today?',
      translatedText: '你今天怎么样？',
      fromLanguage: 'English',
      toLanguage: '中文',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      originalText: '我想去餐厅吃晚饭。',
      translatedText: 'I want to go to a restaurant for dinner.',
      fromLanguage: '中文',
      toLanguage: 'English',
      timestamp: new Date(Date.now() - 10800000),
    },
  ]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}${t('history.daysAgo', '天前')}`;
    } else if (diffHours > 0) {
      return `${diffHours}${t('history.hoursAgo', '小时前')}`;
    } else {
      return t('history.justNow', '刚刚');
    }
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View style={[styles.historyItem, { backgroundColor: colors.card }]}>
      <View style={styles.itemHeader}>
        <View style={styles.languagePair}>
          <Text style={[styles.languageText, { color: colors.primary }]}>
            {item.fromLanguage} → {item.toLanguage}
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <Clock size={12} color={colors.textSecondary} />
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>

      <View style={styles.textSection}>
        <Text style={[styles.originalText, { color: colors.textSecondary }]}>{item.originalText}</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.translatedText, { color: colors.text }]}>{item.translatedText}</Text>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton}>
          <Volume2 size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Copy size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Trash2 size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('history.title', '翻译历史')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('history.subtitle', '查看您的翻译记录')}</Text>
      </View>

      {history.length > 0 ? (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Platform.OS === 'android' ? 100 + insets.bottom : 20 }
          ]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('history.empty', '暂无翻译历史')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {t('history.emptyDescription', '开始使用语音翻译功能，您的翻译记录将显示在这里')}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  historyItem: {
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});