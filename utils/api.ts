// utils/api.ts
import { API_BASE, API_TIMEOUT } from '../config/api';

const fetchWithTimeout = (url: string, options: RequestInit, timeout = API_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]);
};

// 生成fallback数据的函数
const generateFallbackData = (inputPhrase: string) => {
  const lowerPhrase = inputPhrase.toLowerCase();
  
  if (lowerPhrase.includes('water') || lowerPhrase.includes('水')) {
    return [
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
  } else if (lowerPhrase.includes('food') || lowerPhrase.includes('eat') || lowerPhrase.includes('吃')) {
    return [
      {
        scene: '餐厅',
        phrases: ['I would like to order food.', 'What do you recommend?'],
        translations: ['我想点餐', '你有什么推荐吗？']
      },
      {
        scene: '超市',
        phrases: ['Where can I find food?', 'Do you have fresh food?'],
        translations: ['哪里可以找到食物？', '你们有新鲜的食物吗？']
      },
      {
        scene: '紧急情况',
        phrases: ['I need food.', 'I am hungry.'],
        translations: ['我需要食物', '我饿了']
      }
    ];
  } else if (lowerPhrase.includes('help') || lowerPhrase.includes('帮助')) {
    return [
      {
        scene: '紧急情况',
        phrases: ['I need help.', 'Can you help me?'],
        translations: ['我需要帮助', '你能帮助我吗？']
      },
      {
        scene: '商店',
        phrases: ['Could you help me find something?', 'I need assistance.'],
        translations: ['你能帮我找东西吗？', '我需要协助']
      },
      {
        scene: '医院',
        phrases: ['I need medical help.', 'Please help me.'],
        translations: ['我需要医疗帮助', '请帮助我']
      }
    ];
  } else if (lowerPhrase.includes('bathroom') || lowerPhrase.includes('toilet') || lowerPhrase.includes('厕所')) {
    return [
      {
        scene: '公共场所',
        phrases: ['Where is the bathroom?', 'Where is the restroom?'],
        translations: ['洗手间在哪里？', '卫生间在哪里？']
      },
      {
        scene: '餐厅',
        phrases: ['Excuse me, where is the restroom?', 'Could you tell me where the bathroom is?'],
        translations: ['打扰一下，洗手间在哪里？', '能告诉我洗手间在哪里吗？']
      },
      {
        scene: '紧急情况',
        phrases: ['I need to use the bathroom.', 'Where is the nearest restroom?'],
        translations: ['我需要上厕所', '最近的洗手间在哪里？']
      }
    ];
  } else if (lowerPhrase.includes('money') || lowerPhrase.includes('price') || lowerPhrase.includes('钱')) {
    return [
      {
        scene: '购物',
        phrases: ['How much does this cost?', 'What is the price?'],
        translations: ['这个多少钱？', '价格是多少？']
      },
      {
        scene: '餐厅',
        phrases: ['How much is the bill?', 'Could I have the check, please?'],
        translations: ['账单多少钱？', '请给我账单']
      },
      {
        scene: '银行',
        phrases: ['I need to withdraw money.', 'Where is the ATM?'],
        translations: ['我需要取钱', 'ATM在哪里？']
      }
    ];
  } else {
    // 通用fallback
    return [
      {
        scene: '日常对话',
        phrases: [`${inputPhrase}`, `Could you please ${inputPhrase}?`],
        translations: [inputPhrase, `请${inputPhrase}`]
      },
      {
        scene: '礼貌用语',
        phrases: [`Excuse me, ${inputPhrase}`, `I would like to ${inputPhrase}`],
        translations: [`打扰一下，${inputPhrase}`, `我想要${inputPhrase}`]
      },
      {
        scene: '紧急情况',
        phrases: [`I need ${inputPhrase}`, `Help me ${inputPhrase}`],
        translations: [`我需要${inputPhrase}`, `帮我${inputPhrase}`]
      }
    ];
  }
};

export interface ExpandedPhrase {
  scene: string;
  phrases: string[];
  translations: string[];
}

export const expandPhrase = async (
  phrase: string,
  setExpandedPhrases: (phrases: ExpandedPhrase[]) => void,
  setIsExpanding: (loading: boolean) => void,
  fromLanguage: string = 'en',
  toLanguage: string = 'zh-CN'
): Promise<ExpandedPhrase[]> => {
  if (!phrase.trim()) return [];

  setIsExpanding(true);
  setExpandedPhrases([]); // 清空之前的结果，不显示模拟数据
  
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/expand-phrase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        phrase: phrase.trim(), 
        lang: fromLanguage,
        toLanguage: toLanguage
      }),
    }, API_TIMEOUT);

    if (response.ok) {
      const data = await response.json();
      setExpandedPhrases(data);
      console.log("✅ AI扩展成功");
      return data;
    } else {
      // API调用失败，抛出错误让前端处理
      throw new Error('API调用失败，请稍后重试');
    }
  } catch (err) {
    console.log("ℹ️ AI服务不可用", (err as Error).message);
    // 重新抛出错误，让前端显示友好提示
    throw err;
  } finally {
    setIsExpanding(false);
  }
};

// 其他API函数可以在这里添加
export const translateText = async (text: string, fromLang: string, toLang: string) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fromLang, toLang }),
    }, API_TIMEOUT);

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.log("翻译服务不可用", (err as Error).message);
  }
  return null;
};

export const textToSpeech = async (text: string, language: string) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    }, API_TIMEOUT);

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.log("TTS服务不可用", (err as Error).message);
  }
  return null;
};
