const fs = require('fs');
const path = require('path');

// Vosk模型名称翻译
const modelTranslations = {
  ja: {
    englishModel: "英語モデル",
    chineseModel: "中国語モデル",
    japaneseModel: "日本語モデル",
    koreanModel: "韓国語モデル",
    frenchModel: "フランス語モデル",
    germanModel: "ドイツ語モデル",
    spanishModel: "スペイン語モデル",
    italianModel: "イタリア語モデル",
    portugueseModel: "ポルトガル語モデル",
    russianModel: "ロシア語モデル",
    arabicModel: "アラビア語モデル",
    hindiModel: "ヒンディー語モデル"
  },
  ko: {
    englishModel: "영어 모델",
    chineseModel: "중국어 모델",
    japaneseModel: "일본어 모델",
    koreanModel: "한국어 모델",
    frenchModel: "프랑스어 모델",
    germanModel: "독일어 모델",
    spanishModel: "스페인어 모델",
    italianModel: "이탈리아어 모델",
    portugueseModel: "포르투갈어 모델",
    russianModel: "러시아어 모델",
    arabicModel: "아랍어 모델",
    hindiModel: "힌디어 모델"
  },
  th: {
    englishModel: "โมเดลภาษาอังกฤษ",
    chineseModel: "โมเดลภาษาจีน",
    japaneseModel: "โมเดลภาษาญี่ปุ่น",
    koreanModel: "โมเดลภาษาเกาหลี",
    frenchModel: "โมเดลภาษาฝรั่งเศส",
    germanModel: "โมเดลภาษาเยอรมัน",
    spanishModel: "โมเดลภาษาสเปน",
    italianModel: "โมเดลภาษาอิตาลี",
    portugueseModel: "โมเดลภาษาโปรตุเกส",
    russianModel: "โมเดลภาษารัสเซีย",
    arabicModel: "โมเดลภาษาอารบิก",
    hindiModel: "โมเดลภาษาฮินดี"
  },
  vi: {
    englishModel: "Mô hình tiếng Anh",
    chineseModel: "Mô hình tiếng Trung",
    japaneseModel: "Mô hình tiếng Nhật",
    koreanModel: "Mô hình tiếng Hàn",
    frenchModel: "Mô hình tiếng Pháp",
    germanModel: "Mô hình tiếng Đức",
    spanishModel: "Mô hình tiếng Tây Ban Nha",
    italianModel: "Mô hình tiếng Ý",
    portugueseModel: "Mô hình tiếng Bồ Đào Nha",
    russianModel: "Mô hình tiếng Nga",
    arabicModel: "Mô hình tiếng Ả Rập",
    hindiModel: "Mô hình tiếng Hindi"
  },
  es: {
    englishModel: "Modelo de inglés",
    chineseModel: "Modelo de chino",
    japaneseModel: "Modelo de japonés",
    koreanModel: "Modelo de coreano",
    frenchModel: "Modelo de francés",
    germanModel: "Modelo de alemán",
    spanishModel: "Modelo de español",
    italianModel: "Modelo de italiano",
    portugueseModel: "Modelo de portugués",
    russianModel: "Modelo de ruso",
    arabicModel: "Modelo de árabe",
    hindiModel: "Modelo de hindi"
  },
  fr: {
    englishModel: "Modèle anglais",
    chineseModel: "Modèle chinois",
    japaneseModel: "Modèle japonais",
    koreanModel: "Modèle coréen",
    frenchModel: "Modèle français",
    germanModel: "Modèle allemand",
    spanishModel: "Modèle espagnol",
    italianModel: "Modèle italien",
    portugueseModel: "Modèle portugais",
    russianModel: "Modèle russe",
    arabicModel: "Modèle arabe",
    hindiModel: "Modèle hindi"
  },
  de: {
    englishModel: "Englisches Modell",
    chineseModel: "Chinesisches Modell",
    japaneseModel: "Japanisches Modell",
    koreanModel: "Koreanisches Modell",
    frenchModel: "Französisches Modell",
    germanModel: "Deutsches Modell",
    spanishModel: "Spanisches Modell",
    italianModel: "Italienisches Modell",
    portugueseModel: "Portugiesisches Modell",
    russianModel: "Russisches Modell",
    arabicModel: "Arabisches Modell",
    hindiModel: "Hindi-Modell"
  },
  it: {
    englishModel: "Modello inglese",
    chineseModel: "Modello cinese",
    japaneseModel: "Modello giapponese",
    koreanModel: "Modello coreano",
    frenchModel: "Modello francese",
    germanModel: "Modello tedesco",
    spanishModel: "Modello spagnolo",
    italianModel: "Modello italiano",
    portugueseModel: "Modello portoghese",
    russianModel: "Modello russo",
    arabicModel: "Modello arabo",
    hindiModel: "Modello hindi"
  },
  pt: {
    englishModel: "Modelo inglês",
    chineseModel: "Modelo chinês",
    japaneseModel: "Modelo japonês",
    koreanModel: "Modelo coreano",
    frenchModel: "Modelo francês",
    germanModel: "Modelo alemão",
    spanishModel: "Modelo espanhol",
    italianModel: "Modelo italiano",
    portugueseModel: "Modelo português",
    russianModel: "Modelo russo",
    arabicModel: "Modelo árabe",
    hindiModel: "Modelo hindi"
  },
  ru: {
    englishModel: "Английская модель",
    chineseModel: "Китайская модель",
    japaneseModel: "Японская модель",
    koreanModel: "Корейская модель",
    frenchModel: "Французская модель",
    germanModel: "Немецкая модель",
    spanishModel: "Испанская модель",
    italianModel: "Итальянская модель",
    portugueseModel: "Португальская модель",
    russianModel: "Русская модель",
    arabicModel: "Арабская модель",
    hindiModel: "Хинди модель"
  },
  ar: {
    englishModel: "نموذج الإنجليزية",
    chineseModel: "نموذج الصينية",
    japaneseModel: "نموذج اليابانية",
    koreanModel: "نموذج الكورية",
    frenchModel: "نموذج الفرنسية",
    germanModel: "نموذج الألمانية",
    spanishModel: "نموذج الإسبانية",
    italianModel: "نموذج الإيطالية",
    portugueseModel: "نموذج البرتغالية",
    russianModel: "نموذج الروسية",
    arabicModel: "نموذج العربية",
    hindiModel: "نموذج الهندية"
  },
  tr: {
    englishModel: "İngilizce Modeli",
    chineseModel: "Çince Modeli",
    japaneseModel: "Japonca Modeli",
    koreanModel: "Korece Modeli",
    frenchModel: "Fransızca Modeli",
    germanModel: "Almanca Modeli",
    spanishModel: "İspanyolca Modeli",
    italianModel: "İtalyanca Modeli",
    portugueseModel: "Portekizce Modeli",
    russianModel: "Rusça Modeli",
    arabicModel: "Arapça Modeli",
    hindiModel: "Hintçe Modeli"
  },
  nl: {
    englishModel: "Engels Model",
    chineseModel: "Chinees Model",
    japaneseModel: "Japans Model",
    koreanModel: "Koreaans Model",
    frenchModel: "Frans Model",
    germanModel: "Duits Model",
    spanishModel: "Spaans Model",
    italianModel: "Italiaans Model",
    portugueseModel: "Portugees Model",
    russianModel: "Russisch Model",
    arabicModel: "Arabisch Model",
    hindiModel: "Hindi Model"
  },
  pl: {
    englishModel: "Model angielski",
    chineseModel: "Model chiński",
    japaneseModel: "Model japoński",
    koreanModel: "Model koreański",
    frenchModel: "Model francuski",
    germanModel: "Model niemiecki",
    spanishModel: "Model hiszpański",
    italianModel: "Model włoski",
    portugueseModel: "Model portugalski",
    russianModel: "Model rosyjski",
    arabicModel: "Model arabski",
    hindiModel: "Model hindi"
  },
  fil: {
    englishModel: "Modelo ng Ingles",
    chineseModel: "Modelo ng Tsino",
    japaneseModel: "Modelo ng Hapon",
    koreanModel: "Modelo ng Koreano",
    frenchModel: "Modelo ng Pranses",
    germanModel: "Modelo ng Aleman",
    spanishModel: "Modelo ng Espanyol",
    italianModel: "Modelo ng Italyano",
    portugueseModel: "Modelo ng Portuges",
    russianModel: "Modelo ng Ruso",
    arabicModel: "Modelo ng Arabe",
    hindiModel: "Modelo ng Hindi"
  }
};

const localesDir = path.join(__dirname, '../locales');
const languages = Object.keys(modelTranslations);

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    
    // 添加模型名称翻译到vosk部分
    if (json.vosk) {
      Object.assign(json.vosk, modelTranslations[lang]);
      
      // 写回文件
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log(`✅ ${lang}.json - 已添加Vosk模型名称翻译`);
    } else {
      console.log(`⚠️  ${lang}.json - 没有vosk部分`);
    }
  } catch (error) {
    console.error(`❌ ${lang}.json - 错误:`, error.message);
  }
});

console.log('\n✅ 完成！所有语言的Vosk模型名称翻译已添加。');

