import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Book,
  BookOpen,
  Building,
  Car,
  Dice6,
  DollarSign,
  FileText,
  Folder,
  Gamepad2,
  Gift,
  Globe,
  Heart,
  Key,
  Laptop,
  Lightbulb,
  Menu,
  MessageCircle,
  Music,
  Palette,
  PartyPopper,
  Plane,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Smartphone,
  Star,
  Target,
  Theater,
  Trash2,
  Trophy,
  Utensils,
  Wrench
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SUPPORTED_LANGUAGES, getLanguageFullDisplayName } from '../../constants/languages';
import { PHRASE_TRANSLATIONS, getPhraseTranslation } from '../../constants/phrase-translations';
import { ExpandedPhrase, expandPhrase } from '../../utils/api';
import { translateText } from '../../services/translationService';
import { playTTS } from '../../services/ttsService';

interface Phrase {
  id: string;
  original: string;
  translated: string;
  fromLanguage: string;
  toLanguage: string;
  category: string;
  isFavorite: boolean;
  isCustom: boolean;
  timestamp: Date;
}

type TabType = 'all' | 'favorites' | 'custom';

export default function PhrasesScreen() {
  const { colors } = useTheme();
  const { t, currentLanguage } = useI18n();
  const insets = useSafeAreaInsets();
  
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchText, setSearchText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhrase, setNewPhrase] = useState({
    original: '',
    translated: '',
    fromLanguage: 'en',
    toLanguage: 'zh-CN',
    category: 'custom'
  });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showExpandModal, setShowExpandModal] = useState(false);
  const [expandInput, setExpandInput] = useState('');
  const [expandedPhrases, setExpandedPhrases] = useState<ExpandedPhrase[]>([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [showFromLanguagePicker, setShowFromLanguagePicker] = useState(false);
  const [showToLanguagePicker, setShowToLanguagePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAddCategoryPicker, setShowAddCategoryPicker] = useState(false);
  const [showAddNewCategoryModal, setShowAddNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Folder');
  const [showSaveCategoryPicker, setShowSaveCategoryPicker] = useState(false);
  const [saveCategoryId, setSaveCategoryId] = useState('');
  const [isFromSaveCategoryPicker, setIsFromSaveCategoryPicker] = useState(false);
  const [languageSearchText, setLanguageSearchText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [showCategoryView, setShowCategoryView] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 使用与相机页面相同的语言数据
  const languageOptions = SUPPORTED_LANGUAGES;

  // 美观的图标选项 - 使用Lucide图标
  const iconOptions = [
    { name: 'Folder', component: Folder },
    { name: 'Car', component: Car },
    { name: 'ShoppingBag', component: ShoppingBag },
    { name: 'Utensils', component: Utensils },
    { name: 'AlertTriangle', component: AlertTriangle },
    { name: 'Building', component: Building },
    { name: 'MessageCircle', component: MessageCircle },
    { name: 'Heart', component: Heart },
    { name: 'Target', component: Target },
    { name: 'Lightbulb', component: Lightbulb },
    { name: 'Wrench', component: Wrench },
    { name: 'Book', component: Book },
    { name: 'Palette', component: Palette },
    { name: 'Music', component: Music },
    { name: 'Activity', component: Activity },
    { name: 'Plane', component: Plane },
    { name: 'Globe', component: Globe },
    { name: 'DollarSign', component: DollarSign },
    { name: 'Gamepad2', component: Gamepad2 },
    { name: 'Smartphone', component: Smartphone },
    { name: 'Laptop', component: Laptop },
    { name: 'Theater', component: Theater },
    { name: 'Trophy', component: Trophy },
    { name: 'PartyPopper', component: PartyPopper },
    { name: 'Gift', component: Gift },
    { name: 'Key', component: Key },
    { name: 'FileText', component: FileText },
    { name: 'BarChart3', component: BarChart3 },
    { name: 'Dice6', component: Dice6 },
    { name: 'Star', component: Star },
    { name: 'BookOpen', component: BookOpen },
    { name: 'Plus', component: Plus }
  ];

  // 分类卡片数据 - 使用状态管理
  const [categoryCards, setCategoryCards] = useState([
    {
      id: 'travel',
      title: t('phrases.travelTitle', '出行交通'),
      icon: 'Car',
      description: t('phrases.travelDesc', '问路导航、交通工具、座位预订'),
      color: '#4CAF50',
      count: 15
    },
    {
      id: 'shopping',
      title: t('phrases.shoppingTitle', '购物消费'),
      icon: 'ShoppingBag',
      description: t('phrases.shoppingDesc', '价格询问、支付方式、试穿退货'),
      color: '#FF9800',
      count: 15
    },
    {
      id: 'dining',
      title: t('phrases.diningTitle', '餐饮美食'),
      icon: 'Utensils',
      description: t('phrases.diningDesc', '点餐服务、食物偏好、过敏信息'),
      color: '#E91E63',
      count: 15
    },
    {
      id: 'emergency',
      title: t('phrases.emergencyTitle', '紧急情况'),
      icon: 'AlertTriangle',
      description: t('phrases.emergencyDesc', '求助报警、医疗急救、物品丢失'),
      color: '#F44336',
      count: 15
    },
    {
      id: 'hotel',
      title: t('phrases.hotelTitle', '住宿酒店'),
      icon: 'Building',
      description: t('phrases.hotelDesc', '预订入住、酒店设施、客房服务'),
      color: '#2196F3',
      count: 15
    },
    {
      id: 'communication',
      title: t('phrases.communicationTitle', '日常交流'),
      icon: 'MessageCircle',
      description: t('phrases.communicationDesc', '基本问候、礼貌用语、沟通技巧'),
      color: '#9C27B0',
      count: 15
    },
    {
      id: 'medical',
      title: t('phrases.medicalTitle', '医疗健康'),
      icon: 'Heart',
      description: t('phrases.medicalDesc', '就医预约、症状描述、药品需求'),
      color: '#00BCD4',
      count: 10
    }
  ]);


  // 过滤语言选项 - 排除Auto Detect并按A-Z排序
  const filteredLanguageOptions = languageOptions
    .filter(lang => {
      // 排除Auto Detect（添加短语需要明确语言）
      if (lang.code === 'auto') return false;
      
      // 根据搜索文本过滤
      return lang.name.toLowerCase().includes(languageSearchText.toLowerCase()) ||
             lang.nativeName.toLowerCase().includes(languageSearchText.toLowerCase()) ||
             lang.code.toLowerCase().includes(languageSearchText.toLowerCase());
    })
    .sort((a, b) => {
      // 按英文名称A-Z排序
      return a.name.localeCompare(b.name);
    });

  // 获取语言显示名称 - 使用与相机页面相同的函数
  const getLanguageDisplayName = (code: string) => {
    return getLanguageFullDisplayName(code);
  };

  // 获取分类显示名称
  const getCategoryDisplayName = (categoryId: string) => {
    const category = categoryCards.find(c => c.id === categoryId);
    if (category) {
      return category.title;
    }
    
    // 如果是自定义分类，从ID中提取名称
    if (categoryId.startsWith('custom_')) {
      const title = categoryId.replace('custom_', '').replace(/_/g, ' ');
      return title;
    }
    
    return '其他';
  };

  // 根据图标名称获取Lucide图标组件
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'Folder': Folder,
      'Car': Car,
      'ShoppingBag': ShoppingBag,
      'Utensils': Utensils,
      'AlertTriangle': AlertTriangle,
      'Building': Building,
      'MessageCircle': MessageCircle,
      'Heart': Heart,
      'Target': Target,
      'Lightbulb': Lightbulb,
      'Wrench': Wrench,
      'Book': Book,
      'Palette': Palette,
      'Music': Music,
      'Activity': Activity,
      'Plane': Plane,
      'Globe': Globe,
      'DollarSign': DollarSign,
      'Gamepad2': Gamepad2,
      'Smartphone': Smartphone,
      'Laptop': Laptop,
      'Theater': Theater,
      'Trophy': Trophy,
      'PartyPopper': PartyPopper,
      'Gift': Gift,
      'Key': Key,
      'FileText': FileText,
      'BarChart3': BarChart3,
      'Dice6': Dice6,
      'Star': Star,
      'BookOpen': BookOpen,
      'Plus': Plus
    };
    return iconMap[iconName] || Folder;
  };

  // 根据场景名称推断分类
  const getCategoryFromScene = (scene: string): string => {
    const sceneLower = scene.toLowerCase();
    
    if (sceneLower.includes('交通') || sceneLower.includes('出行') || sceneLower.includes('导航') || 
        sceneLower.includes('机场') || sceneLower.includes('地铁') || sceneLower.includes('出租车')) {
      return 'travel';
    } else if (sceneLower.includes('购物') || sceneLower.includes('商店') || sceneLower.includes('支付') || 
               sceneLower.includes('价格') || sceneLower.includes('试穿') || sceneLower.includes('退货')) {
      return 'shopping';
    } else if (sceneLower.includes('餐厅') || sceneLower.includes('点餐') || sceneLower.includes('菜单') || 
               sceneLower.includes('食物') || sceneLower.includes('饮料') || sceneLower.includes('结账')) {
      return 'dining';
    } else if (sceneLower.includes('紧急') || sceneLower.includes('帮助') || sceneLower.includes('警察') || 
               sceneLower.includes('医院') || sceneLower.includes('救护车') || sceneLower.includes('丢失')) {
      return 'emergency';
    } else if (sceneLower.includes('酒店') || sceneLower.includes('住宿') || sceneLower.includes('房间') || 
               sceneLower.includes('预订') || sceneLower.includes('退房') || sceneLower.includes('服务')) {
      return 'hotel';
    } else if (sceneLower.includes('交流') || sceneLower.includes('问候') || sceneLower.includes('礼貌') || 
               sceneLower.includes('沟通') || sceneLower.includes('感谢') || sceneLower.includes('道歉')) {
      return 'communication';
    } else if (sceneLower.includes('医疗') || sceneLower.includes('医生') || sceneLower.includes('药物') || 
               sceneLower.includes('症状') || sceneLower.includes('预约') || sceneLower.includes('健康')) {
      return 'medical';
    } else if (sceneLower.includes('游泳') || sceneLower.includes('健身') || sceneLower.includes('运动') || 
               sceneLower.includes('锻炼') || sceneLower.includes('体育') || sceneLower.includes('比赛')) {
      return 'sports'; // 运动分类
    } else {
      return 'custom'; // 默认分类
    }
  };

  // 创建新分类
  const createNewCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('提示', '请输入分类名称');
      return;
    }

    // 生成基于分类名称的ID
    const safeId = newCategoryName.trim().toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w\u4e00-\u9fff]/g, '') // 保留字母、数字、下划线和中文
      .substring(0, 20); // 限制长度
    const newCategoryId = `custom_${safeId}`;
    
    const newCategory = {
      id: newCategoryId,
      title: newCategoryName.trim(),
      icon: newCategoryIcon,
      description: '自定义分类',
      color: '#9E9E9E',
      count: 0
    };

    // 将新分类添加到分类列表中
    const updatedCards = [...categoryCards, newCategory];
    setCategoryCards(updatedCards);
    await saveCategoryCards(updatedCards);
    
    // 如果是从保存分类选择器来的，直接保存扩展短语
    if (isFromSaveCategoryPicker && expandedPhrases.length > 0) {
      console.log('从保存分类选择器创建新分类，准备保存扩展短语');
      console.log('当前扩展短语状态:', expandedPhrases);
      setShowAddNewCategoryModal(false);
      setIsFromSaveCategoryPicker(false);
      // 使用setTimeout确保状态更新完成后再保存，并标记分类已存在
      setTimeout(() => {
        performSaveExpandedPhrasesWithExistingCategory(newCategoryId);
      }, 100);
    } else {
      // 设置新分类为选中状态
      setNewPhrase({...newPhrase, category: newCategoryId});
      setShowAddNewCategoryModal(false);
      setShowAddCategoryPicker(false);
    }
    setShowAddModal(true);
    
    // 重置表单
    setNewCategoryName('');
    setNewCategoryIcon('Folder');
    
    Alert.alert(t('common.success', '成功'), t('phrases.categoryCreated', `分类"${newCategoryName}"已创建`));
  };

  // 检查分类是否存在
  const categoryExists = (categoryId: string) => {
    return categoryCards.some(category => category.id === categoryId);
  };

  // 清除添加短语内容
  const clearAddPhraseContent = () => {
    setNewPhrase(prev => ({
      original: '',
      translated: '',
      fromLanguage: prev.fromLanguage, // 保留用户选择的语言
      toLanguage: prev.toLanguage, // 保留用户选择的语言
      category: 'custom'
    }));
  };

  // 关闭添加短语模态框并清除内容
  const closeAddModal = () => {
    setShowAddModal(false);
    clearAddPhraseContent();
  };

  // 关闭分类选择器并清除内容（用户取消操作）
  const closeAddCategoryPicker = () => {
    setShowAddCategoryPicker(false);
    clearAddPhraseContent();
  };

  // 关闭添加新分类模态框并清除内容（用户取消操作）
  const closeAddNewCategoryModal = () => {
    setShowAddNewCategoryModal(false);
    clearAddPhraseContent();
  };

  // 翻译功能
  const handleTranslate = async () => {
    if (!newPhrase.original.trim()) {
      Alert.alert(t('common.tip', '提示'), t('text.pleaseEnterText', '请输入要翻译的文本'));
      return;
    }

    setIsTranslating(true);
    try {
      // 调用真正的翻译API
      const result = await translateText(newPhrase.original, newPhrase.fromLanguage, newPhrase.toLanguage);
      if (result.success && result.translatedText) {
        setNewPhrase({...newPhrase, translated: result.translatedText});
      } else {
        // 即使翻译失败，也显示翻译结果（可能是降级翻译）
        if (result.translatedText) {
          setNewPhrase({...newPhrase, translated: result.translatedText});
          Alert.alert(t('voice.translationComplete', '翻译完成'), t('common.usingFallbackTranslation', '已使用降级翻译服务'));
        } else {
          Alert.alert(t('errors.translationError', '翻译失败'), t('errors.translationServiceUnavailable', '翻译服务暂时不可用，请稍后重试'));
        }
      }
    } catch (error) {
      console.error('翻译错误:', error);
      Alert.alert(t('errors.translationError', '翻译失败'), t('errors.networkError', '请检查网络连接或稍后重试'));
    } finally {
      setIsTranslating(false);
    }
  };

  // 内置常用短语 - 100个实用场景短语
  const defaultPhrases: Phrase[] = [
    // 🚗 出行交通 (15个短语)
    {
      id: '1',
      original: 'Where is the restroom?',
      translated: '洗手间在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '2',
      original: 'Where is the subway station?',
      translated: '地铁站在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '3',
      original: 'How do I get to the airport?',
      translated: '怎么去机场？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '4',
      original: 'Is this seat taken?',
      translated: '这个座位有人吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '5',
      original: 'What time does the bus arrive?',
      translated: '公交车什么时候到？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '6',
      original: 'How much is the taxi fare?',
      translated: '出租车费多少钱？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '7',
      original: 'Can you help me with my luggage?',
      translated: '您能帮我拿行李吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '8',
      original: 'Where is the nearest train station?',
      translated: '最近的火车站在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '9',
      original: 'Is there a direct flight to Beijing?',
      translated: '有直飞北京的航班吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '10',
      original: 'Can I get a window seat?',
      translated: '我可以要靠窗的座位吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '11',
      original: 'How long does the flight take?',
      translated: '飞行需要多长时间？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '12',
      original: 'Where is the baggage claim?',
      translated: '行李提取处在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '13',
      original: 'Can you show me on the map?',
      translated: '您能在地图上指给我看吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '14',
      original: 'Is it far from here?',
      translated: '离这里远吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '15',
      original: 'Can I walk there?',
      translated: '我可以步行去那里吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'travel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },

    // 🛍️ 购物消费 (15个短语)
    {
      id: '16',
      original: 'How much does this cost?',
      translated: '这个多少钱？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '17',
      original: 'Do you accept credit cards?',
      translated: '你们接受信用卡吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '18',
      original: 'Can I try this on?',
      translated: '我可以试穿这个吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '19',
      original: 'Do you have this in a different size?',
      translated: '这个有其他尺寸吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '20',
      original: 'Where are the fitting rooms?',
      translated: '试衣间在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '21',
      original: 'Do you have this in other colors?',
      translated: '这个有其他颜色吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '22',
      original: 'Is this on sale?',
      translated: '这个打折吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '23',
      original: 'Can you give me a discount?',
      translated: '您能给我打个折吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '24',
      original: 'Do you have a warranty?',
      translated: '有保修吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '25',
      original: 'Can I return this?',
      translated: '我可以退货吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '26',
      original: 'Where is the cashier?',
      translated: '收银台在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '27',
      original: 'Do you have a shopping bag?',
      translated: '有购物袋吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '28',
      original: 'Can I pay by mobile payment?',
      translated: '可以用手机支付吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '29',
      original: 'Do you deliver?',
      translated: '你们送货吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '30',
      original: 'What\'s your return policy?',
      translated: '你们的退货政策是什么？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'shopping',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },

    // 🍽️ 餐饮美食 (15个短语)
    {
      id: '31',
      original: 'Check, please',
      translated: '买单',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '32',
      original: 'I would like to order',
      translated: '我想点餐',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '33',
      original: 'Could I have the menu, please?',
      translated: '请给我菜单',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '34',
      original: 'Is this dish spicy?',
      translated: '这道菜辣吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '35',
      original: 'What do you recommend?',
      translated: '您推荐什么？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '36',
      original: 'I\'m allergic to nuts',
      translated: '我对坚果过敏',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '37',
      original: 'Could I have some water?',
      translated: '请给我一些水',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '38',
      original: 'This is delicious!',
      translated: '这个很好吃！',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '39',
      original: 'Could I have the bill?',
      translated: '请给我账单',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '40',
      original: 'Is service included?',
      translated: '包含服务费吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '41',
      original: 'Could I have a table for two?',
      translated: '我要一张两人桌',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '42',
      original: 'Do you have vegetarian options?',
      translated: '有素食选择吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '43',
      original: 'Could you make it less spicy?',
      translated: '您能做得不那么辣吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '44',
      original: 'I\'d like to make a reservation',
      translated: '我想预订',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '45',
      original: 'Could I see the wine list?',
      translated: '我能看看酒单吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'dining',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },

    // 🚨 紧急情况 (15个短语)
    {
      id: '46',
      original: 'I need help',
      translated: '我需要帮助',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '47',
      original: 'Call the police',
      translated: '报警',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '48',
      original: 'I lost my passport',
      translated: '我丢了护照',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '49',
      original: 'Where is the hospital?',
      translated: '医院在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '50',
      original: 'Call an ambulance',
      translated: '叫救护车',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '51',
      original: 'I\'m injured',
      translated: '我受伤了',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '52',
      original: 'I need to see a doctor',
      translated: '我需要看医生',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '53',
      original: 'Where is the pharmacy?',
      translated: '药店在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '54',
      original: 'I lost my wallet',
      translated: '我丢了钱包',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '55',
      original: 'I need to contact my embassy',
      translated: '我需要联系我的大使馆',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '56',
      original: 'My phone is stolen',
      translated: '我的手机被偷了',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '57',
      original: 'Can you help me find my hotel?',
      translated: '您能帮我找到我的酒店吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '58',
      original: 'I\'m lost',
      translated: '我迷路了',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '59',
      original: 'Fire!',
      translated: '着火了！',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '60',
      original: 'There\'s been an accident',
      translated: '发生了事故',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'emergency',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },

    // 🏨 住宿酒店 (15个短语)
    {
      id: '61',
      original: 'I have a reservation',
      translated: '我有预订',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '62',
      original: 'What time is checkout?',
      translated: '退房时间是几点？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '63',
      original: 'Could you wake me up at 7 AM?',
      translated: '能在早上7点叫醒我吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '64',
      original: 'Where is the elevator?',
      translated: '电梯在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '65',
      original: 'Do you have room service?',
      translated: '有客房服务吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '66',
      original: 'Where is the swimming pool?',
      translated: '游泳池在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '67',
      original: 'Could I have extra towels?',
      translated: '我能要额外的毛巾吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '68',
      original: 'Is breakfast included?',
      translated: '包含早餐吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '69',
      original: 'Could you help me with my luggage?',
      translated: '您能帮我拿行李吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '70',
      original: 'Where is the fitness center?',
      translated: '健身房在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '71',
      original: 'Do you have WiFi?',
      translated: '有WiFi吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '72',
      original: 'Could I extend my stay?',
      translated: '我能延长住宿吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '73',
      original: 'Where can I do laundry?',
      translated: '我在哪里可以洗衣服？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '74',
      original: 'Could you call me a taxi?',
      translated: '您能帮我叫辆出租车吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '75',
      original: 'Do you have a safe?',
      translated: '有保险箱吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'hotel',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },

    // 💬 日常交流 (15个短语)
    {
      id: '76',
      original: 'Excuse me, do you speak English?',
      translated: '打扰一下，您会说英语吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '77',
      original: 'Thank you very much',
      translated: '非常感谢',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '78',
      original: 'Sorry, I don\'t understand',
      translated: '抱歉，我不明白',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '79',
      original: 'Could you speak more slowly?',
      translated: '您能说慢一点吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '80',
      original: 'Could you repeat that?',
      translated: '您能重复一遍吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '81',
      original: 'Nice to meet you',
      translated: '很高兴认识您',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '82',
      original: 'How are you?',
      translated: '您好吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '83',
      original: 'What\'s your name?',
      translated: '您叫什么名字？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '84',
      original: 'Where are you from?',
      translated: '您来自哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '85',
      original: 'Could you help me?',
      translated: '您能帮助我吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '86',
      original: 'I\'m sorry for the trouble',
      translated: '抱歉给您添麻烦了',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '87',
      original: 'You\'re welcome',
      translated: '不客气',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '88',
      original: 'Have a good day',
      translated: '祝您有美好的一天',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '89',
      original: 'See you later',
      translated: '回头见',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '90',
      original: 'Could you write it down?',
      translated: '您能写下来吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'communication',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },

    // 🏥 医疗健康 (10个短语)
    {
      id: '91',
      original: 'I need to see a doctor',
      translated: '我需要看医生',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'medical',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '92',
      original: 'I have a headache',
      translated: '我头疼',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'medical',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '93',
      original: 'I feel sick',
      translated: '我觉得不舒服',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'medical',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '94',
      original: 'I need medicine',
      translated: '我需要药物',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'medical',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '95',
      original: 'I have an appointment',
      translated: '我有预约',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'medical',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '96',
      original: 'Where is the nearest clinic?',
      translated: '最近的诊所在哪里？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'medical',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '97',
      original: 'I need a prescription',
      translated: '我需要处方',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'medical',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '98',
      original: 'How much does the consultation cost?',
      translated: '咨询费多少钱？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'medical',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '99',
      original: 'I have insurance',
      translated: '我有保险',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'medical',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    },
    {
      id: '100',
      original: 'Could you call an ambulance?',
      translated: '您能叫救护车吗？',
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: 'medical',
      isFavorite: false,
      isCustom: false,
      timestamp: new Date()
    }
  ];

  // 根据当前app language转换短语的译文（仅用于显示，不修改存储数据）
  const getDisplayPhrase = (phrase: Phrase): Phrase => {
    // 如果是用户自定义短语，保持原样
    if (phrase.isCustom) {
      return phrase;
    }
    
    // 如果是内置短语，根据当前语言动态转换译文
    const translations = PHRASE_TRANSLATIONS[phrase.original];
    let translatedText: string;
    
    if (translations && translations[currentLanguage]) {
      // 有对应语言的翻译
      translatedText = translations[currentLanguage];
    } else if (currentLanguage === 'zh-CN') {
      // 中文用户：使用原始的中文译文
      translatedText = phrase.translated;
    } else if (currentLanguage === 'en') {
      // 英文用户：显示英文原文（因为短语original就是英文）
      translatedText = phrase.original;
    } else {
      // 其他语言：如果有中文译文就显示中文，否则显示英文
      translatedText = translations?.['zh-CN'] || phrase.translated || phrase.original;
    }
    
    return {
      ...phrase,
      translated: translatedText,
      toLanguage: currentLanguage
    };
  };

  // 加载短语数据
  useEffect(() => {
    loadPhrases();
    loadCategoryCards();
    loadLanguagePreferences();
    // 清空扩展短语状态，避免意外触发
    setExpandedPhrases([]);
  }, []);

  const loadPhrases = async () => {
    try {
      const savedPhrases = await AsyncStorage.getItem('phrases');
      if (savedPhrases) {
        const parsedPhrases = JSON.parse(savedPhrases).map((phrase: any) => ({
          ...phrase,
          timestamp: new Date(phrase.timestamp)
        }));
        
        // 检查是否需要更新短语库（如果保存的短语数量少于100个）
        if (parsedPhrases.length < 100) {
          console.log(`检测到短语数量不足(${parsedPhrases.length}/100)，显示刷新选项...`);
          setPhrases(parsedPhrases);
          setShowRefreshButton(true);
        } else {
          setPhrases(parsedPhrases);
          setShowRefreshButton(false);
        }
        // 更新分类计数
        setTimeout(() => {
          updateCategoryCounts(parsedPhrases);
        }, 100);
      } else {
        // 首次使用，保存默认短语
        console.log('首次使用，正在保存100个默认短语...');
        await savePhrases(defaultPhrases);
        setPhrases(defaultPhrases);
        // 更新分类计数
        setTimeout(() => {
          updateCategoryCounts(defaultPhrases);
        }, 100);
        console.log('已保存100个默认短语');
      }
    } catch (error) {
      console.error('加载短语失败:', error);
      setPhrases(defaultPhrases);
    }
  };

  const savePhrases = async (phrasesToSave: Phrase[]) => {
    try {
      await AsyncStorage.setItem('phrases', JSON.stringify(phrasesToSave));
    } catch (error) {
      console.error('保存短语失败:', error);
    }
  };

  // 保存分类卡片到本地存储
  const saveCategoryCards = async (cardsToSave: any[]) => {
    try {
      await AsyncStorage.setItem('categoryCards', JSON.stringify(cardsToSave));
    } catch (error) {
      console.error('保存分类卡片失败:', error);
    }
  };

  // 加载分类卡片从本地存储
  const loadCategoryCards = async () => {
    try {
      const saved = await AsyncStorage.getItem('categoryCards');
      if (saved) {
        const parsedCards = JSON.parse(saved);
        setCategoryCards(parsedCards);
      }
    } catch (error) {
      console.error('加载分类卡片失败:', error);
    }
  };

  // 加载语言偏好
  const loadLanguagePreferences = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem('phraseLanguagePreferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        console.log('📖 加载语言偏好:', prefs);
        setNewPhrase(prev => ({
          ...prev,
          fromLanguage: prefs.fromLanguage || 'en',
          toLanguage: prefs.toLanguage || 'zh-CN'
        }));
      } else {
        console.log('📖 未找到保存的语言偏好，使用默认值 (en → zh-CN)');
      }
    } catch (error) {
      console.error('❌ 加载语言偏好失败:', error);
    }
  };

  // 保存语言偏好
  const saveLanguagePreferences = async (fromLang: string, toLang: string) => {
    try {
      const prefs = {
        fromLanguage: fromLang,
        toLanguage: toLang
      };
      await AsyncStorage.setItem('phraseLanguagePreferences', JSON.stringify(prefs));
      console.log('💾 保存语言偏好:', prefs);
    } catch (error) {
      console.error('❌ 保存语言偏好失败:', error);
    }
  };

  // 更新分类计数
  const updateCategoryCounts = async (phrasesList: Phrase[]) => {
    console.log('🔄 开始更新分类计数，当前分类数量:', categoryCards.length);
    
    // 获取所有唯一的分类ID（包括现有分类和短语中的分类）
    const allCategoryIds = new Set([
      ...categoryCards.map(card => card.id),
      ...phrasesList.map(phrase => phrase.category)
    ]);
    
    const updatedCards = Array.from(allCategoryIds).map(categoryId => {
      const existingCard = categoryCards.find(card => card.id === categoryId);
      const count = phrasesList.filter(phrase => phrase.category === categoryId).length;
      
      if (existingCard) {
        // 更新现有分类的计数
        return { ...existingCard, count };
      } else {
        // 为新分类创建卡片（如果不存在）
        console.log('📁 为新分类创建卡片:', categoryId);
        return {
          id: categoryId,
          title: categoryId.replace('custom_', '').replace(/_/g, ' '),
          icon: 'Folder',
          description: '自定义分类',
          color: '#9E9E9E',
          count: count
        };
      }
    });
    
    console.log('🔄 更新后的分类数量:', updatedCards.length);
    setCategoryCards(updatedCards);
    await saveCategoryCards(updatedCards);
  };

  // 删除自定义分类
  const deleteCategory = async (categoryId: string) => {
    // 检查是否为预设分类（不允许删除）
    const presetCategories = ['travel', 'dining', 'shopping', 'emergency', 'hotel', 'communication', 'medical'];
    if (presetCategories.includes(categoryId)) {
      Alert.alert('提示', '预设分类不能删除');
      return;
    }

    // 获取该分类下的短语数量
    const phrasesInCategory = phrases.filter(phrase => phrase.category === categoryId);
    
    Alert.alert(
      '删除分类',
      `确定要删除分类"${categoryId.replace('custom_', '')}"吗？\n这将同时删除该分类下的 ${phrasesInCategory.length} 个短语。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            // 删除该分类下的所有短语
            const updatedPhrases = phrases.filter(phrase => phrase.category !== categoryId);
            setPhrases(updatedPhrases);
            await savePhrases(updatedPhrases);
            
            // 删除分类卡片
            const updatedCards = categoryCards.filter(card => card.id !== categoryId);
            setCategoryCards(updatedCards);
            await saveCategoryCards(updatedCards);
            
            // 如果当前选中的分类被删除了，重置选择
            if (selectedCategory === categoryId) {
              setSelectedCategory(null);
            }
            
            Alert.alert(t('common.success', '成功'), t('phrases.categoryDeleted', '分类及其下的所有短语已删除'));
          }
        }
      ]
    );
  };

  // 强制刷新短语库
  const forceRefreshPhrases = async () => {
    try {
      console.log('正在强制刷新短语库...');
      await savePhrases(defaultPhrases);
      setPhrases(defaultPhrases);
      setShowRefreshButton(false);
      Alert.alert(t('common.success', '成功'), t('phrases.refreshSuccess', `已更新为${defaultPhrases.length}个短语！`));
    } catch (error) {
      console.error('刷新短语库失败:', error);
      Alert.alert(t('errors.refreshFailed', '刷新失败'), t('errors.pleaseRetry', '请稍后重试'));
    }
  };

  // 处理分类卡片点击
  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryView(false);
    setActiveTab('all'); // 重置标签页
  };

  // 返回分类视图
  const handleBackToCategories = () => {
    setShowCategoryView(true);
    setSelectedCategory(null);
  };

  // AI短语扩展功能
  const handleExpandPhrase = async (phrase: string) => {
    if (!phrase.trim()) {
      Alert.alert('提示', '请输入要扩展的短语');
      return;
    }

    setIsExpanding(true);
    setExpandedPhrases([]); // 清空之前的结果
    
    console.log('🤖 开始AI扩展，短语:', phrase);
    console.log('🌐 网络配置:', { fromLang: newPhrase.fromLanguage, toLang: newPhrase.toLanguage });
    
    try {
      await expandPhrase(
        phrase, 
        setExpandedPhrases, 
        setIsExpanding,
        newPhrase.fromLanguage,
        newPhrase.toLanguage
      );
      console.log('✅ AI扩展完成');
    } catch (error) {
      console.error('❌ 扩展失败:', error);
      setIsExpanding(false);
      
      // 根据错误类型提供更友好的提示
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Request timeout')) {
          Alert.alert(
            t('phrases.generateTimeout', '生成超时'), 
            t('phrases.generateTimeoutMessage', 'AI服务响应较慢，请稍后重试。\n\n建议：\n• 检查网络连接\n• 稍后再试\n• 尝试输入更简单的关键词')
          );
        } else if (error.message.includes('network') || error.message.includes('Network request failed')) {
          Alert.alert(
            t('phrases.networkFailed', '网络连接失败'), 
            t('phrases.networkFailedMessage', '无法连接到AI服务，请检查网络设置。\n\n请确保：\n• 设备已连接到网络\n• 网络连接稳定\n• 防火墙未阻止应用')
          );
        } else if (error.message.includes('API调用失败')) {
          Alert.alert(
            t('phrases.serviceUnavailable', '服务暂时不可用'), 
            t('phrases.serviceUnavailableMessage', 'AI服务暂时无法响应，请稍后重试。\n\n您可以：\n• 等待几分钟后重试\n• 检查网络连接\n• 尝试其他关键词')
          );
        } else {
          Alert.alert(
            t('phrases.generateFailed', '生成失败'), 
            t('phrases.generateFailedMessage', '抱歉，智能短语生成遇到问题。\n\n请尝试：\n• 检查网络连接\n• 稍后重试\n• 使用更简单的关键词')
          );
        }
      } else {
        Alert.alert(
          t('phrases.generateFailed', '生成失败'), 
          t('phrases.generateFailedMessage', '抱歉，智能短语生成遇到问题。\n\n请尝试：\n• 检查网络连接\n• 稍后重试\n• 使用更简单的关键词')
        );
      }
    }
  };

  // 播放TTS
  const playPhrase = async (phrase: Phrase, isOriginal: boolean = true) => {
    try {
      if (playingId === phrase.id) {
        Speech.stop();
        setPlayingId(null);
        return;
      }

      const text = isOriginal ? phrase.original : phrase.translated;
      const language = isOriginal ? phrase.fromLanguage : phrase.toLanguage;
      
      setPlayingId(phrase.id);
      
      // 使用更好的TTS服务
      await playTTS(text, language, 
        () => {
          console.log('短语播放完成');
          setPlayingId(null);
        },
        (error) => {
          console.error('短语播放失败:', error);
          setPlayingId(null);
        }
      );
    } catch (error) {
      console.error('播放失败:', error);
      setPlayingId(null);
    }
  };

  // 切换收藏状态
  const toggleFavorite = async (phraseId: string) => {
    const updatedPhrases = phrases.map(phrase => 
      phrase.id === phraseId 
        ? { ...phrase, isFavorite: !phrase.isFavorite }
        : phrase
    );
    setPhrases(updatedPhrases);
    await savePhrases(updatedPhrases);
  };

  // 删除短语
  const deletePhrase = async (phraseId: string) => {
    Alert.alert(
      '删除短语',
      '确定要删除这个短语吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const updatedPhrases = phrases.filter(phrase => phrase.id !== phraseId);
            setPhrases(updatedPhrases);
            await savePhrases(updatedPhrases);
            // 更新分类计数
            await updateCategoryCounts(updatedPhrases);
          }
        }
      ]
    );
  };

  // 添加短语
  const addCustomPhrase = async () => {
    if (!newPhrase.original.trim() || !newPhrase.translated.trim()) {
      Alert.alert('提示', '请填写完整的短语内容');
      return;
    }

    console.log('📝 开始添加短语:', newPhrase);

    // 检查分类是否存在，如果不存在则创建新分类
    if (!categoryExists(newPhrase.category)) {
      // 这是一个新分类，需要创建
      const newCategory = {
        id: newPhrase.category,
        title: newPhrase.category.replace('custom_', ''), // 从ID中提取名称
        icon: 'Folder', // 默认图标
        description: '自定义分类',
        color: '#9E9E9E',
        count: 1
      };
      const updatedCards = [...categoryCards, newCategory];
      setCategoryCards(updatedCards);
      await saveCategoryCards(updatedCards);
      console.log('📁 创建新分类:', newCategory);
    }

    const customPhrase: Phrase = {
      id: Date.now().toString(),
      original: newPhrase.original.trim(),
      translated: newPhrase.translated.trim(),
      fromLanguage: newPhrase.fromLanguage,
      toLanguage: newPhrase.toLanguage,
      category: newPhrase.category,
      isFavorite: false,
      isCustom: true,
      timestamp: new Date()
    };

    console.log('💾 新短语:', customPhrase);

    const updatedPhrases = [customPhrase, ...phrases];
    setPhrases(updatedPhrases);
    await savePhrases(updatedPhrases);
    // 更新分类计数
    await updateCategoryCounts(updatedPhrases);
    
    console.log('✅ 短语保存完成，总数:', updatedPhrases.length);
    
    // 重置表单
    setNewPhrase({
      original: '',
      translated: '',
      fromLanguage: 'auto',
      toLanguage: 'en',
      category: 'custom'
    });
    setShowAddModal(false);
    
    // 显示成功消息
    const categoryName = getCategoryDisplayName(newPhrase.category);
    Alert.alert(t('common.success', '成功'), t('phrases.phraseSaved', `短语已添加到"${categoryName}"分类中`));
  };

  // 保存扩展的短语
  const saveExpandedPhrase = async (original: string, translated: string, scene: string) => {
    // 使用用户输入的原始短语创建分类
    const originalInput = newPhrase.original.trim();
    // 生成安全的分类ID，处理中文字符
    const safeId = originalInput.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w\u4e00-\u9fff]/g, '') // 保留字母、数字、下划线和中文
      .substring(0, 20); // 限制长度
    const categoryId = `custom_${safeId}`;
    const categoryTitle = originalInput;
    
    // 检查分类是否存在，如果不存在则创建新分类
    if (!categoryExists(categoryId)) {
      // 这是一个新分类，需要创建
      const newCategory = {
        id: categoryId,
        title: categoryTitle, // 使用用户输入的短语作为分类标题
        icon: 'Folder', // 默认图标
        description: `基于"${categoryTitle}"的扩展短语`,
        color: '#9E9E9E',
        count: 1
      };
      const updatedCards = [...categoryCards, newCategory];
      setCategoryCards(updatedCards);
      await saveCategoryCards(updatedCards);
    }
    
    const expandedPhrase: Phrase = {
      id: Date.now().toString(),
      original: original.trim(),
      translated: translated.trim(),
      fromLanguage: 'en',
      toLanguage: 'zh-CN',
      category: categoryId, // 使用基于用户输入的分类ID
      isFavorite: false,
      isCustom: true,
      timestamp: new Date()
    };

    const updatedPhrases = [expandedPhrase, ...phrases];
    setPhrases(updatedPhrases);
    await savePhrases(updatedPhrases);
    // 更新分类计数
    await updateCategoryCounts(updatedPhrases);
    
    Alert.alert(t('common.success', '成功'), t('phrases.phraseSaved', `短语已添加到"${categoryTitle}"分类中`));
  };

  // AI扩展功能已移除保存功能，仅用于预览

  // 保存扩展短语到已存在的分类（避免重复创建分类）
  const performSaveExpandedPhrasesWithExistingCategory = async (selectedCategoryId: string) => {
    
    if (expandedPhrases.length === 0) {
      Alert.alert('提示', '没有可保存的扩展短语');
      return;
    }

    let savedCount = 0;
    let allNewPhrases: Phrase[] = [];
    const existingPhrases = new Set<string>(); // 用于去重

    // 收集现有短语的原文用于去重
    phrases.forEach(phrase => {
      existingPhrases.add(phrase.original.toLowerCase().trim());
    });

    // 收集所有要保存的短语，并去重
    console.log('扩展短语数据结构:', expandedPhrases);
    for (const expandedPhrase of expandedPhrases) {
      console.log('处理场景:', expandedPhrase.scene);
      console.log('短语数组:', expandedPhrase.phrases);
      console.log('翻译数组:', expandedPhrase.translations);
      for (let i = 0; i < expandedPhrase.phrases.length; i++) {
        const phrase = expandedPhrase.phrases[i];
        const translation = expandedPhrase.translations[i];
        
        // 检查是否已存在相同短语
        const phraseKey = phrase.toLowerCase().trim();
        if (existingPhrases.has(phraseKey)) {
          continue; // 跳过重复短语
        }
        
        const newPhrase: Phrase = {
          id: Date.now().toString() + '_' + i + '_' + Math.random().toString(36).substr(2, 9),
          original: phrase.trim(),
          translated: translation.trim(),
          fromLanguage: 'en',
          toLanguage: 'zh-CN',
          category: selectedCategoryId,
          isFavorite: false,
          isCustom: true,
          timestamp: new Date()
        };

        allNewPhrases.push(newPhrase);
        existingPhrases.add(phraseKey); // 添加到已存在集合中，避免本次保存中的重复
        savedCount++;
      }
    }

    console.log('准备保存的短语数量:', allNewPhrases.length);

    // 一次性保存所有短语
    if (allNewPhrases.length > 0) {
      console.log('准备保存的短语:', allNewPhrases);
      const updatedPhrases = [...allNewPhrases, ...phrases];
      console.log('更新后的短语总数:', updatedPhrases.length);
      setPhrases(updatedPhrases);
      await savePhrases(updatedPhrases);
      // 更新分类计数
      await updateCategoryCounts(updatedPhrases);
      console.log('短语保存完成');
    } else {
      console.log('没有新短语需要保存');
    }

    // 清空扩展结果
    setExpandedPhrases([]);
    setShowSaveCategoryPicker(false);
    setShowExpandModal(false);
    
    // 显示保存结果
    Alert.alert(t('common.success', '成功'), t('phrases.phrasesSaved', `已保存 ${savedCount} 个短语到"${selectedCategoryId.replace('custom_', '')}"分类中`));
  };

  // 保存扩展短语到分类
  const performSaveExpandedPhrases = async (selectedCategoryId: string) => {
    console.log('开始保存扩展短语，分类ID:', selectedCategoryId);
    console.log('当前扩展短语数量:', expandedPhrases.length);
    
    if (expandedPhrases.length === 0) {
      Alert.alert('提示', '没有可保存的扩展短语');
      return;
    }

    let savedCount = 0;
    const createdCategories = new Set<string>();
    let allNewPhrases: Phrase[] = [];
    const existingPhrases = new Set<string>(); // 用于去重

    // 收集现有短语的原文用于去重
    phrases.forEach(phrase => {
      existingPhrases.add(phrase.original.toLowerCase().trim());
    });

    // 检查分类是否存在，如果不存在则创建新分类
    if (!categoryExists(selectedCategoryId)) {
      // 从分类ID中提取分类名称
      let categoryTitle = selectedCategoryId.replace('custom_', '').replace(/_/g, ' ');
      
      // 如果ID是时间戳格式，使用默认名称
      if (/^\d+$/.test(selectedCategoryId.replace('custom_', ''))) {
        categoryTitle = t('phrases.smartPhraseCategory', '智能短语分类');
      }
      
      const newCategory = {
        id: selectedCategoryId,
        title: categoryTitle,
        icon: 'Folder',
        description: t('phrases.smartPhraseCategory', '智能短语分类'),
        color: '#9E9E9E',
        count: 0
      };
      console.log('📁 创建新分类卡片:', newCategory);
      const updatedCards = [...categoryCards, newCategory];
      setCategoryCards(updatedCards);
      await saveCategoryCards(updatedCards);
      createdCategories.add(newCategory.title);
      console.log('📁 分类卡片已更新，总数:', updatedCards.length);
    }

    // 收集所有要保存的短语，并去重
    console.log('扩展短语数据结构:', expandedPhrases);
    for (const expandedPhrase of expandedPhrases) {
      console.log('处理场景:', expandedPhrase.scene);
      console.log('短语数组:', expandedPhrase.phrases);
      console.log('翻译数组:', expandedPhrase.translations);
      for (let i = 0; i < expandedPhrase.phrases.length; i++) {
        const phrase = expandedPhrase.phrases[i];
        const translation = expandedPhrase.translations[i];
        
        // 检查是否已存在相同短语
        const phraseKey = phrase.toLowerCase().trim();
        if (existingPhrases.has(phraseKey)) {
          continue; // 跳过重复短语
        }
        
        const newPhrase: Phrase = {
          id: Date.now().toString() + '_' + i + '_' + Math.random().toString(36).substr(2, 9),
          original: phrase.trim(),
          translated: translation.trim(),
          fromLanguage: 'en',
          toLanguage: 'zh-CN',
          category: selectedCategoryId,
          isFavorite: false,
          isCustom: true,
          timestamp: new Date()
        };

        allNewPhrases.push(newPhrase);
        existingPhrases.add(phraseKey); // 添加到已存在集合中，避免本次保存中的重复
        savedCount++;
      }
    }

    console.log('准备保存的短语数量:', allNewPhrases.length);

    // 一次性保存所有短语
    if (allNewPhrases.length > 0) {
      console.log('准备保存的短语:', allNewPhrases);
      const updatedPhrases = [...allNewPhrases, ...phrases];
      console.log('更新后的短语总数:', updatedPhrases.length);
      setPhrases(updatedPhrases);
      await savePhrases(updatedPhrases);
      // 更新分类计数
      await updateCategoryCounts(updatedPhrases);
      console.log('短语保存完成');
    } else {
      console.log('没有新短语需要保存');
    }

    // 清空扩展结果
    setExpandedPhrases([]);
    setShowSaveCategoryPicker(false);
    setShowExpandModal(false);
    
    // 显示保存结果
    const categoryNames = Array.from(createdCategories).join('、');
    Alert.alert(
      '保存成功', 
      `已保存 ${savedCount} 个短语${createdCategories.size > 0 ? `\n创建了分类：${categoryNames}` : ''}`,
      [
        { text: '确定' },
        { 
          text: '查看分类', 
          onPress: () => {
            // 强制刷新分类卡片
            loadCategoryCards();
            setShowCategoryView(true);
            setSelectedCategory(null);
          }
        }
      ]
    );
  };

  // 播放扩展短语
  const playExpandedPhrase = async (text: string, language: string = 'en') => {
    try {
      await playTTS(text, language, 
        () => {
          console.log('扩展短语播放完成');
        },
        (error) => {
          console.error('扩展短语播放失败:', error);
        }
      );
    } catch (error) {
      console.error('播放失败:', error);
    }
  };

  // 过滤短语
  const filteredPhrases = phrases.filter(phrase => {
    const matchesCategory = 
      !selectedCategory || phrase.category === selectedCategory;
    
    if (!matchesCategory) {
      console.log('🚫 短语被过滤:', phrase.original, '分类:', phrase.category, '选中分类:', selectedCategory);
    }
    
    return matchesCategory;
  });

  console.log('🔍 过滤结果:', {
    totalPhrases: phrases.length,
    filteredPhrases: filteredPhrases.length,
    selectedCategory: selectedCategory,
    customPhrases: phrases.filter(p => p.isCustom).length
  });

  console.log('📁 分类卡片状态:', {
    totalCategories: categoryCards.length,
    customCategories: categoryCards.filter(c => c.id.startsWith('custom_')).length,
    categoryIds: categoryCards.map(c => c.id)
  });

  // 渲染分类卡片
  const renderCategoryCard = ({ item }: { item: typeof categoryCards[0] }) => {
    const IconComponent = getIconComponent(item.icon);
    const isCustomCategory = item.id.startsWith('custom_');
    
    return (
      <View style={[styles.categoryCard, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.categoryCardContent}
          onPress={() => handleCategoryPress(item.id)}
        >
          <View style={[styles.categoryIconContainer, { backgroundColor: item.color + '20' }]}>
            <IconComponent size={24} color={item.color} />
          </View>
          <View style={styles.categoryContent}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
            <Text style={[styles.categoryCount, { color: item.color }]}>
              {t('phrases.phraseCount', { count: phrases.filter(phrase => phrase.category === item.id).length, defaultValue: `${phrases.filter(phrase => phrase.category === item.id).length} 个短语` })}
            </Text>
          </View>
          <View style={styles.categoryArrow}>
            <Text style={[styles.categoryArrowText, { color: colors.textSecondary }]}>›</Text>
          </View>
        </TouchableOpacity>
        
        {/* 删除按钮 - 仅对自定义分类显示 */}
        {isCustomCategory && (
          <TouchableOpacity
            style={styles.categoryDeleteButton}
            onPress={() => deleteCategory(item.id)}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPhraseItem = ({ item }: { item: Phrase }) => {
    // 转换为显示用的短语（根据app language）
    const displayPhrase = getDisplayPhrase(item);
    
    return (
    <View style={[styles.phraseCard, { backgroundColor: colors.card }]}>
      <View style={styles.phraseContent}>
        {/* 分类标签 */}
        <View style={styles.phraseHeader}>
          <View style={styles.phraseCategoryContainer}>
            {item.category !== 'custom' && (
              (() => {
                const category = categoryCards.find(c => c.id === item.category);
                if (category) {
                  const IconComponent = getIconComponent(category.icon);
                  return <IconComponent size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />;
                }
                return null;
              })()
            )}
            <Text style={[styles.phraseCategory, { color: colors.textSecondary }]}>
              {(() => {
                // 统一的场景名称映射逻辑
                if (item.category === 'custom') return t('phrases.custom', '自定义');
                
                // 从category中解析场景名
                const sceneName = item.category.replace('custom_', '');
                
                // 查找对应的分类卡片获取显示名称
                const category = categoryCards.find(c => c.id === item.category);
                if (category) {
                  return category.title;
                }
                
                // 如果没有找到分类卡片，使用预设的映射
                const presetMapping: { [key: string]: string } = {
                  'travel': t('phrases.travel', '出行'),
                  'dining': t('phrases.dining', '餐饮'), 
                  'shopping': t('phrases.shopping', '购物'),
                  'emergency': t('phrases.emergency', '紧急'),
                  'hotel': t('phrases.hotel', '住宿'),
                  'communication': t('phrases.communication', '交流'),
                  'medical': t('phrases.medical', '医疗')
                };
                
                return presetMapping[item.category] || sceneName || t('phrases.other', '其他');
              })()}
            </Text>
          </View>
          <View style={styles.phraseActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleFavorite(item.id)}
            >
              <Star 
                size={18} 
                color={item.isFavorite ? '#FFD700' : colors.textSecondary} 
                fill={item.isFavorite ? '#FFD700' : 'none'}
              />
            </TouchableOpacity>
            {item.isCustom && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => deletePhrase(item.id)}
              >
                <Trash2 size={18} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 短语内容 */}
        <View style={styles.phraseMain}>
          <View style={styles.phraseRow}>
            <Text style={[styles.phraseOriginal, { color: colors.text }]}>
              {displayPhrase.original || ''}
            </Text>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: colors.surface }]}
              onPress={() => playPhrase(item, true)}
            >
              <Play 
                size={14} 
                color={playingId === item.id ? colors.primary : colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.phraseRow}>
            <Text style={[styles.phraseTranslated, { color: colors.textSecondary }]}>
              {displayPhrase.translated || ''}
            </Text>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: colors.surface }]}
              onPress={() => playPhrase(item, false)}
            >
              <Play 
                size={14} 
                color={playingId === item.id ? colors.primary : colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {showCategoryView ? (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => router.push('/settings')}
            >
              <Menu size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToCategories}
            >
              <Text style={[styles.backButtonText, { color: colors.primary }]}>‹</Text>
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <View style={styles.titleCenterContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                {showCategoryView ? t('phrases.title', '常用短语') : categoryCards.find(c => c.id === selectedCategory)?.title || t('phrases.phraseList', '短语列表')}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {showRefreshButton && (
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={forceRefreshPhrases}
              >
                <RefreshCw size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showCategoryView ? (
        /* 分类卡片视图 */
        <FlatList
          data={categoryCards}
          renderItem={renderCategoryCard}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          contentContainerStyle={[
            styles.categoryListContainer,
            { paddingBottom: 20 + insets.bottom }
          ]}
          showsVerticalScrollIndicator={false}
          numColumns={1}
        />
      ) : (
        /* 短语列表视图 */
        <>
          {/* Phrases List */}
          <FlatList
            data={filteredPhrases}
            renderItem={renderPhraseItem}
            keyExtractor={(item, index) => `${item.id}_${index}`}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: 20 + insets.bottom }
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <BookOpen size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  暂无短语
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* Add Phrase Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentCenter, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('phrases.addPhrase', '添加短语')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeAddModal}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {/* 语言选择器 */}
              <View style={styles.languageSelectorContainer}>
                <TouchableOpacity
                  style={[styles.languageSelector, { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border 
                  }]}
                  onPress={() => setShowFromLanguagePicker(true)}
                >
                  <Text
                    style={[styles.languageSelectorText, { color: colors.text }]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    allowFontScaling={false}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.75}
                  >
                    {getLanguageDisplayName(newPhrase.fromLanguage)}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.languageArrow}>
                  <Text style={[styles.languageArrowText, { color: colors.textSecondary }]}>→</Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.languageSelector, { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border 
                  }]}
                  onPress={() => setShowToLanguagePicker(true)}
                >
                  <Text
                    style={[styles.languageSelectorText, { color: colors.text }]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    allowFontScaling={false}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.75}
                  >
                    {getLanguageDisplayName(newPhrase.toLanguage)}
                  </Text>
                </TouchableOpacity>
              </View>


              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder={t('phrases.enterKeyword', '请输入关键词')}
                placeholderTextColor={colors.textSecondary}
                value={newPhrase.original}
                onChangeText={(text) => setNewPhrase({...newPhrase, original: text})}
                multiline
              />

              {/* 翻译按钮 */}
              <TouchableOpacity
                style={[styles.translateButton, { 
                  backgroundColor: colors.primary,
                  opacity: isTranslating ? 0.6 : 1
                }]}
                onPress={handleTranslate}
                disabled={isTranslating}
              >
                <Text style={styles.translateButtonText}>
                  {isTranslating ? t('phrases.translating', '翻译中...') : t('common.translate', '翻译')}
                </Text>
              </TouchableOpacity>
              
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder={t('text.translatedText', '译文')}
                placeholderTextColor={colors.textSecondary}
                value={newPhrase.translated}
                onChangeText={(text) => setNewPhrase({...newPhrase, translated: text})}
                multiline
              />
              
              {/* 添加按钮 */}
              <TouchableOpacity
                style={[styles.translateButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (!newPhrase.original.trim() || !newPhrase.translated.trim()) {
                    Alert.alert(t('common.tip', '提示'), t('phrases.fillComplete', '请填写完整的短语内容'));
                    return;
                  }
                  setShowAddModal(false);
                  setShowAddCategoryPicker(true);
                }}
              >
                <Text style={styles.translateButtonText}>
                  {t('common.add', '添加')}
                </Text>
              </TouchableOpacity>
              
              {/* AI智能扩展按钮 */}
              <TouchableOpacity
                style={[styles.translateButton, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                  borderWidth: 1
                }]}
                onPress={() => {
                  setExpandInput(newPhrase.original);
                  setShowAddModal(false);
                  setShowExpandModal(true);
                  // 清除添加短语内容，因为用户选择了智能短语功能
                  clearAddPhraseContent();
                }}
              >
                <Text style={[styles.translateButtonText, { color: colors.primary }]}>
                  {t('phrases.smartPhrase', '智能短语')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* From Language Picker Modal */}
      <Modal
        visible={showFromLanguagePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFromLanguagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.languagePickerModal, { backgroundColor: colors.background }]}>
            <View style={styles.languagePickerHeader}>
              <Text style={[styles.languagePickerTitle, { color: colors.text }]}>选择源语言</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowFromLanguagePicker(false);
                  setLanguageSearchText('');
                }}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* 搜索框 */}
            <View style={[styles.languageSearchContainer, { backgroundColor: colors.surface }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.languageSearchInput, { color: colors.text }]}
                placeholder="搜索语言..."
                placeholderTextColor={colors.textSecondary}
                value={languageSearchText}
                onChangeText={setLanguageSearchText}
              />
            </View>
            
            <FlatList
              data={filteredLanguageOptions}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    { 
                      backgroundColor: newPhrase.fromLanguage === item.code ? colors.primary + '20' : 'transparent',
                      borderBottomColor: colors.border 
                    }
                  ]}
                  onPress={() => {
                    const updatedFromLang = item.code;
                    setNewPhrase({...newPhrase, fromLanguage: updatedFromLang});
                    saveLanguagePreferences(updatedFromLang, newPhrase.toLanguage);
                    setShowFromLanguagePicker(false);
                  }}
                >
                  <Text 
                    style={[styles.languageOptionText, { color: colors.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.flag || '🌐'} {item.nativeName || item.name || item.code}
                  </Text>
                  {newPhrase.fromLanguage === item.code && (
                    <Text style={[styles.languageOptionCheck, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* To Language Picker Modal */}
      <Modal
        visible={showToLanguagePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowToLanguagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.languagePickerModal, { backgroundColor: colors.background }]}>
            <View style={styles.languagePickerHeader}>
              <Text style={[styles.languagePickerTitle, { color: colors.text }]}>选择目标语言</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowToLanguagePicker(false);
                  setLanguageSearchText('');
                }}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* 搜索框 */}
            <View style={[styles.languageSearchContainer, { backgroundColor: colors.surface }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.languageSearchInput, { color: colors.text }]}
                placeholder="搜索语言..."
                placeholderTextColor={colors.textSecondary}
                value={languageSearchText}
                onChangeText={setLanguageSearchText}
              />
            </View>
            
            <FlatList
              data={filteredLanguageOptions}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    { 
                      backgroundColor: newPhrase.toLanguage === item.code ? colors.primary + '20' : 'transparent',
                      borderBottomColor: colors.border 
                    }
                  ]}
                  onPress={() => {
                    const updatedToLang = item.code;
                    setNewPhrase({...newPhrase, toLanguage: updatedToLang});
                    saveLanguagePreferences(newPhrase.fromLanguage, updatedToLang);
                    setShowToLanguagePicker(false);
                  }}
                >
                  <Text 
                    style={[styles.languageOptionText, { color: colors.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.flag || '🌐'} {item.nativeName || item.name || item.code}
                  </Text>
                  {newPhrase.toLanguage === item.code && (
                    <Text style={[styles.languageOptionCheck, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Add Phrase Category Picker Modal */}
      <Modal
        visible={showAddCategoryPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={closeAddCategoryPicker}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.languagePickerModal, { backgroundColor: colors.background }]}>
            <View style={styles.languagePickerHeader}>
              <Text style={[styles.languagePickerTitle, { color: colors.text }]}>选择分类</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeAddCategoryPicker}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categoryCards}
              keyExtractor={(item, index) => `${item.id}_${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    { 
                      backgroundColor: newPhrase.category === item.id ? colors.primary + '20' : 'transparent',
                      borderBottomColor: colors.border 
                    }
                  ]}
                  onPress={() => {
                    setNewPhrase({...newPhrase, category: item.id});
                    setShowAddCategoryPicker(false);
                    setShowAddModal(true);
                  }}
                >
                  <View style={styles.categoryOptionContent}>
                    {(() => {
                      const IconComponent = getIconComponent(item.icon);
                      return <IconComponent size={20} color={colors.text} style={{ marginRight: 12 }} />;
                    })()}
                    <Text 
                      style={[styles.languageOptionText, { color: colors.text }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.title}
                    </Text>
                  </View>
                  {newPhrase.category === item.id && (
                    <Text style={[styles.languageOptionCheck, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ListFooterComponent={
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    styles.addCategoryOption,
                    { 
                      backgroundColor: colors.surface,
                      borderBottomColor: colors.border 
                    }
                  ]}
                  onPress={() => {
                    setShowAddCategoryPicker(false);
                    setShowAddNewCategoryModal(true);
                  }}
                >
                  <Text 
                    style={[styles.languageOptionText, { color: colors.primary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    ➕ 添加新分类
                  </Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.languagePickerModal, { backgroundColor: colors.background }]}>
            <View style={styles.languagePickerHeader}>
              <Text style={[styles.languagePickerTitle, { color: colors.text }]}>选择分类</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryPicker(false)}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categoryCards}
              keyExtractor={(item, index) => `${item.id}_${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    { 
                      backgroundColor: newPhrase.category === item.id ? colors.primary + '20' : 'transparent',
                      borderBottomColor: colors.border 
                    }
                  ]}
                  onPress={() => {
                    setNewPhrase({...newPhrase, category: item.id});
                    setShowAddCategoryPicker(false);
                    addCustomPhrase();
                  }}
                >
                  <View style={styles.categoryOptionContent}>
                    {(() => {
                      const IconComponent = getIconComponent(item.icon);
                      return <IconComponent size={20} color={colors.text} style={{ marginRight: 12 }} />;
                    })()}
                    <Text 
                      style={[styles.languageOptionText, { color: colors.text }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.title}
                    </Text>
                  </View>
                  {newPhrase.category === item.id && (
                    <Text style={[styles.languageOptionCheck, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Add New Category Modal */}
      <Modal
        visible={showAddNewCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeAddNewCategoryModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentCenter, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>创建新分类</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeAddNewCategoryModal}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {/* 分类名称输入 */}
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="分类名称"
                placeholderTextColor={colors.textSecondary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />

              {/* 图标选择 */}
              <View style={styles.iconSelectorContainer}>
                <Text style={[styles.iconSelectorLabel, { color: colors.text }]}>选择图标：</Text>
                <View style={styles.iconGrid}>
                  {iconOptions.map((icon, index) => {
                    const IconComponent = icon.component;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.iconOption,
                          { 
                            backgroundColor: newCategoryIcon === icon.name ? colors.primary + '20' : colors.surface,
                            borderColor: newCategoryIcon === icon.name ? colors.primary : colors.border
                          }
                        ]}
                        onPress={() => setNewCategoryIcon(icon.name)}
                      >
                        <IconComponent 
                          size={24} 
                          color={newCategoryIcon === icon.name ? colors.primary : colors.textSecondary} 
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 按钮 */}
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary, { 
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                    borderWidth: 1,
                    flex: 1
                  }]}
                  onPress={closeAddNewCategoryModal}
                >
                  <Text style={[styles.modalButtonText, { color: colors.primary }]}>取消</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary, flex: 1 }]}
                  onPress={createNewCategory}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>创建</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Expand Phrase Modal */}
      <Modal
        visible={showExpandModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExpandModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentCenter, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('phrases.smartPhrase', '智能短语')}
               </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowExpandModal(false);
                  setShowAddModal(true);
                }}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border,
                  marginBottom: 16
                }]}
                placeholder={t('phrases.enterKeyword', '请输入关键词')}
                placeholderTextColor={colors.textSecondary}
                value={expandInput}
                onChangeText={setExpandInput}
                multiline
                editable={!isExpanding}
              />
              
              {/* 生成按钮 */}
              <TouchableOpacity
                style={[styles.translateButton, { 
                  backgroundColor: isExpanding ? colors.textSecondary : colors.primary,
                  opacity: isExpanding || !expandInput.trim() ? 0.6 : 1
                }]}
                onPress={() => handleExpandPhrase(expandInput)}
                disabled={isExpanding || !expandInput.trim()}
              >
                <Text style={styles.translateButtonText}>
                  {isExpanding ? t('phrases.generating', 'AI生成中...') : t('phrases.generate', '生成')}
                </Text>
              </TouchableOpacity>

              {isExpanding && (
                <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    {t('phrases.aiGenerating', 'AI正在生成相关短语，请稍候...')}
                  </Text>
                  <Text style={[styles.loadingSubText, { color: colors.textSecondary }]}>
                    {t('phrases.aiWaitTime', '这可能需要10-30秒，请耐心等待')}
                  </Text>
                </View>
              )}

              {expandedPhrases.length > 0 && (
                <>
                  <View style={[styles.previewNotice, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.previewNoticeText, { color: colors.textSecondary }]}>
                      {t('phrases.aiGeneratedNotice', 'AI生成的智能短语，可以选择保存到分类')}
                    </Text>
                  </View>
                  
                  <ScrollView style={styles.expandedResults} showsVerticalScrollIndicator={false}>
                    {expandedPhrases.map((item, sceneIndex) => (
                      <View key={sceneIndex} style={[styles.sceneCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.sceneTitle, { color: colors.text }]}>{item.scene}</Text>
                        {item.phrases.map((phrase: string, phraseIndex: number) => (
                          <View key={phraseIndex} style={styles.expandedPhraseItem}>
                            <View style={styles.expandedPhraseContent}>
                              <Text style={[styles.expandedPhraseOriginal, { color: colors.text }]}>
                                {phrase}
                              </Text>
                              <Text style={[styles.expandedPhraseTranslation, { color: colors.textSecondary }]}>
                                {item.translations[phraseIndex]}
                              </Text>
                            </View>
                            <View style={styles.expandedPhraseActions}>
                              <TouchableOpacity
                                style={styles.expandedActionButton}
                                onPress={() => playExpandedPhrase(phrase, 'en')}
                              >
                                <Play size={16} color={colors.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.expandedActionButton}
                                onPress={() => playExpandedPhrase(item.translations[phraseIndex], 'zh-CN')}
                              >
                                <Play size={16} color={colors.primary} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                  
                  {/* 保存按钮 */}
                  <TouchableOpacity
                    style={[styles.translateButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setShowSaveCategoryPicker(true);
                    }}
                  >
                    <Text style={styles.translateButtonText}>
                      {t('phrases.saveToCategory', '保存到分类')}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 保存分类选择器模态框 */}
      <Modal
        visible={showSaveCategoryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSaveCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('phrases.selectSaveCategory', '选择保存分类')}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowSaveCategoryPicker(false)}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categoryCards}
              keyExtractor={(item, index) => `${item.id}_${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    { 
                      backgroundColor: colors.surface,
                      borderColor: colors.border 
                    },
                    saveCategoryId === item.id && { 
                      backgroundColor: colors.primary + '20',
                      borderColor: colors.primary 
                    }
                  ]}
                  onPress={() => setSaveCategoryId(item.id)}
                >
                  <View style={styles.categoryOptionContent}>
                    {(() => {
                      const IconComponent = getIconComponent(item.icon);
                      return <IconComponent size={20} color={colors.text} style={{ marginRight: 8 }} />;
                    })()}
                    <Text style={[styles.categoryOptionText, { color: colors.text }]}>
                      {item.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListFooterComponent={() => (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    { 
                      backgroundColor: colors.primary + '15',
                      borderColor: colors.primary,
                      borderWidth: 2,
                      marginTop: 16,
                      marginBottom: 8
                    }
                  ]}
                  onPress={() => {
                    setIsFromSaveCategoryPicker(true);
                    setShowSaveCategoryPicker(false);
                    setShowAddNewCategoryModal(true);
                  }}
                >
                  <View style={styles.categoryOptionContent}>
                    <Plus size={20} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.addNewCategoryText, { color: colors.primary }]}>
                      添加新分类
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.categoryPickerList}
            />
            
            <View style={[styles.modalActions, { justifyContent: 'center' }]}>
              <TouchableOpacity
                style={[styles.modalButton, { 
                  backgroundColor: colors.primary,
                  minWidth: 120
                }]}
                onPress={() => {
                  if (saveCategoryId) {
                    performSaveExpandedPhrases(saveCategoryId);
                  } else {
                    Alert.alert('提示', '请选择一个分类');
                  }
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  保存
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  addButton: {
    padding: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoryListContainer: {
    padding: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  categoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    flex: 1,
  },
  categoryDeleteButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryArrow: {
    marginLeft: 8,
  },
  categoryArrowText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  phraseCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phraseContent: {
    padding: 16,
  },
  phraseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  phraseMain: {
    flex: 1,
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  phraseOriginal: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
    lineHeight: 22,
  },
  phraseTranslated: {
    flex: 1,
    fontSize: 14,
    marginRight: 12,
    lineHeight: 20,
    opacity: 0.8,
  },
  playButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  phraseCategory: {
    fontSize: 13,
    fontWeight: '600',
  },
  phraseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalContentCenter: {
    borderRadius: 20,
    maxHeight: '80%',
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  translateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  previewNotice: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
  },
  previewNoticeText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  expandInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  expandInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  expandButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  expandedResults: {
    maxHeight: 400,
  },
  sceneCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sceneTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  expandedPhraseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  expandedPhraseContent: {
    flex: 1,
    marginRight: 12,
  },
  expandedPhraseOriginal: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  expandedPhraseTranslation: {
    fontSize: 14,
  },
  expandedPhraseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandedActionButton: {
    padding: 8,
  },
  languageSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  languageSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    height: 50,
    overflow: 'hidden',
  },
  languageSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    lineHeight: 20,
    includeFontPadding: false,
  },
  languageArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },
  languageArrowText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  languagePickerModal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  languagePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  languagePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  languageOptionCheck: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  languageSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  languageSearchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  categorySelectorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  categorySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryOption: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 8,
  },
  iconSelectorContainer: {
    marginBottom: 20,
  },
  iconSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  phraseCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  saveAllButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    minHeight: 400,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  addCategoryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  addNewCategoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryPickerList: {
    maxHeight: 300,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
