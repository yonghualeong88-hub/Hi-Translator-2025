import { getLanguageDisplayName } from '@/constants/languages';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import { Copy, FileDown, Pause, Play, Share2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  Clipboard,
  Modal,
  Pressable,
  Share as RNShare,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryDetailScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const [isSpeakingOriginal, setIsSpeakingOriginal] = useState(false);
  const [isSpeakingTranslated, setIsSpeakingTranslated] = useState(false);
  const [showExportOptionsOriginal, setShowExportOptionsOriginal] = useState(false);
  const [showExportOptionsTranslated, setShowExportOptionsTranslated] = useState(false);
  const [showPdfExportModalOriginal, setShowPdfExportModalOriginal] = useState(false);
  const [showPdfExportModalTranslated, setShowPdfExportModalTranslated] = useState(false);
  const [showWordExportModalOriginal, setShowWordExportModalOriginal] = useState(false);
  const [showWordExportModalTranslated, setShowWordExportModalTranslated] = useState(false);

  // 组件卸载时停止所有播报
  useEffect(() => {
    return () => {
      // 组件卸载时停止所有语音播报
      Speech.stop();
      console.log('页面退出，停止所有播报');
    };
  }, []);
  
  // 快速关闭所有导出选项
  const closeAllExportOptions = () => {
    setShowExportOptionsOriginal(false);
    setShowExportOptionsTranslated(false);
    setShowPdfExportModalOriginal(false);
    setShowPdfExportModalTranslated(false);
    setShowWordExportModalOriginal(false);
    setShowWordExportModalTranslated(false);
  };
  
  console.log('详情页面接收到的参数:', params);
  
  const getLanguageName = (code: string) => {
    if (code === 'auto') {
      return '自动检测';
    }
    return getLanguageDisplayName(code);
  };

  // 播报文本的函数 - 使用与文本翻译页面相同的逻辑
  const speakText = async (text: string, language?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // 停止当前播放
        Speech.stop();
        
        console.log('开始播报文本:', text, '语言:', language);
        
        // 语言检测和转换
        let speechLanguage = 'en-US'; // 默认英文
        
        if (language && language !== 'auto') {
          // 语言代码转换
          const languageMap: Record<string, string> = {
            'zh-CN': 'zh-CN',
            'zh': 'zh-CN',
            'en': 'en-US',
            'en-US': 'en-US',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'ms': 'ms-MY',
            'id': 'id-ID',
            'vi': 'vi-VN',
            'th': 'th-TH',
            'ar': 'ar-SA',
            'hi': 'hi-IN',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'es': 'es-ES',
            'it': 'it-IT',
            'pt': 'pt-PT',
            'ru': 'ru-RU',
          };
          speechLanguage = languageMap[language] || 'en-US';
        } else {
          // 自动检测语言
          const chineseRegex = /[\u4e00-\u9fff]/;
          const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
          const koreanRegex = /[\uac00-\ud7af]/;
          
          if (chineseRegex.test(text)) {
            speechLanguage = 'zh-CN';
          } else if (japaneseRegex.test(text)) {
            speechLanguage = 'ja-JP';
          } else if (koreanRegex.test(text)) {
            speechLanguage = 'ko-KR';
          }
        }
        
        console.log('使用语音语言:', speechLanguage);
        
        // 直接使用Speech.speak
        Speech.speak(text, {
          language: speechLanguage,
          pitch: 1.0,
          rate: 0.8,
          volume: 1.0,
          onDone: () => {
            console.log('播报完成');
            resolve();
          },
          onStopped: () => {
            console.log('播报停止');
            resolve();
          },
          onError: (error) => {
            console.error('播报错误:', error);
            reject(error);
          }
        });
        
        console.log('播报开始');
      } catch (error) {
        console.error('播报文本失败:', error);
        reject(error);
      }
    });
  };

  // 播放原文
  const playOriginalText = async (text: string, language: string) => {
    try {
      // 如果正在播放，则停止播放
      if (isSpeakingOriginal) {
        console.log('⏹️ 停止原文播放');
        Speech.stop();
        setIsSpeakingOriginal(false);
        return;
      }

      // 如果语言是 'auto'，则使用文本检测功能
      const actualLanguage = language === 'auto' ? undefined : language;
      console.log('🎵 开始播放原文:', { text, language, actualLanguage });
      
      // 停止译文播放
      Speech.stop();
      setIsSpeakingTranslated(false);
      
      // 设置播放状态
      setIsSpeakingOriginal(true);
      
      // 播放语音
      console.log('🔊 开始原文语音播放');
      await speakText(text, actualLanguage);
      console.log('✅ 原文语音播放完成');
      
    } catch (error) {
      console.error('❌ 原文播放失败:', error);
      Alert.alert(t('common.error', '失败'), t('errors.playbackFailed', '无法播放原文'));
    } finally {
      console.log('🛑 停止原文播放');
      setIsSpeakingOriginal(false);
    }
  };

  // 播放译文
  const playTranslatedText = async (text: string, language: string) => {
    try {
      // 如果正在播放，则停止播放
      if (isSpeakingTranslated) {
        console.log('⏹️ 停止译文播放');
        Speech.stop();
        setIsSpeakingTranslated(false);
        return;
      }

      console.log('🎵 开始播放译文:', { text, language });
      
      // 停止原文播放
      Speech.stop();
      setIsSpeakingOriginal(false);
      
      // 设置播放状态
      setIsSpeakingTranslated(true);
      
      // 播放语音
      console.log('🔊 开始译文语音播放');
      await speakText(text, language);
      console.log('✅ 译文语音播放完成');
      
    } catch (error) {
      console.error('❌ 译文播放失败:', error);
      Alert.alert(t('common.error', '失败'), t('errors.playbackFailed', '无法播放译文'));
    } finally {
      console.log('🛑 停止译文播放');
      setIsSpeakingTranslated(false);
    }
  };

  // 复制文本
  const copyText = async (text: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert(t('common.success', '成功'), t('common.copied', '已复制到剪贴板'));
    } catch (error) {
      console.error('复制失败:', error);
      Alert.alert(t('common.error', '失败'), t('common.copyFailed', '无法复制文本'));
    }
  };

  // 分享文本
  const shareText = async (text: string) => {
    try {
      await RNShare.share({
        message: text,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  // 导出为TXT
  const exportAsTxt = async (exportType: 'original' | 'translated' | 'both' = 'both') => {
    if (!historyItem) return;
    
    try {
      let exportContent = `${t('text.translationRecord', '翻译记录')}
${t('text.generatedTime', '生成时间')}: ${historyItem.timestamp.toLocaleString()}
${t('history.languagePair', '语言对')}: ${getLanguageName(historyItem.fromLanguage)} → ${getLanguageName(historyItem.toLanguage)}

`;

      if (exportType === 'original' || exportType === 'both') {
        exportContent += `${t('text.originalText', '原文')} (${getLanguageName(historyItem.fromLanguage)}):
${historyItem.originalText}

`;
      }
      
      if (exportType === 'translated' || exportType === 'both') {
        exportContent += `${t('text.translatedText', '译文')} (${getLanguageName(historyItem.toLanguage)}):
${historyItem.translatedText}`;
      }

      await RNShare.share({
        message: exportContent,
        title: t('text.translationRecord', '翻译记录'),
      });
    } catch (error) {
      console.error('导出TXT失败:', error);
      Alert.alert(t('common.error', '失败'), t('text.exportFailed', '无法导出TXT文件'));
    }
  };

  // 导出为Word
  const exportAsWord = async (exportType: 'original' | 'translated' | 'both' = 'both') => {
    if (!historyItem) return;
    
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
              text: `${t('text.generatedTime', '生成时间')}: ${historyItem.timestamp.toLocaleString()}`,
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
              text: `${t('history.languagePair', '语言对')}: ${getLanguageName(historyItem.fromLanguage)} → ${getLanguageName(historyItem.toLanguage)}`,
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
                text: `${t('text.originalText', '原文')} (${getLanguageName(historyItem.fromLanguage)})`,
                bold: true,
                size: 28,
                font: "Microsoft YaHei"
              })
            ],
            spacing: { before: 300, after: 200 }
          })
        );

        // 将原文按行分割并添加为段落
        historyItem.originalText.split('\n').forEach(line => {
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
                text: `${t('text.translatedText', '译文')} (${getLanguageName(historyItem.toLanguage)})`,
                bold: true,
                size: 28,
                font: "Microsoft YaHei"
              })
            ],
            spacing: { before: 400, after: 200 }
          })
        );

        // 将译文按行分割并添加为段落
        historyItem.translatedText.split('\n').forEach(line => {
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
          dialogTitle: '分享翻译记录Word文档',
        });
      } else {
        // 如果无法分享，回退到文本分享
        let shareMessage = t('text.translationRecord', '翻译记录') + '\n\n';
        
        if (exportType === 'original' || exportType === 'both') {
          shareMessage += `${t('text.originalText', '原文')} (${getLanguageName(historyItem.fromLanguage)}):\n${historyItem.originalText}\n\n`;
        }
        
        if (exportType === 'translated' || exportType === 'both') {
          shareMessage += `${t('text.translatedText', '译文')} (${getLanguageName(historyItem.toLanguage)}):\n${historyItem.translatedText}`;
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

  // 导出为PDF
  const exportAsPdf = async (exportType: 'original' | 'translated' | 'both' = 'both') => {
    if (!historyItem) return;
    
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
        .language-pair { 
            font-size: 14px; 
            color: #333; 
            margin-bottom: 20px; 
        }
        .section { 
            margin-bottom: 25px; 
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            color: #374151;
        }
        .content { 
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
        <div class="timestamp">${t('text.generatedTime', '生成时间')}: ${historyItem.timestamp.toLocaleString()}</div>
        <div class="language-pair">${t('history.languagePair', '语言对')}: ${getLanguageName(historyItem.fromLanguage)} → ${getLanguageName(historyItem.toLanguage)}</div>
    </div>`;

        let contentSections = '';
        
        if (exportType === 'original' || exportType === 'both') {
          contentSections += `
    <div class="section original">
        <div class="section-title">原文 (${getLanguageName(historyItem.fromLanguage)})</div>
        <div class="content">${historyItem.originalText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>`;
        }
        
        if (exportType === 'translated' || exportType === 'both') {
          contentSections += `
    <div class="section translated">
        <div class="section-title">${t('text.translatedText', '译文')} (${getLanguageName(historyItem.toLanguage)})</div>
        <div class="content">${historyItem.translatedText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
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
          dialogTitle: '分享翻译记录PDF',
        });
      } else {
        // 如果无法分享，回退到文本分享
        let shareMessage = t('text.translationRecord', '翻译记录') + '\n\n';
        
        if (exportType === 'original' || exportType === 'both') {
          shareMessage += `${t('text.originalText', '原文')} (${getLanguageName(historyItem.fromLanguage)}):\n${historyItem.originalText}\n\n`;
        }
        
        if (exportType === 'translated' || exportType === 'both') {
          shareMessage += `${t('text.translatedText', '译文')} (${getLanguageName(historyItem.toLanguage)}):\n${historyItem.translatedText}`;
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
  
  // 从路由参数中获取历史记录数据
  const historyItem = params ? {
    id: params.id as string,
    originalText: params.original as string,
    translatedText: params.translated as string,
    fromLanguage: params.fromLanguage as string,
    toLanguage: params.toLanguage as string,
    timestamp: new Date(params.timestamp as string),
  } : null;
  
  console.log('处理后的历史记录数据:', historyItem);

  if (!historyItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            {t('history.loadError', '无法加载翻译详情')}
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              // 返回前停止所有播报
              Speech.stop();
              setIsSpeakingOriginal(false);
              setIsSpeakingTranslated(false);
              console.log('错误页面返回，停止播报');
              router.back();
            }}
          >
            <Text style={[styles.backButtonText, { color: colors.primaryText }]}>
              {t('common.back', '返回')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      {/* 头部 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            // 返回前停止所有播报
            Speech.stop();
            setIsSpeakingOriginal(false);
            setIsSpeakingTranslated(false);
            console.log('返回按钮点击，停止播报');
            
            router.back();
            // 延迟一点时间确保页面切换完成后再打开历史记录
            setTimeout(() => {
              // 通过路由参数告诉文本页面打开历史记录
              router.setParams({ showHistory: 'true' });
            }, 100);
          }}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← {t('common.back', '返回')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('history.detailTitle', '翻译详情')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 内容 */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 翻译信息 */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {t('history.translationTime', '翻译时间')}
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {historyItem.timestamp.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {t('history.languagePair', '语言对')}
            </Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>
              {getLanguageName(historyItem.fromLanguage)} → {getLanguageName(historyItem.toLanguage)}
            </Text>
          </View>
        </View>

        {/* 原文 */}
        <View style={[styles.textCard, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.textCardTitle, { color: colors.text }]}>
              {t('text.originalText', '原文')} ({getLanguageName(historyItem.fromLanguage)})
            </Text>
          </View>
          <View style={[styles.textContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.textContent, { color: colors.text }]}>
              {historyItem.originalText}
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => playOriginalText(historyItem.originalText, historyItem.fromLanguage)}
              >
                {isSpeakingOriginal ? (
                  <Pause size={20} color={colors.textSecondary} />
                ) : (
                  <Play size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => copyText(historyItem.originalText)}
              >
                <Copy size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => shareText(historyItem.originalText)}
              >
                <Share2 size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <View style={styles.exportContainer}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowExportOptionsOriginal(!showExportOptionsOriginal)}
                >
                  <FileDown size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {showExportOptionsOriginal && (
                  <>
                    <Pressable style={styles.exportOverlay} onPress={closeAllExportOptions} />
                    <View style={[styles.exportOptions, { backgroundColor: colors.card }]}>
                      <TouchableOpacity 
                        style={styles.exportOption}
                        onPress={() => {
                          exportAsTxt('original');
                          setShowExportOptionsOriginal(false);
                        }}
                      >
                        <Text style={[styles.exportOptionText, { color: colors.text }]}>TXT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.exportOption}
                        onPress={() => {
                          setShowPdfExportModalOriginal(true);
                          setShowExportOptionsOriginal(false);
                        }}
                      >
                        <Text style={[styles.exportOptionText, { color: colors.text }]}>PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.exportOption}
                        onPress={() => {
                          setShowWordExportModalOriginal(true);
                          setShowExportOptionsOriginal(false);
                        }}
                      >
                        <Text style={[styles.exportOptionText, { color: colors.text }]}>Word</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* 译文 */}
        <View style={[styles.textCard, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.textCardTitle, { color: colors.text }]}>
              {t('text.translatedText', '译文')} ({getLanguageName(historyItem.toLanguage)})
            </Text>
          </View>
          <View style={[styles.textContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.textContent, { color: colors.text }]}>
              {historyItem.translatedText}
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => playTranslatedText(historyItem.translatedText, historyItem.toLanguage)}
              >
                {isSpeakingTranslated ? (
                  <Pause size={20} color={colors.textSecondary} />
                ) : (
                  <Play size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => copyText(historyItem.translatedText)}
              >
                <Copy size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => shareText(historyItem.translatedText)}
              >
                <Share2 size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <View style={styles.exportContainer}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowExportOptionsTranslated(!showExportOptionsTranslated)}
                >
                  <FileDown size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {showExportOptionsTranslated && (
                  <>
                    <Pressable style={styles.exportOverlay} onPress={closeAllExportOptions} />
                    <View style={[styles.exportOptions, { backgroundColor: colors.card }]}>
                      <TouchableOpacity 
                        style={styles.exportOption}
                        onPress={() => {
                          exportAsTxt('translated');
                          setShowExportOptionsTranslated(false);
                        }}
                      >
                        <Text style={[styles.exportOptionText, { color: colors.text }]}>TXT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.exportOption}
                        onPress={() => {
                          setShowPdfExportModalTranslated(true);
                          setShowExportOptionsTranslated(false);
                        }}
                      >
                        <Text style={[styles.exportOptionText, { color: colors.text }]}>PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.exportOption}
                        onPress={() => {
                          setShowWordExportModalTranslated(true);
                          setShowExportOptionsTranslated(false);
                        }}
                      >
                        <Text style={[styles.exportOptionText, { color: colors.text }]}>Word</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* 原文卡片PDF导出选项模态框 */}
      <Modal
        visible={showPdfExportModalOriginal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPdfExportModalOriginal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('text.selectExportContent', '选择导出内容')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPdfExportModalOriginal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.exportOptionsContainer}>
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsPdf('original');
                  setShowPdfExportModalOriginal(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>{t('text.originalOnly', '仅原文')}</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(historyItem.fromLanguage)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsPdf('both');
                  setShowPdfExportModalOriginal(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>原文 + 译文</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(historyItem.fromLanguage)} + {getLanguageName(historyItem.toLanguage)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 译文卡片PDF导出选项模态框 */}
      <Modal
        visible={showPdfExportModalTranslated}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPdfExportModalTranslated(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('text.selectExportContent', '选择导出内容')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPdfExportModalTranslated(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.exportOptionsContainer}>
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsPdf('translated');
                  setShowPdfExportModalTranslated(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>{t('text.translatedOnly', '仅译文')}</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(historyItem.toLanguage)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsPdf('both');
                  setShowPdfExportModalTranslated(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>原文 + 译文</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(historyItem.fromLanguage)} + {getLanguageName(historyItem.toLanguage)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 原文卡片Word导出选项模态框 */}
      <Modal
        visible={showWordExportModalOriginal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWordExportModalOriginal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('text.selectExportContent', '选择导出内容')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowWordExportModalOriginal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.exportOptionsContainer}>
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsWord('original');
                  setShowWordExportModalOriginal(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>{t('text.originalOnly', '仅原文')}</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(historyItem.fromLanguage)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsWord('both');
                  setShowWordExportModalOriginal(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>原文 + 译文</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(historyItem.fromLanguage)} + {getLanguageName(historyItem.toLanguage)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 译文卡片Word导出选项模态框 */}
      <Modal
        visible={showWordExportModalTranslated}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWordExportModalTranslated(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('text.selectExportContent', '选择导出内容')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowWordExportModalTranslated(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.exportOptionsContainer}>
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsWord('translated');
                  setShowWordExportModalTranslated(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>{t('text.translatedOnly', '仅译文')}</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(historyItem.toLanguage)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOptionItem}
                onPress={() => {
                  exportAsWord('both');
                  setShowWordExportModalTranslated(false);
                }}
              >
                <Text style={styles.exportOptionItemText}>原文 + 译文</Text>
                <Text style={styles.exportOptionItemSubtext}>
                  {getLanguageName(historyItem.fromLanguage)} + {getLanguageName(historyItem.toLanguage)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60, // 占位符，保持标题居中
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50, // 增加滚动范围，为底部导航栏预留更多空间
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  textCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  textCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  textContainer: {
    borderRadius: 8,
    padding: 15,
    minHeight: 100,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: 8,
  },
  // Export Options Styles
  exportContainer: {
    position: 'relative',
  },
  exportOverlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
  },
  exportOptions: {
    position: 'absolute',
    top: 40,
    right: 0,
    flexDirection: 'column',
    gap: 3,
    zIndex: 1000,
  },
  exportOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: '#374151',
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  // PDF导出选项模态框样式
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
