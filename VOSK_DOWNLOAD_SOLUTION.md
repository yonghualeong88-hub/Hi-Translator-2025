# Vosk 模型下载 - 最终解决方案

## 🎯 **问题根源**

React Native 的 `fetch` API **不支持 `ReadableStream`**！

```typescript
const response = await fetch(url);
console.log(response.body); // ❌ undefined (RN中不存在)
```

这是 React Native 与 Web 标准的差异。

---

## ✅ **最终方案：使用 FileSystem.createDownloadResumable**

### **为什么选择这个API？**

| API | 是否废弃 | 流式下载 | RN支持 | 结果 |
|-----|---------|---------|--------|------|
| `fetch` + `arrayBuffer()` | ❌ 否 | ❌ 否 | ✅ 是 | ❌ OOM |
| `fetch` + `ReadableStream` | ❌ 否 | ✅ 是 | ❌ **否** | ❌ body为空 |
| `FileSystem.getInfoAsync` | ✅ **是** | - | ✅ 是 | ❌ 废弃警告 |
| `File.downloadAsync` | ❌ 否 | ✅ 是 | ❌ **不存在** | ❌ 方法未定义 |
| `FileSystem.createDownloadResumable` | ⚠️ Legacy | ✅ **是** | ✅ **是** | ✅ **完美** |

### **最终代码：**

```typescript
import * as FileSystem from 'expo-file-system/legacy';
import { Paths, Directory, File } from 'expo-file-system';

// 1. 使用新API管理文件
const modelDir = new Directory(Paths.document, 'vosk-models');
const zipFile = new File(modelDir, `${modelName}.zip`);

// 2. 使用legacy API下载（流式，不会OOM）
const downloadResumable = FileSystem.createDownloadResumable(
  url,
  zipFile.uri,
  {},
  (progress) => {
    const percent = (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100;
    console.log(`📥 ${percent.toFixed(1)}%`);
  }
);

const result = await downloadResumable.downloadAsync();
console.log('✅ 下载完成:', result.uri);
```

---

## 🔧 **技术细节**

### **混合使用新旧API**

**新API（文件管理）：**
```typescript
// ✅ 用于文件检查、创建、删除
const zipFile = new File(modelDir, 'model.zip');
await zipFile.exists;
await zipFile.size;
await zipFile.delete();
```

**Legacy API（下载）：**
```typescript
// ✅ 用于流式下载（唯一可行方案）
import * as FileSystem from 'expo-file-system/legacy';
const downloadResumable = FileSystem.createDownloadResumable(...);
```

---

## 📊 **为什么不会OOM？**

`createDownloadResumable` 在**原生层**实现流式下载：

```
网络数据 → 原生层缓冲区 → 直接写入磁盘
           (不经过JS层)
```

**JS层只接收进度事件**，不处理文件内容！

---

## 🚀 **使用方法**

```typescript
import { downloadVoskModel } from '@/utils/downloadVoskModel';

// 下载日语模型
const localPath = await downloadVoskModel('ja', (progress) => {
  console.log(`📥 ${progress.progress.toFixed(1)}%`);
});

console.log('✅ 下载完成:', localPath);
```

---

## 📦 **特性总结**

### ✅ **功能完善**
- 原生流式下载（不经过JS层）
- 实时进度回调
- 自动创建目录
- 文件存在检查
- 下载失败自动清理
- 支持断点续传

### ✅ **性能优化**
- **零OOM风险**（原生层处理）
- 适用于任意大小文件
- 支持130MB+大文件

### ✅ **API兼容**
- 使用 `File` 和 `Directory` 类（新API）
- 下载使用 `legacy` API（稳定可靠）
- 避免废弃警告（通过 `/legacy` 导入）

---

## 🎬 **预期日志**

```
🔍 找到模型: vosk-model-small-ja-0.22 (48MB)
📁 创建模型目录: file:///data/.../vosk-models/
⬇️ 开始下载模型: https://pub-xxx.r2.dev/vosk-model-small-ja-0.22.zip
📦 文件大小: 48MB
📥 下载进度: 0.0% (0.0MB / 48.6MB)
📥 下载进度: 10.0% (4.9MB / 48.6MB)
📥 下载进度: 20.0% (9.7MB / 48.6MB)
📥 下载进度: 30.0% (14.6MB / 48.6MB)
📥 下载进度: 40.0% (19.4MB / 48.6MB)
📥 下载进度: 50.0% (24.3MB / 48.6MB)
📥 下载进度: 60.0% (29.2MB / 48.6MB)
📥 下载进度: 70.0% (34.0MB / 48.6MB)
📥 下载进度: 80.0% (38.9MB / 48.6MB)
📥 下载进度: 90.0% (43.7MB / 48.6MB)
📥 下载进度: 100.0% (48.6MB / 48.6MB)
✅ 模型下载完成: file:///data/.../vosk-model-small-ja-0.22.zip
📊 文件大小: 48.59MB
```

---

## 💡 **关键要点**

1. **React Native ≠ Web**
   - RN 的 `fetch` 不支持 `ReadableStream`
   - 必须使用原生API

2. **Legacy API 不等于废弃**
   - `expo-file-system/legacy` 是专门的导入路径
   - 避免废弃警告
   - 功能稳定可靠

3. **原生层流式下载**
   - 数据不经过JS层
   - 零内存压力
   - 支持超大文件

4. **混合使用新旧API**
   - 新API：文件管理（`File`, `Directory`）
   - Legacy API：下载功能（`createDownloadResumable`）
   - 两者完美配合

---

## ⚠️ **注意事项**

1. **下载时间**
   - 48MB 约需 30秒-2分钟（取决于网络）
   - 130MB 约需 1-5分钟
   - 保持屏幕常亮

2. **存储空间**
   - 下载前检查可用空间
   - 建议至少200MB
   - 下载失败会自动清理

3. **网络要求**
   - 稳定的网络连接
   - 避免切换WiFi/移动数据
   - 支持断点续传（如果网络中断）

---

## 🔗 **相关文件**

- `utils/downloadVoskModel.ts` - 下载工具（最终版本）
- `services/offlineVoskService.ts` - Vosk服务
- `config/vosk-models.ts` - 模型配置

---

## 🎉 **总结**

✅ **问题完全解决**  
✅ **使用原生流式下载**  
✅ **零OOM风险**  
✅ **无废弃警告**  
✅ **支持超大文件**  

**这是目前最优、最稳定的解决方案！** 🚀

