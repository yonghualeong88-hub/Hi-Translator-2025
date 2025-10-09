// 语音翻译API - 整合语音识别、翻译和TTS功能
import formidable from 'formidable';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Next.js 自动加载环境变量，无需手动配置

// 禁用Next.js默认的bodyParser，让我们手动处理multipart数据
export const config = {
  api: {
    bodyParser: false,
  },
};

// OpenAI客户端 - 添加环境变量检查
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY 环境变量未设置');
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 语言代码映射
const LANGUAGE_MAP: Record<string, string> = {
  'zh': 'Chinese',
  'en': 'English',
  'ja': 'Japanese',
  'ko': 'Korean',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'ms': 'Malay',
  'tl': 'Filipino',
  'tr': 'Turkish',
  'pl': 'Polish',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'ro': 'Romanian',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'et': 'Estonian',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
};

// 语言代码转换函数
function convertToWhisperLanguageCode(langCode: string): string {
  const mapping: Record<string, string> = {
    'zh-CN': 'zh',
    'zh-TW': 'zh',
    'en-US': 'en',
    'en-GB': 'en',
    'ja-JP': 'ja',
    'ko-KR': 'ko',
    'es-ES': 'es',
    'fr-FR': 'fr',
    'de-DE': 'de',
    'it-IT': 'it',
    'pt-PT': 'pt',
    'ru-RU': 'ru',
    'ar-SA': 'ar',
    'hi-IN': 'hi',
    'th-TH': 'th',
    'vi-VN': 'vi',
    'id-ID': 'id',
    'ms-MY': 'ms',
    'tl-PH': 'tl',
    'tr-TR': 'tr',
    'pl-PL': 'pl',
    'nl-NL': 'nl',
    'sv-SE': 'sv',
    'da-DK': 'da',
    'no-NO': 'no',
    'fi-FI': 'fi',
    'cs-CZ': 'cs',
    'hu-HU': 'hu',
    'ro-RO': 'ro',
    'bg-BG': 'bg',
    'hr-HR': 'hr',
    'sk-SK': 'sk',
    'sl-SI': 'sl',
    'et-EE': 'et',
    'lv-LV': 'lv',
    'lt-LT': 'lt',
  };
  
  return mapping[langCode] || langCode;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎤 开始处理语音翻译请求');

    // 解析multipart表单数据
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    console.log('📋 表单字段:', fields);
    console.log('📁 文件信息:', Object.keys(files));

    const audioFile = Array.isArray(files.file) ? files.file[0] : files.file;
    const sourceLang = Array.isArray(fields.sourceLang) ? fields.sourceLang[0] : fields.sourceLang;
    const targetLang = Array.isArray(fields.targetLang) ? fields.targetLang[0] : fields.targetLang;

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    if (!sourceLang) {
      return res.status(400).json({ error: 'No source language provided' });
    }

    if (!targetLang) {
      return res.status(400).json({ error: 'No target language provided' });
    }

    console.log('🎵 音频文件:', {
      originalFilename: audioFile.originalFilename,
      filepath: audioFile.filepath,
      mimetype: audioFile.mimetype,
      size: audioFile.size
    });

    // 1️⃣ 语音识别（Whisper）
    console.log('🔍 开始语音识别...');
    
    // 创建临时文件，确保有正确的扩展名
    const tempFilePath = audioFile.filepath + '.m4a';
    fs.copyFileSync(audioFile.filepath, tempFilePath);
    
    const audioStream = fs.createReadStream(tempFilePath);
    
    // 添加超时设置
    const transcriptPromise = openai.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-1",
      language: convertToWhisperLanguageCode(sourceLang),
    });
    
    // 设置30秒超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API timeout after 30 seconds')), 30000);
    });
    
    const transcript = await Promise.race([transcriptPromise, timeoutPromise]) as { text: string; language?: string };

    const sourceText = transcript.text;
    const detectedLang = transcript.language;

    console.log('✅ 语音识别完成:', {
      sourceText,
      detectedLang,
      sourceLang,
      targetLang
    });

    // 检查识别到的文本是否有效
    if (!sourceText || sourceText.trim().length < 2) {
      return res.status(400).json({ 
        error: 'No valid speech detected',
        sourceText: sourceText || ''
      });
    }

    // 检查是否是无效的重复文本（如"..."）
    const trimmedText = sourceText.trim();
    if (trimmedText === '...' || 
        trimmedText.match(/^\.{3,}$/) || // 3个或更多点
        trimmedText.match(/^(\.\s*){3,}$/) || // 重复的". "
        trimmedText.toLowerCase().includes('thank you for watching') ||
        trimmedText.toLowerCase().includes('thanks for watching') ||
        trimmedText.toLowerCase().includes('谢谢观看')) {
      return res.status(400).json({ 
        error: 'Invalid speech content detected',
        sourceText: trimmedText
      });
    }

    // 2️⃣ 翻译（GPT-4o-mini）
    console.log('🌐 开始翻译...');
    
    const sourceLangName = LANGUAGE_MAP[detectedLang] || detectedLang;
    const targetLangName = LANGUAGE_MAP[targetLang] || targetLang;

    const translationPromise = openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following ${sourceLangName} text into ${targetLangName}. Keep it natural and accurate. Return only the translated text, nothing else.`
        },
        { 
          role: "user", 
          content: sourceText 
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });
    
    // 设置20秒超时
    const translationTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Translation API timeout after 20 seconds')), 20000);
    });
    
    const translation = await Promise.race([translationPromise, translationTimeoutPromise]);

    const translatedText = translation.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error('No translation received from OpenAI');
    }

    console.log('✅ 翻译完成:', translatedText);

    // 3️⃣ TTS由前端系统处理

    // 清理临时文件
    try {
      fs.unlinkSync(audioFile.filepath);
      fs.unlinkSync(tempFilePath);
    } catch (cleanupError) {
      console.warn('清理临时文件失败:', cleanupError);
    }

    // 返回结果
    const result = {
      success: true,
      data: {
        sourceText,
        detectedLang,
        translatedText,
        confidence: 0.95,
        sourceLanguage: detectedLang,
        targetLanguage: targetLang,
      }
    };

    console.log('🎉 语音翻译完成');
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ 语音翻译失败:', error);
    
    // 清理临时文件
    try {
      if (req.files?.file) {
        const audioFile = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
        if (audioFile.filepath) {
          fs.unlinkSync(audioFile.filepath);
        }
      }
    } catch (cleanupError) {
      console.warn('清理临时文件失败:', cleanupError);
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'VOICE_TRANSLATION_ERROR',
        message: error instanceof Error ? error.message : 'Voice translation failed',
      },
    });
  }
}
