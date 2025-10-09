import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phrase, lang } = req.body;

    if (!phrase || !phrase.trim()) {
      return res.status(400).json({ error: 'Phrase is required' });
    }

    // 获取目标语言信息 - 支持83种语言
    const getLanguageInfo = (langCode: string) => {
      const languages: { [key: string]: { name: string, nativeName: string } } = {
        // 自动检测
        'auto': { name: 'Auto Detect', nativeName: '自动检测' },
        // 主要语言
        'en': { name: 'English', nativeName: 'English' },
        'zh-CN': { name: 'Chinese (Simplified)', nativeName: '中文' },
        'zh-TW': { name: 'Chinese (Traditional)', nativeName: '繁體中文' },
        'ja': { name: 'Japanese', nativeName: '日本語' },
        'ko': { name: 'Korean', nativeName: '한국어' },
        'es': { name: 'Spanish', nativeName: 'Español' },
        'fr': { name: 'French', nativeName: 'Français' },
        'de': { name: 'German', nativeName: 'Deutsch' },
        'it': { name: 'Italian', nativeName: 'Italiano' },
        'pt': { name: 'Portuguese', nativeName: 'Português' },
        'ru': { name: 'Russian', nativeName: 'Русский' },
        'ar': { name: 'Arabic', nativeName: 'العربية' },
        'hi': { name: 'Hindi', nativeName: 'हिन्दी' },
        // 亚洲语言
        'th': { name: 'Thai', nativeName: 'ไทย' },
        'vi': { name: 'Vietnamese', nativeName: 'Tiếng Việt' },
        'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
        'ms': { name: 'Malay', nativeName: 'Bahasa Melayu' },
        'tl': { name: 'Filipino', nativeName: 'Filipino' },
        'km': { name: 'Khmer', nativeName: 'ខ្មែរ' },
        'lo': { name: 'Lao', nativeName: 'ລາວ' },
        'my': { name: 'Burmese', nativeName: 'မြန်မာ' },
        // 南亚语言
        'bn': { name: 'Bengali', nativeName: 'বাংলা' },
        'ta': { name: 'Tamil', nativeName: 'தமிழ்' },
        'te': { name: 'Telugu', nativeName: 'తెలుగు' },
        'gu': { name: 'Gujarati', nativeName: 'ગુજરાતી' },
        'kn': { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
        'ml': { name: 'Malayalam', nativeName: 'മലയാളം' },
        'pa': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
        'or': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
        'as': { name: 'Assamese', nativeName: 'অসমীয়া' },
        'ne': { name: 'Nepali', nativeName: 'नेपाली' },
        'si': { name: 'Sinhala', nativeName: 'සිංහල' },
        'ur': { name: 'Urdu', nativeName: 'اردو' },
        // 欧洲语言
        'nl': { name: 'Dutch', nativeName: 'Nederlands' },
        'sv': { name: 'Swedish', nativeName: 'Svenska' },
        'da': { name: 'Danish', nativeName: 'Dansk' },
        'no': { name: 'Norwegian', nativeName: 'Norsk' },
        'fi': { name: 'Finnish', nativeName: 'Suomi' },
        'pl': { name: 'Polish', nativeName: 'Polski' },
        'cs': { name: 'Czech', nativeName: 'Čeština' },
        'sk': { name: 'Slovak', nativeName: 'Slovenčina' },
        'hu': { name: 'Hungarian', nativeName: 'Magyar' },
        'ro': { name: 'Romanian', nativeName: 'Română' },
        'bg': { name: 'Bulgarian', nativeName: 'Български' },
        'hr': { name: 'Croatian', nativeName: 'Hrvatski' },
        'sr': { name: 'Serbian', nativeName: 'Српски' },
        'bs': { name: 'Bosnian', nativeName: 'Bosanski' },
        'sl': { name: 'Slovenian', nativeName: 'Slovenščina' },
        'mk': { name: 'Macedonian', nativeName: 'Македонски' },
        'sq': { name: 'Albanian', nativeName: 'Shqip' },
        'el': { name: 'Greek', nativeName: 'Ελληνικά' },
        'tr': { name: 'Turkish', nativeName: 'Türkçe' },
        'ca': { name: 'Catalan', nativeName: 'Català' },
        'eu': { name: 'Basque', nativeName: 'Euskera' },
        'gl': { name: 'Galician', nativeName: 'Galego' },
        'is': { name: 'Icelandic', nativeName: 'Íslenska' },
        'ga': { name: 'Irish', nativeName: 'Gaeilge' },
        'cy': { name: 'Welsh', nativeName: 'Cymraeg' },
        'mt': { name: 'Maltese', nativeName: 'Malti' },
        // 东欧语言
        'be': { name: 'Belarusian', nativeName: 'Беларуская' },
        'uk': { name: 'Ukrainian', nativeName: 'Українська' },
        'lt': { name: 'Lithuanian', nativeName: 'Lietuvių' },
        'lv': { name: 'Latvian', nativeName: 'Latviešu' },
        'et': { name: 'Estonian', nativeName: 'Eesti' },
        // 中亚语言
        'kk': { name: 'Kazakh', nativeName: 'Қазақ' },
        'ky': { name: 'Kyrgyz', nativeName: 'Кыргыз' },
        'uz': { name: 'Uzbek', nativeName: 'Oʻzbek' },
        'tg': { name: 'Tajik', nativeName: 'Тоҷикӣ' },
        'mn': { name: 'Mongolian', nativeName: 'Монгол' },
        'ug': { name: 'Uyghur', nativeName: 'ئۇيغۇرچە' },
        // 中东语言
        'he': { name: 'Hebrew', nativeName: 'עברית' },
        'fa': { name: 'Persian', nativeName: 'فارسی' },
        'ps': { name: 'Pashto', nativeName: 'پښتو' },
        'sd': { name: 'Sindhi', nativeName: 'سنڌي' },
        // 非洲语言
        'sw': { name: 'Swahili', nativeName: 'Kiswahili' },
        'ha': { name: 'Hausa', nativeName: 'Hausa' },
        'ig': { name: 'Igbo', nativeName: 'Igbo' },
        'yo': { name: 'Yoruba', nativeName: 'Yorùbá' },
        'xh': { name: 'Xhosa', nativeName: 'IsiXhosa' },
        'zu': { name: 'Zulu', nativeName: 'IsiZulu' },
        'af': { name: 'Afrikaans', nativeName: 'Afrikaans' },
        // 高加索语言
        'hy': { name: 'Armenian', nativeName: 'Հայերեն' },
        'ka': { name: 'Georgian', nativeName: 'ქართული' },
        'az': { name: 'Azerbaijani', nativeName: 'Azərbaycan' },
        // 其他语言
        'am': { name: 'Amharic', nativeName: 'አማርኛ' },
        'bo': { name: 'Tibetan', nativeName: 'བོད་ཡིག' }
      };
      return languages[langCode] || { name: langCode, nativeName: langCode };
    };

    const targetLang = req.body.toLanguage || 'en';
    const sourceLang = req.body.lang || 'auto';
    const targetLangInfo = getLanguageInfo(targetLang);
    
    // 处理自动检测语言
    const sourceLangInfo = sourceLang === 'auto' 
      ? { name: 'Auto Detect', nativeName: '自动检测' }
      : getLanguageInfo(sourceLang);

    const prompt = `你是一个专业的语言学习助手。请根据用户输入的短语生成相关的常用表达方式。

要求：
1. 输出严格的 JSON 数组格式，不要包含任何其他文字。
2. 数组结构：
   - "scene": 场景名称（使用用户源语言，基于用户输入的短语主题生成一个统一的场景名称）
   - "phrases": 短语数组（使用目标语言，5-8 个自然、地道、实用的短语，都与用户输入的主题相关）
   - "translations": 翻译数组（与 phrases 一一对应，用用户母语或指定目标语言表达，保证自然准确）

3. 只生成一个场景，场景名称基于用户输入的短语主题。
4. 生成 5-8 个与用户输入短语主题相关的不同表达方式，短语要多样化但都围绕同一主题。
5. 短语要自然、地道、实用，适合口语使用。
6. 翻译要准确、自然，符合目标语言表达习惯。

用户输入: "${phrase}" 
源语言: ${sourceLangInfo.nativeName}
目标语言: ${targetLangInfo.nativeName}

严格返回 JSON 示例：
[
  {
    "scene": "源语言场景名称",
    "phrases": 源语言短语数组（用户输入语言）
    "translations": 目标语言短语数组（学习要用的语言）

    
  }
]`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // 尝试解析JSON
    let parsedContent;
    try {
      // 清理响应内容，移除可能的markdown代码块标记
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedContent = JSON.parse(cleanContent);
      
      // 验证数据结构
      if (!Array.isArray(parsedContent)) {
        throw new Error('Response is not an array');
      }
      
      // 验证每个元素的结构
      parsedContent.forEach((item, index) => {
        if (!item.scene || !Array.isArray(item.phrases) || !Array.isArray(item.translations)) {
          throw new Error(`Invalid structure at index ${index}`);
        }
        if (item.phrases.length !== item.translations.length) {
          throw new Error(`Mismatched arrays at index ${index}`);
        }
      });
      
      console.log('✅ OpenAI response parsed successfully');
      
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw content:', content);
      
      // 如果解析失败，返回默认数据
      parsedContent = [
        {
          scene: '餐厅',
          phrases: ['Can I get a glass of water, please?', 'Still or sparkling water?'],
          translations: ['请给我一杯水', '要矿泉水还是气泡水？']
        },
        {
          scene: '机场',
          phrases: ['Where can I get drinking water?', 'Is there a water fountain nearby?'],
          translations: ['哪里可以买到饮用水？', '附近有饮水机吗？']
        },
        {
          scene: '紧急情况',
          phrases: ['I need water, please.', 'Do you have bottled water?'],
          translations: ['我需要水', '你有瓶装水吗？']
        }
      ];
    }

    res.status(200).json(parsedContent);
  } catch (error) {
    console.error('❌ Expand phrase error:', error);
    
    // 根据错误类型返回不同的响应
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.error('🔑 OpenAI API key error');
        return res.status(500).json({ 
          error: 'OpenAI API key configuration error',
          fallback: true 
        });
      } else if (error.message.includes('rate limit')) {
        console.error('⏰ OpenAI rate limit exceeded');
        return res.status(429).json({ 
          error: 'Rate limit exceeded, please try again later',
          fallback: true 
        });
      }
    }
    
    // 返回默认数据作为fallback
    const fallbackData = [
      {
        scene: '餐厅',
        phrases: ['Can I get a glass of water, please?', 'Still or sparkling water?'],
        translations: ['请给我一杯水', '要矿泉水还是气泡水？']
      },
      {
        scene: '机场',
        phrases: ['Where can I get drinking water?', 'Is there a water fountain nearby?'],
        translations: ['哪里可以买到饮用水？', '附近有饮水机吗？']
      },
      {
        scene: '紧急情况',
        phrases: ['I need water, please.', 'Do you have bottled water?'],
        translations: ['我需要水', '你有瓶装水吗？']
      }
    ];
    
    console.log('🔄 Returning fallback data');
    res.status(200).json(fallbackData);
  }
}
