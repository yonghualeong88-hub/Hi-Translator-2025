import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowUpDown } from 'lucide-react-native';

/**
 * 语言选择器组件属性接口
 * 
 * @param fromLanguage - 源语言代码
 * @param toLanguage - 目标语言代码
 * @param colors - 主题颜色配置
 * @param onFromLanguagePress - 源语言按钮点击回调
 * @param onToLanguagePress - 目标语言按钮点击回调
 * @param onSwapLanguages - 语言交换回调
 * @param getLanguageName - 获取语言显示名称函数
 */
interface LanguageSelectorProps {
  fromLanguage: string;
  toLanguage: string;
  colors: any;
  onFromLanguagePress: () => void;
  onToLanguagePress: () => void;
  onSwapLanguages: () => void;
  getLanguageName: (code: string) => string;
}

export default function LanguageSelector({
  fromLanguage,
  toLanguage,
  colors,
  onFromLanguagePress,
  onToLanguagePress,
  onSwapLanguages,
  getLanguageName,
}: LanguageSelectorProps) {
  return (
    <View style={styles.languageContainer}>
      <TouchableOpacity 
        style={[styles.languageBox, { backgroundColor: '#374151' }]}
        onPress={onFromLanguagePress}
      >
        <Text style={[styles.languageText, { color: '#FFFFFF' }]}>
          {getLanguageName(fromLanguage)}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.swapButton}
        onPress={onSwapLanguages}
      >
        <ArrowUpDown size={24} color={colors.primary} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.languageBox, { backgroundColor: '#374151' }]}
        onPress={onToLanguagePress}
      >
        <Text style={[styles.languageText, { color: '#FFFFFF' }]}>
          {getLanguageName(toLanguage)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  languageBox: {
    width: '44%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
  languageText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
