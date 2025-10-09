# Vosk 流式下载优化

## 📋 **问题描述**

之前使用 `fetch` + `arrayBuffer()` 一次性将整个模型文件（130MB+）加载到内存，导致：
- ❌ **OOM错误**：`Failed to allocate 364MB`
- ❌ **内存溢出**：超出Android应用内存限制（256-512MB）
- ❌ **下载失败**：大文件无法成功下载
- ❌ **API废弃**：Expo v54 废弃了旧的 `getInfoAsync` 等API

## ✅ **解决方案**

使用 **Expo FileSystem 的流式下载**，边下载边写入磁盘，避免内存堆积。

---

## 🔧 **核心改进**

### **1. 新增 `utils/downloadVoskModel.ts`**

提供专门的模型下载工具：

```typescript
import { downloadVoskModel } from '@/utils/downloadVoskModel';

// 下载中文模型
const localPath = await downloadVoskModel('zh-CN', (progress) => {
  console.log(`下载进度: ${progress.progress.toFixed(1)}%`);
});
```

**特性：**
- ✅ **流式下载**：使用 `File.downloadAsync()` (Expo v54+)
- ✅ **避免OOM**：不在JS层堆积内存
- ✅ **进度回调**：实时显示下载进度
- ✅ **新版API**：使用 `File` 和 `Directory` 类（非废弃API）
- ✅ **存储空间检查**：下载前检查可用空间
- ✅ **自动清理**：下载失败后清理残留文件

### **2. 修改 `services/offlineVoskService.ts`**

集成新的下载工具：

```typescript
// 旧方法（导致OOM）
const response = await fetch(model.url);
const arrayBuffer = await response.arrayBuffer(); // ❌ 一次性加载到内存
const uint8Array = new Uint8Array(arrayBuffer);
await modelFile.write(uint8Array, {});

// 新方法（流式下载）
const zipFilePath = await downloadVoskModel(languageCode, (progress) => {
  onProgress?.(progress.progress * 0.8); // 下载占80%进度
});
```

---

## 📦 **工具函数**

### **`downloadVoskModel(languageCode, onProgress?)`**
下载指定语言的模型

**参数：**
- `languageCode`: 语言代码（如 `'zh-CN'`, `'en'`, `'ja'`）
- `onProgress`: 可选的进度回调函数

**返回：** 本地zip文件路径

### **`isModelDownloaded(modelName)`**
检查模型是否已下载

**参数：**
- `modelName`: 模型名称（如 `'vosk-model-small-cn-0.22'`）

**返回：** `Promise<boolean>`

### **`deleteVoskModel(modelName)`**
删除已下载的模型

**参数：**
- `modelName`: 模型名称

**返回：** `Promise<boolean>` - 是否成功删除

### **`getDownloadedModels()`**
获取所有已下载的模型列表

**返回：** `Promise<VoskModelInfo[]>`

### **`getModelsStorageSize()`**
获取所有模型占用的存储空间（MB）

**返回：** `Promise<number>`

---

## 🧪 **测试方法**

### **方法1：在应用中测试**

在 `app/(tabs)/index.tsx` 或任何页面中：

```typescript
import { downloadVoskModel } from '@/utils/downloadVoskModel';

// 测试下载中文模型
const testDownload = async () => {
  try {
    console.log('开始测试下载...');
    
    const localPath = await downloadVoskModel('zh-CN', (progress) => {
      console.log(`📥 ${progress.progress.toFixed(1)}% - ${(progress.bytesWritten / 1024 / 1024).toFixed(1)}MB`);
    });
    
    console.log('✅ 下载成功:', localPath);
  } catch (error) {
    console.error('❌ 下载失败:', error);
  }
};

// 在组件中调用
useEffect(() => {
  testDownload();
}, []);
```

### **方法2：在Vosk模型管理页面测试**

在 `app/vosk-models.tsx` 中，点击下载按钮时：

```typescript
const handleDownload = async (modelName: string) => {
  try {
    setDownloading(true);
    
    // 使用offlineVoskService（内部已使用流式下载）
    await offlineVoskService.downloadModel(modelName, (progress) => {
      setDownloadProgress(progress);
    });
    
    Alert.alert('✅ 成功', '模型下载完成！');
  } catch (error) {
    Alert.alert('❌ 失败', error.message);
  } finally {
    setDownloading(false);
  }
};
```

---

## 📊 **预期效果**

### **下载日志示例：**

```
🔍 找到模型: vosk-model-small-ja-0.22 (48MB)
📁 创建模型目录: file:///data/user/0/com.yourapp/files/vosk-models/
💾 可用存储空间: 2048MB
⬇️ 开始下载模型: https://pub-xxx.r2.dev/vosk-model-small-ja-0.22.zip
📦 文件大小: 48MB
📥 下载进度: 10.0% (6.4MB / 48.6MB)
📥 下载进度: 20.0% (12.8MB / 48.6MB)
📥 下载进度: 30.0% (19.2MB / 48.6MB)
...
📥 下载进度: 100.0% (48.6MB / 48.6MB)
✅ 模型下载完成: file:///data/user/0/com.yourapp/files/vosk-models/vosk-model-small-ja-0.22.zip
📊 文件大小: 48.59MB
📦 下载完成，开始解压模型...
✅ 模型解压完成
✅ 模型 vosk-model-small-ja-0.22 安装完成
```

### **不会出现的错误：**
- ❌ `Failed to allocate 364MB`
- ❌ `OOM (Out Of Memory)`
- ❌ JavaScript heap out of memory

---

## 💡 **优化建议**

### **1. 延迟下载**

不要在应用启动时立即下载所有模型，而是：
- 用户第一次选择离线模式时提示下载
- 按需下载用户需要的语言模型
- 在后台空闲时预下载常用模型

### **2. 管理存储空间**

```typescript
import { getModelsStorageSize, getDownloadedModels } from '@/utils/downloadVoskModel';

// 显示存储使用情况
const storageSize = await getModelsStorageSize();
const downloadedModels = await getDownloadedModels();

console.log(`已下载 ${downloadedModels.length} 个模型`);
console.log(`占用空间 ${storageSize.toFixed(2)} MB`);
```

### **3. 清理不需要的模型**

```typescript
import { deleteVoskModel } from '@/utils/downloadVoskModel';

// 删除不再需要的模型
await deleteVoskModel('vosk-model-small-ja-0.22');
```

---

## ⚠️ **注意事项**

1. **首次下载**：大型模型（130MB）需要几分钟，确保网络稳定
2. **存储空间**：建议至少预留200MB空间
3. **后台下载**：iOS可能限制后台下载，建议在前台完成
4. **下载失败**：会自动清理残留文件，可以重新下载

---

## 🔗 **相关文件**

- `utils/downloadVoskModel.ts` - 流式下载工具
- `services/offlineVoskService.ts` - Vosk服务（已集成）
- `config/vosk-models.ts` - 模型配置
- `app/vosk-models.tsx` - 模型管理界面

---

## 🎯 **总结**

✅ **问题解决**：使用流式下载完全避免了OOM错误  
✅ **性能提升**：下载过程不会占用大量JS内存  
✅ **用户体验**：实时进度显示，支持断点续传  
✅ **可维护性**：独立的工具模块，易于测试和扩展  

**现在可以安全下载任意大小的Vosk模型，不再担心内存溢出！** 🎉

