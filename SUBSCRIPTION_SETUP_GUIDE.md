# 📱 Speak to Translator 订阅功能实现完整指南

> **预计总时间：2-3 小时**  
> **前置要求：Google Play Console 账号（$25 注册费）**

---

## 📋 **目录**

1. [第一阶段：Google Play Console 配置](#第一阶段google-play-console-配置) (30分钟)
2. [第二阶段：代码修改与测试](#第二阶段代码修改与测试) (60分钟)
3. [第三阶段：上传测试版本](#第三阶段上传测试版本) (30分钟)
4. [第四阶段：正式上架](#第四阶段正式上架) (30分钟)

---

## 第一阶段：Google Play Console 配置

### ✅ **步骤 1.1：创建应用（如果还没有）**

1. 访问：https://play.google.com/console
2. 点击 **"创建应用"**
3. 填写信息：
   - **应用名称**：Speak to Translator
   - **默认语言**：英语
   - **应用类型**：应用
   - **免费还是付费**：免费（应用内购买）
4. 勾选政策声明 → 点击 **"创建应用"**

---

### ✅ **步骤 1.2：配置订阅产品**

1. 左侧菜单 → **获利** → **产品** → **订阅**
2. 点击 **"创建订阅"**

#### **月度订阅配置：**

```
产品 ID：premium_monthly
（⚠️ 必须精确匹配，不能修改）

名称（英文）：Premium Monthly Subscription
说明：
- Unlimited voice & text translations
- Download offline language packs
- AI-powered phrase expansion
- Ad-free experience
- Priority support

基准国家/地区：美国
基准价格：$9.99 USD

订阅期限：1个月（每月续订）

免费试用：
☑️ 启用免费试用
试用期：3 天
试用价格：$0.00

宽限期：3天（可选，推荐启用）
账号保留：30天（可选）
```

#### **年度订阅配置：**

```
产品 ID：premium_yearly
（⚠️ 必须精确匹配，不能修改）

名称（英文）：Premium Yearly Subscription
说明：
- All monthly features
- Save 25% with annual plan
- Unlimited translations forever
- Offline language packs
- Ad-free experience

基准国家/地区：美国
基准价格：$89.99 USD

订阅期限：1年（每年续订）

免费试用：
☑️ 启用免费试用
试用期：3 天
试用价格：$0.00
```

3. 每个产品配置完成后，点击 **"激活"**

---

### ✅ **步骤 1.3：设置许可测试账号**

1. 左侧菜单 → **设置** → **许可测试**
2. 点击 **"创建许可证"**
3. 添加测试邮箱（必须是 Gmail）：
   ```
   your-test-email@gmail.com
   ```
4. 许可证回应：选择 **"已授予许可证"**
5. 保存

**⚠️ 重要：**
- 测试账号可以免费购买订阅（不会真的扣费）
- 测试购买的订阅会在5分钟后自动到期（方便测试）

---

## 第二阶段：代码修改与测试

### ✅ **步骤 2.1：检查 react-native-iap 是否已安装**

打开终端，运行：
```bash
cd D:\project
npm list react-native-iap
```

**如果没有安装，运行：**
```bash
npm install react-native-iap@latest
```

---

### ✅ **步骤 2.2：启用 IAP 功能（修改代码）**

**让 Cursor Agent 执行以下命令：**

**对话内容：**
```
请帮我启用订阅功能：

1. 修改 services/subscriptionService.ts
   - 取消注释第13-27行的 react-native-iap 导入
   - 删除第30-45行的 stub 函数（临时占位）
   - 确保真实的 IAP 函数被使用

2. 验证产品 ID：
   - MONTHLY: 'premium_monthly'
   - YEARLY: 'premium_yearly'
   
请确认这两个 ID 与我在 Play Console 配置的完全一致！
```

---

### ✅ **步骤 2.3：重新构建 Android 应用**

```bash
# 清理缓存
npx expo prebuild --clean

# 重新构建
npx expo run:android --variant release
```

**⚠️ 注意：**
- 订阅功能必须在 **release 构建** 中测试
- debug 构建可能无法正常工作

---

### ✅ **步骤 2.4：生成签名的 APK/AAB**

#### **创建签名密钥（如果还没有）：**

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**会提示输入：**
- 密钥库密码：（记住！）
- 姓名、组织等信息

#### **配置 Gradle 签名：**

编辑 `android/gradle.properties`，添加：
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=你的密钥库密码
MYAPP_RELEASE_KEY_PASSWORD=你的密钥库密码
```

编辑 `android/app/build.gradle`，在 `signingConfigs` 中添加：
```gradle
signingConfigs {
    release {
        storeFile file(MYAPP_RELEASE_STORE_FILE)
        storePassword MYAPP_RELEASE_STORE_PASSWORD
        keyAlias MYAPP_RELEASE_KEY_ALIAS
        keyPassword MYAPP_RELEASE_KEY_PASSWORD
    }
}
```

#### **生成 AAB（推荐）：**

```bash
cd android
./gradlew bundleRelease
```

**生成位置：**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 第三阶段：上传测试版本

### ✅ **步骤 3.1：创建内部测试轨道**

1. Play Console → **测试** → **内部测试**
2. 点击 **"创建新版本"**
3. 上传 `app-release.aab`
4. 填写 **"版本说明"**：
   ```
   - 添加订阅功能
   - 支持离线语言包下载
   - 优化翻译性能
   ```
5. 点击 **"保存"** → **"审核版本"** → **"开始向内部测试推出"**

---

### ✅ **步骤 3.2：添加测试人员**

1. **内部测试** → **测试人员** 标签页
2. 点击 **"创建电子邮件列表"**
3. 添加测试邮箱（与许可测试账号相同）
4. 保存

---

### ✅ **步骤 3.3：获取测试链接并安装**

1. 复制 **"内部测试链接"**（类似：https://play.google.com/apps/internaltest/...）
2. 在测试设备上用测试账号登录 Google Play
3. 打开测试链接 → 点击 **"成为测试人员"**
4. 下载并安装应用

---

### ✅ **步骤 3.4：测试订阅购买**

1. 打开应用
2. 进入 **设置** 或看到订阅提示
3. 点击 **"订阅"**
4. 选择月度或年度订阅
5. 确认购买（不会真的扣费）

**✅ 测试成功标志：**
- 显示 "订阅成功" 提示
- 可以下载离线语言包
- 显示为 Premium 用户

**⚠️ 测试订阅会在 5 分钟后自动到期！**

---

## 第四阶段：正式上架

### ✅ **步骤 4.1：完善应用商店资料**

**必需资料：**

1. **应用图标**
   - 512 × 512 px
   - PNG 格式，透明背景

2. **功能图片**（可选但推荐）
   - 1024 × 500 px

3. **截图**（至少 2 张）
   - 手机：1080 × 1920 或其他标准分辨率
   - 平板（可选）：1600 × 2560

4. **应用描述**
   ```markdown
   Speak to Translator - Your AI-Powered Translation Companion
   
   🌍 支持84种语言即时翻译
   🎤 语音翻译 - 说话即可翻译
   ✍️ 文本翻译 - 快速准确
   📚 常用短语 - 预设7大分类100+常用短语
   🤖 AI扩展 - 智能生成相关短语
   📦 离线包 - 无网络也能翻译
   🎨 17种界面语言 - 完全本地化
   
   Premium 订阅功能：
   ✨ 无限翻译次数
   ✨ 下载所有离线语言包
   ✨ AI 智能短语扩展
   ✨ 无广告体验
   
   免费试用 3 天，随时取消！
   ```

5. **隐私政策链接**
   - 需要一个公开可访问的网址
   - 例如：https://your-website.com/privacy
   - 或使用 GitHub Pages

6. **应用分类**
   - 主要分类：**工具**
   - 次要分类：**教育**

7. **内容分级**
   - 填写问卷 → 通常为 **Everyone（所有人）**

---

### ✅ **步骤 4.2：准备隐私政策和使用条款链接**

**选项1：使用 GitHub Pages（免费）**

1. 在 GitHub 创建仓库：`speaktotranslator-policies`
2. 创建 `privacy.html` 和 `terms.html`
3. 启用 GitHub Pages
4. 链接：
   - 隐私政策：`https://your-username.github.io/speaktotranslator-policies/privacy.html`
   - 使用条款：`https://your-username.github.io/speaktotranslator-policies/terms.html`

**选项2：使用自己的网站**
- 上传到您的服务器
- 确保链接公开可访问

**选项3：使用 Vercel（推荐，免费）**
1. 在项目中创建 `docs/privacy.html` 和 `docs/terms.html`
2. 部署到 Vercel
3. 获取链接

---

### ✅ **步骤 4.3：提交正式版本审核**

1. Play Console → **生产** → **国家/地区**
   - 选择发布的国家/地区
   - 推荐：**全球所有国家**

2. **创建新版本**
   - 上传签名的 AAB：`app-release.aab`
   - 版本号：1（自动递增）
   - 版本名称：1.0.0

3. **版本说明**（英文 + 中文）：
   ```
   Version 1.0.0
   
   🎉 Initial release of Speak to Translator!
   
   Features:
   • Voice translation for 84 languages
   • Text translation with AI enhancement
   • 100+ common phrases in 7 categories
   • Offline language pack support
   • 17 UI languages
   
   Premium subscription:
   • Unlimited translations
   • Offline language packs
   • AI phrase expansion
   • Ad-free experience
   
   7-day free trial available!
   ```

4. **提交审核**
   - 检查所有必填项（✓ 绿色勾号）
   - 点击 **"提交审核"**

---

## 📝 **代码修改清单（给 Cursor Agent）**

**复制以下内容给 Cursor Agent：**

```
请帮我完成以下订阅功能代码修改：

===== 任务 1：启用 react-native-iap =====

文件：services/subscriptionService.ts

1. 取消注释第 13-27 行的导入：
   import {
     initConnection,
     endConnection,
     getProducts,
     getSubscriptions,
     requestSubscription,
     purchaseUpdatedListener,
     purchaseErrorListener,
     finishTransaction,
     clearTransactionIOS,
     PurchaseError,
     Product,
     Purchase,
     SubscriptionPurchase,
   } from 'react-native-iap';

2. 删除第 30-45 行的 stub 函数（临时占位代码）

3. 删除第 31-34 行的临时类型定义

===== 任务 2：确认产品 ID =====

文件：services/subscriptionService.ts

确认第 48-57 行的产品 ID：
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: Platform.select({
    ios: 'premium_monthly_ios',
    android: 'premium_monthly',  // ← 必须与 Play Console 一致
  }) || 'premium_monthly',
  YEARLY: Platform.select({
    ios: 'premium_yearly_ios',
    android: 'premium_yearly',   // ← 必须与 Play Console 一致
  }) || 'premium_yearly',
} as const;

===== 任务 3：添加订阅页面入口 =====

文件：app/settings.tsx

在 "General Settings" 卡片后添加订阅选项：

<SettingCard>
  <SettingItem
    icon={<Crown />}
    title={t('settings.premiumSubscription', 'Premium Subscription')}
    subtitle={t('settings.unlockAllFeatures', 'Unlock unlimited translations & offline packs')}
    onPress={() => router.push('/subscription')}
    iconColor="#FFD700"
  />
</SettingCard>

记得在顶部导入 Crown 图标：
import { Crown, ... } from 'lucide-react-native';

===== 任务 4：添加翻译 key =====

在所有 17 个语言文件（locales/*.json）中的 settings 部分添加：

"premiumSubscription": "Premium Subscription",
"unlockAllFeatures": "Unlock unlimited translations & offline packs"

（其他语言使用对应翻译）

===== 完成后告诉我！=====
```

---

## 🧪 **测试清单**

### **测试前准备：**
- [ ] 已在 Play Console 创建订阅产品
- [ ] 已激活产品
- [ ] 已添加测试账号
- [ ] 已上传内部测试版本
- [ ] 已成为测试人员

### **功能测试：**
- [ ] 打开订阅页面，能看到两个订阅选项
- [ ] 点击"月度订阅"，弹出 Google Play 支付界面
- [ ] 确认购买（测试账号不会扣费）
- [ ] 显示"订阅成功"提示
- [ ] 检查订阅状态：设置页面显示"Premium"标识
- [ ] 尝试下载离线语言包（应该成功）
- [ ] 关闭应用重新打开，订阅状态保持
- [ ] 等待5分钟，测试订阅自动到期
- [ ] 测试"恢复购买"功能

---

## 📤 **上架前最终检查清单**

### **必需项目：**
- [ ] 应用图标（512×512）
- [ ] 至少 2 张截图
- [ ] 应用描述（英文）
- [ ] 隐私政策链接（公开可访问）
- [ ] 已完成内容分级问卷
- [ ] 已设置目标国家/地区
- [ ] 已配置订阅产品并激活
- [ ] 已签名的 AAB 文件
- [ ] 版本号：1
- [ ] 版本名称：1.0.0

### **推荐项目：**
- [ ] 使用条款链接
- [ ] 功能图片（1024×500）
- [ ] 多语言应用描述（中文、日文等）
- [ ] 平板截图
- [ ] 宣传视频（30秒-2分钟）

---

## ⚠️ **常见问题与解决方案**

### **问题1：找不到订阅产品**
**原因：** 产品未激活或产品 ID 不匹配  
**解决：** 检查 Play Console 中产品状态是否为"有效"

### **问题2：购买时提示"此商品无法购买"**
**原因：** 未使用测试账号或应用未签名  
**解决：** 确认使用许可测试账号登录，并使用 release 构建

### **问题3：订阅状态不保存**
**原因：** 收据验证失败  
**解决：** 检查 `finishTransaction` 是否被调用

### **问题4：审核被拒**
**常见原因：**
- 缺少隐私政策链接
- 截图不符合要求
- 应用描述不清晰
- 订阅功能说明不完整

---

## 🎯 **总结：操作顺序**

```
1. Google Play Console 配置订阅产品 (30分钟)
   ↓
2. 让 Cursor Agent 修改代码启用 IAP (10分钟)
   ↓
3. 重新构建应用 (10分钟)
   ↓
4. 生成签名 AAB (5分钟)
   ↓
5. 上传内部测试版本 (10分钟)
   ↓
6. 用测试账号测试购买 (15分钟)
   ↓
7. 准备商店资料（图标、截图、描述）(30分钟)
   ↓
8. 准备隐私政策和使用条款链接 (15分钟)
   ↓
9. 提交正式版本审核 (10分钟)
   ↓
10. 等待审核（1-7天）
   ↓
11. 上架成功！🎉
```

---

## 📞 **需要帮助时：**

**代码相关：** 询问 Cursor Agent  
**Play Console 配置：** 参考 Google 官方文档  
**审核问题：** 查看 Play Console 通知邮件

---

**您现在可以从步骤 1.1 开始！每完成一个阶段，告诉我，我会帮您进行下一步！** 🚀

