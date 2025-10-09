# 🔍 离线语音识别调试指南

## 问题现象
- ✅ 顶部显示 "📱 离线模式"
- ❌ 录音后没有显示Toast提示
- ❌ 翻译历史没有显示 "语音识别需要网络"

---

## 🎯 可能的原因

### 原因1：代码未重新加载
**解决方法：**
1. 在设备上打开应用
2. 摇晃设备，打开开发菜单
3. 点击 "Reload" 重新加载
4. 或者按键盘 `r` 键重新加载

### 原因2：网络检测不准确
**验证方法：**
1. 断开WiFi和移动数据
2. 打开应用，查看顶部是否显示 "📱 离线模式"
3. 如果没有显示，说明网络检测有问题

### 原因3：翻译模式管理器状态错误
**查看日志：**
在Metro Bundler终端中查找以下日志：
```
🌐 网络状态变化: 在线 → 离线
🔄 自动切换到 offline 模式
```

如果没有看到这些日志，说明网络状态没有正确检测。

---

## 🧪 手动测试步骤

### 步骤1：验证网络检测
1. **打开应用**（保持在线）
2. **查看终端日志**，应该看到：
   ```
   LOG  🌐 网络状态变化: 在线 → 在线
   LOG  🔄 自动切换到 online 模式
   ```
3. **断开WiFi和移动数据**
4. **等待5-10秒**
5. **查看终端日志**，应该看到：
   ```
   LOG  🌐 网络状态变化: 在线 → 离线
   LOG  🔄 自动切换到 offline 模式
   ```
6. **查看应用顶部**，应该显示 "📱 离线模式"

### 步骤2：验证录音提示
1. **确保应用显示 "📱 离线模式"**
2. **点击并按住录音按钮**
3. **说话**
4. **松开按钮**
5. **查看终端日志**，应该看到：
   ```
   LOG  ⚠️ 离线模式：语音识别不可用
   ```
6. **查看应用界面**，应该显示：
   - Toast提示："语音识别需要网络连接，请切换到在线模式"
   - 翻译历史："语音识别需要网络" → "请连接网络后使用"

---

## 🔧 强制重新加载代码

如果上述步骤都没有效果，执行以下操作：

### 方法1：清除缓存并重新构建
```bash
# 停止当前运行的Expo服务器（Ctrl+C）

# 清除Metro缓存
npx expo start --clear

# 在另一个终端，重新构建并安装
npx expo run:android --device ELP_NX9
```

### 方法2：手动清除应用缓存
1. 在设备上打开应用
2. 摇晃设备，打开开发菜单
3. 点击 "Reload"
4. 如果还不行，卸载应用后重新安装

---

## 📝 关键代码位置

### 网络检测：`services/translationModeManager.ts`
```typescript
// 监听网络状态变化
NetInfo.addEventListener((state) => {
  const isOnline = state.isConnected === true && state.isInternetReachable !== false;
  console.log(`🌐 网络状态变化: ${prevOnline ? '在线' : '离线'} → ${isOnline ? '在线' : '离线'}`);
  
  if (isOnline !== prevOnline) {
    this.updateActualMode(isOnline);
  }
});
```

### 离线语音处理：`app/(tabs)/index.tsx`
```typescript
if (modeState.actualMode === 'offline') {
  // 离线模式：语音识别不可用
  console.log('⚠️ 离线模式：语音识别不可用');
  
  // 更新翻译历史记录显示错误
  setTimeout(() => {
    setTranslationHistory(prev => {
      const newHistory = [...prev];
      const processingIndex = newHistory.findIndex(item => item.source === 'reading...');
      if (processingIndex !== -1) {
        newHistory[processingIndex] = {
          ...newHistory[processingIndex],
          source: t('voice.offlineNotSupported', '语音识别需要网络'),
          target: t('voice.pleaseConnectNetwork', '请连接网络后使用'),
        };
      }
      return newHistory;
    });
  }, 0);
  
  // 显示提示
  setToastMessage(t('voice.offlineVoiceNotSupported', '语音识别需要网络连接，请切换到在线模式'));
  setShowToast(true);
  setTimeout(() => setShowToast(false), 4000);
  return;
}
```

### 语音识别服务：`services/offlineVoiceService.ts`
```typescript
async speechToText(audioUri: string, language: string): Promise<OfflineVoiceResult> {
  console.log('⚠️ 离线语音识别不可用');
  return {
    success: false,
    error: '语音识别需要网络连接才能使用',
  };
}
```

---

## 🎯 预期的完整日志流程

**离线模式下录音：**
```
1. LOG  🌐 网络状态变化: 在线 → 离线
2. LOG  🔄 自动切换到 offline 模式
3. LOG  录音按钮按下 - source
4. LOG  按压时间足够，开始录音 - source
5. LOG  开始录音 - source
6. LOG  录音按钮松开 - source
7. LOG  停止录音 - 当前录音状态: source
8. LOG  🎯 开始离线语音翻译流程
9. LOG  ⚠️ 离线模式：语音识别不可用
```

**界面应该显示：**
- 📢 Toast: "语音识别需要网络连接，请切换到在线模式"
- 📝 翻译历史第一条: "语音识别需要网络" | "请连接网络后使用"

---

## ✅ 确认检查清单

完成以下检查：

- [ ] 设备已断开WiFi和移动数据
- [ ] 应用顶部显示 "📱 离线模式"
- [ ] 终端显示 "🌐 网络状态变化: 在线 → 离线"
- [ ] 终端显示 "🔄 自动切换到 offline 模式"
- [ ] 点击录音按钮
- [ ] 终端显示 "⚠️ 离线模式：语音识别不可用"
- [ ] 应用显示Toast提示（底部弹出消息）
- [ ] 翻译历史显示错误信息

---

## 🆘 如果还是不行

**请提供以下信息：**

1. **终端日志截图** - 从录音开始到结束的完整日志
2. **应用界面截图** - 显示 "离线模式" 和录音后的状态
3. **网络状态** - 确认WiFi和移动数据都已关闭
4. **应用版本** - 确认是最新构建的版本

**我会根据这些信息进一步诊断问题。**

