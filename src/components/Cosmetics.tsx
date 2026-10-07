import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface Cosmetic {
  id: number;
  name: string;
  type: 'frame' | 'avatar' | 'title';
  rarity: string;
  icon: string;
  price_crystals: number;
  max_supply: number;
  current_supply: number;
}

interface MyItem {
  user_cosmetic_id: number;
  cosmetic_id: number;
  serial_number: number | null;
  name: string;
  type: string;
  rarity: string;
  icon: string;
}

interface Equipped {
  avatar: number | null;
  frame: number | null;
  title: number | null;
}

interface CosmeticsProps {
  crystals: number;
  onUpdate: () => void;
}

function Cosmetics({ crystals, onUpdate }: CosmeticsProps) {
  const [catalog, setCatalog] = useState<Cosmetic[]>([]);
  const [my, setMy] = useState<MyItem[]>([]);
  const [equipped, setEquipped] = useState<Equipped>({ avatar: null, frame: null, title: null });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [tab, setTab] = useState<'frame' | 'avatar' | 'title'>('frame');
  const tg = (window as any).Telegram?.WebApp;

  const headers = { 'x-telegram-init-data': tg?.initData || '' };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [catRes, myRes] = await Promise.all([
        axios.get(API_URL + '/api/cosmetics/catalog', { headers }),
        axios.get(API_URL + '/api/cosmetics/my', { headers }),
      ]);
      setCatalog(catRes.data.catalog);
      setMy(myRes.data.items);
      setEquipped(myRes.data.equipped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const owns = (cosmeticId: number) => my.some((m) => m.cosmetic_id === cosmeticId);

  const isEquipped = (cosmeticId: number, type: string) => {
    if (type === 'frame') return equipped.frame === cosmeticId;
    if (type === 'avatar') return equipped.avatar === cosmeticId;
    if (type === 'title') return equipped.title === cosmeticId;
    return false;
  };

  const buy = async (id: number, price: number) => {
    if (crystals < price) {
      tg?.showAlert('💎 Не хватает кристаллов');
      return;
    }
    if (!tg?.showConfirm) {
      if (!confirm('Купить за ' + price + '💎?')) return;
    }
    setBusy(id);
    try {
      const res = await axios.post(API_URL + '/api/cosmetics/buy/' + id, {}, { headers });
      tg?.showAlert('🎉 Куплено: ' + res.data.name + (res.data.serial ? ' #' + res.data.serial : ''));
      tg?.HapticFeedback?.notificationOccurred('success');
      load();
      onUpdate();
    } catch (e: any) {
      tg?.showAlert(e.response?.data?.error || 'Ошибка');
    } finally {
      setBusy(null);
    }
  };

  const equip = async (id: number) => {
    setBusy(id);
    try {
      await axios.post(API_URL + '/api/cosmetics/equip/' + id, {}, { headers });
      tg?.HapticFeedback?.impactOccurred('light');
      load();
      onUpdate();
    } catch (e: any) {
      tg?.showAlert(e.response?.data?.error || 'Ошибка');
    } finally {
      setBusy(null);
    }
  };

  const unequip = async (type: string) => {
    try {
      await axios.post(API_URL + '/api/cosmetics/unequip/' + type, {}, { headers });
      load();
      onUpdate();
    } catch (e: any) {
      tg?.showAlert(e.response?.data?.error || 'Ошибка');
    }
  };

  if (loading) return <p className="empty">Загрузка...</p>;

  const catalogFiltered = catalog.filter((c) => c.type === tab);

  return (
    <div className="cosmetics">
      <div className="cosm-tabs">
        <button className={tab === 'frame' ? 'active' : ''} onClick={() => setTab('frame')}>🖼 Рамки</button>
        <button className={tab === 'avatar' ? 'active' : ''} onClick={() => setTab('avatar')}>👤 Аватары</button>
        <button className={tab === 'title' ? 'active' : ''} onClick={() => setTab('title')}>🏷 Титулы</button>
      </div>

      {equipped[tab] && (
        <div className="cosm-equipped">
          Надето: <strong>{catalog.find((c) => c.id === equipped[tab])?.name || '—'}</strong><button className="cosm-unequip" onClick={() => unequip(tab)}>Снять</button>
        </div>
      )}

      <div className="cosm-grid">
        {catalogFiltered.map((item) => {
          const owned = owns(item.id);
          const eq = isEquipped(item.id, item.type);
          const limited = item.max_supply > 0;
          const left = limited ? item.max_supply - item.current_supply : null;

          return (
            <div key={item.id} className={'cosm-card ' + item.rarity}>
              <div className="cosm-icon">{item.icon}</div>
              <div className="cosm-name">{item.name}</div>
              {limited && left !== null && (
                <div className="cosm-limited">Осталось: {left}/{item.max_supply}</div>
              )}

              {!owned ? (
                <button
                  className="cosm-btn buy"
                  onClick={() => buy(item.id, item.price_crystals)}
                  disabled={busy === item.id || crystals < item.price_crystals}
                >
                  {item.price_crystals}💎
                </button>
              ) : eq ? (
                <button className="cosm-btn equipped" disabled>✅ Надето</button>
              ) : (
                <button
                  className="cosm-btn equip"
                  onClick={() => equip(item.id)}
                  disabled={busy === item.id}
                >
                  Надеть
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Cosmetics;