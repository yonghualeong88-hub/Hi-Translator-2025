// 迁移语言包数据：zh-CN → zh（适配 ML Kit 格式）
// 在手机上通过 React Native Debugger 或开发者菜单执行

const migrateLanguageCodes = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    
    console.log('🔄 开始迁移语言包数据...');
    
    // 读取当前存储的语言包
    const stored = await AsyncStorage.getItem('downloaded_language_packs');
    console.log('📦 旧数据:', stored);
    
    if (!stored) {
      console.log('❌ 没有找到语言包数据');
      return;
    }
    
    const oldPacks = JSON.parse(stored);
    console.log('📦 解析的旧数据:', oldPacks);
    
    // 映射规则
    const map = {
      'zh-CN': 'zh',
      'zh-TW': 'zh',
      'en-US': 'en',
      'en-GB': 'en',
      'pt-BR': 'pt',
      'pt-PT': 'pt',
      'es-ES': 'es',
      'es-MX': 'es',
    };
    
    // 转换为 ML Kit 格式
    const newPacks = oldPacks.map(code => map[code] || code);
    
    // 去重
    const uniquePacks = [...new Set(newPacks)];
    
    console.log('✅ 新数据:', uniquePacks);
    
    // 保存
    await AsyncStorage.setItem('downloaded_language_packs', JSON.stringify(uniquePacks));
    
    console.log('✅ 迁移完成！');
    console.log('旧格式:', oldPacks);
    console.log('新格式:', uniquePacks);
    
    // 重新加载应用
    console.log('🔄 请重新加载应用以使更改生效');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
  }
};

// 执行迁移
migrateLanguageCodes();

export default migrateLanguageCodes;

