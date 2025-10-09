// pages/api/speech-to-text.ts
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Next.js 自动加载环境变量，无需手动配置

// 配置 API 路由
export const config = {
  api: {
    bodyParser: false, // 禁用默认的 bodyParser，使用 formidable 处理文件上传
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Speech-to-Text 封装函数
 * @param {string} filePath - 音频文件路径
 * @param {string} language - 用户选择的语言 (例如 "en" | "ms" | "zh")
 * @returns {Promise<string>} 转写结果
 */
async function transcribeAudio(filePath: string, language: string = "en"): Promise<string> {
  try {
    console.log(`开始语音识别，文件: ${filePath}, 语言: ${language}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`音频文件不存在: ${filePath}`);
    }
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language, // 固定语言，避免误判
    });

    console.log('Whisper 识别结果:', transcription.text);
    return transcription.text;
  } catch (error) {
    console.error("语音识别失败:", error);
    console.error("错误详情:", {
      message: (error as any).message,
      code: (error as any).code,
      status: (error as any).status,
      filePath,
      language
    });
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { message: '只支持POST请求' } });
  }

  try {
    console.log('=== 收到语音识别请求 ===');
    console.log('请求方法:', req.method);
    console.log('请求头:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);

    const form = new IncomingForm({ maxFileSize: 25 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);
    
    console.log('解析后的字段:', fields);
    console.log('解析后的文件:', files);

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ success: false, error: { message: '没有找到音频文件' } });
    }

    console.log('调用 Whisper API，文件路径:', file.filepath);
    console.log('文件信息:', {
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size
    });

    // 获取语言参数 - 从fields中获取
    const language = fields.language?.[0] || 'en';
    console.log('=== 语音识别请求详情 ===');
    console.log('用户选择的语言:', language);
    console.log('文件信息:', {
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size
    });
    console.log('========================');

    // 创建一个带正确扩展名的临时文件
    const tempFilePath = file.filepath + '.m4a';
    fs.copyFileSync(file.filepath, tempFilePath);
    
    console.log('创建临时文件:', tempFilePath);
    
    // 使用带扩展名的临时文件进行语音识别
    const transcriptionText = await transcribeAudio(tempFilePath, language);

    // 清理临时文件
    try { 
      fs.unlinkSync(file.filepath); 
      fs.unlinkSync(tempFilePath);
    } catch {}

    return res.status(200).json({
      success: true,
      data: {
        text: transcriptionText,
        confidence: 0.9,
      },
    });
  } catch (error) {
    console.error('=== 语音识别失败详情 ===');
    console.error('错误类型:', typeof error);
    console.error('错误信息:', error);
    console.error('错误堆栈:', (error as any).stack);
    console.error('========================');
    
    return res.status(500).json({
      success: false,
      error: { 
        message: error instanceof Error ? error.message : String(error),
        type: typeof error
      },
    });
  }
}