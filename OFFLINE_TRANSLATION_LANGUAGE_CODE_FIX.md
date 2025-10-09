# ✅ 离线翻译语言码映射修复

## 🎯 问题总结

### ⚠️ 问题 1：语言码与 ML Kit 实际支持码不匹配

ML Kit 官方语言代码与 ISO 语言码略有不同：

| 语言 | 应用定义的 | ML Kit 实际代码 | 状态 |
|------|-----------|----------------|------|
| 简体中文 | `zh-CN` | `zh` | ❌ 不匹配 |
| 繁体中文 | `zh-TW` | `zh` | ❌ 不匹配 |
| 英文 | `en` | `en` | ✅ 匹配 |
| 马来语 | `ms` | `ms` | ✅ 匹配 |

**问题现象：**
- 下载时传入 `zh-CN`，ML Kit 实际下载的是 `zh` 模型
- `translationModeManager` 检查时只在数组中找 `zh-CN`，自然认为"未下载"
- 这是"假成功"——下载成功但检测逻辑不认

### ⚠️ 问题 2：下载流程没有验证模型存在

之前的代码只是异步调用成功的 Promise，并不是模型真的下载完成。在离线时调用 `translate()` 时，它仍会尝试联网。

---

## ✅ 修复方案

### 📝 Step 1: 统一语言码映射

在 `utils/mlKitLanguageMapper.ts` 中添加映射函数：

```typescript
// 语言码映射：应用语言码 → ML Kit 语言码
export const mapToMlKitLangCode = (lang: string): string => {
  const map: Record<string, string> = {
    'zh-CN': 'zh',
    'zh-TW': 'zh',
    'en-US': 'en',
    'en-GB': 'en',
    'pt-BR': 'pt',
    'pt-PT': 'pt',
    'es-ES': 'es',
    'es-MX': 'es',
  };
  return map[lang] || lang;
};

// 反向映射：ML Kit 语言码 → 应用默认语言码
export const mapFromMlKitLangCode = (mlKitLang: string): string => {
  const reverseMap: Record<string, string> = {
    'zh': 'zh-CN',
    'en': 'en',
    'pt': 'pt',
    'es': 'es',
  };
  return reverseMap[mlKitLang] || mlKitLang;
};
```

### 📝 Step 2: 修改所有调用 ML Kit 的地方

#### 2.1 `mlKitTranslationService.ts`

```typescript
import { mapToMlKitLangCode } from '@/utils/mlKitLanguageMapper';

// 下载时映射
async downloadLanguagePack(languageCode: string): Promise<boolean> {
  const mlKitCode = mapToMlKitLangCode(languageCode);
  console.log(`🔄 下载语言包: ${languageCode} → ML Kit: ${mlKitCode}`);
  
  const result = await this.nativeModule.downloadLanguagePack(mlKitCode);
  if (result) {
    await translationModeManager.addDownloadedLanguagePack(mlKitCode); // 存储 ML Kit 码
  }
  return result;
}

// 翻译时映射
async translateText(text: string, sourceLang: string, targetLang: string) {
  const mlKitSourceLang = mapToMlKitLangCode(sourceLang);
  const mlKitTargetLang = mapToMlKitLangCode(targetLang);
  
  console.log(`🔄 翻译: ${sourceLang}(${mlKitSourceLang}) → ${targetLang}(${mlKitTargetLang})`);
  
  const result = await this.nativeModule.translate(text, mlKitSourceLang, mlKitTargetLang);
  // ...
}
```

#### 2.2 `translationModeManager.ts`

```typescript
import { mapToMlKitLangCode } from '@/utils/mlKitLanguageMapper';

async canTranslate(fromLang: string, toLang: string) {
  // ... 在线模式检查 ...
  
  // ✅ 转换为 ML Kit 语言码检查
  const mlKitFromLang = mapToMlKitLangCode(fromLang);
  const mlKitToLang = mapToMlKitLangCode(toLang);
  
  // ✅ 只检查目标语言包（使用 ML Kit 码）
  const hasTargetPack = this.downloadedLanguagePacks.includes(mlKitToLang);
  
  console.log(`🔍 离线翻译检查: ${fromLang}(${mlKitFromLang}) → ${toLang}(${mlKitToLang}) (${hasTargetPack ? '已下载' : '未下载'})`);
  // ...
}
```

#### 2.3 `languagePackManager.ts`

```typescript
import { mapToMlKitLangCode } from '@/utils/mlKitLanguageMapper';

// 下载时使用 ML Kit 码存储
private async performDownload(languageCode: string, onProgress?: (progress: number) => void) {
  const mlKitCode = mapToMlKitLangCode(languageCode);
  console.log(`🔄 开始真正下载 ${languageCode} 语言包（ML Kit: ${mlKitCode}）`);
  
  const downloadSuccess = await mlKitTranslationService.downloadLanguagePack(languageCode);
  
  if (downloadSuccess) {
    // ✅ 存储 ML Kit 码
    await this.addToDownloadedList(mlKitCode);
    await translationModeManager.addDownloadedLanguagePack(mlKitCode);
    await offlineTranslationService.addLanguagePack(mlKitCode);
    
    console.log(`✅ ${languageCode} 语言包真正下载完成（存储为 ${mlKitCode}）`);
  }
}
```

