import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface TutorialState {
  step: number;
  skipped: boolean;
  completed: boolean;
  totalSteps: number;
  dialog: string | null;
}

interface TutorialOverlayProps {
  onAdvance: () => void;
  onComplete: () => void;
}

function TutorialOverlay({ onAdvance, onComplete }: TutorialOverlayProps) {
  const [state, setState] = useState<TutorialState | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const tg = (window as any).Telegram?.WebApp;

  const headers = { 'x-telegram-init-data': tg?.initData || '' };

  useEffect(() => {
    load();
  }, []);

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

  const advance = async () => {
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
        tg?.showAlert('🎉 Обучение пройдено! Дед Мазай доволен.');
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

  const skip = async () => {
    if (!state) return;
    try {
      await axios.post(API_URL + '/api/tutorial/skip', {}, { headers });
      onComplete();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !state) return null;
  if (state.skipped || state.completed) return null;
  if (!state.dialog) return null;

  const progressPercent = Math.round((state.step / state.totalSteps) * 100);

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal">
        <div className="tutorial-progress">
          <div className="tutorial-progress-fill" style={{ width: progressPercent + '%' }} />
        </div>

        <div className="tutorial-header">
          <div className="tutorial-avatar">👴</div>
          <div className="tutorial-name">Дед Мазай</div>
        </div>

        <div className="tutorial-dialog">{state.dialog}</div>

        <div className="tutorial-counter">
          Шаг {state.step} из {state.totalSteps}
        </div>

        <button
          className="tutorial-next-btn"
          onClick={advance}
          disabled={advancing}
        >
          {advancing ? '...' : state.step === state.totalSteps ? 'Завершить! 🎉' : 'Дальше →'}
        </button>

        <button className="tutorial-skip-btn" onClick={skip}>
          Я всё знаю, пропустить
        </button>
      </div>
    </div>
  );
}

export default TutorialOverlay;