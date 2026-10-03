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
  const [activeTab, setActiveTab] = useState('farm');

  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes?.();
    }
    loadState();

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

      const plotsRes = await axios.get(API_URL + '/api/farm/plots', { headers });
      setPlotsInfo(plotsRes.data);
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
      tg?.showAlert(
        '💧 Полив успешен!\n' +
        'Вода: ' + res.data.waterLevel + '%\n' +
        'Качество: ' + res.data.quality + '/100'
      );
      loadState();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    }
  };

  return (
    <div className="app"><header className="header">
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
            plotsInfo={plotsInfo}
            onBuyPlot={buyPlot}
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