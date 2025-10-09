# 🌐 Vosk模型云端部署指南

## 📋 **概述**

本指南教你如何将Vosk语音识别模型上传到云端，让用户从你的服务器下载模型，而不是从Vosk官方网站下载。

---

## 🎯 **为什么要用云端部署？**

### **优势：**
- ✅ **下载速度更快** - 使用国内CDN
- ✅ **更可控** - 可以监控下载量、用户统计
- ✅ **更稳定** - 不依赖第三方服务
- ✅ **可定制** - 可以压缩、优化模型

### **成本估算：**

假设你有1000个用户，每人平均下载2个模型（100MB）：

| 服务 | 存储费用 | 流量费用 | 总计/月 |
|------|---------|---------|--------|
| 阿里云OSS | ¥0.12/GB × 1GB = ¥0.12 | ¥0.50/GB × 200GB = ¥100 | ~¥100 |
| 七牛云 | 免费10GB | ¥0.28/GB × 190GB = ¥53 | ~¥53 |
| Cloudflare R2 | $0.015/GB × 1GB = $0.015 | **免费** | ~$0.015 |

**推荐：Cloudflare R2**（无流量费）或**七牛云**（有免费额度）

---

## 🚀 **方案1：使用阿里云OSS**

### **步骤1：创建OSS Bucket**

1. **注册阿里云账号**
   - 访问：https://www.aliyun.com/
   - 实名认证

2. **开通OSS服务**
   - 访问：https://oss.console.aliyun.com/
   - 点击"创建Bucket"

3. **配置Bucket**
   ```
   Bucket名称: hi-translator-vosk-models
   地域: 华北2（北京）或你用户集中的地区
   存储类型: 标准存储
   访问控制: 公共读 ⚠️ 重要！
   读写权限: 公共读
   服务端加密: 不加密
   实时日志查询: 开启（可选，用于统计）
   ```

### **步骤2：下载Vosk模型**

在Windows上使用PowerShell：

```powershell
# 创建下载目录
New-Item -ItemType Directory -Path "D:\vosk-models" -Force
cd D:\vosk-models

# 定义要下载的模型
$models = @(
    "vosk-model-small-en-us-0.15",
    "vosk-model-small-cn-0.22",
    "vosk-model-small-ja-0.22",
    "vosk-model-small-ko-0.22",
    "vosk-model-small-fr-0.22",
    "vosk-model-small-de-0.15",
    "vosk-model-small-es-0.42",
    "vosk-model-small-it-0.22",
    "vosk-model-small-pt-0.3",
    "vosk-model-small-ru-0.22",
    "vosk-model-small-hi-0.22"
)

# 批量下载
foreach ($model in $models) {
    $url = "https://alphacephei.com/vosk/models/$model.zip"
    $output = "$model.zip"
    Write-Host "⏬ 下载 $model ..." -ForegroundColor Cyan
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -TimeoutSec 600
        Write-Host "✅ $model 下载完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ $model 下载失败: $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ 所有模型下载完成！" -ForegroundColor Green
Get-ChildItem *.zip | Format-Table Name, @{Name="Size (MB)";Expression={[math]::Round($_.Length/1MB, 2)}}
```

### **步骤3：上传到OSS**

**方法A：使用Web控制台（简单）**

1. 登录OSS控制台
2. 进入你的Bucket
3. 创建文件夹：`vosk-models`
4. 点击"上传文件"
5. 选择所有 `.zip` 文件
6. 点击"开始上传"

**方法B：使用ossutil命令行工具（推荐，更快）**

```powershell
# 1. 下载ossutil
# 访问：https://help.aliyun.com/document_detail/120075.html
# 下载Windows版本

# 2. 配置ossutil
.\ossutil64.exe config
# 输入：
# - Endpoint: oss-cn-beijing.aliyuncs.com (根据你的地区)
# - AccessKeyID: 在阿里云控制台获取
# - AccessKeySecret: 在阿里云控制台获取

# 3. 批量上传
.\ossutil64.exe cp -r D:\vosk-models oss://hi-translator-vosk-models/vosk-models/ --update

# 4. 验证上传
.\ossutil64.exe ls oss://hi-translator-vosk-models/vosk-models/
```

### **步骤4：配置CDN加速（可选但推荐）**

1. **开通CDN服务**
   - 访问：https://cdn.console.aliyun.com/
   - 添加加速域名

2. **配置CDN**
   ```
   加速域名: vosk.yourapp.com
   业务类型: 下载加速
   源站类型: OSS域名
   源站域名: hi-translator-vosk-models.oss-cn-beijing.aliyuncs.com
   ```

3. **DNS配置**
   - 添加CNAME记录指向CDN域名

### **步骤5：更新应用配置**

打开 `config/vosk-models.ts`：

```typescript
export const VOSK_MODEL_SOURCE = {
  OFFICIAL: 'https://alphacephei.com/vosk/models',
  
  // 替换为你的OSS地址
  CUSTOM: 'https://hi-translator-vosk-models.oss-cn-beijing.aliyuncs.com/vosk-models',
  
  // 或者使用CDN地址（更快）
  CDN: 'https://vosk.yourapp.com/vosk-models',
};

// 改为使用你的云存储
export const CURRENT_SOURCE = VOSK_MODEL_SOURCE.CUSTOM; // 或 CDN
```

### **步骤6：测试**

```bash
# 重新构建应用
npx expo prebuild --clean

# 启动应用
npx expo start

# 在应用中测试下载
# 设置 → Vosk语音模型 → 下载任意模型
```

---

## 🚀 **方案2：使用Cloudflare R2（无流量费）**

