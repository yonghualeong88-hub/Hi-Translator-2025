# 🚀 快速修复指南 - 迁移语言包数据

## 问题
Metro 缓存太顽固，修改的代码不生效。

## 快速解决方案
直接修改存储数据：`["zh-CN", "ja", "ko", "en"]` → `["zh", "ja", "ko", "en"]`

---

## 方法 1: 通过开发者菜单执行（最简单）⭐

### 步骤：

1. **在手机上打开应用**

2. **摇晃手机，打开开发者菜单**

3. **选择 "Debug JS Remotely" 或 "Open Debugger"**

4. **在 Chrome 控制台中执行以下代码：**

```javascript
(async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  // 读取当前数据
  const stored = await AsyncStorage.getItem('downloaded_language_packs');
  console.log('旧数据:', stored);
  
  // 迁移数据
  const newPacks = ["zh", "ja", "ko", "en"];
  await AsyncStorage.setItem('downloaded_language_packs', JSON.stringify(newPacks));
  
  console.log('✅ 迁移完成！新数据:', newPacks);
  
  // 刷新应用
  location.reload();
})();
```

5. **应用会自动重新加载**

6. **开启飞行模式测试 `en → zh-CN`**

---

## 方法 2: 添加自动迁移代码

在 `app/_layout.tsx` 的初始化代码中添加一次性迁移：

```typescript
useEffect(() => {
  const initializeServices = async () => {
    try {
      // ✅ 一次性数据迁移
      const stored = await AsyncStorage.getItem('downloaded_language_packs');
      if (stored) {
        const packs = JSON.parse(stored);
        const needsMigration = packs.some(p => p.includes('-'));
        
        if (needsMigration) {
          console.log('🔄 迁移语言包数据格式...');
          const map = { 'zh-CN': 'zh', 'zh-TW': 'zh' };
          const newPacks = [...new Set(packs.map(p => map[p] || p))];
          await AsyncStorage.setItem('downloaded_language_packs', JSON.stringify(newPacks));
          console.log('✅ 迁移完成:', packs, '→', newPacks);
        }
      }
      
      // 原有的初始化代码...
      const { translationModeManager } = await import('@/services/translationModeManager');
      await translationModeManager.init();
      // ...
    } catch (error) {
      console.error('❌ 初始化失败:', error);
    }
  };
  
  initializeServices();
}, []);
```

---

## 方法 3: 通过 adb shell 修改（高级）

```bash
# 进入 adb shell
adb shell

# 找到应用数据目录
cd /data/data/com.hltransslater.app

# 使用 run-as 访问
run-as com.hltransslater.app

# 查看 AsyncStorage 数据
cat databases/RKStorage
```

---

## 预期结果

迁移后：
```javascript
旧数据: ["zh-CN", "ja", "ko", "en"]
新数据: ["zh", "ja", "ko", "en"]
```

测试 `en → zh-CN` 应该看到：
```
LOG  🔍 离线翻译检查: en(en) → zh(zh) (已下载)  ✅
LOG  ✅ 模型已验证: en → zh
LOG  ✅ ML Kit 翻译成功: 你好
```

---

## 推荐
**使用方法 1** - 最快最简单！

1. 摇晃手机
2. 打开调试器
3. 粘贴代码执行
4. 等待刷新
5. 测试离线翻译

完成！🎉

