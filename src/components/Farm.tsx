import { useState, useEffect } from 'react';
import { getSeedIcon } from '../seedIcons';

interface Crop {
  id: number;
  name: string;
  rarity: string;
  ready_at: string;
  expires_at: string | null;
}

interface Seed {
  id: number;
  name: string;
  rarity: string;
  quantity: number;
  seed_type_id: number;
}

interface FarmProps {
  crops: Crop[];
  seeds: Seed[];
  onPlant: (seedTypeId: number) => void;
  onHarvest: (cropId: number) => void;
}

function Farm({ crops, seeds, onPlant, onHarvest }: FarmProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimeLeft = (readyAt: string) => {
    const diff = new Date(readyAt).getTime() - now;
    if (diff <= 0) return 'Готово!';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const secsStr = secs < 10 ? '0' + secs : '' + secs;
    return mins + ':' + secsStr;
  };

  const getExpireTime = (expiresAt: string | null) => {
    if (!expiresAt) return '';
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return 'Завял';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours + 'ч ' + mins + 'м';
  };

  const isUrgent = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - now;
    return diff > 0 && diff < 2 * 60 * 60 * 1000;
  };

  const isReady = (readyAt: string) => new Date(readyAt).getTime() <= now;

  return (
    <div className="farm">
      <h2>Грядки</h2>
      <div className="crops-grid">
        {crops.length === 0 && <p className="empty">Посадите семена, чтобы начать</p>}
        {crops.map((crop) => (
          <div key={crop.id} className={'crop-card ' + crop.rarity}>
            <div className="crop-image">{isReady(crop.ready_at) ? getSeedIcon(crop.name) : '🌱'}</div>
            <div className="crop-name">{crop.name}</div>
            <div className="crop-timer">
              {isReady(crop.ready_at) ? (
                <>
                  <button className="harvest-btn" onClick={() => onHarvest(crop.id)}>Собрать</button>
                  <div className={'crop-expire' + (isUrgent(crop.expires_at) ? ' urgent' : '')}>
                    {isUrgent(crop.expires_at) ? '⚠️' : '🌾'} Осталось: {getExpireTime(crop.expires_at)}
                  </div>
                </>
              ) : (
                <span>⏱️ {getTimeLeft(crop.ready_at)}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2>Инвентарь семян</h2>
      <div className="seeds-grid">
        {seeds.map((seed) => (
          <div key={seed.id} className={'seed-card ' + seed.rarity}>
            <div className="seed-image">{getSeedIcon(seed.name)}</div>
            <div className="seed-name">{seed.name}</div>
            <div className="seed-qty">x{seed.quantity}</div>
            <button className="plant-btn" onClick={() => onPlant(seed.seed_type_id)}>Посадить</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Farm;