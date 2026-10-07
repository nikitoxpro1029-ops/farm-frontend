import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface TutorialState {
  step: number;
  skipped: boolean;
  completed: boolean;
  totalSteps: number;
  dialog: string | null;
  mode: 'manual' | 'action';
}

interface TutorialOverlayProps {
  onAdvance: () => void;
  onComplete: () => void;
  activeTab: string;
}

function TutorialOverlay({ onAdvance, onComplete, activeTab }: TutorialOverlayProps) {
  const [state, setState] = useState<TutorialState | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const tg = (window as any).Telegram?.WebApp;

  const headers = { 'x-telegram-init-data': tg?.initData || '' };

  useEffect(() => {
    load();
  }, []);

  // Polling: пока показывается шаг с action — каждые 2 сек проверяем,
  // не продвинулся ли туториал (игрок выполнил действие).
  useEffect(() => {
    if (!state || state.skipped || state.completed) return;
    if (state.mode !== 'action') return;

    const id = setInterval(async () => {
      try {
        const res = await axios.get(API_URL + '/api/tutorial', { headers });
        if (res.data.step !== state.step) {
          setState(res.data);
          tg?.HapticFeedback?.impactOccurred('light');
          if (res.data.completed) {
            tg?.showAlert('🎉 Обучение пройдено! Дракоша доволен.');
            onComplete();
          } else {
            onAdvance();
          }
        }
      } catch (e) {
        // тихо
      }
    }, 2000);

    return () => clearInterval(id);
  }, [state]);

  const load = async () => {
    try {
      const res = await axios.get(API_URL + '/api/tutorial', { headers });
      setState(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Для manual-шагов — просто продвигаем через API
  const advanceManual = async () => {
    if (!state || advancing) return;
    setAdvancing(true);
    try {
      const res = await axios.post(
        API_URL + '/api/tutorial/advance',
        { expectedStep: state.step },
        { headers }
      );
      tg?.HapticFeedback?.impactOccurred('light');
      if (res.data.completed) {
        tg?.showAlert('🎉 Обучение пройдено! Дракоша доволен.');
        onComplete();
      } else {
        setState(res.data);
        onAdvance();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdvancing(false);
    }
  };

  // Для action-шагов — просто скрываемся, игрок идёт делать.
  const collapse = () => {
    setCollapsed(true);
    tg?.HapticFeedback?.impactOccurred('light');
  };

  if (loading || !state) return null;
  if (state.skipped || state.completed) return null;
  if (!state.dialog) return null; 

 // Автосворачивание: пока игрок на вкладке Паки и шаг — action,
  // не разворачиваем модалку, чтобы не перебивать рулетку.
  const shouldAutoCollapse = state.mode === 'action' && activeTab === 'packs';

  if (collapsed || shouldAutoCollapse) {
    return (
      <div className="tutorial-mini" onClick={() => setCollapsed(false)}>
        🐉 Подсказка Деда
      </div>
    );
  }
  

  const progressPercent = Math.round((state.step / state.totalSteps) * 100);
  const isAction = state.mode === 'action';

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal">
        <div className="tutorial-progress">
          <div className="tutorial-progress-fill" style={{ width: progressPercent + '%' }} />
        </div>

        <div className="tutorial-header">
          <div className="tutorial-avatar">👴</div>
          <div className="tutorial-name">Дракоша</div>
        </div>

        <div className="tutorial-dialog">{state.dialog}</div>

        <div className="tutorial-counter">
          Шаг {state.step} из {state.totalSteps}
        </div>

        {isAction ? (
          <button className="tutorial-next-btn" onClick={collapse}>
            Понятно, делаю! 👍
          </button>
        ) : (
          <button
            className="tutorial-next-btn"
            onClick={advanceManual}
            disabled={advancing}
          >
            {advancing ? '...' : state.step === state.totalSteps ? 'Завершить! 🎉' : 'Дальше →'}
          </button>
        )}
      </div>
    </div>
  );
}

export default TutorialOverlay;