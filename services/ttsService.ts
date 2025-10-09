// services/ttsService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

// 获取保存的语音选择
export const getSelectedVoice = async (): Promise<string | null> => {
  try {
    const savedVoiceId = await AsyncStorage.getItem('selectedVoiceId');
    console.log('🔍 获取保存的语音:', savedVoiceId);
    return savedVoiceId;
  } catch (error) {
    console.error('❌ 获取保存的语音失败:', error);
    return null;
  }
};

// 设置语音选择
export const setSelectedVoice = async (voiceId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('selectedVoiceId', voiceId);
    console.log('✅ 语音选择已保存:', voiceId);
  } catch (error) {
    console.error('❌ 保存语音选择失败:', error);
  }
};

// 获取设备支持的所有声音
export const getAvailableVoices = async () => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    console.log('设备支持的声音列表:', voices);
    return voices;
  } catch (error) {
    console.error('获取声音列表失败:', error);
    return [];
  }
};

// 获取真正的男声
export const getMaleVoices = async () => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    
    // 筛选男声相关的voice
    const maleVoices = voices.filter(voice => {
      const name = voice.name?.toLowerCase() || '';
      const identifier = voice.identifier?.toLowerCase() || '';
      
      // 常见的男声标识
      return (
        name.includes('daniel') ||
        name.includes('alex') ||
        name.includes('tom') ||
        name.includes('male') ||
        name.includes('man') ||
        identifier.includes('daniel') ||
        identifier.includes('alex') ||
        identifier.includes('male') ||
        identifier.includes('man')
      );
    });
    
    console.log('找到的男声列表:', maleVoices);
    return maleVoices;
  } catch (error) {
    console.error('获取男声列表失败:', error);
    return [];
  }
};

