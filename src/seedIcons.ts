const ICONS: Record<string, string> = {
  'Pshenitsa': '🌾',
  'Morkov': '🥕',
  'Kartofel': '🥔',
  'Kapusta': '🥬',
  'Ogurets': '🥒',
  'Tomat': '🍅',
  'Kukuruza': '🌽',
  'Klubnika': '🍓',
  'Baklazhan': '🍆',
  'Tykva': '🎃',
  'Arbuz': '🍉',
  'Vinograd': '🍇',
  'Zolotoe yabloko': '🍎',
  'Zolotaya pshenitsa': '🌟',
  'Kristalnaya tykva': '💎',
  'Drakonye semya': '🐉',
  'PirogSPumpkin': '🥧',
  'OvoshchnoySalat': '🥗',
  'KlubnichnoeVarenye': '🍯',
  'TomatnyySok': '🧃',
  'DrakoniyEliksir': '🧪',
  'Yaytso': '🥚',
  'Moloko': '🥛',
  'Syr': '🧀',
  'Chizkeyk': '🍰',
  'MolokoKoktel': '🥤',
  'MorkovnyiPirog': '🥧',
};

const NAME_MAP: Record<string, string> = {
  'Пшеница': 'Pshenitsa',
  'Морковь': 'Morkov',
  'Картофель': 'Kartofel',
  'Капуста': 'Kapusta',
  'Огурец': 'Ogurets',
  'Томат': 'Tomat',
  'Кукуруза': 'Kukuruza',
  'Клубника': 'Klubnika',
  'Баклажан': 'Baklazhan',
  'Тыква': 'Tykva',
  'Арбуз': 'Arbuz',
  'Виноград': 'Vinograd',
  'Золотое яблоко': 'Zolotoe yabloko',
  'Золотая пшеница': 'Zolotaya pshenitsa',
  'Кристальная тыква': 'Kristalnaya tykva',
  'Драконье семя': 'Drakonye semya',
  'Пирог с тыквой': 'PirogSPumpkin',
  'Овощной салат': 'OvoshchnoySalat',
  'Клубничное варенье': 'KlubnichnoeVarenye',
  'Томатный сок': 'TomatnyySok',
  'Драконий эликсир': 'DrakoniyEliksir',
  'Яйцо': 'Yaytso',
  'Молоко': 'Moloko',
  'Сыр': 'Syr',
  'Чизкейк': 'Chizkeyk',
  'Молочный коктейль': 'MolokoKoktel',
  'Морковный пирог': 'MorkovnyiPirog',
};

export const getSeedIcon = (name: string): string => {
  const key = NAME_MAP[name];
  if (key && ICONS[key]) {
    return ICONS[key];
  }
  return '🌰';
};