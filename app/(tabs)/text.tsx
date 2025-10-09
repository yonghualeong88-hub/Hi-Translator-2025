 import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { AutoPlayService } from '@/services/autoPlayService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import { ArrowLeftRight, Copy, FileDown, History, Menu, Share2, Trash2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Share as RNShare,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import SpeakButton from '../../components/SpeakButton';
import { getLanguageDisplayName, SUPPORTED_LANGUAGES } from '../../constants/languages';
import { translationModeManager } from '../../services/translationModeManager';
import { translateText } from '../../services/translationService';
import { playTTS } from '../../services/ttsService';
// 简单的UUID生成器，不需要原生依赖
// 简单的UUID生成器，不需要原生依赖
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function TextTranslateScreen() {
  const { colors, autoPlayTextTranslation } = useTheme();
  const { t, currentLanguage } = useI18n();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const isFocused = useIsFocused();
  const [inputText, setInputText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [fromLanguage, setFromLanguage] = useState('en');
  const [toLanguage, setToLanguage] = useState('zh-CN');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 页面失去焦点时停止播报 - 使用更精确的焦点检测
  useEffect(() => {
    if (!isFocused) {
      // 添加延迟，避免快速切换时的误触发
      const timer = setTimeout(() => {
        Speech.stop();
        setIsSpeaking(false);
        setIsPaused(false);
        console.log('🛑 页面失去焦点，停止录音和播报');
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  // 组件卸载时停止所有播报
  useEffect(() => {
    return () => {
      // 组件卸载时停止所有语音播报
      Speech.stop();
      console.log('文本翻译页面退出，停止所有播报');
    };
  }, []);
  // 🎯 语言选择状态
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectingLanguageType, setSelectingLanguageType] = useState<'source' | 'target'>('source');
  const [translationHistory, setTranslationHistory] = useState<Array<{
    id: string;
    original: string;
    translated: string;
    fromLanguage: string;
    toLanguage: string;
    timestamp: Date;
  }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const [showWordExportModal, setShowWordExportModal] = useState(false);
  const [translationModeState, setTranslationModeState] = useState({
    mode: 'auto' as 'online' | 'offline' | 'auto',
    isOnline: true,
    canTranslateOffline: false,
    downloadedLanguagePacks: [] as string[],
  });
  const textInputRef = useRef<TextInput>(null);

  // 保存翻译历史到 AsyncStorage
  const saveTranslationHistory = async (history: typeof translationHistory) => {
    try {
      await AsyncStorage.setItem('textTranslationHistory', JSON.stringify(history));
    } catch (error) {
      console.error('保存翻译历史失败:', error);
    }
  };

  // 从 AsyncStorage 加载翻译历史
  const loadTranslationHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('textTranslationHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setTranslationHistory(parsedHistory);
      }
    } catch (error) {
      console.error('加载翻译历史失败:', error);
    }
  };

  // 保存语言选择到 AsyncStorage
  const saveLanguageSelection = async (fromLang: string, toLang: string) => {
    try {
      await AsyncStorage.setItem('textTranslationLanguages', JSON.stringify({
        fromLanguage: fromLang,
        toLanguage: toLang
      }));
    } catch (error) {
      console.error('保存语言选择失败:', error);
    }
  };

  // 从 AsyncStorage 加载语言选择
  const loadLanguageSelection = async () => {
    try {
      const savedLanguages = await AsyncStorage.getItem('textTranslationLanguages');
      if (savedLanguages) {
        const { fromLanguage: savedFrom, toLanguage: savedTo } = JSON.parse(savedLanguages);
        setFromLanguage(savedFrom || 'auto');
        setToLanguage(savedTo || 'en');
      }
    } catch (error) {
      console.error('加载语言选择失败:', error);
    }
  };

  // ✅ 检查语言包是否已下载
  const isLanguageDownloaded = (langCode: string): boolean => {
    const isOfflineMode = translationModeState.mode === 'offline' || !translationModeState.isOnline;
    if (!isOfflineMode) return true; // 在线模式下所有语言都可用
    if (langCode === 'auto') return false; // auto 不支持离线
    
    // 动态导入映射函数
    const { mapToMlKitLangCode } = require('@/utils/mlKitLanguageMapper');
    const mlKitCode = mapToMlKitLangCode(langCode);
    
    return translationModeState.downloadedLanguagePacks.includes(mlKitCode) || 
           translationModeState.downloadedLanguagePacks.includes(langCode);
  };

  // 🎯 语言选择处理
  const handleSelectLanguage = (languageCode: string) => {
    const isOfflineMode = translationModeState.mode === 'offline' || !translationModeState.isOnline;
    
    // ✅ 离线模式下检查语言包
    if (isOfflineMode && !isLanguageDownloaded(languageCode) && languageCode !== 'auto') {
      Alert.alert(
        t('text.languagePackNotDownloaded', '语言包未下载'),
        t('text.languagePackNotDownloadedMessage', '离线模式下无法使用此语言。\n\n请在有网络时前往设置下载对应的语言包。'),
        [
          { text: t('history.gotIt', '知道了'), style: 'default' },
        ]
      );
      return;
    }
    
    if (selectingLanguageType === 'source') {
      setFromLanguage(languageCode);
      // 保存语言选择
      saveLanguageSelection(languageCode, toLanguage);
    } else {
      setToLanguage(languageCode);
      // 保存语言选择
      saveLanguageSelection(fromLanguage, languageCode);
    }
    setShowLanguageModal(false);
  };

  const openSourceLanguageModal = () => {
    setSelectingLanguageType('source');
    setShowLanguageModal(true);
  };

  const openTargetLanguageModal = () => {
    setSelectingLanguageType('target');
    setShowLanguageModal(true);
  };

  // 组件加载时加载历史记录和语言选择
  useEffect(() => {
    loadTranslationHistory();
    loadLanguageSelection();
  }, []);

  // 监听翻译模式状态变化
  useEffect(() => {
    const updateTranslationModeState = (state: any) => {
      setTranslationModeState(state);
    };

    translationModeManager.addListener(updateTranslationModeState);

    return () => {
      translationModeManager.removeListener(updateTranslationModeState);
    };
  }, []);

  // 响应路由参数，打开历史记录
  useEffect(() => {
    if (params.showHistory === 'true') {
      setShowHistory(true);
      // 清除参数，避免重复触发
      router.replace({ pathname: '/text', params: {} });
    }
  }, [params.showHistory]);

  // 删除单个翻译历史记录
  const deleteHistoryItem = (itemId: string) => {
    Alert.alert(
      t('history.deleteRecord', '删除记录'),
      t('history.deleteConfirm', '确定要删除这条翻译记录吗？'),
      [
        {
          text: t('common.cancel', '取消'),
          style: 'cancel',
        },
        {
          text: t('common.delete', '删除'),
          style: 'destructive',
          onPress: async () => {
            const newHistory = translationHistory.filter(item => item.id !== itemId);
            setTranslationHistory(newHistory);
            await saveTranslationHistory(newHistory);
          },
        },
      ]
    );
  };



  const performTranslation = async (text: string) => {
    if (!text.trim()) return;
    
    setIsTranslating(true);
    
    try {
      // 调用真实的翻译API
      const result = await translateText(text, fromLanguage, toLanguage);
      setTranslatedText(result.translatedText);
      
      // 自动播放文本翻译结果
      if (autoPlayTextTranslation) {
        AutoPlayService.playTranslationByType(
          result.translatedText,
          toLanguage,
          'text',
          {
            autoPlayVoiceTranslation: false,
            autoPlayTextTranslation,
          }
        );
      }
      
      // 保存到历史记录
      const newHistoryItem = {
        id: generateUUID(),
        original: text,
        translated: result.translatedText,
        fromLanguage,
        toLanguage,
        timestamp: new Date(),
      };
      const newHistory = [newHistoryItem, ...translationHistory.slice(0, 29)]; // 保留最新30条记录
      setTranslationHistory(newHistory);
      saveTranslationHistory(newHistory);
    } catch (error) {
      console.error('翻译失败:', error);
      
      // 显示错误信息
      const errorMessage = error instanceof Error ? error.message : t('errors.translationError', '翻译失败，请检查网络连接');
      Alert.alert(t('errors.translationError', '翻译错误'), errorMessage);
      
      setTranslatedText(t('errors.translationError', '翻译失败，请重试'));
    } finally {
      setIsTranslating(false);
    }
  };

  const translateInputText = () => {
    if (!inputText.trim()) {
      Alert.alert(t('common.tip', '提示'), t('text.pleaseEnterText', '请输入要翻译的文本'));
      return;
    }
    
    setOriginalText(inputText.trim());
    setTranslatedText(''); // Clear previous translation
    performTranslation(inputText.trim());
    // 不要清空输入框，保留原文
  };

  const playTranslation = async (text: string, language: string) => {
    try {
      // 如果正在播放，则停止播放
      if (isSpeaking) {
        console.log('⏹️ 停止播放');
        Speech.stop();
        setIsSpeaking(false);
        setIsPaused(false);
        return;
      }

      console.log('🎵 开始播放翻译:', { text, language });
      
      // 停止当前播放
      if (isSpeaking) {
        Speech.stop();
      }
      
      // 设置播放状态
      setIsSpeaking(true);
      setIsPaused(false);
      
      // 播放语音
      console.log('🔊 开始语音播放');
      await speakTranslation(text, language);
      console.log('✅ 语音播放完成');
      
    } catch (error) {
      console.error('❌ 播放失败:', error);
      // 播放失败时重置状态
      setIsSpeaking(false);
      setIsPaused(false);
    }
    // 移除 finally 块，让 speakTranslation 的 onDone 回调来控制状态重置
  };

  // 播报翻译结果的函数 - 使用与语音页面相同的逻辑
  const speakTranslation = async (text: string, language: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // 停止当前播放
        Speech.stop();
        
        console.log('开始TTS播报翻译结果:', text, '语言:', language);
        
        // 使用新的TTS服务，传递语言参数、声音设置和回调函数
        playTTS(text, language, 
          // onDone 回调
          () => {
            console.log('TTS播报完成');
            // 播放完成时重置状态
            setIsSpeaking(false);
            setIsPaused(false);
            resolve();
          },
          // onError 回调
          (error) => {
            console.error('TTS播报失败:', error);
            // 播放失败时重置状态
            setIsSpeaking(false);
            setIsPaused(false);
            reject(error);
          }
        );
      } catch (error) {
        console.error('语音播报初始化失败:', error);
        // 初始化失败时重置状态
        setIsSpeaking(false);
        setIsPaused(false);
        reject(error);
      }
    });
  };

  const stopPlayback = () => {
    try {
      Speech.stop();
      setIsSpeaking(false);
      setIsPaused(false);
    } catch (error) {
      console.error('停止播放失败:', error);
    }
  };

  const swapLanguages = () => {
    const temp = fromLanguage;
    setFromLanguage(toLanguage);
    setToLanguage(temp);
    
    // 只交换语言设置，不影响翻译结果卡片
    // 用户可以选择是否重新翻译或保持当前结果
  };

  const getLanguageName = (code: string) => {
    return getLanguageDisplayName(code);
  };

  const copyToClipboard = async (text: string) => {
    try {
      Clipboard.setString(text);
      Alert.alert(t('common.success', '成功'), t('common.copied', '已复制到剪贴板'));
    } catch (error) {
      console.error('复制失败:', error);
      Alert.alert(t('common.error', '失败'), t('common.copyFailed', '无法复制文本，请检查权限设置'));
    }
  };



  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return t('history.justNow', '刚刚');
    } else if (diffMinutes < 60) {
      return t('history.minutesAgo', { count: diffMinutes, defaultValue: `${diffMinutes}分钟前` });
    } else if (diffHours < 24) {
      return t('history.hoursAgo', { count: diffHours, defaultValue: `${diffHours}小时前` });
    } else if (diffDays < 7) {
      return t('history.daysAgo', { count: diffDays, defaultValue: `${diffDays}天前` });
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const selectHistoryItem = (item: typeof translationHistory[0]) => {
    // 导航到详情页面
    router.push({
      pathname: '/history-detail',
      params: {
        id: item.id,
        original: item.original,
        translated: item.translated,
        fromLanguage: item.fromLanguage,
        toLanguage: item.toLanguage,
        timestamp: item.timestamp.toISOString(),
      }
    });
    // 关闭历史记录模态框
    setShowHistory(false);
  };



  const shareTranslation = async () => {
    if (!originalText || !translatedText) return;
    
    try {
      const shareContent = `${t('text.originalText', '原文')} (${getLanguageName(fromLanguage)}):\n${originalText}\n\n${t('text.translatedText', '译文')} (${getLanguageName(toLanguage)}):\n${translatedText}`;
      
      await RNShare.share({
        message: shareContent,
        title: t('text.translationResult', '翻译结果'),
      });
    } catch (error) {
      console.error('分享失败:', error);
      Alert.alert(t('common.error', '失败'), t('common.shareFailed', '无法分享翻译结果'));
    }
  };


  const exportAsTxt = async () => {
    if (!originalText || !translatedText) return;
    
    try {
      const exportContent = `${t('text.translationRecord', '翻译记录')}
${t('text.generatedTime', '生成时间')}: ${new Date().toLocaleString()}

${t('text.originalText', '原文')} (${getLanguageName(fromLanguage)}):
${originalText}

${t('text.translatedText', '译文')} (${getLanguageName(toLanguage)}):
${translatedText}`;

      await RNShare.share({
        message: exportContent,
        title: t('text.translationRecord', '翻译记录'),
      });
    } catch (error) {
      console.error('导出TXT失败:', error);
      Alert.alert(t('common.error', '失败'), t('text.exportFailed', '无法导出TXT文件'));
    }
  };

  const exportAsPdf = async (exportType: 'original' | 'translated' | 'both' = 'both') => {
    if (!originalText || !translatedText) return;
    
    try {
      // 根据导出类型生成HTML内容
      const generateHtmlContent = () => {
        const baseHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${t('text.translationRecord', '翻译记录')}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px; 
              color: #1e40af;
            }
            .timestamp { 
              font-size: 12px; 
              color: #666; 
            }
            .section { 
              margin-bottom: 25px; 
              padding: 15px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
            }
            .label { 
              font-weight: bold; 
              margin-bottom: 10px; 
              font-size: 16px;
              color: #374151;
            }
            .content { 
              margin-left: 10px; 
              line-height: 1.8; 
              font-size: 14px;
              white-space: pre-wrap;
            }
            .original { background-color: #f9fafb; }
            .translated { background-color: #f0f9ff; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${t('text.translationRecord', '翻译记录')}</div>
            <div class="timestamp">${t('text.generatedTime', '生成时间')}: ${new Date().toLocaleString()}</div>
          </div>`;

        let contentSections = '';
        
        if (exportType === 'original' || exportType === 'both') {
          contentSections += `
          <div class="section original">
            <div class="label">${t('text.originalText', '原文')} (${getLanguageName(fromLanguage)}):</div>
            <div class="content">${originalText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>`;
        }
        
        if (exportType === 'translated' || exportType === 'both') {
          contentSections += `
          <div class="section translated">
            <div class="label">${t('text.translatedText', '译文')} (${getLanguageName(toLanguage)}):</div>
            <div class="content">${translatedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>`;
        }

        return baseHtml + contentSections + `
        </body>
        </html>`;
      };

      const htmlContent = generateHtmlContent();

      // 使用 expo-print 生成 PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      console.log('✅ PDF 文件已生成:', uri);

      // 检查是否可以分享
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: t('text.shareTranslationRecordPDF', '分享翻译记录PDF'),
        });
      } else {
        // 如果无法分享，回退到文本分享
        let shareMessage = t('text.translationRecord', '翻译记录') + '\n\n';
        
        if (exportType === 'original' || exportType === 'both') {
          shareMessage += `${t('text.originalText', '原文')} (${getLanguageName(fromLanguage)}):\n${originalText}\n\n`;
        }
        
        if (exportType === 'translated' || exportType === 'both') {
          shareMessage += `${t('text.translatedText', '译文')} (${getLanguageName(toLanguage)}):\n${translatedText}`;
        }
        
        await RNShare.share({
          message: shareMessage,
          title: t('text.translationRecord', '翻译记录'),
        });
      }
    } catch (error) {
      console.error('❌ 导出PDF失败:', error);
      Alert.alert(t('common.error', '失败'), t('text.exportPDFFailed', '无法导出PDF文件，请重试'));
    }
  };

  // 导出为Word
  const exportAsWord = async (exportType: 'original' | 'translated' | 'both' = 'both') => {
    if (!originalText || !translatedText) return;
    
    try {
      console.log('🔄 开始生成.docx文档');

      // 创建Word文档段落
      const paragraphs: Paragraph[] = [];

      // 标题
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: t('text.translationRecord', '翻译记录'),
              bold: true,
              size: 32,
              font: "Microsoft YaHei"
            })
          ],
          alignment: "center",
          spacing: { after: 400 }
        })
      );

      // 生成时间
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${t('text.generatedTime', '生成时间')}: ${new Date().toLocaleString()}`,
              size: 24,
              font: "Microsoft YaHei"
            })
          ],
          spacing: { after: 200 }
        })
      );

      // 语言对
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `语言对: ${getLanguageName(fromLanguage)} → ${getLanguageName(toLanguage)}`,
              size: 24,
              font: "Microsoft YaHei"
            })
          ],
          spacing: { after: 400 }
        })
      );

      // 原文部分
      if (exportType === 'original' || exportType === 'both') {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${t('text.originalText', '原文')} (${getLanguageName(fromLanguage)})`,
                bold: true,
                size: 28,
                font: "Microsoft YaHei"
              })
            ],
            spacing: { before: 300, after: 200 }
          })
        );

        // 将原文按行分割并添加为段落
        originalText.split('\n').forEach(line => {
          if (line.trim()) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: line.trim(),
                    size: 24,
                    font: "Microsoft YaHei"
                  })
                ],
                spacing: { after: 100 }
              })
            );
          }
        });
      }

      // 译文部分
      if (exportType === 'translated' || exportType === 'both') {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${t('text.translatedText', '译文')} (${getLanguageName(toLanguage)})`,
                bold: true,
                size: 28,
                font: "Microsoft YaHei"
              })
            ],
            spacing: { before: 400, after: 200 }
          })
        );

        // 将译文按行分割并添加为段落
        translatedText.split('\n').forEach(line => {
          if (line.trim()) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: line.trim(),
                    size: 24,
                    font: "Microsoft YaHei"
                  })
                ],
                spacing: { after: 100 }
              })
            );
          }
        });
      }

      // 创建Word文档
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      // 生成.docx文件
      const buffer = await Packer.toBuffer(doc);

      // 创建临时文件路径
      const fileName = `translation_${Date.now()}.docx`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // 写入.docx文件（使用legacy API）
      await FileSystem.writeAsStringAsync(fileUri, Buffer.from(buffer).toString('base64'), {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('✅ Word 文件已生成:', fileUri);

      // 检查是否可以分享
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: t('text.shareTranslationRecordWord', '分享翻译记录Word文档'),
        });
      } else {
        // 如果无法分享，回退到文本分享
        let shareMessage = t('text.translationRecord', '翻译记录') + '\n\n';
        
        if (exportType === 'original' || exportType === 'both') {
          shareMessage += `${t('text.originalText', '原文')} (${getLanguageName(fromLanguage)}):\n${originalText}\n\n`;
        }
        
        if (exportType === 'translated' || exportType === 'both') {
          shareMessage += `${t('text.translatedText', '译文')} (${getLanguageName(toLanguage)}):\n${translatedText}`;
        }
        
        await RNShare.share({
          message: shareMessage,
          title: t('text.translationRecord', '翻译记录'),
        });
      }
    } catch (error) {
      console.error('❌ 导出Word失败:', error);
      Alert.alert(t('common.error', '失败'), t('text.exportWordFailed', '无法导出Word文件，请重试'));
    }
  };

  const clearInput = () => {
    setInputText('');
  };

  const clearTranslation = () => {
    Alert.alert(
      t('text.clearTranslationResult', '清除翻译结果'),
      t('text.clearTranslationConfirm', '确定要清除当前的翻译结果吗？原文和输入框内容将保留。'),
      [
        {
          text: t('common.cancel', '取消'),
          style: 'cancel',
        },
        {
          text: t('common.clear', '清除'),
          style: 'destructive',
          onPress: () => {
            setTranslatedText('');
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'android' ? 100 + insets.bottom : 20 }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => router.push('/settings')}
              >
                <Menu size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text }]}>{t('tabs.text', '文本翻译')}</Text>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => setShowHistory(true)}
              >
                <History size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('text.inputTextForTranslation')}
            </Text>
          </View>

          {/* Language Selector */}
          <View style={styles.languageContainer}>
            <TouchableOpacity 
              style={[styles.languageBox, { backgroundColor: '#374151' }]}
              onPress={openSourceLanguageModal}
            >
              <View style={styles.languageBoxContent}>
                <Text style={[styles.languageText, { color: '#FFFFFF' }]}>
                  {getLanguageDisplayName(fromLanguage)}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.swapButton}
              onPress={swapLanguages}
            >
              <ArrowLeftRight size={24} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.languageBox, { backgroundColor: '#374151' }]}
              onPress={openTargetLanguageModal}
            >
              <View style={styles.languageBoxContent}>
                <Text style={[styles.languageText, { color: '#FFFFFF' }]}>{getLanguageDisplayName(toLanguage)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 离线模式提示 - 放在原文卡片上方 */}
          {!translationModeState.isOnline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineBannerText}>
                📱 {t('text.offlineMode', '离线模式')}
              </Text>
              <Text style={styles.offlineBannerSubtext}>
                • {t('text.offlineTranslationAvailable', '已启用离线翻译')}
              </Text>
            </View>
          )}

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <View style={styles.inputHeader}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('text.originalText', '原文')}</Text>
                {inputText.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearInputButton}
                    onPress={clearInput}
                  >
                    <Text style={[styles.clearInputText, { color: colors.textSecondary }]}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                ref={textInputRef}
                style={[styles.textInput, { color: colors.text }]}
                placeholder={t('text.pleaseEnterText', '请输入要翻译的文本') + '...'}
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={3000}
                textAlignVertical="top"
              />
              <View style={styles.inputFooter}>
                <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                  {inputText.length}/3000
                </Text>
                
                <TouchableOpacity
                  style={[
                    styles.translateButton,
                    { backgroundColor: '#3b82f6' },
                    !inputText.trim() && { backgroundColor: colors.textSecondary }
                  ]}
                  onPress={translateInputText}
                  disabled={!inputText.trim() || isTranslating}
                >
                  {isTranslating ? (
                    <Text style={[styles.translateButtonText, { color: colors.primaryText }]}>{t('phrases.translating', '翻译中...')}</Text>
                  ) : (
                    <Text style={[styles.translateButtonText, { color: colors.primaryText }]}>{t('common.translate', '翻译')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Translation Results */}
          {translatedText && (
            <View style={styles.resultsContainer}>
              <View style={[styles.textCard, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.primary }]}>{t('text.translationResult', '翻译结果')}</Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => playTranslation(translatedText, toLanguage)}
                    >
                      <SpeakButton
                        isSpeaking={isSpeaking}
                        size={20}
                        color={colors.textSecondary}
                        activeColor={colors.textSecondary}
                        disabled={false}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => copyToClipboard(translatedText)}
                    >
                      <Copy size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={shareTranslation}
                    >
                      <Share2 size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.exportContainer}>
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => {
                          console.log('🔄 导出按钮被点击，切换导出选项');
                          setShowExportOptions(!showExportOptions);
                        }}
                      >
                        <FileDown size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                      {showExportOptions && (
                        <View style={styles.exportOptions}>
                          <TouchableOpacity 
                            style={styles.exportOption}
                            onPress={() => {
                              console.log('🔄 TXT导出按钮被点击');
                              exportAsTxt();
                              setShowExportOptions(false);
                            }}
                          >
                            <Text style={styles.exportOptionText}>TXT</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.exportOption}
                            onPress={() => {
                              console.log('🔄 PDF导出按钮被点击');
                              setShowPdfExportModal(true);
                              setShowExportOptions(false);
                            }}
                          >
                            <Text style={styles.exportOptionText}>PDF</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.exportOption}
                            onPress={() => {
                              console.log('🔄 Word导出按钮被点击');
                              setShowWordExportModal(true);
                              setShowExportOptions(false);
                            }}
                          >
                            <Text style={styles.exportOptionText}>Word</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={clearTranslation}
                    >
                      <Trash2 size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                {isTranslating ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (
                  <Text style={[styles.textContent, { color: colors.text }]}>{translatedText}</Text>
                )}
              </View>
            </View>
          )}

        </ScrollView>
        
        {/* 导出选项覆盖层 - 暂时移除以防止阻止按钮点击 */}
        {/* {showExportOptions && (
          <TouchableOpacity 
            style={styles.exportOverlay} 
            activeOpacity={1}
            onPress={() => setShowExportOptions(false)}
          />
        )} */}
      </SafeAreaView>

      {/* 🎯 语言选择模态框 */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectingLanguageType === 'source' ? t('language.selectSource', '选择源语言') : t('language.selectTarget', '选择目标语言')}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {SUPPORTED_LANGUAGES
                .filter((lang) => {
                  // 源语言和目标语言都排除 Auto Detect
                  return lang.code !== 'auto';
                })
                .map((lang) => {
                  const isOfflineMode = translationModeState.mode === 'offline' || !translationModeState.isOnline;
                  const isDownloaded = isLanguageDownloaded(lang.code);
                  const isSelected = (selectingLanguageType === 'source' ? fromLanguage : toLanguage) === lang.code;
                  
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageItem,
                        isSelected && styles.languageItemSelected,
                        !isDownloaded && isOfflineMode && styles.languageItemDisabled,
                      ]}
                      onPress={() => handleSelectLanguage(lang.code)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text 
                          style={[
                            styles.languageItemText,
                            !isDownloaded && isOfflineMode && { opacity: 0.5 }
                          ]} 
                          numberOfLines={1}
                        >
                          {lang.flag} {lang.nativeName}
                        </Text>
                        {isOfflineMode && (
                          <View style={[
                            styles.downloadBadge,
                            { backgroundColor: isDownloaded ? '#10B981' : '#6B7280' }
                          ]}>
                            <Text style={styles.downloadBadgeText}>
                              {isDownloaded ? '✓' : '⬇'}
                            </Text>
                          </View>
                        )}
                      </View>
                      {isSelected && (
                        <Text style={styles.languageItemCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      {showHistory && (
        <View style={styles.historyModalOverlay}>
          <View style={[styles.historyModal, { backgroundColor: colors.background }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>{t('history.title', '翻译历史')}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowHistory(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.primary }]}>{t('common.close', '关闭')}</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.historyList}>
              {translationHistory.length > 0 ? (
                translationHistory.map((item) => (
                  <View key={item.id} style={[styles.historyItem, { backgroundColor: colors.card }]}>
                    <TouchableOpacity 
                      style={styles.historyItemContent}
                      onPress={() => selectHistoryItem(item)}
                    >
                      <View style={styles.historyItemHeader}>
                        <Text style={[styles.historyLanguage, { color: colors.primary }]}>
                          {getLanguageName(item.fromLanguage)} → {getLanguageName(item.toLanguage)}
                        </Text>
                        <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                          {formatTime(item.timestamp)}
                        </Text>
                      </View>
                      <Text style={[styles.historyOriginal, { color: colors.text }]} numberOfLines={2}>
                        {item.original}
                      </Text>
                      <Text style={[styles.historyTranslated, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.translated}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.historyDeleteButton}
                      onPress={() => deleteHistoryItem(item.id)}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyHistory}>
                  <Text style={[styles.emptyHistoryText, { color: colors.textSecondary }]}>
                    {t('history.empty', '暂无翻译历史')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* PDF导出选项模态框 */}
      <Modal
        visible={showPdfExportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPdfExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('text.selectExportContent', '选择导出内容')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPdfExportModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.exportOptionsContainer}>
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsPdf('original');
                  setShowPdfExportModal(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>{t('text.originalOnly', '仅原文')}</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(fromLanguage)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsPdf('translated');
                  setShowPdfExportModal(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>{t('text.translatedOnly', '仅译文')}</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(toLanguage)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsPdf('both');
                  setShowPdfExportModal(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>{t('text.originalAndTranslated', '原文 + 译文')}</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(fromLanguage)} + {getLanguageName(toLanguage)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Word导出选项模态框 */}
      <Modal
        visible={showWordExportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWordExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('text.selectExportContent', '选择导出内容')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowWordExportModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.exportOptionsContainer}>
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsWord('original');
                  setShowWordExportModal(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>{t('text.originalOnly', '仅原文')}</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(fromLanguage)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsWord('translated');
                  setShowWordExportModal(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>{t('text.translatedOnly', '仅译文')}</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(toLanguage)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsWord('both');
                  setShowWordExportModal(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>{t('text.originalAndTranslated', '原文 + 译文')}</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(fromLanguage)} + {getLanguageName(toLanguage)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 150, // 增加滚动范围，为底部导航栏预留更多空间
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    position: 'relative',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  historyButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  languageBox: {
    width: '44%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  languageBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageIcon: {
    marginRight: 6,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  swapButton: {
    padding: 12,
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -24,
    marginTop: -24,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  inputSection: {
    marginBottom: 30,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearInputButton: {
    padding: 4,
  },
  clearInputText: {
    fontSize: 12,
    fontWeight: '500',
  },
  textInput: {
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 12,
    lineHeight: 24,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
  },
  offlineBanner: {
    backgroundColor: '#D97706', // 更深的琥珀色，不刺眼
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 40,
    marginTop: 0,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  offlineBannerSubtext: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.95,
  },
  translateButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  translateButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  resultsContainer: {
    marginBottom: 30,
  },
  textCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  iconButton: {
    padding: 8,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
  },
  // History Modal Styles
  historyModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  historyModal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyList: {
    maxHeight: 400,
  },
  historyItem: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyItemContent: {
    flex: 1,
    padding: 16,
  },
  historyDeleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyLanguage: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 12,
  },
  historyOriginal: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  historyTranslated: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
  },
  // Export Options Styles
  exportContainer: {
    position: 'relative',
  },
  exportOptions: {
    position: 'absolute',
    top: 40,
    right: 0,
    flexDirection: 'column',
    gap: 1,
    zIndex: 1001,
  },
  exportOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
    backgroundColor: 'transparent',
  },
  exportOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: '#374151',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportOptionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // 🎯 语言选择模态框样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  languageList: {
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  languageItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
  },
  languageItemDisabled: {
    opacity: 0.6,
  },
  languageItemText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    flex: 1,
  },
  languageItemCheck: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: '600',
  },
  downloadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  downloadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  // PDF导出选项模态框样式
  exportOptionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exportOptionItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exportOptionItemText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    marginBottom: 4,
  },
  exportOptionItemSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
  },
});
