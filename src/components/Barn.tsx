import { useEffect, useState } from 'react';
import axios from 'axios';
import { getSeedIcon } from '../seedIcons';
import Pets from './Pets';

const API_URL = import.meta.env.VITE_API_URL;

interface BarnItem {
  id: number;
  seed_type_id: number;
  name: string;
  rarity: string;
  sell_price: number;
  quantity: number;
}

interface Ingredient {
  name: string;
  seedTypeId: number;
  needed: number;
  have: number;
  enough: boolean;
}

interface Recipe {
  id: number;
  name: string;
  resultName: string;
  resultRarity: string;
  resultPrice: number;
  ingredients: Ingredient[];
  canCraft: boolean;
}

interface BarnProps {
  onSell: () => void;
}

function Barn({ onSell }: BarnProps) {
  const [items, setItems] = useState<BarnItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [crafting, setCrafting] = useState<number | null>(null);
  const [subTab, setSubTab] = useState<'items' | 'craft' | 'pets'>('items');
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const initData = tg?.initData || '';
      const headers = { 'x-telegram-init-data': initData };

      const [barnRes, recipesRes] = await Promise.all([
        axios.get(API_URL + '/api/farm/barn', { headers }),
        axios.get(API_URL + '/api/craft/recipes', { headers }),
      ]);

      setItems(barnRes.data.items);
      setRecipes(recipesRes.data.recipes);
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

  const craft = async (recipeId: number) => {
    setCrafting(recipeId);
    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/craft/craft',
        { recipeId },
        { headers: { 'x-telegram-init-data': initData } }
      );
      tg?.showAlert('🎉 Готово: ' + res.data.resultName);
      tg?.HapticFeedback?.notificationOccurred('success');
      load();
      onSell();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    } finally {
      setCrafting(null);
    }
  };

  if (loading) return <p className="empty">Загрузка...</p>;

  const totalValue = items.reduce((sum, item) => sum + item.sell_price * item.quantity, 0);

  return (
    <div className="barn">
      <h2>🏚 Амбар</h2>

      <div className="subtabs">
        <button
          className={subTab === 'items' ? 'active' : ''}
          onClick={() => setSubTab('items')}
        >
          Урожай
        </button>
        <button
          className={subTab === 'craft' ? 'active' : ''}
          onClick={() => setSubTab('craft')}
        >
          🔨 Крафт
        </button>
        <button
          className={subTab === 'pets' ? 'active' : ''}
          onClick={() => setSubTab('pets')}
        >
          🐾 Питомцы
        </button>
      </div>

      {subTab === 'items' && (
        <>
          {items.length === 0 ? (
            <p className="empty">Амбар пуст. Соберите урожай!</p>
          ) : (
            <>
              <div className="barn-header">
                <span>Всего: <strong>{totalValue}💰</strong></span>
                <button className="sell-all-btn" onClick={sellAll}>
                  Продать всё</button>
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
        </>
      )}

      {subTab === 'craft' && (
        <>
          <p className="craft-hint">Соединяй урожай в дорогие блюда</p>
          <div className="craft-list">
            {recipes.map((recipe) => (
              <div key={recipe.id} className={'craft-card ' + recipe.resultRarity}>
                <div className="craft-result">
                  <div className="craft-icon">{getSeedIcon(recipe.resultName)}</div>
                  <div className="craft-name">{recipe.resultName}</div>
                  <div className="craft-price">💰 {recipe.resultPrice}</div>
                </div>

                <div className="craft-ingredients">
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className={'craft-ing' + (ing.enough ? ' ok' : ' miss')}>
                      <span className="craft-ing-icon">{getSeedIcon(ing.name)}</span>
                      <span className="craft-ing-name">{ing.name}</span>
                      <span className="craft-ing-count">
                        {ing.have}/{ing.needed}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="craft-btn"
                  onClick={() => craft(recipe.id)}
                  disabled={!recipe.canCraft || crafting === recipe.id}
                >
                  {crafting === recipe.id ? 'Готовим...' : recipe.canCraft ? 'Скрафтить' : 'Не хватает'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {subTab === 'pets' && <Pets onUpdate={onSell} />}
    </div>
  );
}

export default Barn;