// 检测文本语言
const detectLanguage = (text: string): string => {
  // 字符检测 - 通过Unicode字符范围检测
  const chineseRegex = /[\u4e00-\u9fff]/;
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
  const koreanRegex = /[\uac00-\ud7af]/;
  const arabicRegex = /[\u0600-\u06ff]/;
  const thaiRegex = /[\u0e00-\u0e7f]/;
  const hindiRegex = /[\u0900-\u097f]/;
  const bengaliRegex = /[\u0980-\u09ff]/;
  const tamilRegex = /[\u0b80-\u0bff]/;
  const teluguRegex = /[\u0c00-\u0c7f]/;
  const malayalamRegex = /[\u0d00-\u0d7f]/;
  const kannadaRegex = /[\u0c80-\u0cff]/;
  const gujaratiRegex = /[\u0a80-\u0aff]/;
  const punjabiRegex = /[\u0a00-\u0a7f]/;
  const sinhalaRegex = /[\u0d80-\u0dff]/;
  const myanmarRegex = /[\u1000-\u109f]/;
  const khmerRegex = /[\u1780-\u17ff]/;
  const laoRegex = /[\u0e80-\u0eff]/;
  const georgianRegex = /[\u10a0-\u10ff]/;
  const armenianRegex = /[\u0530-\u058f]/;
  const cyrillicRegex = /[\u0400-\u04ff]/;
  const greekRegex = /[\u0370-\u03ff]/;
  const hebrewRegex = /[\u0590-\u05ff]/;
  const ethiopicRegex = /[\u1200-\u137f]/;
  const assameseRegex = /[\u0980-\u09ff]/; // 阿萨姆文使用孟加拉文字符
  const oriyaRegex = /[\u0b00-\u0b7f]/; // 奥里亚文
  const pashtoRegex = /[\u0600-\u06ff]/; // 普什图文使用阿拉伯文字符
  const sindhiRegex = /[\u0600-\u06ff]/; // 信德文使用阿拉伯文字符
  const uyghurRegex = /[\u0600-\u06ff]/; // 维吾尔文使用阿拉伯文字符
  
  if (chineseRegex.test(text)) return 'zh-CN';
  if (japaneseRegex.test(text)) return 'ja';
  if (koreanRegex.test(text)) return 'ko';
  if (arabicRegex.test(text)) return 'ar';
  if (thaiRegex.test(text)) return 'th';
  if (hindiRegex.test(text)) return 'hi';
  if (bengaliRegex.test(text)) return 'bn';
  if (tamilRegex.test(text)) return 'ta';
  if (teluguRegex.test(text)) return 'te';
  if (malayalamRegex.test(text)) return 'ml';
  if (kannadaRegex.test(text)) return 'kn';
  if (gujaratiRegex.test(text)) return 'gu';
  if (punjabiRegex.test(text)) return 'pa';
  if (sinhalaRegex.test(text)) return 'si';
  if (myanmarRegex.test(text)) return 'my';
  if (khmerRegex.test(text)) return 'km';
  if (laoRegex.test(text)) return 'lo';
  if (georgianRegex.test(text)) return 'ka';
  if (armenianRegex.test(text)) return 'hy';
  if (cyrillicRegex.test(text)) return 'ru'; // 默认俄文，可进一步检测
  if (greekRegex.test(text)) return 'el';
  if (hebrewRegex.test(text)) return 'he';
  if (ethiopicRegex.test(text)) return 'am';
  if (assameseRegex.test(text)) return 'as';
  if (oriyaRegex.test(text)) return 'or';
  if (pashtoRegex.test(text)) return 'ps';
  if (sindhiRegex.test(text)) return 'sd';
  if (uyghurRegex.test(text)) return 'ug';
  
  // 对于使用拉丁字母的语言，进行关键词检测
  const lowerText = text.toLowerCase();
  
  // 马来文/印尼文特征词
  const malayWords = ['saya', 'anda', 'tidak', 'adalah', 'dengan', 'untuk', 'dari', 'yang', 'ini', 'itu', 'dan', 'atau', 'tetapi', 'jika', 'karena', 'sehingga', 'ketika', 'dimana', 'bagaimana', 'mengapa', 'siapa', 'apa', 'berapa', 'kapan'];
  const malayCount = malayWords.filter(word => lowerText.includes(word)).length;
  if (malayCount >= 2) return 'ms';
  
  // 越南文特征词
  const vietnameseWords = ['tôi', 'bạn', 'không', 'là', 'với', 'cho', 'từ', 'của', 'này', 'đó', 'và', 'hoặc', 'nhưng', 'nếu', 'vì', 'để', 'khi', 'ở', 'như', 'tại', 'sao', 'ai', 'gì', 'bao', 'nhiêu', 'khi', 'nào'];
  const vietnameseCount = vietnameseWords.filter(word => lowerText.includes(word)).length;
  if (vietnameseCount >= 2) return 'vi';
  
  // 法文特征词
  const frenchWords = ['le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'qui', 'quoi', 'dont', 'où', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs'];
  const frenchCount = frenchWords.filter(word => lowerText.includes(word)).length;
  if (frenchCount >= 3) return 'fr';
  
  // 德文特征词
  const germanWords = ['der', 'die', 'das', 'und', 'oder', 'aber', 'denn', 'sondern', 'doch', 'jedoch', 'allein', 'nur', 'auch', 'sogar', 'besonders', 'vor', 'allem', 'zwar', 'aber', 'dennoch', 'trotzdem', 'gleichwohl', 'indes', 'hingegen', 'dagegen', 'dafür', 'dagegen', 'deshalb', 'deswegen', 'daher', 'darum', 'nämlich', 'zwar', 'aber', 'dennoch'];
  const germanCount = germanWords.filter(word => lowerText.includes(word)).length;
  if (germanCount >= 3) return 'de';
  
  // 西班牙文特征词
  const spanishWords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'y', 'o', 'pero', 'sino', 'aunque', 'mientras', 'que', 'quien', 'quienes', 'cuyo', 'cuya', 'cuyos', 'cuyas', 'donde', 'cuando', 'como', 'porque', 'para', 'por', 'con', 'sin', 'sobre', 'bajo', 'entre', 'hasta', 'desde', 'hacia', 'durante', 'mediante', 'según', 'contra', 'tras', 'ante', 'bajo', 'cabe', 'so', 'sobre'];
  const spanishCount = spanishWords.filter(word => lowerText.includes(word)).length;
  if (spanishCount >= 3) return 'es';
  
  // 意大利文特征词
  const italianWords = ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'e', 'o', 'ma', 'però', 'mentre', 'che', 'chi', 'cui', 'dove', 'quando', 'come', 'perché', 'affinché', 'benché', 'sebbene', 'nonostante', 'tuttavia', 'tuttavia', 'però', 'invece', 'anzi', 'piuttosto', 'dunque', 'quindi', 'allora', 'così', 'così', 'tanto', 'molto', 'poco', 'troppo', 'abbastanza', 'più', 'meno', 'meglio', 'peggio', 'bene', 'male'];
  const italianCount = italianWords.filter(word => lowerText.includes(word)).length;
  if (italianCount >= 3) return 'it';
  
  // 葡萄牙文特征词
  const portugueseWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'pelo', 'pela', 'pelos', 'pelas', 'para', 'pelo', 'pela', 'pelos', 'pelas', 'com', 'sem', 'sobre', 'sob', 'entre', 'até', 'desde', 'durante', 'mediante', 'segundo', 'conforme', 'consoante', 'salvo', 'exceto', 'menos', 'fora', 'além', 'aquém', 'através', 'perante', 'ante', 'após', 'antes', 'depois', 'durante', 'enquanto', 'até', 'quando', 'onde', 'como', 'porque', 'para', 'que', 'quem', 'cujo', 'cuja', 'cujos', 'cujas', 'qual', 'quais', 'quanto', 'quanta', 'quantos', 'quantas'];
  const portugueseCount = portugueseWords.filter(word => lowerText.includes(word)).length;
  if (portugueseCount >= 3) return 'pt';
  
  // 俄文特征词（通过西里尔字母检测）
  if (cyrillicRegex.test(text)) {
    const russianWords = ['и', 'в', 'не', 'на', 'я', 'быть', 'с', 'он', 'а', 'как', 'по', 'но', 'они', 'к', 'у', 'мы', 'для', 'что', 'от', 'за', 'из', 'до', 'при', 'со', 'об', 'во', 'без', 'над', 'под', 'через', 'между', 'против', 'около', 'вокруг', 'внутри', 'снаружи', 'перед', 'после', 'во', 'время', 'между', 'тем', 'как', 'пока', 'когда', 'где', 'куда', 'откуда', 'почему', 'зачем', 'как', 'сколько', 'чей', 'чья', 'чьё', 'чьи', 'который', 'которая', 'которое', 'которые', 'что', 'кто', 'чей', 'чья', 'чьё', 'чьи'];
    const russianCount = russianWords.filter(word => lowerText.includes(word)).length;
    if (russianCount >= 2) return 'ru';
  }
  
  return 'en'; // 默认英文
};

