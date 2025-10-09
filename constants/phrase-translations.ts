// 短语的多语言翻译映射
// 格式: { [短语ID]: 翻译键 }
// 实际翻译存储在 locales/{lang}.json 的 defaultPhrases 部分

export const PHRASE_TRANSLATION_KEYS: Record<string, string> = {
  // Travel 出行交通
  "1": "defaultPhrases.whereIsRestroom",
  "2": "defaultPhrases.whereIsSubway",
  "3": "defaultPhrases.howToAirport",
  "4": "defaultPhrases.isSeatTaken",
  "5": "defaultPhrases.busArrivalTime",
  "6": "defaultPhrases.taxiFare",
  "7": "defaultPhrases.helpWithLuggage",
  "8": "defaultPhrases.nearestTrainStation",
  "9": "defaultPhrases.directFlightBeijing",
  "10": "defaultPhrases.windowSeat",
  "11": "defaultPhrases.flightDuration",
  // ... 可以继续添加
};

// 短语原文（英文，保持不变）
export const PHRASE_ORIGINALS: Record<string, string> = {
  "1": "Where is the restroom?",
  "2": "Where is the subway station?",
  "3": "How do I get to the airport?",
  "4": "Is this seat taken?",
  "5": "What time does the bus arrive?",
  "6": "How much is the taxi fare?",
  "7": "Can you help me with my luggage?",
  "8": "Where is the nearest train station?",
  "9": "Is there a direct flight to Beijing?",
  "10": "Can I get a window seat?",
  "11": "How long does the flight take?",
};

