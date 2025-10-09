// 简单的 API Key 配置脚本
const fs = require('fs');
const path = require('path');

function configureAPIKey() {
  console.log('🔧 Google Vision API Key 配置助手\n');
  
  console.log('请按照以下步骤获取 Google Vision API Key:');
  console.log('1. 访问: https://console.cloud.google.com/');
  console.log('2. 创建或选择项目');
  console.log('3. 启用 Vision API (在 API 库中搜索 "Vision API")');
  console.log('4. 创建 API 密钥 (在凭据页面)');
  console.log('5. 复制以 "AIzaSy" 开头的 API 密钥\n');
  
  console.log('获取 API Key 后，请手动编辑 .env 文件：');
  console.log('将以下行：');
  console.log('GOOGLE_VISION_API_KEY=your_google_vision_api_key_here');
  console.log('替换为：');
  console.log('GOOGLE_VISION_API_KEY=您的实际API密钥\n');
  
  // 检查当前 .env 文件状态
  const envPath = path.join(__dirname, '../.env');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('GOOGLE_VISION_API_KEY=your_google_vision_api_key_here')) {
      console.log('📝 当前状态: Google Vision API Key 未配置');
      console.log('请按照上述步骤配置 API Key\n');
    } else if (envContent.includes('GOOGLE_VISION_API_KEY=AIzaSy')) {
      console.log('✅ 当前状态: Google Vision API Key 已配置');
      console.log('运行测试: node scripts/test-ocr-api.js\n');
    } else {
      console.log('⚠️  当前状态: Google Vision API Key 配置状态未知');
      console.log('请检查 .env 文件中的 GOOGLE_VISION_API_KEY 设置\n');
    }
  } else {
    console.log('❌ 找不到 .env 文件');
    console.log('请从 env.template 复制创建 .env 文件\n');
  }
  
  console.log('配置完成后，请运行以下命令测试：');
  console.log('node scripts/test-ocr-api.js\n');
  
  console.log('如果测试成功，您可以：');
  console.log('1. 访问 http://localhost:3000/ocr-test 测试 OCR 功能');
  console.log('2. 访问 http://localhost:3000/camera-translate 使用相机翻译');
  console.log('3. 确保后端服务器正在运行: cd backend && npm run dev');
}

configureAPIKey();
