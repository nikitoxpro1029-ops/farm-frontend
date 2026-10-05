import { useEffect, useState } from 'react';
import axios from 'axios';

import Pets from './Pets';
import Bonus from './Bonus';
import CropIcon from './CropIcon';
import CookingGame from './CookingGame';

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
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [subTab, setSubTab] = useState<'items' | 'craft' | 'pets' | 'bonus'>('items');
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

  // Открыть мини-игру
  const startCooking = (recipe: Recipe) => {
    if (!recipe.canCraft) return;
    setCookingRecipe(recipe);
  };

  // Мини-игра завершена — отправляем крафт с множителем
  const finishCooking = async (multiplier: number) => {
    if (!cookingRecipe) return;
    const recipeId = cookingRecipe.id;
    setCookingRecipe(null);
    setCrafting(recipeId);

    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/craft/craft',
        { recipeId, multiplier },
        { headers: { 'x-telegram-init-data': initData } }
      );

      let msg = '🍳 Готово: ' + res.data.resultName;
      if (res.data.bonus > 0) {
        msg += '\n💰 Бонус за точность: +' + res.data.bonus;
      }
      tg?.showAlert(msg);
      tg?.HapticFeedback?.notificationOccurred('success');
      load();
      onSell();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    } finally {
      setCrafting(null);
    }
  };

  const cancelCooking = () => {
    setCookingRecipe(null);
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
          className={subTab === 'craft' ? 'active' : ''}onClick={() => setSubTab('craft')}
        >
          🍳 Кухня
        </button>
        <button
          className={subTab === 'pets' ? 'active' : ''}
          onClick={() => setSubTab('pets')}
        >
          🐾 Питомцы
        </button>
        <button
          className={subTab === 'bonus' ? 'active' : ''}
          onClick={() => setSubTab('bonus')}
        >
          🎁 Бонус
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
                  Продать всё
                </button>
              </div>

              <div className="barn-grid">
                {items.map((item) => (
                  <div key={item.id} className={'barn-card ' + item.rarity}>
                    <div className="barn-icon">
                      <CropIcon name={item.name} size={56} />
                    </div>
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
          <p className="craft-hint">Останови маркер в зелёной зоне — получишь бонус 💰</p>
          <div className="craft-list">
            {recipes.map((recipe) => (
              <div key={recipe.id} className={'craft-card ' + recipe.resultRarity}>
                <div className="craft-result">
                  <div className="craft-icon">
                    <CropIcon name={recipe.resultName} size={56} />
                  </div>
                  <div className="craft-name">{recipe.resultName}</div>
                  <div className="craft-price">💰 {recipe.resultPrice}</div>
                </div>

                <div className="craft-ingredients">
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className={'craft-ing' + (ing.enough ? ' ok' : ' miss')}>
                      <span className="craft-ing-icon">
                        <CropIcon name={ing.name} size={28} />
                      </span>
                      <span className="craft-ing-name">{ing.name}</span>
                      <span className="craft-ing-count">
                        {ing.have}/{ing.needed}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="craft-btn"
                  onClick={() => startCooking(recipe)}
                  disabled={!recipe.canCraft || crafting === recipe.id}
                >
                  {crafting === recipe.id
                    ? 'Готовим...'
                    : recipe.canCraft
                    ? '🍳 Готовить'
                    : 'Не хватает'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {subTab === 'pets' && <Pets onUpdate={onSell} />}
      {subTab === 'bonus' && <Bonus onClaim={onSell} />}

      {cookingRecipe && (
        <CookingGame
          recipeName={cookingRecipe.resultName}
          resultName={cookingRecipe.resultName}
          resultPrice={cookingRecipe.resultPrice}
          onFinish={finishCooking}
          onCancel={cancelCooking}
        />
      )}
    </div>
  );
}

export default Barn;