// 临时方案：简化的翻译映射（最常用的11个短语）
export const PHRASE_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Travel 出行交通
  "Where is the restroom?": {
    "zh-CN": "洗手间在哪里？",
    "ja": "トイレはどこですか？",
    "ko": "화장실이 어디에 있나요?",
    "es": "¿Dónde está el baño?",
    "fr": "Où sont les toilettes?",
    "de": "Wo ist die Toilette?",
    "it": "Dove è il bagno?",
    "pt": "Onde fica o banheiro?",
    "ru": "Где туалет?",
    "ar": "أين دورة المياه؟",
    "th": "ห้องน้ำอยู่ที่ไหน?",
    "vi": "Nhà vệ sinh ở đâu?",
    "tr": "Tuvalet nerede?",
    "nl": "Waar is het toilet?",
    "pl": "Gdzie jest toaleta?",
    "fil": "Nasaan ang banyo?"
  },
  "Where is the subway station?": {
    "zh-CN": "地铁站在哪里？",
    "ja": "地下鉄駅はどこですか？",
    "ko": "지하철역이 어디에 있나요?",
    "es": "¿Dónde está la estación de metro?",
    "fr": "Où est la station de métro?",
    "de": "Wo ist die U-Bahn-Station?",
    "it": "Dove è la stazione della metropolitana?",
    "pt": "Onde fica a estação de metrô?",
    "ru": "Где станция метро?",
    "ar": "أين محطة المترو؟",
    "th": "สถานีรถไฟใต้ดินอยู่ที่ไหน?",
    "vi": "Ga tàu điện ngầm ở đâu?",
    "tr": "Metro istasyonu nerede?",
    "nl": "Waar is het metrostation?",
    "pl": "Gdzie jest stacja metra?",
    "fil": "Nasaan ang subway station?"
  },
  "How do I get to the airport?": {
    "zh-CN": "怎么去机场？",
    "ja": "空港への行き方は？",
    "ko": "공항에 어떻게 가나요?",
    "es": "¿Cómo llego al aeropuerto?",
    "fr": "Comment aller à l'aéroport?",
    "de": "Wie komme ich zum Flughafen?",
    "it": "Come arrivo all'aeroporto?",
    "pt": "Como chego ao aeroporto?",
    "ru": "Как добраться до аэропорта?",
    "ar": "كيف أصل إلى المطار؟",
    "th": "ไปสนามบินยังไง?",
    "vi": "Làm thế nào để đến sân bay?",
    "tr": "Havaalanına nasıl giderim?",
    "nl": "Hoe kom ik bij het vliegveld?",
    "pl": "Jak dostać się na lotnisko?",
    "fil": "Paano pumunta sa paliparan?"
  },
  "Is this seat taken?": {
    "zh-CN": "这个座位有人吗？",
    "ja": "この席は空いていますか？",
    "ko": "이 자리 앉아도 되나요?",
    "es": "¿Está ocupado este asiento?",
    "fr": "Cette place est-elle prise?",
    "de": "Ist dieser Platz besetzt?",
    "it": "Questo posto è occupato?",
    "pt": "Este lugar está ocupado?",
    "ru": "Это место занято?",
    "ar": "هل هذا المقعد مشغول؟",
    "th": "ที่นี่มีคนนั่งหรือยัง?",
    "vi": "Chỗ này có người ngồi chưa?",
    "tr": "Bu koltuk dolu mu?",
    "nl": "Is deze stoel bezet?",
    "pl": "Czy to miejsce jest zajęte?",
    "fil": "May umuupo ba dito?"
  },
  "What time does the bus arrive?": {
    "zh-CN": "公交车什么时候到？",
    "ja": "バスは何時に到着しますか？",
    "ko": "버스가 몇 시에 도착하나요?",
    "es": "¿A qué hora llega el autobús?",
    "fr": "À quelle heure arrive le bus?",
    "de": "Wann kommt der Bus an?",
    "it": "A che ora arriva l'autobus?",
    "pt": "A que horas chega o ônibus?",
    "ru": "Когда прибывает автобус?",
    "ar": "متى يصل الحافلة؟",
    "th": "รถบัสมาถึงกี่โมง?",
    "vi": "Xe buýt đến lúc mấy giờ?",
    "tr": "Otobüs saat kaçta gelir?",
    "nl": "Hoe laat komt de bus aan?",
    "pl": "O której przyjeżdża autobus?",
    "fil": "Anong oras darating ang bus?"
  },
  "How much is the taxi fare?": {
    "zh-CN": "出租车费多少钱？",
    "ja": "タクシー料金はいくらですか？",
    "ko": "택시 요금이 얼마인가요?",
    "es": "¿Cuánto cuesta el taxi?",
    "fr": "Combien coûte le taxi?",
    "de": "Wie viel kostet das Taxi?",
    "it": "Quanto costa il taxi?",
    "pt": "Quanto custa o táxi?",
    "ru": "Сколько стоит такси?",
    "ar": "كم أجرة التاكسي؟",
    "th": "ค่าแท็กซี่เท่าไหร่?",
    "vi": "Giá taxi là bao nhiêu?",
    "tr": "Taksi ücreti ne kadar?",
    "nl": "Hoeveel kost de taxi?",
    "pl": "Ile kosztuje taksówka?",
    "fil": "Magkano ang taxi fare?"
  },
  "Can you help me with my luggage?": {
    "zh-CN": "您能帮我拿行李吗？",
    "ja": "荷物を手伝っていただけますか？",
    "ko": "짐 좀 도와주시겠어요?",
    "es": "¿Puede ayudarme con mi equipaje?",
    "fr": "Pouvez-vous m'aider avec mes bagages?",
    "de": "Können Sie mir mit meinem Gepäck helfen?",
    "it": "Può aiutarmi con i bagagli?",
    "pt": "Pode me ajudar com a bagagem?",
    "ru": "Можете помочь с багажом?",
    "ar": "هل يمكنك مساعدتي بأمتعتي؟",
    "th": "ช่วยยกกระเป๋าให้หน่อยได้ไหม?",
    "vi": "Bạn có thể giúp tôi mang hành lý không?",
    "tr": "Bavulumla yardım edebilir misiniz?",
    "nl": "Kunt u me helpen met mijn bagage?",
    "pl": "Czy możesz pomóc mi z bagażem?",
    "fil": "Pwede mo ba akong tulungan sa aking bagahe?"
  },
  "Where is the nearest train station?": {
    "zh-CN": "最近的火车站在哪里？",
    "ja": "最寄りの駅はどこですか？",
    "ko": "가장 가까운 기차역이 어디에 있나요?",
    "es": "¿Dónde está la estación de tren más cercana?",
    "fr": "Où est la gare la plus proche?",
    "de": "Wo ist der nächste Bahnhof?",
    "it": "Dove è la stazione ferroviaria più vicina?",
    "pt": "Onde fica a estação de trem mais próxima?",
    "ru": "Где ближайший вокзал?",
    "ar": "أين أقرب محطة قطار؟",
    "th": "สถานีรถไฟที่ใกล้ที่สุดอยู่ที่ไหน?",
    "vi": "Nhà ga tàu hỏa gần nhất ở đâu?",
    "tr": "En yakın tren istasyonu nerede?",
    "nl": "Waar is het dichtstbijzijnde treinstation?",
    "pl": "Gdzie jest najbliższa stacja kolejowa?",
    "fil": "Nasaan ang pinakamalapit na train station?"
  },
  "Is there a direct flight to Beijing?": {
    "zh-CN": "有直飞北京的航班吗？",
    "ja": "北京への直行便はありますか？",
    "ko": "베이징으로 가는 직항편이 있나요?",
    "es": "¿Hay un vuelo directo a Beijing?",
    "fr": "Y a-t-il un vol direct pour Pékin?",
    "de": "Gibt es einen Direktflug nach Peking?",
    "it": "C'è un volo diretto per Pechino?",
    "pt": "Há um voo direto para Pequim?",
    "ru": "Есть прямой рейс в Пекин?",
    "ar": "هل يوجد رحلة مباشرة إلى بكين؟",
    "th": "มีเที่ยวบินตรงไปปักกิ่งไหม?",
    "vi": "Có chuyến bay thẳng đến Bắc Kinh không?",
    "tr": "Pekin'e direkt uçuş var mı?",
    "nl": "Is er een directe vlucht naar Beijing?",
    "pl": "Czy jest bezpośredni lot do Pekinu?",
    "fil": "May direktang flight ba papuntang Beijing?"
  },
  "Can I get a window seat?": {
    "zh-CN": "我可以要靠窗的座位吗？",
    "ja": "窓側の席をお願いできますか？",
    "ko": "창가 자리로 주실 수 있나요?",
    "es": "¿Puedo tener un asiento junto a la ventana?",
    "fr": "Puis-je avoir un siège côté fenêtre?",
    "de": "Kann ich einen Fensterplatz bekommen?",
    "it": "Posso avere un posto finestrino?",
    "pt": "Posso ter um assento na janela?",
    "ru": "Можно место у окна?",
    "ar": "هل يمكنني الحصول على مقعد بجانب النافذة؟",
    "th": "ขอที่นั่งติดหน้าต่างได้ไหม?",
    "vi": "Tôi có thể có chỗ ngồi cạnh cửa sổ không?",
    "tr": "Pencere kenarı koltuğu alabilir miyim?",
    "nl": "Kan ik een zitplaats bij het raam krijgen?",
    "pl": "Czy mogę dostać miejsce przy oknie?",
    "fil": "Pwede ba akong makakuha ng upuan sa tabi ng bintana?"
  },
  "How long does the flight take?": {
    "zh-CN": "飞行需要多长时间？",
    "ja": "フライトにはどのくらいかかりますか？",
    "ko": "비행 시간이 얼마나 걸리나요?",
    "es": "¿Cuánto dura el vuelo?",
    "fr": "Combien de temps dure le vol?",
    "de": "Wie lange dauert der Flug?",
    "it": "Quanto dura il volo?",
    "pt": "Quanto tempo leva o voo?",
    "ru": "Сколько длится полет?",
    "ar": "كم يستغرق الطيران؟",
    "th": "เที่ยวบินใช้เวลานานเท่าไหร่?",
    "vi": "Chuyến bay mất bao lâu?",
    "tr": "Uçuş ne kadar sürer?",
    "nl": "Hoe lang duurt de vlucht?",
    "pl": "Jak długo trwa lot?",
    "fil": "Gaano katagal ang flight?"
  },
};

// 获取短语翻译
export const getPhraseTranslation = (originalText: string, targetLang: string): string => {
  const translations = PHRASE_TRANSLATIONS[originalText];
  if (!translations) {
    // 如果没有翻译映射，返回中文（因为默认短语都是英文→中文）
    // 对于非中文语言，可以考虑保持英文原文或使用在线翻译
    return targetLang === 'zh-CN' || targetLang === 'en' 
      ? originalText  // 英文和中文用户看到原文
      : originalText; // 其他语言暂时也显示英文原文（或可以显示中文译文）
  }
  
  // 返回对应语言的翻译，如果没有则返回中文，最后fallback到原文
  return translations[targetLang] || translations['zh-CN'] || originalText;
};

