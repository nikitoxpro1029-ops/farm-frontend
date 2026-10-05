import { useEffect, useState } from 'react';
import axios from 'axios';
import CropIcon from './CropIcon';
import { playSound } from '../Sounds';
const API_URL = import.meta.env.VITE_API_URL;

const CULTURES = ['Морковь', 'Картофель', 'Капуста', 'Огурец', 'Томат', 'Кукуруза', 'Клубника', 'Баклажан'];

interface Card {
  id: number;
  name: string;
}

interface MemoryGameProps {
  onFinish: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createDeck(): Card[] {
  const cards: Card[] = [];
  let id = 0;
  for (const name of CULTURES) {
    cards.push({ id: id++, name });
    cards.push({ id: id++, name });
  }
  return shuffleArray(cards);
}

function MemoryGame({ onFinish }: MemoryGameProps) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [reward, setReward] = useState(0);
  const [bonusSeed, setBonusSeed] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState<boolean | null>(null);
  const [nextPlayIn, setNextPlayIn] = useState(0);
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const initData = tg?.initData || '';
      const res = await axios.get(API_URL + '/api/memory/status', {
        headers: { 'x-telegram-init-data': initData },
      });
      setCanPlay(res.data.canPlay);
      setNextPlayIn(res.data.nextPlayIn);
    } catch (error) {
      console.error(error);
    }
  };

  const startGame = () => {
    setDeck(createDeck());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setPlaying(true);
    setFinished(false);
    setReward(0);
    setBonusSeed(null);
  };

  const tapCard = (index: number) => {
    if (!playing) return;
    if (flipped.includes(index)) return;
    if (matched.includes(index)) return;
    if (flipped.length >= 2) return;

    tg?.HapticFeedback?.impactOccurred('light');
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped;
      if (deck[a].name === deck[b].name) {
        setTimeout(() => {
          setMatched((prev) => [...prev, a, b]);
          setFlipped([]);
          tg?.HapticFeedback?.impactOccurred('medium');
        }, 400);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  useEffect(() => {
    if (!playing) return;
    if (matched.length === 16) {
      finishGame();
    }
  }, [matched]);

  const finishGame = async () => {
    setPlaying(false);
    setFinished(true);
    try {
      const initData = tg?.initData || '';
      const res = await axios.post(
        API_URL + '/api/memory/finish',
        { moves },
        { headers: { 'x-telegram-init-data': initData } }
      );
      setReward(res.data.reward);
      setBonusSeed(res.data.bonusSeed);
      playSound('win');tg?.HapticFeedback?.notificationOccurred('success');
      onFinish();
    } catch (error: any) {
      tg?.showAlert(error.response?.data?.error || 'Ошибка');
    }
  };

  const formatNextPlay = (ms: number) => {
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hours > 0) {
    return hours + 'ч ' + mins + 'м';
  }
  if (mins > 0) {
    return mins + 'м ' + secs + 'с';
  }
  return secs + 'с';
};

  if (canPlay === null) return <p className="empty">Загрузка...</p>;

  if (!playing && !finished && !canPlay) {
    return (
      <div className="memorygame">
        <h2>🧠 Найди пару</h2>
        <p className="empty">Следующая игра через {formatNextPlay(nextPlayIn)}</p>
      </div>
    );
  }

  if (!playing && !finished && canPlay) {
    return (
      <div className="memorygame">
        <h2>🧠 Найди пару</h2>
        <p className="minigame-hint">Открывай карточки и находи пары культур.<br />
          Чем меньше ходов — тем больше награда!
        </p>
        <div className="minigame-start">
          <button className="minigame-btn" onClick={startGame}>Начать</button>
        </div>
      </div>
    );
  }

  if (playing) {
    return (
      <div className="memorygame">
        <div className="minigame-header">
          <span>Ходов: {moves}</span>
          <span>Найдено: {matched.length / 2}/8</span>
        </div>
        <div className="memory-grid">
          {deck.map((card, i) => {
            const isOpen = flipped.includes(i) || matched.includes(i);
            return (
              <button
                key={card.id}
                className={'memory-card' + (isOpen ? ' open' : '')}
                onClick={() => tapCard(i)}
              >
                {isOpen ? <CropIcon name={card.name} size={38} /> : <span className="memory-back">?</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="memorygame">
      <h2>🎉 Победа!</h2>
      <div className="minigame-result">
        <div className="minigame-score">Ходов: <strong>{moves}</strong></div>
        <div className="minigame-reward">Награда: <strong>+{reward}💰</strong></div>
        {bonusSeed && (
          <div className="minigame-bonus">🌟 Бонус: семя «{bonusSeed}»</div>
        )}
        <button className="minigame-btn" onClick={() => window.location.reload()}>
          Понятно
        </button>
      </div>
    </div>
  );
}

export default MemoryGame;