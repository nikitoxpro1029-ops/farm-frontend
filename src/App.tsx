import { useEffect, useState } from 'react';
import axios from 'axios';
import Farm from './components/Farm';
import Packs from './components/Packs';
import Barn from './components/Barn';
import Bonus from './components/Bonus';
import Leaderboard from './components/Leaderboard';
import Coin from './components/Coin';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [user, setUser] = useState<any>(null);
  const [crops, setCrops] = useState([]);
  const [seeds, setSeeds] = useState([]);
  const [plotsInfo, setPlotsInfo] = useState<any>(null);
  const [autowater, setAutowater] = useState<any>(null);const [referralInfo, setReferralInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('farm');

  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes?.();
    }
    loadState();// Обработка реферальной ссылки
    const startParam = tg?.initDataUnsafe?.start_param;
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
  }, []);

  const loadState = async () => {
    try {
      const initData = tg?.initData || '';
      const headers = { 'x-telegram-init-data': initData };

      const res = await axios.get(API_URL + '/api/farm/state', { headers });
      setUser(res.data.user);
      setCrops(res.data.crops);
      setSeeds(res.data.seeds);
      setAutowater(res.data.autowater);

      const plotsRes = await axios.get(API_URL + '/api/farm/plots', { headers });
      setPlotsInfo(plotsRes.data);const refRes = await axios.get(API_URL + '/api/farm/referral-info', { headers });
      setReferralInfo(refRes.data);
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  };

  const plantSeed = async (seedTypeId: number) => {
    try {
      const initData = tg?.initData || '';
      await axios.post(
        API_URL + '/api/farm/plant',
        { seedTypeId },
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
        {},
        { headers: { 'x-telegram-init-data': initData } }
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

  const waterCrop = async (cropId: number, score: number) => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/farm/water',
        { cropId, score },
        { headers: { 'x-telegram-init-data': initData } }
      );

      let message = '💧 Полив успешен!\n' +
        'Вода: ' + res.data.waterLevel + '%\n' +
        'Качество: ' + res.data.quality + '/100';

      if (res.data.bonusQuality > 0) {message += '\n\n🔥 БОНУС ЗА СЕРИЮ: +10 к качеству!';
        tg?.HapticFeedback?.notificationOccurred('success');
      } else {
        const left = 3 - (res.data.waterStreak || 0);
        if (left > 0 && left < 3) {
          message += '\n\n🔥 До бонуса: ещё ' + left + ' полив(а)';
        }
      }

      tg?.showAlert(message);
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
  };const inviteFriend = () => {
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
        {user && (
          <div className="balance">
            <Coin size={18} /> {user.balance}
          </div>
        )}
      </header>

      <nav className="tabs">
        <button className={activeTab === 'barn' ? 'active' : ''} onClick={() => setActiveTab('barn')}>Амбар</button>
        <button className={activeTab === 'bonus' ? 'active' : ''} onClick={() => setActiveTab('bonus')}>Бонус</button>
        <button className={activeTab === 'top' ? 'active' : ''} onClick={() => setActiveTab('top')}>Топ</button>
        <button className={activeTab === 'farm' ? 'active' : ''} onClick={() => setActiveTab('farm')}>Ферма</button>
        <button className={activeTab === 'packs' ? 'active' : ''} onClick={() => setActiveTab('packs')}>Паки</button>
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
          />
        )}
        {activeTab === 'packs' && <Packs onOpen={loadState} />}
        {activeTab === 'barn' && <Barn onSell={loadState} />}
        {activeTab === 'bonus' && <Bonus onClaim={loadState} />}
        {activeTab === 'top' && <Leaderboard />}
      </main>
    </div>
  );
}

export default App;