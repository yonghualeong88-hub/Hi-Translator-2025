// 语言包管理页面
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { languagePackManager } from "@/services/languagePackManager";
import { LanguagePackInfo } from '@/utils/mlKitLanguageMapper';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LanguagePacksScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [packs, setPacks] = useState<LanguagePackInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState<number>(0);
  const [downloadedCount, setDownloadedCount] = useState<number>(0);

  // 加载语言包列表
  const loadPacks = async () => {
    setLoading(true);
    try {
      const available = await languagePackManager.getAvailableLanguagePacks();
      setPacks(available);
      
      // 计算已下载语言包的总大小和数量
      const downloadedSize = await languagePackManager.getDownloadedLanguagePacksSize();
      const downloadedPacks = available.filter(pack => pack.isDownloaded);
      setTotalSize(downloadedSize);
      setDownloadedCount(downloadedPacks.length);
      
      // 测试验证：打印每个语言包的下载状态
      console.log('📦 语言包状态检查结果:');
      for (const pack of available) {
        console.log(`  ${pack.languageCode} (${pack.languageName}): ${pack.isDownloaded ? '✅ 已下载' : '⬇️ 未下载'}`);
      }
    } catch (error) {
      console.error('加载语言包列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacks();
  }, []);

  // 点击下载
  const handleDownload = async (code: string) => {
    setDownloading(code);
    try {
      await languagePackManager.downloadLanguagePack(code, (progress) => {
        console.log(`${code} 下载进度: ${progress}%`);
      });
      
      // 下载成功后立即更新UI状态
      setPacks(prevPacks => 
        prevPacks.map(pack => 
          pack.languageCode === code 
            ? { ...pack, isDownloaded: true }
            : pack
        )
      );
      
      // 重新计算总大小和数量
      const downloadedSize = await languagePackManager.getDownloadedLanguagePacksSize();
      setTotalSize(downloadedSize);
      
      // 使用更新后的packs状态计算数量
      const updatedPacks = packs.map(pack => 
        pack.languageCode === code 
          ? { ...pack, isDownloaded: true }
          : pack
      );
      const downloadedPacks = updatedPacks.filter(pack => pack.isDownloaded);
      setDownloadedCount(downloadedPacks.length);
      
      console.log(`✅ ${code} 语言包下载完成，UI已更新`);
    } catch (e) {
      console.error("下载失败:", e);
    } finally {
      setDownloading(null);
    }
  };

  // 点击删除
  const handleRemove = async (code: string) => {
    setDownloading(code);
    try {
      await languagePackManager.removeLanguagePack(code);
      
      // 删除成功后立即更新UI状态
      setPacks(prevPacks => 
        prevPacks.map(pack => 
          pack.languageCode === code 
            ? { ...pack, isDownloaded: false }
            : pack
        )
      );
      
      // 重新计算总大小和数量
      const downloadedSize = await languagePackManager.getDownloadedLanguagePacksSize();
      setTotalSize(downloadedSize);
      
      // 使用更新后的packs状态计算数量
      const updatedPacks = packs.map(pack => 
        pack.languageCode === code 
          ? { ...pack, isDownloaded: false }
          : pack
      );
      const downloadedPacks = updatedPacks.filter(pack => pack.isDownloaded);
      setDownloadedCount(downloadedPacks.length);
      
      console.log(`🗑️ ${code} 语言包删除完成，UI已更新`);
    } catch (e) {
      console.error("删除失败:", e);
    } finally {
      setDownloading(null);
    }
  };

  const renderItem = ({ item }: { item: LanguagePackInfo }) => {
    const { languageCode, languageName, isDownloaded, size } = item;

    return (
      <View style={[styles.itemContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.itemInfo}>
          <Text style={[styles.languageName, { color: colors.text }]}>{languageName}</Text>
          <Text style={[styles.languageCode, { color: colors.textSecondary }]}>({languageCode})</Text>
          <Text style={[styles.sizeInfo, { color: colors.textSecondary }]}>{size} MB</Text>
          <Text style={[styles.statusText, { 
            color: isDownloaded ? '#4CAF50' : '#FF9800'
          }]}>
            {isDownloaded ? `✅ ${t('languagePacks.downloaded', '已下载')}` : t('languagePacks.notDownloaded', '未下载')}
          </Text>
        </View>

        <View style={styles.itemActions}>
          {downloading === languageCode ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isDownloaded ? (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={() => handleRemove(languageCode)}
            >
              <Text style={styles.buttonText}>{t('languagePacks.delete', '删除')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleDownload(languageCode)}
            >
              <Text style={styles.buttonText}>{t('languagePacks.download', '下载')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading', '加载中')}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部 */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('languagePacks.title', '语言包管理')}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t('languagePacks.storageUsed', '已使用存储')}: {totalSize} MB ({t('languagePacks.downloadedCount', '已下载')} {downloadedCount} {t('languagePacks.packs', '个语言包')}){' '}
            </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={packs}
        keyExtractor={(item) => item.languageCode}
        renderItem={renderItem}
        style={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageCode: {
    fontSize: 14,
    marginTop: 2,
  },
  sizeInfo: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  itemActions: {
    marginLeft: 16,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});