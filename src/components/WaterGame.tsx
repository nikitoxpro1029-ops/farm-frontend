import { useEffect, useRef, useState } from 'react';
import { playSound } from '../Sounds';
interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface WaterGameProps {
  onFinish: (score: number) => void;
  onCancel: () => void;
}

const GAME_DURATION = 5;
const MAX_BUBBLES = 40;

function WaterGame({ onFinish, onCancel }: WaterGameProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [finished, setFinished] = useState(false);
  const nextIdRef = useRef(0);
  const scoreRef = useRef(0);
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setBubbles((prev) => {
        if (prev.length >= MAX_BUBBLES) return prev;
        const newBubble: Bubble = {
          id: nextIdRef.current++,
          x: 5 + Math.random() * 80,
          y: 20 + Math.random() * 55,
          size: 50 + Math.random() * 20,
        };
        return [...prev, newBubble];
      });
    }, 250);

    const removeInterval = setInterval(() => {
      setBubbles((prev) => {
        if (prev.length === 0) return prev;
        return prev.slice(1);
      });
    }, 700);

    const timerInterval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerInterval);
          clearInterval(spawnInterval);
          clearInterval(removeInterval);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(removeInterval);
      clearInterval(timerInterval);
    };
  }, []);

  useEffect(() => {
    if (finished) {
      tg?.HapticFeedback?.notificationOccurred('success');
      setTimeout(() => {
        onFinish(scoreRef.current);
      }, 1200);
    }
  }, [finished]);

  const tap = (id: number) => {
  if (finished) return;
  playSound('click', 0.3);
  setBubbles((prev) => prev.filter((b) => b.id !== id));
  setScore((s) => s + 1);
  tg?.HapticFeedback?.impactOccurred('light');
};

  return (
    <div className="water-game-overlay">
      <div className="water-game">
        <div className="water-game-header">
          <span className="water-game-timer">⏱️ {timeLeft}с</span>
          <span className="water-game-score">💧 {score}</span>
        </div>

        <div className="water-game-area">
          {bubbles.map((b) => (
            <button
              key={b.id}
              className="water-bubble"
              style={{
                left: b.x + '%',
                top: b.y + '%',
                width: b.size,
                height: b.size,
              }}
              onPointerDown={() => tap(b.id)}
            >
              💧
            </button>
          ))}

          {finished && (
            <div className="water-game-finished">
              <div className="water-game-result">
                <div className="water-game-emoji">
                  {score >= 15 ? '🌟' : score >= 10 ? '✨' : score >= 5 ? '👍' : '😅'}
                </div>
                <div className="water-game-caption">
                  {score >= 15 ? 'Идеально!' : score >= 10 ? 'Отлично!' : score >= 5 ? 'Хорошо!' : 'Неплохо'}
                </div>
                <div className="water-game-score-final">
                  Поймано капель: <strong>{score}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {!finished && (
          <button className="water-game-cancel" onClick={onCancel}>Отмена</button>
        )}
      </div>
    </div>
  );
}

export default WaterGame;