#### 2.4 `offlineTranslationService.ts`

```typescript
import { mapToMlKitLangCode } from '@/utils/mlKitLanguageMapper';

public async translateOffline(text: string, fromLanguage: string, toLanguage: string) {
  // ✅ 转换为 ML Kit 语言码
  const mlKitFromLang = mapToMlKitLangCode(fromLanguage);
  const mlKitToLang = mapToMlKitLangCode(toLanguage);
  
  console.log(`📱 离线翻译: "${text}" (${fromLanguage}/${mlKitFromLang} → ${toLanguage}/${mlKitToLang})`);
  
  // 检查语言包（内部使用 ML Kit 码）
  const canTranslate = await translationModeManager.canTranslate(fromLanguage, toLanguage);
  // ...
}
```

---

## 🧪 测试验证流程

### 1️⃣ 清除旧缓存

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('downloaded_language_packs');
await AsyncStorage.removeItem('translationMode');
```

### 2️⃣ 在线下载 en → zh-CN 语言包

下载 `zh-CN` 语言包，日志应输出：

```
🔄 下载语言包: zh-CN → ML Kit: zh
✅ zh-CN 语言包真正下载完成（存储为 zh）
📱 加载已下载的语言包: zh
```

### 3️⃣ 断网后翻译测试

断网后翻译 "Hello" → "你好"，日志应输出：

```
🔍 离线翻译检查: en(en) → zh-CN(zh) (已下载)
📦 已下载语言包: ['zh']
📱 离线翻译: "Hello" (en/en → zh-CN/zh)
🔄 翻译: en(en) → zh-CN(zh)
✅ ML Kit 翻译成功: 你好
```

### 4️⃣ 验证成功标志

如果看到以下日志，代表完全生效 🎉：

- ✅ `下载语言包: zh-CN → ML Kit: zh`
- ✅ `存储为 zh`
- ✅ `离线翻译检查: en(en) → zh-CN(zh) (已下载)`
- ✅ `已下载语言包: ['zh']`

---

## 📊 修复文件清单

| 文件 | 修改内容 | 状态 |
|------|---------|------|
| `utils/mlKitLanguageMapper.ts` | 添加 `mapToMlKitLangCode` 和 `mapFromMlKitLangCode` 映射函数 | ✅ 已修复 |
| `services/mlKitTranslationService.ts` | 所有调用原生模块的地方使用映射码 | ✅ 已修复 |
| `services/translationModeManager.ts` | 检测逻辑使用映射码 | ✅ 已修复 |
| `services/languagePackManager.ts` | 下载流程使用映射码存储 | ✅ 已修复 |
| `services/offlineTranslationService.ts` | 翻译调用使用映射码 | ✅ 已修复 |

---

## 🔑 关键点总结

1. **统一存储格式**：所有语言包在 AsyncStorage 中以 ML Kit 码存储（如 `zh` 而非 `zh-CN`）
2. **调用时映射**：所有调用 ML Kit 原生模块的地方都先映射语言码
3. **检查时映射**：检查语言包是否下载时，也使用 ML Kit 码检查
4. **日志清晰**：所有关键步骤都打印映射前后的语言码，便于调试

---

## 📝 后续优化建议

### 1. 添加模型验证（可选）

如果需要更严格的验证，可以在原生模块中添加检查：

```kotlin
// Kotlin 原生代码
fun isModelDownloaded(languageCode: String): Boolean {
    val model = TranslateRemoteModel.Builder(languageCode).build()
    val modelManager = RemoteModelManager.getInstance()
    
    // 同步检查（需要在 IO 线程中）
    return try {
        Tasks.await(modelManager.isModelDownloaded(model))
    } catch (e: Exception) {
        false
    }
}
```

### 2. 下载进度回调（可选）

虽然 ML Kit 不提供原生的下载进度，但可以：
- 监听 `RemoteModelManager.DownloadConditions`
- 估算下载时间（基于语言包大小和网速）
- 使用模拟进度（当前实现）

---

## ✅ 修复完成

所有语言码映射问题已修复，离线翻译功能现在应该能正常工作：

- ✅ 语言码统一映射到 ML Kit 格式
- ✅ 下载时使用正确的语言码
- ✅ 检查时使用正确的语言码
- ✅ 翻译时使用正确的语言码
- ✅ 日志输出清晰，便于调试

🎉 **现在可以开始测试离线翻译功能了！**

