import { useEffect, useState } from 'react';
import axios from 'axios';
import { getSeedIcon } from '../seedIcons';

const API_URL = import.meta.env.VITE_API_URL;

interface BarnItem {
  id: number;
  seed_type_id: number;
  name: string;
  rarity: string;
  sell_price: number;
  quantity: number;
}

interface BarnProps {
  onSell: () => void;
}

function Barn({ onSell }: BarnProps) {
  const [items, setItems] = useState<BarnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.get(API_URL + '/api/farm/barn', {
        headers: { 'x-telegram-init-data': initData },
      });
      setItems(res.data.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sell = async (seedTypeId: number, quantity: number) => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/farm/sell',
        { seedTypeId, quantity },
        { headers: { 'x-telegram-init-data': initData } }
      );
      tg?.showAlert(
        '💰 Продано ' + res.data.quantity + 'x ' + res.data.itemName + ' за ' + res.data.reward + ' монет'
      );
      tg?.HapticFeedback?.notificationOccurred('success');
      load();
      onSell();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    }
  };

  const sellAll = async () => {
    for (const item of items) {
      await sell(item.seed_type_id, item.quantity);
    }
  };

  if (loading) return <p className="empty">Загрузка...</p>;

  const totalValue = items.reduce((sum, item) => sum + item.sell_price * item.quantity, 0);

  return (
    <div className="barn">
      <h2>🏚 Амбар</h2>

      {items.length === 0 ? (
        <p className="empty">Амбар пуст. Соберите урожай!</p>
      ) : (
        <>
          <div className="barn-header">
            <span>Всего: <strong>{totalValue}💰</strong></span>
            <button className="sell-all-btn" onClick={sellAll}>
              Продать всё
            </button>
          </div>

          <div className="barn-grid">
            {items.map((item) => (
              <div key={item.id} className={'barn-card ' + item.rarity}>
                <div className="barn-icon">{getSeedIcon(item.name)}</div>
                <div className="barn-name">{item.name}</div>
                <div className="barn-qty">x{item.quantity}</div>
                <div className="barn-price">💰 {item.sell_price} за шт</div>
                <div className="barn-actions">
                  <button onClick={() => sell(item.seed_type_id, 1)}>1</button>
                  <button onClick={() => sell(item.seed_type_id, item.quantity)}>
                    Все ({item.sell_price * item.quantity}💰)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Barn;