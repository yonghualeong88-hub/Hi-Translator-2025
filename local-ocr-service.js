// 本地 OCR 服务 - 作为 OCR.space API 的替代方案
const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// 启用 CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// OCR 处理端点
app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    console.log('📸 收到 OCR 请求');
    
    if (!req.file) {
      return res.status(400).json({ error: '没有上传图片文件' });
    }

    const imagePath = req.file.path;
    console.log('🖼️ 处理图片:', imagePath);

    // 使用 Tesseract.js 进行 OCR
    const { data: { text, words } } = await Tesseract.recognize(
      imagePath,
      'eng+chi_sim', // 支持英文和简体中文
      {
        logger: m => console.log('🔍 OCR 进度:', m)
      }
    );

    console.log('✅ OCR 识别完成');

    // 清理上传的文件
    fs.unlinkSync(imagePath);

    // 格式化响应数据
    const response = {
      ParsedResults: [{
        TextOverlay: {
          Lines: words.map((word, index) => ({
            LineText: word.text,
            Words: [{
              WordText: word.text,
              Left: word.bbox.x0,
              Top: word.bbox.y0,
              Width: word.bbox.x1 - word.bbox.x0,
              Height: word.bbox.y1 - word.bbox.y0
            }]
          }))
        },
        ParsedText: text
      }],
      OCRExitCode: 1,
      IsErroredOnProcessing: false,
      ProcessingTimeInMilliseconds: "1000"
    };

    res.json(response);

  } catch (error) {
    console.error('❌ OCR 处理错误:', error);
    res.status(500).json({ 
      error: 'OCR 处理失败',
      message: error.message 
    });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'local-ocr' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 本地 OCR 服务已启动: http://localhost:${port}`);
  console.log(`📡 OCR 端点: http://localhost:${port}/api/ocr`);
  console.log(`💚 健康检查: http://localhost:${port}/health`);
});

module.exports = app;
