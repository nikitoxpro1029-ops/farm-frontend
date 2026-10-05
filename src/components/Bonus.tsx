import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const REWARDS = [0, 30, 50, 75, 100, 150, 200, 400];

interface BonusStatus {
  streak: number;
  canClaim: boolean;
  nextReward: number;
  nextStreak: number;
}

interface BonusProps {
  onClaim: () => void;
}

function Bonus({ onClaim }: BonusProps) {
  const [status, setStatus] = useState<BonusStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.get(API_URL + '/api/farm/bonus-status', {
        headers: { 'x-telegram-init-data': initData },
      });
      setStatus(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const claim = async () => {
    if (!status?.canClaim || claiming) return;
    setClaiming(true);
    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/farm/claim-bonus',
        {},
        { headers: { 'x-telegram-init-data': initData } }
      );

      let message = '🎁 Награда: +' + res.data.reward + ' монет!\n🔥 Стрик: ' + res.data.streak + '/7';
      if (res.data.bonusSeed) {
        message += '\n\n🌟 БОНУС: ' + res.data.bonusSeed.name + ' (' + res.data.bonusSeed.rarity + ')';
      }

      tg?.showAlert(message);
      tg?.HapticFeedback?.notificationOccurred('success');
      load();
      onClaim();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <p className="empty">Загрузка...</p>;
  if (!status) return <p className="empty">Не удалось загрузить бонус</p>;

  const currentStreak = status.canClaim ? status.nextStreak - 1 : status.streak;
  const displayStreak = status.canClaim ? status.nextStreak : status.streak;

  return (
    <div className="bonus">
      <h2>🎁 Награда за вход</h2>

      <p className="bonus-subtitle">
        🔥 Твой стрик: <strong>{displayStreak} / 7</strong>
      </p>

      <div className="bonus-days">
        {REWARDS.slice(1).map((reward, i) => {
          const day = i + 1;
          const isDone = day <= currentStreak;
          const isCurrent = day === displayStreak && status.canClaim;
          const isDay7 = day === 7;

          return (
            <div
              key={day}
              className={
                'bonus-day' +
                (isDone ? ' done' : '') +
                (isCurrent ? ' current' : '') +
                (isDay7 ? ' day7' : '')
              }
            >
              <div className="bonus-day-label">День {day}</div>
              <div className="bonus-day-icon">
                {isDone ? '✅' : isDay7 ? '🎁' : '💰'}
              </div>
              <div className="bonus-day-reward">
                {isDay7 ? '500+🌰' : reward}
              </div>
            </div>
          );
        })}
      </div>

      {status.canClaim ? (
        <button className="claim-btn" onClick={claim} disabled={claiming}>
          {claiming ? 'Получаем...' : 'Забрать ' + status.nextReward + ' монет'}
        </button>
      ) : (
        <p className="bonus-waiting">✅ Бонус получен. Возвращайтесь завтра!</p>
      )}

      <p className="bonus-hint">
        Заходи каждый день — на 7-й день получишь 500 монет и редкое семя! 🌟
      </p>
    </div>
  );
}

export default Bonus;