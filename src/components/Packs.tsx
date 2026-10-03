import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { getSeedIcon } from '../seedIcons';

const API_URL = import.meta.env.VITE_API_URL;

interface Pack {
  id: number;
  name: string;
  price: number;
  description: string;
  icon: string;
  rarity: string;
}

interface SeedResult {
  name: string;
  rarity: string;
}

interface RouletteItem {
  name: string;
  rarity: string;
}

interface PacksProps {
  onOpen: () => void;
}

const ITEM_WIDTH = 120;
const ITEM_GAP = 8;
const TOTAL_ITEMS = 50;
const WINNER_INDEX = 45;

function Packs({ onOpen }: PacksProps) {
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [rouletteItems, setRouletteItems] = useState<RouletteItem[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [offset, setOffset] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);useEffect(() => {
  const el = viewportRef.current;
  if (!el) return;
  const blockTouch = (e: TouchEvent) => {
    e.preventDefault();
  };
  el.addEventListener('touchmove', blockTouch, { passive: false });
  return () => {
    el.removeEventListener('touchmove', blockTouch);
  };
}, [rouletteItems.length]);
  const tg = (window as any).Telegram?.WebApp;

  const packs: Pack[] = [
    { id: 1, name: 'Базовый пак', price: 50, description: 'Обычные семена', icon: '📦', rarity: 'common' },
    { id: 2, name: 'Редкий пак', price: 150, description: 'Шанс на редкие', icon: '🎁', rarity: 'rare' },
    { id: 3, name: 'Легендарный пак', price: 500, description: 'Эпик и мифик', icon: '💎', rarity: 'legendary' },
  ];

  const allSeeds: RouletteItem[] = [
    { name: 'Пшеница', rarity: 'common' },
    { name: 'Морковь', rarity: 'common' },
    { name: 'Картофель', rarity: 'common' },
    { name: 'Капуста', rarity: 'uncommon' },
    { name: 'Огурец', rarity: 'uncommon' },
    { name: 'Томат', rarity: 'rare' },
    { name: 'Кукуруза', rarity: 'rare' },
    { name: 'Клубника', rarity: 'rare' },
    { name: 'Баклажан', rarity: 'rare' },
    { name: 'Тыква', rarity: 'epic' },
    { name: 'Арбуз', rarity: 'epic' },
    { name: 'Виноград', rarity: 'epic' },
    { name: 'Золотое яблоко', rarity: 'legendary' },
    { name: 'Золотая пшеница', rarity: 'legendary' },
    { name: 'Кристальная тыква', rarity: 'legendary' },
    { name: 'Драконье семя', rarity: 'mythic' },
  ];

  const openPack = async (packId: number) => {
    setOpening(true);
    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/packs/open',
        { packId },
        { headers: {
          'x-telegram-init-data': initData,
          'bypass-tunnel-reminder': 'true'
        } }
      );

      const winner: SeedResult = res.data.seed;

      const items: RouletteItem[] = [];
      for (let i = 0; i < TOTAL_ITEMS; i++) {
        if (i === WINNER_INDEX) {
          items.push(winner);
        } else {
          items.push(allSeeds[Math.floor(Math.random() * allSeeds.length)]);
        }
      }

      setRouletteItems(items);
      setOffset(0);
      setSpinning(true);
      setResult(null);

      setTimeout(() => {
        const viewportWidth = viewportRef.current?.offsetWidth || 360;
        const itemStep = ITEM_WIDTH + ITEM_GAP;
        const targetOffset = WINNER_INDEX * itemStep + ITEM_WIDTH / 2 - viewportWidth / 2;
        setOffset(targetOffset);

        tg?.HapticFeedback?.impactOccurred('medium');

        setTimeout(() => {
          setSpinning(false);
          setResult(winner);
          tg?.HapticFeedback?.notificationOccurred('success');
          onOpen();
        }, 4400);
      }, 100);

    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
      setOpening(false);
    }
  };

  const closeResult = () => {
    setResult(null);
    setRouletteItems([]);
    setOffset(0);
    setOpening(false);
  };

  return (
    <div className="packs">
      <h2>Паки с семенами</h2>

      {rouletteItems.length === 0 && (
        <div className="packs-grid">
          {packs.map(function(pack) {
            return (
              <div key={pack.id} className={'pack-card ' + pack.rarity}>
                <div className="pack-image">{pack.icon}</div>
                <h3>{pack.name}</h3>
                <p className="pack-desc">{pack.description}</p>
                <div className="pack-price">💰 {pack.price}</div>
                <button
                  onClick={function() { openPack(pack.id); }}
                  disabled={opening}
                >
                  {opening ? 'Открываем...' : 'Купить'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {rouletteItems.length > 0 && (
        <div className="roulette-wrapper">
          <div className="roulette-pointer">▼</div>
          <div className="roulette-viewport" ref={viewportRef}>
            <div
              className={'roulette-reel' + (spinning ? ' spinning' : '')}
              style={{
                transform: 'translateX(' + (-offset) + 'px)',
                transition: spinning
                  ? 'transform 4.2s cubic-bezier(0.15, 0.85, 0.35, 1)'
                  : 'none',
              }}
            >
              {rouletteItems.map((item, i) => (
                <div key={i} className={'roulette-item ' + item.rarity}>
                  <div className="roulette-icon">{getSeedIcon(item.name)}</div>
                  <div className="roulette-name">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="pack-result-overlay" onClick={closeResult}>
          <div className={'pack-result ' + result.rarity}>
            <div className="result-image">{getSeedIcon(result.name)}</div>
            <h3>Вы получили:</h3>
            <p className="result-name">{result.name}</p>
            <p className="result-rarity">{result.rarity}</p>
            <button onClick={closeResult}>Забрать</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Packs;