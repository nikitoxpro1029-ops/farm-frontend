import { useState, useEffect } from 'react';
import { getSeedIcon } from '../seedIcons';

interface Crop {
  id: number;
  name: string;
  rarity: string;
  planted_at: string;
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
  plotsInfo: { plots: number; maxAllowed: number; canBuy: boolean; nextPrice: number; planted: number } | null;
  onBuyPlot: () => void;
}

function Farm({ crops, seeds, onPlant, onHarvest, plotsInfo, onBuyPlot }: FarmProps) {
  const [now, setNow] = useState(Date.now());
  const [harvestingId, setHarvestingId] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimeLeft = (readyAt: string) => {
    const diff = new Date(readyAt).getTime() - now;
    if (diff <= 0) return 'Готово!';
    const totalMins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const secsStr = secs < 10 ? '0' + secs : '' + secs;

    if (totalMins < 60) {
      return totalMins + ':' + secsStr;
    }
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const minsStr = mins < 10 ? '0' + mins : '' + mins;
    return hours + 'ч ' + minsStr + 'м';
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

  const getProgress = (plantedAt: string, readyAt: string) => {
    const plantedTime = new Date(plantedAt).getTime();
    const readyTime = new Date(readyAt).getTime();
    const total = readyTime - plantedTime;
    if (total <= 0) return 100;
    const passed = now - plantedTime;
    const percent = (passed / total) * 100;
    if (percent < 0) return 0;
    if (percent > 100) return 100;
    return Math.floor(percent);
  };

  const isReady = (readyAt: string) => new Date(readyAt).getTime() <= now;

  return (
    <div className="farm">
      {plotsInfo && (
        <div className="plots-header">
          <div className="plots-info">
            <span className="plots-count">🌱 {plotsInfo.planted}/{plotsInfo.plots}</span>
            <span className="plots-label">грядок занято</span>
          </div>
          {plotsInfo.canBuy && (
            <button className="buy-plot-btn" onClick={onBuyPlot}>
              + Грядка<br />
              <span className="buy-plot-price">{plotsInfo.nextPrice}💰</span>
            </button>
          )}
        </div>
      )}
      <h2>Грядки</h2>
      <div className="crops-grid">
        {crops.length === 0 && <p className="empty">Посадите семена, чтобы начать</p>}
        {crops.map((crop) => (
          <div
            key={crop.id}
            className={
              'crop-card ' + crop.rarity +
              (isReady(crop.ready_at) ? ' ready' : '') +
              (harvestingId === crop.id ? ' harvesting' : '')
            }
          >
            {harvestingId === crop.id && (
              <div className="harvest-effect">
                <span className="coin-fly coin-1">🪙</span>
                <span className="coin-fly coin-2">🪙</span>
                <span className="coin-fly coin-3">🪙</span>
                <span className="coin-fly coin-4">🪙</span>
                <span className="coin-fly coin-5">🪙</span>
              </div>
            )}

            <div className="crop-image">
              {isReady(crop.ready_at) ? getSeedIcon(crop.name) : '🌱'}
            </div>
            <div className="crop-name">{crop.name}</div>
            <div className="crop-timer">
              {isReady(crop.ready_at) ? (
                <>
                  <button
                    className="harvest-btn"
                    onClick={() => {
                      setHarvestingId(crop.id);
                      onHarvest(crop.id);
                      setTimeout(() => setHarvestingId(null), 1200);
                    }}
                  >
                    Собрать
                  </button>
                  <div className={'crop-expire' + (isUrgent(crop.expires_at) ? ' urgent' : '')}>
                    {isUrgent(crop.expires_at) ? '⚠️' : '🌾'} Осталось: {getExpireTime(crop.expires_at)}
                  </div>
                </>
              ) : (
                <>
                  <div className="crop-progress-bar">
                    <div
                      className="crop-progress-fill"
                      style={{ width: getProgress(crop.planted_at, crop.ready_at) + '%' }}
                    />
                  </div>
                  <div className="crop-progress-text">
                    <span>⏱️ {getTimeLeft(crop.ready_at)}</span>
                    <span className="crop-progress-percent">
                      {getProgress(crop.planted_at, crop.ready_at)}%
                    </span>
                  </div>
                </>
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