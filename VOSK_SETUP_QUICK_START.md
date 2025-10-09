# 🚀 Vosk模型云端部署 - 快速开始

## 📋 **3步完成部署**

---

### **第1步：下载所有Vosk模型** ⏬

运行下载脚本：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\download-vosk-models.ps1
```

**这个脚本会：**
- ✅ 自动创建 `D:\vosk-models` 目录
- ✅ 下载所有11个语言模型（约500MB）
- ✅ 显示下载进度和速度
- ✅ 自动跳过已下载的文件
- ✅ 统计下载结果

**预计时间：** 5-15分钟（取决于网速）

---

### **第2步：上传到云存储** ☁️

#### **选项A：阿里云OSS（推荐国内用户）**

1. **创建Bucket**
   ```
   访问: https://oss.console.aliyun.com/
   名称: hi-translator-vosk-models
   地域: 华北2（北京）
   访问控制: 公共读 ⚠️
   ```

2. **上传文件**
   - 进入Bucket
   - 创建文件夹: `vosk-models`
   - 上传 `D:\vosk-models\` 下所有 `.zip` 文件

3. **获取URL**
   ```
   https://hi-translator-vosk-models.oss-cn-beijing.aliyuncs.com/vosk-models/
   ```

#### **选项B：Cloudflare R2（推荐海外用户，无流量费）**

1. **创建Bucket**
   ```
   访问: https://dash.cloudflare.com/
   Bucket名称: vosk-models
   ```

2. **上传文件**
   - 使用Web界面上传
   - 或使用rclone批量上传

3. **开启公开访问**
   - 获取公开URL

#### **选项C：七牛云（推荐小规模应用，有免费额度）**

1. **创建空间**
   ```
   访问: https://portal.qiniu.com/
   空间名称: vosk-models
   访问控制: 公开
   ```

2. **上传文件**
   - 使用Web控制台上传

3. **绑定域名**
   - 获取外链域名

---

### **第3步：更新应用配置** ⚙️

1. **编辑配置文件**

打开 `config/vosk-models.ts`：

```typescript
export const VOSK_MODEL_SOURCE = {
  OFFICIAL: 'https://alphacephei.com/vosk/models',
  
  // 替换为你的云存储URL
  CUSTOM: 'https://你的Bucket地址.oss-cn-beijing.aliyuncs.com/vosk-models',
};

// 切换到自定义源
export const CURRENT_SOURCE = VOSK_MODEL_SOURCE.CUSTOM;
```

**示例：**
```typescript
// 阿里云OSS
CUSTOM: 'https://hi-translator-vosk-models.oss-cn-beijing.aliyuncs.com/vosk-models',

// Cloudflare R2  
CUSTOM: 'https://pub-xxxxx.r2.dev/vosk-models',

// 七牛云
CUSTOM: 'http://your-domain.qiniudn.com',
```

2. **重新构建应用**

```bash
npx expo prebuild --clean
```

3. **测试**

```bash
npx expo start
```

在应用中：
- 进入 **设置 → Vosk语音模型**
- 下载任意一个模型
- 检查下载速度和成功率

---

## 🎯 **完成！**

现在你的用户会从你的云存储下载Vosk模型，而不是从Vosk官方网站！

### **预期效果：**
- ✅ 下载速度更快（使用国内CDN）
- ✅ 更稳定可靠
- ✅ 完全可控

### **成本估算：**
- **存储费用：** ~¥0.5/月（500MB）
- **流量费用：** 取决于用户量
  - 100用户/月：~¥5
  - 1000用户/月：~¥50
  - 使用Cloudflare R2：流量免费！

---

## 🔄 **回滚到官方源**

如果遇到问题，随时可以切换回Vosk官方源：

```typescript
// config/vosk-models.ts
export const CURRENT_SOURCE = VOSK_MODEL_SOURCE.OFFICIAL;
```

重新构建应用即可。

---

## 📚 **详细文档**

- 📖 [完整部署指南](./VOSK_CLOUD_DEPLOYMENT.md)
- 🔧 [Vosk模型说明](./VOSK_MODELS_CLARIFICATION.md)
- 📝 [离线模式测试指南](./OFFLINE_MODE_TEST_GUIDE.md)

---

## 💡 **提示**

1. **先小规模测试**
   - 只上传1-2个常用模型（中文+英语）
   - 测试下载速度和稳定性
   - 确认没问题再上传全部模型

2. **配置CDN加速**
   - 阿里云OSS可以配置CDN
   - 大幅提升下载速度
   - 成本增加不多

3. **监控使用情况**
   - 查看云存储的流量统计
   - 了解用户下载模型的偏好
   - 优化存储策略

4. **备份模型文件**
   - 在本地保留一份完整备份
   - 定期检查云存储文件完整性

---

**有问题？** 查看 [VOSK_CLOUD_DEPLOYMENT.md](./VOSK_CLOUD_DEPLOYMENT.md) 获取详细帮助！

**祝你部署顺利！** 🎉

