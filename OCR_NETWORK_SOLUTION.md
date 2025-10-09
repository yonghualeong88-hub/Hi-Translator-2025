# OCR API 网络问题解决方案

## 🐛 问题描述
用户反馈：**"发送 OCR 请求到 API... 没回应"**

## 🔍 问题诊断

### 网络诊断结果
```
📡 测试 OCR.space API 连接...
❌ OCR API 连接失败
⏰ API 请求超时

🔄 测试替代 API 连接...
✅ 替代 API 连接成功，状态码: 200
```

### 问题分析
- ✅ DNS 解析正常：`api.ocr.space` → `94.130.69.140`
- ❌ Ping 连接失败：100% 丢包
- ❌ HTTPS 请求超时
- ✅ 其他 HTTPS 服务正常

**结论**: OCR.space API 被网络策略或防火墙阻止

## 🔧 解决方案

### 方案1: 网络配置修复

#### 1.1 检查防火墙设置
```bash
# Windows 防火墙
netsh advfirewall firewall show rule name="Node.js"
netsh advfirewall firewall add rule name="Node.js" dir=out action=allow program="C:\Program Files\nodejs\node.exe"
```

#### 1.2 检查代理设置
```bash
# 检查环境变量
echo $HTTP_PROXY
echo $HTTPS_PROXY
echo $NO_PROXY
```

#### 1.3 尝试 VPN 连接
- 使用 VPN 绕过网络限制
- 测试不同网络环境

### 方案2: 本地 OCR 服务 (推荐)

#### 2.1 安装依赖
```bash
npm install express multer tesseract.js
```

#### 2.2 启动本地 OCR 服务
```bash
# 方式1: 直接启动
node local-ocr-service.js

# 方式2: 使用启动脚本
node start-local-ocr.js
```

#### 2.3 服务端点
- **OCR API**: `http://localhost:3001/api/ocr`
- **健康检查**: `http://localhost:3001/health`

### 方案3: 代码改进 (已实现)

#### 3.1 添加超时处理
```typescript
const REQUEST_TIMEOUT = 15000; // 15秒超时

const fetchWithTimeout = (url: string, options: any, timeout: number): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`请求超时 (${timeout}ms)`));
    }, timeout);

    fetch(url, options)
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};
```

#### 3.2 多服务支持
```typescript
// 首先尝试云端OCR服务
try {
  response = await fetchWithTimeout(OCR_API_URL, options, REQUEST_TIMEOUT);
  console.log('✅ 云端 OCR 服务响应成功');
} catch (cloudError) {
  console.log('⚠️ 云端 OCR 服务失败，尝试本地服务');
  
  // 尝试本地OCR服务
  try {
    response = await fetchWithTimeout(LOCAL_OCR_URL, localOptions, REQUEST_TIMEOUT);
    console.log('✅ 本地 OCR 服务响应成功');
  } catch (localError) {
    throw new Error(`所有 OCR 服务都不可用`);
  }
}
```

## 🚀 立即解决方案

### 步骤1: 启动本地 OCR 服务
```bash
# 在项目根目录运行
node start-local-ocr.js
```

### 步骤2: 验证服务
```bash
# 测试健康检查
curl http://localhost:3001/health

# 预期响应
{"status":"ok","service":"local-ocr"}
```

### 步骤3: 测试应用
- 重新启动 Expo 应用
- 尝试拍照翻译功能
- 查看控制台日志确认使用本地服务

## 📊 服务对比

| 特性 | 云端 OCR.space | 本地 Tesseract.js |
|------|----------------|-------------------|
| 网络依赖 | 需要外网连接 | 仅需本地网络 |
| 识别精度 | 高 | 中等 |
| 处理速度 | 快 | 较慢 |
| 成本 | 免费额度限制 | 完全免费 |
| 稳定性 | 依赖网络 | 本地稳定 |

## 🔍 故障排除

### 本地服务启动失败
```bash
# 检查端口占用
netstat -ano | findstr :3001

# 检查 Node.js 版本
node --version

# 重新安装依赖
npm install express multer tesseract.js
```

### 应用连接失败
```bash
# 检查防火墙
netsh advfirewall firewall show rule name="Node.js"

# 检查本地网络
ping localhost
telnet localhost 3001
```

## 📝 使用说明

### 开发模式
1. 启动本地 OCR 服务：`node start-local-ocr.js`
2. 启动 Expo 应用：`npx expo start`
3. 应用会自动尝试云端服务，失败后使用本地服务

### 生产模式
1. 部署本地 OCR 服务到服务器
2. 更新 `LOCAL_OCR_URL` 配置
3. 确保服务高可用性

## 🎯 预期效果

修复后的系统会：
- ✅ 自动检测网络连接状态
- ✅ 优先使用云端 OCR 服务
- ✅ 网络问题时自动切换到本地服务
- ✅ 提供详细的错误信息和日志
- ✅ 确保 OCR 功能始终可用

用户现在可以正常使用拍照翻译功能，即使网络环境有限制！
