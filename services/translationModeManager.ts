// 翻译模式管理器 - 自动检测网络状态并切换翻译模式
// ✅ 已修复语言码兼容性问题
import { isOfflineTranslationSupported, LANGUAGE_PACK_STORAGE_KEY, TranslationMode, mapToMlKitLangCode } from '@/utils/mlKitLanguageMapper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';

interface TranslationModeState {
  mode: TranslationMode; // 用户设置模式
  isOnline: boolean;     // 当前网络状态
  actualMode: 'online' | 'offline'; // 实际使用的模式
  downloadedLanguagePacks: string[];
}

class TranslationModeManager {
  private currentMode: TranslationMode = 'auto';
  private isOnline: boolean = true;
  private listeners: Array<(state: TranslationModeState) => void> = [];
  private downloadedLanguagePacks: string[] = [];
  private netUnsubscribe?: NetInfoSubscription;

  // 初始化（外部必须调用一次）
  async init() {
    this.setupNetworkListener();
    await this.loadSavedMode();
    await this.loadDownloadedLanguagePacks();
    this.notifyListeners();
  }

  // 销毁（释放监听器）
  destroy() {
    this.netUnsubscribe?.();
    this.listeners = [];
  }

  // 设置网络监听
  private setupNetworkListener() {
    this.netUnsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      console.log(`🌐 网络状态变化: ${wasOnline ? '在线' : '离线'} → ${this.isOnline ? '在线' : '离线'}`);

      if (this.currentMode === 'auto') {
        this.autoSwitchMode();
      }

      this.notifyListeners();
    });
  }

  // 自动切换模式（仅提示 + 通知，不改 currentMode）
  private autoSwitchMode() {
    const newMode = this.isOnline ? 'online' : 'offline';
    console.log(`🔄 自动切换到 ${newMode} 模式`);
    this.notifyListeners();
  }

  // 设置翻译模式
  async setMode(mode: TranslationMode) {
    this.currentMode = mode;
    await this.saveMode(mode);

    if (mode === 'auto') {
      this.autoSwitchMode();
    }

    this.notifyListeners();
    console.log(`📱 翻译模式设置为: ${mode}`);
  }

  // 获取用户设置的模式
  getCurrentMode(): TranslationMode {
    return this.currentMode;
  }

  // 获取实际使用的模式
  getActualMode(): 'online' | 'offline' {
    if (this.currentMode === 'auto') {
      return this.isOnline ? 'online' : 'offline';
    }
    return this.currentMode as 'online' | 'offline';
  }

  // 检查是否可以翻译
  async canTranslate(fromLang: string, toLang: string): Promise<{
    canTranslate: boolean;
    mode: 'online' | 'offline';
    reason?: string;
  }> {
    const actualMode = this.getActualMode();

    if (actualMode === 'online') {
      return { canTranslate: true, mode: 'online' };
    }

    // 离线模式检查
    if (!isOfflineTranslationSupported(fromLang, toLang)) {
      return {
        canTranslate: false,
        mode: 'offline',
        reason: '该语言对不支持离线翻译',
      };
    }

    // ✅ 转换为 ML Kit 语言码检查
    const mlKitFromLang = mapToMlKitLangCode(fromLang);
    const mlKitToLang = mapToMlKitLangCode(toLang);
    
    // ✅ 兼容检查：同时支持旧格式(zh-CN)和新格式(zh)
    const hasTargetPack = this.downloadedLanguagePacks.includes(mlKitToLang) || 
                          this.downloadedLanguagePacks.includes(toLang);

    console.log(`🔍 离线翻译检查: ${fromLang}(${mlKitFromLang}) → ${toLang}(${mlKitToLang}) (${hasTargetPack ? '已下载' : '未下载'})`);
    console.log(`📦 已下载语言包:`, this.downloadedLanguagePacks);

    if (!hasTargetPack) {
      return {
        canTranslate: false,
        mode: 'offline',
        reason: '目标语言包未下载',
      };
    }

    return { canTranslate: true, mode: 'offline' };
  }

  // 添加已下载语言包
  async addDownloadedLanguagePack(languageCode: string) {
    if (!this.downloadedLanguagePacks.includes(languageCode)) {
      this.downloadedLanguagePacks.push(languageCode);
      await this.saveDownloadedLanguagePacks();
      this.notifyListeners();
      console.log(`✅ 语言包已添加: ${languageCode}`);
    }
  }

  // 移除已下载语言包
  async removeDownloadedLanguagePack(languageCode: string) {
    const index = this.downloadedLanguagePacks.indexOf(languageCode);
    if (index > -1) {
      this.downloadedLanguagePacks.splice(index, 1);
      await this.saveDownloadedLanguagePacks();
      this.notifyListeners();
      console.log(`❌ 语言包已移除: ${languageCode}`);
    }
  }

  // 获取已下载语言包列表
  getDownloadedLanguagePacks(): string[] {
    return [...this.downloadedLanguagePacks];
  }

  // 获取当前状态
  getCurrentState(): TranslationModeState {
    return {
      mode: this.currentMode,
      isOnline: this.isOnline,
      actualMode: this.getActualMode(),
      downloadedLanguagePacks: [...this.downloadedLanguagePacks],
    };
  }

  // 添加状态监听器
  addListener(listener: (state: TranslationModeState) => void) {
    this.listeners.push(listener);
    listener(this.getCurrentState()); // 立即触发一次
  }

  // 移除监听器
  removeListener(listener: (state: TranslationModeState) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知所有监听器
  private notifyListeners() {
    const state = this.getCurrentState();
    this.listeners.forEach(listener => listener(state));
  }

  // 保存模式
  private async saveMode(mode: TranslationMode) {
    try {
      await AsyncStorage.setItem('translationMode', mode);
    } catch (error) {
      console.warn('⚠️ 保存翻译模式失败:', error);
    }
  }

  // 加载模式
  private async loadSavedMode() {
    try {
      const savedMode = await AsyncStorage.getItem('translationMode');
      if (savedMode && ['online', 'offline', 'auto'].includes(savedMode)) {
        this.currentMode = savedMode as TranslationMode;
        console.log(`📱 加载保存的翻译模式: ${savedMode}`);
      }
    } catch (error) {
      console.warn('⚠️ 加载翻译模式失败:', error);
    }
  }

  // 保存语言包列表
  private async saveDownloadedLanguagePacks() {
    try {
      await AsyncStorage.setItem(LANGUAGE_PACK_STORAGE_KEY, JSON.stringify(this.downloadedLanguagePacks));
    } catch (error) {
      console.warn('⚠️ 保存语言包列表失败:', error);
    }
  }

  // 加载语言包列表
  private async loadDownloadedLanguagePacks() {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_PACK_STORAGE_KEY);
      if (saved) {
        this.downloadedLanguagePacks = JSON.parse(saved);
        console.log(`📱 加载已下载的语言包: ${this.downloadedLanguagePacks.join(', ')}`);
      }
    } catch (error) {
      console.warn('⚠️ 加载语言包列表失败:', error);
    }
  }

  // 设置网络状态（测试用）
  setNetworkStatus(isOnline: boolean) {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;
    console.log(`🧪 手动设置网络状态: ${wasOnline ? '在线' : '离线'} → ${this.isOnline ? '在线' : '离线'}`);
    
    if (this.currentMode === 'auto') {
      this.autoSwitchMode();
    }
    
    this.notifyListeners();
  }

  // 强制设置为离线模式（测试用）
  forceOfflineMode() {
    this.isOnline = false;
    // 不要修改 currentMode，只修改网络状态
    console.log('🧪 强制设置为离线模式（仅修改网络状态）');
    this.notifyListeners();
  }
}

export const translationModeManager = new TranslationModeManager();