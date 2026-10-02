import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface Pack {
  id: number;
  name: string;
  price: number;
  description: string;
}

interface SeedResult {
  name: string;
  rarity: string;
}

interface PacksProps {
  onOpen: () => void;
}

function Packs({ onOpen }: PacksProps) {
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const tg = (window as any).Telegram?.WebApp;

  const packs: Pack[] = [
    { id: 1, name: 'Базовый пак', price: 50, description: 'Случайное семя' },
    { id: 2, name: 'Редкий пак', price: 150, description: 'Шанс на редкие семена' },
    { id: 3, name: 'Легендарный пак', price: 500, description: 'Эпические семена' },
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
      setResult(res.data.seed);
      tg?.HapticFeedback?.notificationOccurred('success');
      onOpen();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="packs">
      <h2>Паки с семенами</h2>
      <div className="packs-grid">
        {packs.map((pack) => (
          <div key={pack.id} className="pack-card">
            <div className="pack-image">🎁</div>
            <h3>{pack.name}</h3>
            <p>{pack.description}</p>
            <div className="pack-price">💰 {pack.price}</div>
            <button onClick={() => openPack(pack.id)} disabled={opening}>
              {opening ? 'Открываем...' : 'Купить'}
            </button>
          </div>
        ))}
      </div>

      {result && (
        <div className="pack-result-overlay" onClick={() => setResult(null)}>
          <div className={'pack-result ' + result.rarity}>
            <div className="result-image">🌰</div>
            <h3>Вы получили:</h3>
            <p className="result-name">{result.name}</p>
            <p className="result-rarity">{result.rarity}</p>
            <button onClick={() => setResult(null)}>Забрать</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Packs;