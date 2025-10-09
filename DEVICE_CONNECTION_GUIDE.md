# 📱 设备连接指南

## ✅ Expo 已启动

开发服务器正在运行，现在你有三个选择：

---

## 方案 A: 使用真实 Android 手机（最推荐）⭐

### 步骤 1: 准备手机
1. **启用开发者模式**
   - 打开 `设置` → `关于手机`
   - 连续点击 `版本号` 7 次
   - 提示"您已进入开发者模式"

2. **启用 USB 调试**
   - 返回 `设置` → `系统` → `开发者选项`
   - 打开 `USB 调试`
   - 允许该计算机的 USB 调试

### 步骤 2: 连接手机
1. 用 USB 线连接手机到电脑
2. 手机上会弹出 "允许 USB 调试?" 提示
3. 勾选 "始终允许该计算机"，点击 `确定`

### 步骤 3: 验证连接
打开终端执行：
```bash
adb devices
```

应该看到：
```
List of devices attached
xxxxxxxx  device
```

### 步骤 4: 在 Expo 中选择设备
在 Expo Metro Bundler 中：
- 按 `a` 键 - 在 Android 设备上打开
- 或在浏览器中打开的 Expo 页面选择你的设备

---

## 方案 B: 创建新的稳定模拟器

如果没有真机，可以创建一个更稳定的 API 33 模拟器：

### 使用 Android Studio 创建（推荐）

1. **打开 Android Studio**
2. **Tools → Device Manager**
3. **Create Device**
   - 选择 `Phone` → `Pixel 5` 或其他
   - 系统镜像选择 `Tiramisu (API 33)` 
   - 下载并安装（如未安装）
   - 完成创建

4. **启动新模拟器**
   ```bash
   # 查看新模拟器名称
   C:\Users\yongh\AppData\Local\Android\Sdk\emulator\emulator -list-avds
   
   # 启动新模拟器
   C:\Users\yongh\AppData\Local\Android\Sdk\emulator\emulator @新模拟器名称
   ```

5. **在 Expo 中按 `a` 键**

---

## 方案 C: 通过 QR 码连接（Expo Go）

⚠️ 注意：由于你使用了 `--dev-client`，这个方案可能不适用。Dev Client 需要构建自定义版本的应用。

如果要使用 Expo Go：
1. 重新启动：`npx expo start`（不带 --dev-client）
2. 在手机上安装 Expo Go 应用
3. 扫描终端显示的 QR 码

---

## 🔍 故障排查

### 问题：adb devices 显示 "unauthorized"
**解决：**
1. 手机上重新确认 USB 调试授权
2. 重启 adb 服务：
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

### 问题：模拟器启动失败
**解决：**
1. 检查 BIOS 中虚拟化是否启用（VT-x/AMD-V）
2. 安装 HAXM：
   ```bash
   C:\Users\yongh\AppData\Local\Android\Sdk\extras\intel\Hardware_Accelerated_Execution_Manager\intelhaxm-android.exe
   ```
3. 使用更低的 API 版本（如 API 30 或 33）

### 问题：Metro Bundler 卡住
**解决：**
```bash
# 清除缓存重启
npx expo start --clear --dev-client
```

---

## 📊 当前状态

✅ Expo 开发服务器已启动
⏳ 等待设备连接...

### 下一步：
1. 如果有真机：连接手机，按 `a` 键
2. 如果用模拟器：先启动稳定的模拟器，再按 `a` 键
3. 查看 Metro Bundler 终端输出

---

## 🎯 推荐使用真实设备的原因

✅ **启动快** - 无需等待模拟器启动
✅ **性能好** - 真实硬件性能
✅ **稳定性高** - 不会崩溃
✅ **测试准确** - 真实环境测试
✅ **支持所有功能** - 相机、GPS、传感器等

---

## 📱 测试离线翻译的快速步骤

一旦设备连接成功：

1. **查看初始化日志**（在 Metro Bundler 终端）
   ```
   ✅ TranslationModeManager 初始化完成
   ✅ OfflineTranslationService 初始化完成
   ```

2. **下载语言包**（在线状态）
   - 设置 → 语言包管理 → 下载 `中文(简体)`

3. **测试离线翻译**
   - 开启飞行模式
   - 文本页面：Hello → 你好

4. **验证日志**
   ```
   🔍 离线翻译检查: en(en) → zh(zh) (已下载)
   ✅ 模型已验证: en → zh
   ✅ ML Kit 翻译成功: 你好
   ```

祝测试顺利！🚀