// 获取清晰声音设置
const getVoiceSettings = (): { pitch: number; rate: number; language?: string; voice?: string } => {
  return { pitch: 1.0, rate: 0.9 }; // 清晰声音 - 标准音调，语速较快
};

export const playTTS = async (text: string, language?: string, onDone?: () => void, onError?: (error: Error) => void): Promise<void> => {
  // 直接使用Expo的语音播报，更简单稳定
  await playSystemSpeech(text, language, onDone, onError);
};

// 系统语音播报
const playSystemSpeech = async (text: string, language?: string, onDone?: () => void, onError?: (error: Error) => void): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const voiceSettings = getVoiceSettings();
      
      // 使用原始语言检测
      const detectedLanguage = language || detectLanguage(text);
      const speechLanguage = getSpeechLanguage(detectedLanguage);
      
      console.log('使用Expo语音播报:', speechLanguage, '音调:', voiceSettings.pitch, '语速:', voiceSettings.rate);
      
      const speechOptions: any = {
        language: speechLanguage,
        pitch: voiceSettings.pitch,
        rate: voiceSettings.rate,
        volume: 1.0,
        onDone: () => {
          console.log('语音播报完成');
          onDone?.();
          resolve();
        },
        onError: (error: any) => {
          console.error('Expo语音播报失败:', error);
          onError?.(error);
          reject(error);
        }
      };

      // 系统自动选择最佳语音，无需用户干预
      console.log('🌐 系统自动选择最佳语音');

      Speech.speak(text, speechOptions);
      
      console.log('语音播报开始');
    } catch (error) {
      console.error('Expo语音播报初始化失败:', error);
      onError?.(error as Error);
      reject(error);
    }
  });
};

