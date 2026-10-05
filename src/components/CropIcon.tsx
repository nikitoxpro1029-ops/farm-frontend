import { useState } from 'react';
import { getSeedIcon } from '../seedIcons';

interface CropIconProps {
  name: string;
  size?: number;
  className?: string;
}

const ICON_MAP: { [key: string]: string } = {
  'Пшеница': 'wheat.png',
  'Морковь': 'carrot.png',
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
  'Молоко': 'milk.png',
  'Сыр': 'cheese.png',
  'Чизкейк': 'cheesecake.png',
  'Молочный коктейль': 'milkshake.png',
};

function CropIcon({ name, size = 48, className = '' }: CropIconProps) {
  const [imgError, setImgError] = useState(false);
  const file = ICON_MAP[name];

  if (!file || imgError) {
    return (
      <span
        className={className}
        style={{
          fontSize: size,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {getSeedIcon(name)}
      </span>
    );
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
      onError={() => setImgError(true)}
    />
  );
}

export default CropIcon;