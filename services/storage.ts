import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, TranslationHistoryItem, StorageData } from '@/types/global';

// 存储键名常量
const STORAGE_KEYS = {
  SETTINGS: '@hltransslater_settings',
  HISTORY: '@hltransslater_history',
  FAVORITES: '@hltransslater_favorites',
  LAST_SESSION: '@hltransslater_last_session',
} as const;

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  autoPlay: true,
  saveHistory: true,
  hapticFeedback: true,
  highQualityAudio: false,
  defaultFromLanguage: 'zh-CN',
  defaultToLanguage: 'en',
  translationEngine: 'google',
};

// 设置管理
export class SettingsService {
  // 获取设置
  static async getSettings(): Promise<AppSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        return { ...DEFAULT_SETTINGS, ...settings };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('获取设置失败:', error);
      return DEFAULT_SETTINGS;
    }
  }

  // 保存设置
  static async saveSettings(settings: Partial<AppSettings>): Promise<boolean> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      return true;
    } catch (error) {
      console.error('保存设置失败:', error);
      return false;
    }
  }

  // 重置设置
  static async resetSettings(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return true;
    } catch (error) {
      console.error('重置设置失败:', error);
      return false;
    }
  }
}

// 历史记录管理
export class HistoryService {
  // 获取历史记录
  static async getHistory(): Promise<TranslationHistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      if (historyJson) {
        const history = JSON.parse(historyJson);
        // 确保时间戳是Date对象
        return history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
      return [];
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }

  // 添加历史记录
  static async addHistoryItem(item: Omit<TranslationHistoryItem, 'id'>): Promise<boolean> {
    try {
      const history = await this.getHistory();
      const newItem: TranslationHistoryItem = {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };

      // 添加到开头
      history.unshift(newItem);

      // 限制历史记录数量（最多1000条）
      const limitedHistory = history.slice(0, 1000);

      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(limitedHistory));
      return true;
    } catch (error) {
      console.error('添加历史记录失败:', error);
      return false;
    }
  }

  // 删除历史记录
  static async deleteHistoryItem(id: string): Promise<boolean> {
    try {
      const history = await this.getHistory();
      const filteredHistory = history.filter(item => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filteredHistory));
      return true;
    } catch (error) {
      console.error('删除历史记录失败:', error);
      return false;
    }
  }

  // 清空历史记录
  static async clearHistory(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
      return true;
    } catch (error) {
      console.error('清空历史记录失败:', error);
      return false;
    }
  }

  // 搜索历史记录
  static async searchHistory(query: string): Promise<TranslationHistoryItem[]> {
    try {
      const history = await this.getHistory();
      const lowerQuery = query.toLowerCase();
      
      return history.filter(item => 
        item.originalText.toLowerCase().includes(lowerQuery) ||
        item.translatedText.toLowerCase().includes(lowerQuery) ||
        item.fromLanguage.toLowerCase().includes(lowerQuery) ||
        item.toLanguage.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('搜索历史记录失败:', error);
      return [];
    }
  }

  // 获取历史记录统计
  static async getHistoryStats(): Promise<{
    totalCount: number;
    todayCount: number;
    weekCount: number;
    monthCount: number;
  }> {
    try {
      const history = await this.getHistory();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      return {
        totalCount: history.length,
        todayCount: history.filter(item => item.timestamp >= today).length,
        weekCount: history.filter(item => item.timestamp >= weekAgo).length,
        monthCount: history.filter(item => item.timestamp >= monthAgo).length,
      };
    } catch (error) {
      console.error('获取历史统计失败:', error);
      return { totalCount: 0, todayCount: 0, weekCount: 0, monthCount: 0 };
    }
  }
}

// 收藏管理
export class FavoritesService {
  // 获取收藏列表
  static async getFavorites(): Promise<string[]> {
    try {
      const favoritesJson = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return favoritesJson ? JSON.parse(favoritesJson) : [];
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      return [];
    }
  }

  // 添加收藏
  static async addFavorite(id: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      if (!favorites.includes(id)) {
        favorites.push(id);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      }
      return true;
    } catch (error) {
      console.error('添加收藏失败:', error);
      return false;
    }
  }

  // 移除收藏
  static async removeFavorite(id: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const filteredFavorites = favorites.filter(favId => favId !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filteredFavorites));
      return true;
    } catch (error) {
      console.error('移除收藏失败:', error);
      return false;
    }
  }

  // 检查是否已收藏
  static async isFavorite(id: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.includes(id);
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      return false;
    }
  }
}

// 会话管理
export class SessionService {
  // 保存会话数据
  static async saveSession(data: {
    currentText?: string;
    fromLanguage?: string;
    toLanguage?: string;
    translationMode?: string;
  }): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SESSION, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('保存会话数据失败:', error);
      return false;
    }
  }

  // 获取会话数据
  static async getSession(): Promise<any> {
    try {
      const sessionJson = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SESSION);
      return sessionJson ? JSON.parse(sessionJson) : null;
    } catch (error) {
      console.error('获取会话数据失败:', error);
      return null;
    }
  }

  // 清除会话数据
  static async clearSession(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SESSION);
      return true;
    } catch (error) {
      console.error('清除会话数据失败:', error);
      return false;
    }
  }
}

// 数据导出/导入
export class DataService {
  // 导出所有数据
  static async exportData(): Promise<StorageData | null> {
    try {
      const [settings, history, favorites] = await Promise.all([
        SettingsService.getSettings(),
        HistoryService.getHistory(),
        FavoritesService.getFavorites(),
      ]);

      return {
        settings,
        history,
        favorites,
      };
    } catch (error) {
      console.error('导出数据失败:', error);
      return null;
    }
  }

  // 导入数据
  static async importData(data: StorageData): Promise<boolean> {
    try {
      await Promise.all([
        SettingsService.saveSettings(data.settings),
        AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history)),
        AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(data.favorites)),
      ]);
      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      return false;
    }
  }

  // 清除所有数据
  static async clearAllData(): Promise<boolean> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.removeItem(STORAGE_KEYS.HISTORY),
        AsyncStorage.removeItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SESSION),
      ]);
      return true;
    } catch (error) {
      console.error('清除所有数据失败:', error);
      return false;
    }
  }
}
