import { useEffect, useState } from 'react';
import axios from 'axios';
import Coin from './Coin';
const API_URL = import.meta.env.VITE_API_URL;

interface Player {
  telegram_id: number;
  username: string | null;
  first_name: string;
  balance: number;
}

function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.get(API_URL + '/api/farm/leaderboard', {
        headers: { 'x-telegram-init-data': initData },
      });
      setPlayers(res.data.leaderboard);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="empty">Загрузка...</p>;

  return (
    <div className="leaderboard">
      <h2>🏆 Топ игроков</h2>
      <p className="leaderboard-hint">Лучшие фермеры Telegram по балансу</p>

      <div className="leaderboard-list">
        {players.map((player, i) => {
          const rank = i + 1;
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
          const isMe = player.telegram_id === tg?.initDataUnsafe?.user?.id;

          return (
            <div
              key={player.telegram_id}
              className={
                'leaderboard-row' +
                (rank <= 3 ? ' top-' + rank : '') +
                (isMe ? ' me' : '')
              }
            >
              <div className="rank">
                {medal ? <span className="medal">{medal}</span> : '#' + rank}
              </div>
              <div className="player-info">
                <div className="player-name">
                  {player.first_name || 'Игрок'}
                  {isMe && <span className="me-badge"> (вы)</span>}
                </div>
                {player.username && (
                  <div className="player-username">@{player.username}</div>
                )}
              </div>
              <div className="player-balance"><Coin size={12} /> {player.balance}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Leaderboard;