import { useState, useEffect } from 'react';
import CropIcon from './CropIcon';

interface Crop {
  id: number;
  name: string;
  rarity: string;
  planted_at: string;
  ready_at: string;
  expires_at: string | null;
  water_level: number;
  fertilized: boolean;
  dry_since: string | null;
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
  onWater: (cropId: number) => void;
  onFertilize: (cropId: number) => void;
  plotsInfo: { plots: number; maxAllowed: number; canBuy: boolean; nextPrice: number; planted: number } | null;
  onBuyPlot: () => void;
  autowater: { active: boolean; until: string | null } | null;
  onBuyAutowater: () => void;
  referralInfo: { referralsCount: number; hasReferrer: boolean } | null;
  onInvite: () => void;
}

function Farm({
  crops, seeds, onPlant, onHarvest, onWater, onFertilize,
  plotsInfo, onBuyPlot, autowater, onBuyAutowater,
  referralInfo, onInvite,
}: FarmProps) {
  const [now, setNow] = useState(Date.now());
  const [harvestingId, setHarvestingId] = useState<number | null>(null);
  const [wateringId, setWateringId] = useState<number | null>(null);

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
    if (totalMins < 60) return totalMins + ':' + secsStr;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const minsStr = mins < 10 ? '0' + mins : '' + mins;
    return hours + 'ч ' + minsStr + 'м';
  };

  const getDeathTime = (drySince: string | null) => {
    if (!drySince) return '';
    const dryMs = new Date(drySince).getTime();
    const deathAt = dryMs + 12 * 60 * 60 * 1000;
    const timeToDeath = deathAt - now;
    if (timeToDeath <= 0) return 'Погибает...';
    const hours = Math.floor(timeToDeath / 3600000);
    const mins = Math.floor((timeToDeath % 3600000) / 60000);
    return hours + 'ч ' + mins + 'м';
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

  const getProgress = (plantedAt: string, readyAt: string) => {
    const p = new Date(plantedAt).getTime();
    const r = new Date(readyAt).getTime();
    const total = r - p;
    if (total <= 0) return 100;
    const passed = now - p;
    const percent = (passed / total) * 100;
    if (percent < 0) return 0;
    if (percent > 100) return 100;
    return Math.floor(percent);
  };

  const handleWater = (cropId: number) => {
    setWateringId(cropId);
    onWater(cropId);
    setTimeout(() => setWateringId(null), 600);
  };

  return (
    <div className="farm">
      {plotsInfo && (
        <div className="plots-header">
          <div className="plots-info">
            <span className="plots-count">
              🌱 {plotsInfo.planted}/{Math.max(plotsInfo.plots, plotsInfo.planted)}
            </span>
            <span className="plots-label">грядок занято</span>
          </div>
          {plotsInfo.canBuy && (
            <button className="buy-plot-btn" onClick={onBuyPlot}>
              + Грядка<br />
              <span className="buy-plot-price">{plotsInfo.nextPrice}💰</span>
[05.10.2026 22:55] Никита: </button>
          )}
        </div>
      )}

      {referralInfo && (
        <div className="referral-card">
          <div className="referral-text">
            <div className="referral-title">🎁 Пригласи друга</div>
            <div className="referral-sub">
              {referralInfo.referralsCount > 0
                ? 'Ты пригласил: ' + referralInfo.referralsCount + ' 👥'
                : 'Пригласи друга — получи 500💰'}
            </div>
          </div>
          <button className="referral-btn" onClick={onInvite}>Пригласить</button>
        </div>
      )}

      {autowater && autowater.active && autowater.until && (
        <div className="autowater-banner">
          💧 Автополив активен до{' '}
          {new Date(autowater.until).toLocaleTimeString('ru-RU', {
            hour: '2-digit', minute: '2-digit',
          })}
        </div>
      )}

      {(!autowater || !autowater.active) && (
        <button className="buy-autowater-btn" onClick={onBuyAutowater}>
          💧 Купить автополив на 24ч — 500💰
        </button>
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
              (harvestingId === crop.id ? ' harvesting' : '') +
              (crop.water_level === 0 ? ' dying' : '')
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
              <div>
                <CropIcon name={crop.name} size={56} />
              </div>
            </div>
            <div className="crop-name">{crop.name}</div>

            {!isReady(crop.ready_at) && (
              <>
                <div className="crop-water-bar">
                  <div
                    className={'crop-water-fill' + (crop.water_level < 30 ? ' low' : '')}
                    style={{ width: Math.max(crop.water_level, 4) + '%' }}
                  />
                </div>

                {crop.water_level === 0 && (
                  <div className="crop-dying">
                    ⚠️ Сохнет! Погибнет через {getDeathTime(crop.dry_since)}
                  </div>
                )}

                {crop.water_level < 100 && (
  <button
    className={'water-btn' + (wateringId === crop.id ? ' watering' : '')}
    onClick={() => handleWater(crop.id)}
    disabled={wateringId === crop.id}
  >
    {wateringId === crop.id ? '💧 Поливаем...' : '💧 Полить'}
  </button>
)}
                {!crop.fertilized ? (
                  <button className="fertilize-btn" onClick={() => onFertilize(crop.id)}>
                    ⚡ Ускорить 100💰
                  </button>
                ) : (
                  <div className="fertilized-badge">⚡ Удобрено</div>
                )}
              </>
            )}

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
                    {isUrgent(crop.expires_at) ? '⚠️' : '🌾'} Осталось: {getExpireTime(crop.
 expires_at)}
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
                    <span>⏱ {getTimeLeft(crop.ready_at)}</span>
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
            <div className="seed-image">
              <CropIcon name={seed.name} size={48} />
            </div>
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