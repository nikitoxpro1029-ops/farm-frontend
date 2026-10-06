import { useEffect, useState } from 'react';
import axios from 'axios';
import Farm from './components/Farm';
import Packs from './components/Packs';
import Barn from './components/Barn';
import MemoryGame from './components/MemoryGame';
import Profile from './components/Profile';
import Coin from './components/Coin';
import TutorialOverlay from './components/TutorialOverlay';
import { startMusic, isMusicEnabled, isSfxEnabled, toggleMusic, toggleSfx } from './Sounds';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [user, setUser] = useState<any>(null);
  const [crops, setCrops] = useState([]);
  const [seeds, setSeeds] = useState([]);
  const [plotsInfo, setPlotsInfo] = useState<any>(null);
  const [autowater, setAutowater] = useState<any>(null);
  const [referralInfo, setReferralInfo] = useState<any>(null);
  const [xpForNext, setXpForNext] = useState(100);
  const [activeTab, setActiveTab] = useState('farm');
  const [questsBadge, setQuestsBadge] = useState(0);
  const [tutorialKey, setTutorialKey] = useState(0);
  const tg = (window as any).Telegram?.WebApp;
const loadBadge = async () => {
  try {
    const initData = tg?.initData || '';
    const res = await axios.get(API_URL + '/api/quests', {
      headers: { 'x-telegram-init-data': initData },
    });
    setQuestsBadge(res.data.unclaimedReady || 0);
  } catch (e) {
    // тихо игнорируем — не ломаем игру, если что-то с заданиями
  }
};
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes?.();
    }
    loadState();
    
    const startMusicOnTouch = () => {
      if (isMusicEnabled()) startMusic();
      document.removeEventListener('touchstart', startMusicOnTouch);
      document.removeEventListener('click', startMusicOnTouch);
    };
    document.addEventListener('touchstart', startMusicOnTouch, { once: true });
    document.addEventListener('click', startMusicOnTouch, { once: true });

    const startParam = (tg?.initDataUnsafe as any)?.start_param;
    if (startParam && startParam.startsWith('ref_')) {
      const referrerId = startParam.replace('ref_', '');
      const initData = tg?.initData || '';
      axios.post(
        API_URL + '/api/farm/set-referrer',
        { referrerTelegramId: referrerId },
        { headers: { 'x-telegram-init-data': initData } }
      ).then((res) => {
        if (res.data.success) {
          tg?.showAlert('🎁 Ты получил 200 монет за вход по приглашению!');
          loadState();
        }
      }).catch(() => {});
    }

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > dy && dx > 8) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);useEffect(() => {
    if (activeTab === 'farm') loadBadge();
  }, [activeTab]);

  const loadState = async () => {
    try {
      const initData = tg?.initData || '';
      const headers = { 'x-telegram-init-data': initData };

      const res = await axios.get(API_URL + '/api/farm/state', { headers });
      setUser(res.data.user);
      setCrops(res.data.crops);
      setSeeds(res.data.seeds);
      setAutowater(res.data.autowater);
      setXpForNext(res.data.xpForNext || 100);

      const plotsRes = await axios.get(API_URL + '/api/farm/plots', { headers });
      setPlotsInfo(plotsRes.data);

      const refRes = await axios.get(API_URL + '/api/farm/referral-info', { headers });
      setReferralInfo(refRes.data);
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  };

  const plantSeed = async (seedTypeId: number, plotIndex?: number) => {
    try {
      const initData = tg?.initData || '';
      await axios.post(
        API_URL + '/api/farm/plant',
        { seedTypeId, plotIndex },
        { headers: { 'x-telegram-init-data': initData } }
      );
      loadState();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    }
  };

  const buyPlot = async () => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/farm/buy-plot',
        {},{ headers: { 'x-telegram-init-data': initData } }
      );
      tg?.showAlert('✅ Куплена грядка! Теперь у вас ' + res.data.newPlots + ' грядок.');
      tg?.HapticFeedback?.notificationOccurred('success');
      loadState();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    }
  };

  const harvestCrop = async (cropId: number) => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/farm/harvest',
        { cropId },
        { headers: { 'x-telegram-init-data': initData } }
      );
      tg?.showAlert('🌾 Собрано: ' + res.data.cropName + '\n💰 Можно продать за ' + res.data.sellPrice + ' монет в Амбаре');
      loadState();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    }
  };

  const waterCrop = async (cropId: number) => {
    try {
      const initData = tg?.initData || '';
      await axios.post(
        API_URL + '/api/farm/water',
        { cropId },
        { headers: { 'x-telegram-init-data': initData } }
      );
      tg?.HapticFeedback?.impactOccurred('light');
      loadState();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    }
  };

  const fertilize = async (cropId: number) => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/farm/fertilize',
        { cropId },
        { headers: { 'x-telegram-init-data': initData } }
      );
      const savedMin = Math.floor(res.data.savedMs / 60000);
      tg?.showAlert('⚡️ Ускорено!\nСэкономлено времени: ' + savedMin + ' мин');
      tg?.HapticFeedback?.notificationOccurred('success');
      loadState();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    }
  };

  const buyAutowater = async () => {
    try {
      const initData = tg?.initData || '';
      await axios.post(
        API_URL + '/api/farm/buy-autowater',
        {},
        { headers: { 'x-telegram-init-data': initData } }
      );
      tg?.showAlert('💧 Автополив активен на 24 часа!');
      tg?.HapticFeedback?.notificationOccurred('success');
      loadState();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    }
  };

  const inviteFriend = () => {
    if (!user) return;
    const refLink = 'https://t.me/Farmm_game_bot/farm?startapp=ref_' + user.telegram_id;
    const shareText = '🌾 Заходи в мою ферму! Получишь 200 монет на старт + крутая игра!';
    const shareUrl = 'https://t.me/share/url?url=' + encodeURIComponent(refLink) + '&text=' + encodeURIComponent(shareText);
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🌾 Ферма</h1>
        <div className="header-right">
          {user && (
  <>
    <div className="crystals">
      💎 {user.crystals || 0}
    </div>
    <div className="balance">
      <Coin size={18} /> {user.balance}
    </div>
  </>
)}
          <button
            className="sound-toggle"
            onClick={() => {
              const on = toggleSfx();
              tg?.showAlert(on ? '🔊 Звуки вкл' : '🔇 Звуки выкл');
            }}
          >
            {isSfxEnabled() ? '🔊' : '🔇'}
          </button>
          <button
            className="sound-toggle"
            onClick={() => {
              const on = toggleMusic();
              tg?.showAlert(on ? '🎵 Музыка вкл' : '🔕 Музыка выкл');
            }}
          >
            {isMusicEnabled() ? '🎵' : '🔕'}
          </button>
        </div>
      </header>

      {user && (
        <div className="xp-bar-wrapper">
          <div className="level-badge">Ур. {user.level || 1}</div>
          <div className="xp-bar">
            <div
              className="xp-bar-fill"
              style={{
                width: Math.min(100, ((user.xp || 0) / xpForNext) * 100) + '%',
              }}
            />
          </div>
          <div className="xp-text">{user.xp || 0} / {xpForNext}
          </div>
        </div>
      )}

      <nav className="tabs">
  <button className={activeTab === 'barn' ? 'active' : ''} onClick={() => setActiveTab('barn')}>
    Амбар
    {questsBadge > 0 && <span className="tab-badge">{questsBadge}</span>}
  </button>
  <button className={activeTab === 'game' ? 'active' : ''} onClick={() => setActiveTab('game')}>
    Игры
  </button>
  <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
    Профиль
  </button>
  <button className={activeTab === 'farm' ? 'active' : ''} onClick={() => setActiveTab('farm')}>
    Ферма
  </button>
  <button className={activeTab === 'packs' ? 'active' : ''} onClick={() => setActiveTab('packs')}>
    Паки
  </button>
</nav>

      <main className="content">
        {activeTab === 'farm' && (
          <Farm
            crops={crops}
            seeds={seeds}
            onPlant={plantSeed}
            onHarvest={harvestCrop}
            onWater={waterCrop}
            onFertilize={fertilize}
            plotsInfo={plotsInfo}
            onBuyPlot={buyPlot}
            autowater={autowater}
            onBuyAutowater={buyAutowater}
            referralInfo={referralInfo}
            onInvite={inviteFriend}
            balance={user?.balance || 0}
            crystals={user?.crystals || 0}
          />
        )}
        {activeTab === 'packs' && <Packs onOpen={loadState} />}
        {activeTab === 'barn' && <Barn onSell={loadState} />}
        {activeTab === 'game' && <MemoryGame onFinish={loadState} />}
        {activeTab === 'profile' && <Profile />}
      </main>
      <TutorialOverlay
        key={tutorialKey}
        activeTab={activeTab}
        onAdvance={() => {
          setTutorialKey(k => k + 1);
          loadState();
        }}
        onComplete={() => {
          loadState();
          loadBadge();
        }}
      />
  
    </div>
  );
}

export default App;