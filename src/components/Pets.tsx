import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface Pet {
  id: number;
  type: string;
  name: string;
  pendingIncome: number;
  canCollect: boolean;
  hoursSince: number;
}

interface CatalogItem {
  type: string;
  name: string;
  price: number;
  income: number;
  maxHours: number;
}

function Pets({ onUpdate }: { onUpdate: () => void }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.get(API_URL + '/api/pets', {
        headers: { 'x-telegram-init-data': initData },
      });
      setPets(res.data.pets);
      setCatalog(res.data.catalog);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const buy = async (petType: string) => {
    setBuying(true);
    try {
      const initData = tg?.initData || '';
      await axios.post(
        API_URL + '/api/pets/buy',
        { petType },
        { headers: { 'x-telegram-init-data': initData } }
      );
      tg?.showAlert('🎉 Питомец приютился!');
      tg?.HapticFeedback?.notificationOccurred('success');
      load();
      onUpdate();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    } finally {
      setBuying(false);
    }
  };

  const collect = async (petId: number) => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/pets/collect',
        { petId },
        { headers: { 'x-telegram-init-data': initData } }
      );
      if (res.data.type === 'coins') {
        tg?.showAlert('💰 Получено: ' + res.data.reward + ' монет!');
      } else {
        tg?.showAlert('🥚 Получено: ' + res.data.reward + ' яиц!');
      }
      tg?.HapticFeedback?.notificationOccurred('success');
      load();
      onUpdate();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    }
  };

  if (loading) return <p className="empty">Загрузка...</p>;

  const ownedTypes = pets.map((p) => p.type);

  return (
    <div className="pets">
      <h2>🐾 Мои питомцы</h2>

      {pets.length === 0 && <p className="empty">У вас пока нет питомцев</p>}

      <div className="pets-list">
        {pets.map((pet) => (
          <div key={pet.id} className={'pet-card ' + pet.type}>
            <div className="pet-icon">
              {pet.type === 'cat' ? '🐱' : pet.type === 'dog' ? '🐶' : '🐔'}
            </div>
            <div className="pet-info">
              <div className="pet-name">{pet.name}</div>
              {pet.type === 'cat' && (
                <div className="pet-status">💰 Накоплено: {pet.pendingIncome}</div>
              )}
              {pet.type === 'dog' && (
                <div className="pet-status">🛡 +12ч к сроку увядания</div>
              )}
              {pet.type === 'chicken' && (
                <div className="pet-status">🥚 Накоплено: {Math.floor(pet.pendingIncome / 100)} шт.</div>
              )}
            </div>
            {pet.canCollect && (
              <button className="pet-collect-btn" onClick={() => collect(pet.id)}>
                Забрать
              </button>
            )}
          </div>
        ))}
      </div>

      <h2>🛍 Приютить</h2>

      <div className="pets-shop">
        {catalog.map((item) => {
          const owned = ownedTypes.includes(item.type);
          return (
            <div key={item.type} className="pet-shop-card">
              <div className="pet-shop-icon">
                {item.type === 'cat' ? '🐱' : item.type === 'dog' ? '🐶' : '🐔'}
              </div>
              <div className="pet-shop-name">{item.name}</div>
              <div className="pet-shop-desc">
                {item.type === 'cat' && '50💰/час (макс 10ч)'}
                {item.type === 'dog' && '+12ч к увяданию'}
                {item.type === 'chicken' && '1 яйцо / 2 часа'}
              </div>
              <div className="pet-shop-price">💰 {item.price}</div>
              {owned ? (
                <div className="pet-owned-badge">✅ Есть</div>
              ) : (
                <button
                  className="pet-buy-btn"
                  onClick={() => buy(item.type)}
                  disabled={buying}
                >
                  Приютить
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Pets;