### **为什么选择R2？**
- ✅ **无流量费** - 只收存储费
- ✅ **全球CDN** - 自带CDN加速
- ✅ **S3兼容** - 使用标准S3 API

### **步骤：**

1. **注册Cloudflare账号**
   - 访问：https://dash.cloudflare.com/
   - 开通R2服务

2. **创建R2 Bucket**
   ```
   Bucket名称: vosk-models
   位置: 自动（全球分布）
   ```

3. **获取访问凭证**
   - 创建API Token
   - 记录 Account ID、Access Key、Secret Key

4. **使用rclone上传**
   ```bash
   # 安装rclone
   # Windows: https://rclone.org/downloads/

   # 配置rclone
   rclone config
   # 选择 Cloudflare R2
   # 输入 Access Key 和 Secret Key

   # 上传文件
   rclone copy D:\vosk-models cloudflare-r2:vosk-models --progress
   ```

5. **设置公开访问**
   - 在R2控制台开启公开访问
   - 获取公开URL：`https://your-account.r2.cloudflarestorage.com/vosk-models/`

6. **更新配置**
   ```typescript
   export const CURRENT_SOURCE = 'https://your-account.r2.cloudflarestorage.com/vosk-models';
   ```

---

## 🚀 **方案3：使用七牛云（有免费额度）**

### **优势：**
- ✅ **10GB免费存储**
- ✅ **10GB/月免费流量**
- ✅ **国内访问快**

### **步骤：**

1. **注册七牛云**
   - 访问：https://www.qiniu.com/
   - 实名认证

2. **创建存储空间**
   ```
   空间名称: vosk-models
   存储区域: 华北
   访问控制: 公开
   ```

3. **上传文件**
   - 使用Web控制台上传
   - 或使用qshell命令行工具

4. **获取外链域名**
   - 七牛会提供测试域名（30天有效）
   - 建议绑定自己的域名

5. **更新配置**
   ```typescript
   export const CURRENT_SOURCE = 'http://your-domain.qiniu.com';
   ```

---

## 💡 **优化建议**

### **1. 压缩模型（可选）**

Vosk模型可以进一步压缩：

```bash
# 使用7zip压缩（比zip更高压缩率）
7z a -tzip -mx=9 vosk-model-small-en-us-0.15-compressed.zip vosk-model-small-en-us-0.15.zip
```

### **2. 添加下载统计**

在OSS中启用访问日志：
- 记录每个文件的下载次数
- 分析用户最常下载的模型
- 优化CDN配置

### **3. 设置缓存策略**

在CDN中配置：
```
缓存时间: 30天
浏览器缓存: 7天
```

### **4. 监控和告警**

设置OSS监控：
- 存储容量告警
- 流量超限告警
- 费用告警

---

## 📊 **成本对比**

假设：
- 总模型大小：500MB
- 1000用户，每人下载2个模型（平均100MB）
- 每月下载量：100GB

| 方案 | 存储费 | 流量费 | 月总计 |
|-----|--------|-------|--------|
| 阿里云OSS | ¥0.06 | ¥50 | ~¥50 |
| 七牛云 | 免费 | ¥28 | ~¥28 |
| Cloudflare R2 | $0.008 | **免费** | ~$0.01 |
| Vosk官方 | 免费 | 免费 | 免费 |

**结论：**
- 🆓 预算有限：继续使用Vosk官方
- 💰 小成本：使用七牛云（免费额度）
- 🚀 大规模：使用Cloudflare R2（无流量费）
- 🇨🇳 国内用户多：使用阿里云OSS（速度快）

---

## 🔧 **切换源的步骤**

1. **编辑配置文件**
   ```typescript
   // config/vosk-models.ts
   export const CURRENT_SOURCE = VOSK_MODEL_SOURCE.CUSTOM;
   ```

2. **重新构建**
   ```bash
   npx expo prebuild --clean
   ```

3. **测试下载**
   - 在应用中下载一个模型
   - 检查下载速度
   - 验证模型可用

4. **回滚（如果需要）**
   ```typescript
   export const CURRENT_SOURCE = VOSK_MODEL_SOURCE.OFFICIAL;
   ```

---

## ⚠️ **注意事项**

1. **版权问题**
   - Vosk模型是开源的（Apache License 2.0）
   - 可以自由分发和托管
   - 建议在应用中注明来源

2. **文件完整性**
   - 上传后验证文件SHA256
   - 确保下载不会损坏

3. **备份**
   - 在本地保留一份完整备份
   - 防止云存储意外删除

4. **安全性**
   - 使用HTTPS
   - 定期检查访问日志
   - 防止热链接滥用

---

## 📝 **快速开始清单**

- [ ] 选择云存储服务
- [ ] 创建Bucket并设置公开读
- [ ] 下载所有Vosk模型到本地
- [ ] 上传模型到云存储
- [ ] 获取公开访问URL
- [ ] 更新 `config/vosk-models.ts`
- [ ] 重新构建应用
- [ ] 测试模型下载
- [ ] （可选）配置CDN加速
- [ ] （可选）设置监控告警

---

## 🆘 **常见问题**

### **Q: 下载速度慢怎么办？**
A: 配置CDN加速，或者选择离用户更近的存储区域。

### **Q: 费用太高怎么办？**
A: 使用Cloudflare R2（无流量费）或继续使用Vosk官方源。

### **Q: 如何回滚到官方源？**
A: 修改 `CURRENT_SOURCE` 为 `VOSK_MODEL_SOURCE.OFFICIAL`，重新构建。

### **Q: 可以同时支持多个源吗？**
A: 可以！在代码中添加降级逻辑，优先尝试自己的云存储，失败时降级到官方源。

---

**祝部署顺利！** 🎉

如有问题，请查看详细日志或联系技术支持。

