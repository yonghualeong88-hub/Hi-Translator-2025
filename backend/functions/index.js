// Firebase Functions - 翻译服务
// 基于您的指南实现的后端翻译服务

const functions = require('firebase-functions');
const {Translate} = require('@google-cloud/translate').v2;

const translate = new Translate();

// 1. 翻译文本函数
exports.translateText = functions.https.onCall(async (data, context) => {
    const text = data.text;
    const target = data.target;

    if (!text || !target) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with text and target language.');
    }

    try {
        const [translation] = await translate.translate(text, target);
        return { translatedText: translation };
    } catch (error) {
        console.error('Translation error:', error);
        throw new functions.https.HttpsError('internal', 'Translation failed.', error.message);
    }
});

// 2. 批量翻译函数
exports.translateBatch = functions.https.onCall(async (data, context) => {
    const texts = data.texts;
    const target = data.target;

    if (!texts || !Array.isArray(texts) || !target) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with texts array and target language.');
    }

    try {
        const [translations] = await translate.translate(texts, target);
        const results = texts.map((text, index) => ({
            original: text,
            translated: translations[index]
        }));
        
        return { translations: results };
    } catch (error) {
        console.error('Batch translation error:', error);
        throw new functions.https.HttpsError('internal', 'Batch translation failed.', error.message);
    }
});

// 3. 检测语言函数
exports.detectLanguage = functions.https.onCall(async (data, context) => {
    const text = data.text;

    if (!text) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with text.');
    }

    try {
        const [detection] = await translate.detect(text);
        return { 
            language: detection.language,
            confidence: detection.confidence
        };
    } catch (error) {
        console.error('Language detection error:', error);
        throw new functions.https.HttpsError('internal', 'Language detection failed.', error.message);
    }
});

// 4. 获取支持的语言列表
exports.getSupportedLanguages = functions.https.onCall(async (data, context) => {
    try {
        const [languages] = await translate.getLanguages();
        return { languages: languages.map(lang => ({
            code: lang.code,
            name: lang.name
        })) };
    } catch (error) {
        console.error('Get languages error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get supported languages.', error.message);
    }
});

// 5. 性能优化版本 - 带缓存
const translationCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

exports.translateTextCached = functions.https.onCall(async (data, context) => {
    const text = data.text;
    const target = data.target;
    const cacheKey = `${text}_${target}`;

    // 检查缓存
    if (translationCache.has(cacheKey)) {
        const cached = translationCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_EXPIRY) {
            return { translatedText: cached.translation };
        } else {
            translationCache.delete(cacheKey);
        }
    }

    if (!text || !target) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with text and target language.');
    }

    try {
        const [translation] = await translate.translate(text, target);
        
        // 存储到缓存
        translationCache.set(cacheKey, {
            translation: translation,
            timestamp: Date.now()
        });
        
        return { translatedText: translation };
    } catch (error) {
        console.error('Translation error:', error);
        throw new functions.https.HttpsError('internal', 'Translation failed.', error.message);
    }
});

// 6. 定时清理缓存
exports.cleanupCache = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = Date.now();
    for (const [key, value] of translationCache.entries()) {
        if (now - value.timestamp > CACHE_EXPIRY) {
            translationCache.delete(key);
        }
    }
    console.log('Cache cleanup completed');
    return null;
});
