interface CropIconProps {
  name: string;
  size?: number;
  className?: string;
}

const ICON_MAP: { [key: string]: string } = {
  'Пшеница': 'wheat.png',
  'Морковь': 'carrot.png','Морковь золотая': 'carrot.png',

  'Картофель': 'potato.png',
  'Капуста': 'cabbage.png',
  'Огурец': 'cucumber.png',
  'Томат': 'tomato.png',
  'Кукуруза': 'corn.png',
  'Клубника': 'strawberry.png',
  'Баклажан': 'eggplant.png',
  'Тыква': 'pumpkin.png',
  'Арбуз': 'watermelon.png',
  'Виноград': 'grape.png',
  'Золотое яблоко': 'golden-apple.png',
  'Золотая пшеница': 'golden-wheat.png',
  'Кристальная тыква': 'crystal-pumpkin.png',
  'Драконье семя': 'dragon-seed.png',
  'Яйцо': 'egg.png',
  'Пирог с тыквой': 'pie.png',
  'Овощной салат': 'salad.png',
  'Клубничное варенье': 'jam.png',
  'Томатный сок': 'juice.png',
  'Драконий эликсир': 'potion.png',
};

const GROWTH_MAP: { [key: string]: string } = {
  '🌱': 'sprout.png',
  '🌿': 'young.png',
  '🪴': 'growing.png',
  '🌾': 'almost.png',
};

function CropIcon({ name, size = 48, className = '' }: CropIconProps) {
  const file = ICON_MAP[name] || GROWTH_MAP[name];
  if (!file) {
    return <span style={{ fontSize: size }}>🌰</span>;
  }
  return (
    <img
      src={'/crops/' + file}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', objectFit: 'contain' }}
      draggable={false}
    />
  );
}

export default CropIcon;