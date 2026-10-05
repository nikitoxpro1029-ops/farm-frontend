import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface Quest {
  id: number;
  type: string;
  label: string;
  target: number;
  progress: number;
  reward: number;
  xpReward: number;
  claimed: boolean;
  completed: boolean;
}

interface QuestsProps {
  onClaim: () => void;
}

function Quests({ onClaim }: QuestsProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.get(API_URL + '/api/quests', {
        headers: { 'x-telegram-init-data': initData },
      });
      setQuests(res.data.quests);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const claim = async (questId: number) => {
    setClaiming(questId);
    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/quests/claim/' + questId,
        {},
        { headers: { 'x-telegram-init-data': initData } }
      );
      tg?.showAlert('🎉 +' + res.data.reward + '💰 и +' + res.data.xpReward + ' XP');
      tg?.HapticFeedback?.notificationOccurred('success');
      load();
      onClaim();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    } finally {
      setClaiming(null);
    }
  };

  if (loading) return <p className="empty">Загрузка...</p>;

  const allDone = quests.length > 0 && quests.every((q) => q.claimed);

  return (
    <div className="quests">
      <p className="quests-hint">
        Выполняй задания и получай монеты и опыт. Обновляются каждый день.
      </p>

      {allDone && (
        <div className="quests-done-banner">
          🎉 Все задания на сегодня выполнены! Возвращайся завтра.
        </div>
      )}

      <div className="quests-list">
        {quests.map((quest) => {
          const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));
          return (
            <div
              key={quest.id}
              className={'quest-card' + (quest.claimed ? ' claimed' : quest.completed ? ' ready' : '')}
            >
              <div className="quest-label">{quest.label}</div>

              <div className="quest-progress-bar">
                <div className="quest-progress-fill" style={{ width: percent + '%' }} />
              </div>

              <div className="quest-bottom">
                <span className="quest-progress-text">
                  {quest.progress}/{quest.target}
                </span>
                <span className="quest-rewards">
                  +{quest.reward}💰 +{quest.xpReward}⭐️
                </span>
              </div>

              {quest.claimed ? (
                <div className="quest-claimed-badge">✅ Забрано</div>
              ) : quest.completed ? (
                <button
                  className="quest-claim-btn"
                  onClick={() => claim(quest.id)}
                  disabled={claiming === quest.id}
                >
                  {claiming === quest.id ? 'Забираем...' : '🎁 Забрать'}
                </button>
              ) : (
                <div className="quest-pending">В процессе…</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Quests;