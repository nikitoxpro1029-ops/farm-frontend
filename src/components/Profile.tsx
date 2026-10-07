import { useEffect, useState } from 'react';
import axios from 'axios';
import Coin from './Coin';
import CropIcon from './CropIcon';
import Cosmetics from './Cosmetics';

const API_URL = import.meta.env.VITE_API_URL;

interface ProfileData {
  user: any;
  xpForNext: number;
  stats: any;
  leaderboard: any[];
  catalog: any[];
}

interface ProfileProps {
  crystals: number;
  onUpdate: () => void;
}
function Profile({ crystals, onUpdate }: ProfileProps) {

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'stats' | 'top' | 'cosmetics' | 'catalog'>('stats');
  const [selected, setSelected] = useState<any>(null);
  const tg = (window as any).Telegram?.WebApp;
  const [myLoadout, setMyLoadout] = useState<{
  frame_icon: string | null;
  frame_rarity: string | null;
  avatar_icon: string | null;
  title_icon: string | null;
}>({ frame_icon: null, frame_rarity: null, avatar_icon: null, title_icon: null });

  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.get(API_URL + '/api/farm/profile', {
        headers: { 'x-telegram-init-data': initData },
      });
      setData(res.data);
      const cosRes = await axios.get(API_URL + '/api/cosmetics/my', {
        headers: { 'x-telegram-init-data': initData },
      });
      const equipped = cosRes.data.equipped || {};
      const items = cosRes.data.items || [];
      const getItem = (id: number | null) => {
        if (!id) return null;
        return items.find((it: any) => it.cosmetic_id === id) || null;
      };
      const frameItem = getItem(equipped.frame);
      const avatarItem = getItem(equipped.avatar);
      const titleItem = getItem(equipped.title);
      setMyLoadout({
        frame_icon: frameItem?.icon || null,
        frame_rarity: frameItem?.rarity || null,
        avatar_icon: avatarItem?.icon || null,
        title_icon: titleItem?.icon || null,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="empty">Загрузка...</p>;
  if (!data) return <p className="empty">Не удалось загрузить профиль</p>;

  const { user, xpForNext, stats, leaderboard, catalog } = data;
  const xpPercent = Math.min(100, ((user.xp || 0) / xpForNext) * 100);

  return (
    <div className="profile">
      <div className={'profile-header' + (myLoadout.frame_rarity ? ' frame-' + myLoadout.frame_rarity : '')}>
  {myLoadout.frame_icon && (
    <>
      <div className="frame-row top">{Array(12).fill(myLoadout.frame_icon).join('')}</div>
      <div className="frame-row bottom">{Array(12).fill(myLoadout.frame_icon).join('')}</div>
      <div className="frame-col left">{Array(5).fill(myLoadout.frame_icon).join('\n')}</div>
      <div className="frame-col right">{Array(5).fill(myLoadout.frame_icon).join('\n')}</div>
    </>
  )}
          <div className="profile-avatar">
            {user.first_name ? user.first_name[0].toUpperCase() : '?'}
          </div>
          <div className="profile-name">{user.first_name || 'Игрок'}</div>
          {user.username && <div className="profile-username">@{user.username}</div>}
          {myLoadout.title_icon && (
            <div className="profile-title">{myLoadout.title_icon} Титул</div>
          )}
          <div className="profile-balance">
            <Coin size={16} /> {user.balance}
          </div>

      <div className="profile-level">
        <div className="level-badge-lg">Уровень {user.level || 1}</div>
        <div className="xp-bar">
          <div className="xp-bar-fill" style={{ width: xpPercent + '%' }} />
        </div>
        <div className="xp-text">
          {user.xp || 0} / {xpForNext} XP
        </div>
      </div>
      </div>
      <div className="subtabs">
        <button className={subTab === 'stats' ? 'active' : ''} onClick={() => setSubTab('stats')}>📊 Стат</button>
        <button className={subTab === 'top' ? 'active' : ''} onClick={() => setSubTab('top')}>🏆 Топ</button>
        <button className={subTab === 'cosmetics' ? 'active' : ''} onClick={() => setSubTab('cosmetics')}>🎨 Косметика</button>
        <button className={subTab === 'catalog' ? 'active' : ''} onClick={() => setSubTab('catalog')}>📖 Справочник</button>
      </div>

      {subTab === 'stats' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🌾</div>
            <div className="stat-value">{stats.harvested}</div>
            <div className="stat-label">Собрано урожая</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🌱</div>
            <div className="stat-value">{stats.planted}</div>
            <div className="stat-label">Посажено</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value">{stats.sold}</div>
            <div className="stat-label">Продано</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🐾</div>
            <div className="stat-value">{stats.pets}</div>
            <div className="stat-label">Питомцев</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.referrals}</div>
            <div className="stat-label">Приглашено</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📖</div>
            <div className="stat-value">{stats.discovered}/{stats.catalogTotal}</div>
            <div className="stat-label">Открыто</div>
          </div>
        </div>
      )}

      {subTab === 'top' && (
        <div className="leaderboard-list">
          {leaderboard.map((player, i) => {
            const rank = i + 1;const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
            const isMe = player.telegram_id === tg?.initDataUnsafe?.user?.id;
            return (
              <div key={player.telegram_id} className={'leaderboard-row' + (rank <= 3 ? ' top-' + rank : '') + (isMe ? ' me' : '')}>
                <div className="rank">{medal ? <span className="medal">{medal}</span> : '#' + rank}</div>
                <div className="player-info">
                  <div className="player-name">
                    {player.first_name || 'Игрок'}
                    {isMe && <span className="me-badge"> (вы)</span>}
                  </div>
                  {player.username && <div className="player-username">@{player.username}</div>}
                </div>
                <div className="player-balance"><Coin size={12} /> {player.balance}</div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'cosmetics' && <Cosmetics crystals={crystals} onUpdate={onUpdate} />}
      {subTab === 'catalog' && (
        <>
          <div className="catalog-progress">
            <div className="catalog-progress-bar">
              <div className="catalog-progress-fill" style={{ width: (stats.discovered / stats.catalogTotal) * 100 + '%' }} />
            </div>
            <div className="catalog-progress-text">
              Открыто: <strong>{stats.discovered}</strong> / {stats.catalogTotal}
            </div>
          </div>
          <div className="catalog-grid">
            {catalog.map((item) => (
              <div
                key={item.id}
                className={'catalog-card ' + item.rarity + (item.discovered ? '' : ' locked')}
                onClick={() => item.discovered && setSelected(item)}
              >
                <div className="catalog-icon">
                  {item.discovered ? <CropIcon name={item.name} size={44} /> : <span className="catalog-locked">?</span>}
                </div>
                <div className="catalog-name">{item.discovered ? item.name : '???'}</div>
                {item.discovered && item.timesCollected > 0 && (
                  <div className="catalog-count">×{item.timesCollected}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div className="catalog-modal" onClick={() => setSelected(null)}>
          <div className={'catalog-modal-card ' + selected.rarity}>
            <div className="catalog-modal-icon">
              <CropIcon name={selected.name} size={90} />
            </div>
            <h3>{selected.name}</h3>
            <div className="catalog-modal-rarity">{selected.rarity}</div>
            <p className="catalog-modal-desc">{selected.description || 'Описание появится позже.'}</p>
            <div className="catalog-modal-stats">
              <span>💰 Цена: {selected.sellPrice}</span>
              <span>📦 Собрано: {selected.timesCollected}</span>
            </div>
            <button className="catalog-modal-btn" onClick={() => setSelected(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;