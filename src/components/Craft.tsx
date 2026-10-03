import { useEffect, useState } from 'react';
import axios from 'axios';
import { getSeedIcon } from '../seedIcons';

const API_URL = import.meta.env.VITE_API_URL;

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

interface CraftProps {
  onCraft: () => void;
}

function Craft({ onCraft }: CraftProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [crafting, setCrafting] = useState<number | null>(null);
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.get(API_URL + '/api/craft/recipes', {
        headers: { 'x-telegram-init-data': initData },
      });
      setRecipes(res.data.recipes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
      tg?.showAlert('Готово: ' + res.data.resultName);
      tg?.HapticFeedback?.notificationOccurred('success');
      load();
      onCraft();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    } finally {
      setCrafting(null);
    }
  };

  if (loading) return <p className="empty">Загрузка...</p>;

  return (
    <div className="craft">
      <h2>🔨 Крафт</h2>
      <p className="craft-hint">Соединяй урожай из Амбара в дорогие блюда</p>

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
    </div>
  );
}

export default Craft;