// 将语言代码转换为expo-speech支持的语言代码
const getSpeechLanguage = (languageCode: string): string => {
  const languageMap: Record<string, string> = {
    // 亚洲语言
    'zh-CN': 'zh-CN',
    'zh': 'zh-CN',
    'zh-TW': 'zh-TW', // 繁体中文
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'th': 'th-TH',
    'vi': 'vi-VN',
    'ms': 'ms-MY', // 马来文
    'id': 'id-ID', // 印尼文
    'hi': 'hi-IN', // 印地文
    'ar': 'ar-SA', // 阿拉伯文
    'fa': 'fa-IR', // 波斯文
    'bn': 'bn-BD', // 孟加拉文
    'ur': 'ur-PK', // 乌尔都文
    'ta': 'ta-IN', // 泰米尔文
    'te': 'te-IN', // 泰卢固文
    'ml': 'ml-IN', // 马拉雅拉姆文
    'kn': 'kn-IN', // 卡纳达文
    'gu': 'gu-IN', // 古吉拉特文
    'pa': 'pa-IN', // 旁遮普文
    'si': 'si-LK', // 僧伽罗文
    'my': 'my-MM', // 缅甸文
    'km': 'km-KH', // 高棉文
    'lo': 'lo-LA', // 老挝文
    'as': 'as-IN', // 阿萨姆文
    'or': 'or-IN', // 奥里亚文
    'ps': 'ps-AF', // 普什图文
    'sd': 'sd-PK', // 信德文
    'tl': 'tl-PH', // 菲律宾文
    'ug': 'ug-CN', // 维吾尔文
    
    // 欧洲语言
    'en': 'en-US',
    'en-US': 'en-US',
    'en-GB': 'en-GB', // 英式英文
    'fr': 'fr-FR',
    'de': 'de-DE',
    'es': 'es-ES',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'ru': 'ru-RU',
    'nl': 'nl-NL',
    'sv': 'sv-SE',
    'no': 'no-NO',
    'da': 'da-DK',
    'fi': 'fi-FI',
    'pl': 'pl-PL',
    'cs': 'cs-CZ',
    'hu': 'hu-HU',
    'tr': 'tr-TR',
    'el': 'el-GR',
    'he': 'he-IL',
    'bg': 'bg-BG',
    'ro': 'ro-RO',
    'hr': 'hr-HR',
    'sk': 'sk-SK', // 斯洛伐克文
    'sl': 'sl-SI', // 斯洛文尼亚文
    'et': 'et-EE', // 爱沙尼亚文
    'lv': 'lv-LV', // 拉脱维亚文
    'lt': 'lt-LT', // 立陶宛文
    'uk': 'uk-UA', // 乌克兰文
    'sr': 'sr-RS', // 塞尔维亚文
    'mk': 'mk-MK', // 马其顿文
    'sq': 'sq-AL', // 阿尔巴尼亚文
    'mt': 'mt-MT', // 马耳他文
    'is': 'is-IS', // 冰岛文
    'ga': 'ga-IE', // 爱尔兰文
    'cy': 'cy-GB', // 威尔士文
    'eu': 'eu-ES', // 巴斯克文
    'ca': 'ca-ES', // 加泰罗尼亚文
    'gl': 'gl-ES', // 加利西亚文
    'be': 'be-BY', // 白俄罗斯文
    'bs': 'bs-BA', // 波斯尼亚文
    
    // 非洲语言
    'sw': 'sw-KE', // 斯瓦希里文
    'am': 'am-ET', // 阿姆哈拉文
    'zu': 'zu-ZA', // 祖鲁文
    'xh': 'xh-ZA', // 科萨文
    'af': 'af-ZA', // 南非荷兰文
    'ha': 'ha-NG', // 豪萨文
    'ig': 'ig-NG', // 伊博文
    'yo': 'yo-NG', // 约鲁巴文
    
    // 其他语言
    'ne': 'ne-NP', // 尼泊尔文
    'ka': 'ka-GE', // 格鲁吉亚文
    'hy': 'hy-AM', // 亚美尼亚文
    'az': 'az-AZ', // 阿塞拜疆文
    'kk': 'kk-KZ', // 哈萨克文
    'ky': 'ky-KG', // 吉尔吉斯文
    'uz': 'uz-UZ', // 乌兹别克文
    'tg': 'tg-TJ', // 塔吉克文
    'mn': 'mn-MN', // 蒙古文
    'bo': 'bo-CN', // 藏文
  };
  
  return languageMap[languageCode] || 'en-US'; // 默认英文
};
