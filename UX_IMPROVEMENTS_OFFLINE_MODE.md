# 🎨 离线模式 UX 改进

## ✅ 已实现的改进

### 1. 语言选择器状态显示 ⭐

#### 功能说明：
在离线模式下，语言选择器会显示每种语言的下载状态。

#### 视觉效果：

**离线模式下：**
```
语言列表：
┌─────────────────────────────┐
│ 中文(简体)            [✓]   │  ← 已下载（绿色徽章）
│ English              [✓]   │
│ 日本语                [✓]   │
│ 한국어                [✓]   │
│ Français             [✓]   │
│ Deutsch              [✓]   │
│ Español              [✓]   │
│ Italiano             [✓]   │
│ Português            [✓]   │
│ العربية              [✓]   │
│ हिन्दी               [⬇]   │  ← 未下载（灰色徽章，半透明）
│ ไทย                  [⬇]   │
│ Tiếng Việt           [⬇]   │
└─────────────────────────────┘
```

**在线模式下：**
- 不显示徽章
- 所有语言都可正常选择

#### 交互逻辑：

1. **选择已下载的语言** ✅
   - 直接选择成功
   - 正常进行翻译

2. **选择未下载的语言** ⚠️
   - 弹出确认对话框：
     ```
     语言包未下载
     
     离线模式下使用 हिन्दी 需要先下载对应的语言包。
     
     是否前往下载？
     
     [取消]  [前往下载]
     ```
   - 点击"前往下载"→ 跳转到语言包管理页面
   - 点击"取消"→ 留在当前页面

---

## 📝 实现细节

### 修改的文件：

#### `components/LanguagePicker.tsx` ✅

**新增功能：**
1. 添加 `isOfflineMode` 属性
2. 加载已下载语言包列表
3. 检查语言包状态（兼容新旧格式）
4. 显示下载状态徽章
5. 未下载语言点击时弹出提示
6. 提供跳转到语言包管理的按钮

**关键代码：**
```typescript
// 检查语言包是否已下载
const isLanguageDownloaded = (langCode: string): boolean => {
  if (!isOfflineMode) return true;
  
  const mlKitCode = mapToMlKitLangCode(langCode);
  return downloadedPacks.includes(mlKitCode) || downloadedPacks.includes(langCode);
};

// 选择未下载语言时提示
if (isOfflineMode && !isLanguageDownloaded(language.code)) {
  Alert.alert(
    '语言包未下载',
    `离线模式下使用 ${language.nativeName} 需要先下载对应的语言包。\n\n是否前往下载？`,
    [
      { text: '取消', style: 'cancel' },
      { 
        text: '前往下载',
        onPress: () => router.push('/language-packs')
      },
    ]
  );
  return;
}
```

**样式更新：**
- `statusBadge`: 圆形徽章显示状态
- 绿色 `#10B981`: 已下载（✓）
- 灰色 `#6B7280`: 未下载（⬇）
- 未下载语言：50% 不透明度

---

## 🎯 使用方式

### 在文本翻译页面：

```typescript
import LanguagePicker from '@/components/LanguagePicker';
import { translationModeManager } from '@/services/translationModeManager';

// 获取当前翻译模式
const actualMode = translationModeManager.getActualMode();
const isOfflineMode = actualMode === 'offline';

// 使用 LanguagePicker
<LanguagePicker
  visible={showLanguagePicker}
  onClose={() => setShowLanguagePicker(false)}
  onSelectLanguage={handleSelectLanguage}
  title="选择目标语言"
  isOfflineMode={isOfflineMode}  // ✅ 传入离线模式状态
/>
```

---

## 📊 用户体验流程

### 场景 1: 在线模式
```
用户选择任何语言 → 直接选择成功 → 正常翻译
```

### 场景 2: 离线模式 + 已下载语言
```
用户选择已下载语言 → 直接选择成功 → 离线翻译
```

### 场景 3: 离线模式 + 未下载语言
```
用户选择未下载语言 
  ↓
弹出提示对话框
  ↓
[选择"前往下载"]
  ↓
跳转到语言包管理页面
  ↓
下载语言包
  ↓
返回翻译页面
  ↓
重新选择语言
  ↓
离线翻译成功
```

---

## 🔧 后续优化建议

### 1. 添加更多视觉提示 ✨

**在语言选择器顶部添加提示栏：**
```
┌─────────────────────────────┐
│ 📴 离线模式                  │
│ 只能选择已下载的语言包       │
│ [管理语言包]                 │
└─────────────────────────────┘
```

### 2. 在主界面显示离线状态 ✨

```
┌─────────────────────────────┐
│  [中文(简体) ✓]  ⇄  [English ✓]  │
│        📴 离线模式            │  ← 小提示
└─────────────────────────────┘
```

### 3. 智能推荐 ✨

离线模式下，只在推荐语言列表中显示已下载的语言：
```
推荐语言（离线可用）:
- 中文(简体) ✓
- English ✓
- 日本语 ✓
- 한국어 ✓

其他语言（需下载）:
- Français ⬇
- Deutsch ⬇
- ...
```

### 4. 语言包大小提示 ✨

显示语言包大小，帮助用户决策：
```
हिन्दी (Hindi)  [⬇ 27 MB]
```

---

## 🎊 当前实现总结

### ✅ 已实现
- 离线模式下显示语言下载状态
- 未下载语言显示徽章（⬇）和半透明
- 点击未下载语言弹出提示
- 提供直接跳转到下载页面

### 📌 待实现（可选）
- 顶部离线模式提示栏
- 智能推荐列表过滤
- 语言包大小显示
- 批量下载推荐

---

## 🧪 测试建议

1. **开启飞行模式**
2. **打开语言选择器**
3. **验证：**
   - 已下载语言显示绿色 ✓
   - 未下载语言显示灰色 ⬇ 和半透明
4. **点击未下载语言**
5. **验证弹出提示对话框**
6. **点击"前往下载"**
7. **验证跳转到语言包管理页面**

---

**现在按 `r` 键重新加载，测试新的 UX 改进！** 🚀

