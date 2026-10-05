import { useEffect, useState } from 'react';
import axios from 'axios';
import CropIcon from './CropIcon';

const API_URL = import.meta.env.VITE_API_URL;

interface CatalogItem {
  id: number;
  name: string;
  rarity: string;
  sellPrice: number;
  description: string | null;
  discovered: boolean;
  timesCollected: number;
}

function Catalog() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [found, setFound] = useState(0);
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.get(API_URL + '/api/farm/catalog', {
        headers: { 'x-telegram-init-data': initData },
      });
      setItems(res.data.catalog);
      setTotal(res.data.total);
      setFound(res.data.found);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="empty">Загрузка...</p>;

  return (
    <div className="catalog">
      <h2>📖 Справочник</h2>

      <div className="catalog-progress">
        <div className="catalog-progress-bar">
          <div
            className="catalog-progress-fill"
            style={{ width: (found / total) * 100 + '%' }}
          />
        </div>
        <div className="catalog-progress-text">
          Открыто: <strong>{found}</strong> / {total}
        </div>
      </div>

      <div className="catalog-grid">
        {items.map((item) => (
          <div
            key={item.id}
            className={
              'catalog-card ' + item.rarity + (item.discovered ? '' : ' locked')
            }
            onClick={() => item.discovered && setSelected(item)}
          >
            <div className="catalog-icon">
              {item.discovered ? (
                <CropIcon name={item.name} size={44} />
              ) : (
                <span className="catalog-locked">?</span>
              )}
            </div>
            <div className="catalog-name">
              {item.discovered ? item.name : '???'}
            </div>
            {item.discovered && item.timesCollected > 0 && (
              <div className="catalog-count">×{item.timesCollected}</div>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div className="catalog-modal" onClick={() => setSelected(null)}>
          <div className={'catalog-modal-card ' + selected.rarity}>
            <div className="catalog-modal-icon">
              <CropIcon name={selected.name} size={90} />
            </div>
            <h3>{selected.name}</h3>
            <div className="catalog-modal-rarity">{selected.rarity}</div>
            <p className="catalog-modal-desc">
              {selected.description || 'Описание появится позже.'}
            </p>
            <div className="catalog-modal-stats">
              <span>💰 Цена: {selected.sellPrice}</span>
              <span>📦 Собрано: {selected.timesCollected}</span>
            </div>
            <button
              className="catalog-modal-btn"
              onClick={() => setSelected(null)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Catalog;