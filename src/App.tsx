import { useEffect, useState } from 'react';
import axios from 'axios';
import Farm from './components/Farm';
import Packs from './components/Packs';import Barn from './components/Barn';import Bonus from './components/Bonus';import Leaderboard from './components/Leaderboard';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [user, setUser] = useState<any>(null);
  const [crops, setCrops] = useState([]);
  const [seeds, setSeeds] = useState([]);
  const [activeTab, setActiveTab] = useState('farm');

  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
  if (tg) {
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
  }
  loadState();

  // Блокируем горизонтальные свайпы по всей странице
  let startX = 0;
  let startY = 0;

  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - startX);
    const dy = Math.abs(e.touches[0].clientY - startY);
    // Если свайп больше по горизонтали, чем по вертикали — блокируем
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
      const res = await axios.get(`${API_URL}/api/farm/state`, {
       headers: { 
  'x-telegram-init-data': initData,
  'bypass-tunnel-reminder': 'true'
}
      });
      setUser(res.data.user);
      setCrops(res.data.crops);
      setSeeds(res.data.seeds);
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  };

  const plantSeed = async (seedTypeId: number) => {
    const initData = tg?.initData || '';
    await axios.post(`${API_URL}/api/farm/plant`, { seedTypeId }, {
      headers: { 
  'x-telegram-init-data': initData,
  'bypass-tunnel-reminder': 'true'
}
    });
    loadState();
  };

  const harvestCrop = async (cropId: number) => {
    const initData = tg?.initData || '';
    const res = await axios.post(`${API_URL}/api/farm/harvest`, { cropId }, {
      headers: { 
  'x-telegram-init-data': initData,
  'bypass-tunnel-reminder': 'true'
}
    });
    tg?.showAlert(`🌾 Собрано: ${res.data.cropName}\n💰 Можно продать за ${res.data.sellPrice} монет в Амбаре`);
    loadState();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🌾 Ферма</h1>
        {user && <div className="balance">💰 {user.balance}</div>}
      </header>
      <nav className="tabs"><button className={activeTab === 'barn' ? 'active' : ''} onClick={() => setActiveTab('barn')}>Амбар</button><button className={activeTab === 'bonus' ? 'active' : ''} onClick={() => setActiveTab('bonus')}>Бонус</button><button className={activeTab === 'top' ? 'active' : ''} onClick={() => setActiveTab('top')}>Топ</button>
        <button className={activeTab === 'farm' ? 'active' : ''} onClick={() => setActiveTab('farm')}>Ферма</button>
        <button className={activeTab === 'packs' ? 'active' : ''} onClick={() => setActiveTab('packs')}>Паки</button>
      </nav>
      <main className="content">{activeTab === 'top' && <Leaderboard />}{activeTab === 'bonus' && <Bonus onClaim={loadState} />}
        {activeTab === 'farm' && <Farm crops={crops} seeds={seeds} onPlant={plantSeed} onHarvest={harvestCrop} />}
        {activeTab === 'packs' && <Packs onOpen={loadState} />}{activeTab === 'barn' && <Barn onSell={loadState} />}
      </main>
    </div>
  );
}

export default App;