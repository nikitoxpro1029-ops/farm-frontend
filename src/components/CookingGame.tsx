import { useEffect, useRef, useState } from 'react';

interface CookingGameProps {
  recipeName: string;
  resultName: string;
  resultPrice: number;
  onFinish: (multiplier: number) => void;
  onCancel: () => void;
}

type Zone = 'perfect' | 'good' | 'ok' | 'miss';

// Определяем зону по позиции маркера (0-100%)
function getZone(pos: number): Zone {
  if (pos >= 42 && pos <= 58) return 'perfect';
  if ((pos >= 30 && pos < 42) || (pos > 58 && pos <= 70)) return 'good';
  if ((pos >= 15 && pos < 30) || (pos > 70 && pos <= 85)) return 'ok';
  return 'miss';
}

const ZONE_MULTIPLIER: Record<Zone, number> = {
  perfect: 2.0,
  good: 1.5,
  ok: 1.0,
  miss: 0.5,
};

const ZONE_LABEL: Record<Zone, string> = {
  perfect: '🎯 ИДЕАЛЬНО!',
  good: '👍 Отлично!',
  ok: '🙂 Неплохо',
  miss: '😅 Промах',
};

function CookingGame({ recipeName, resultPrice, onFinish, onCancel }: CookingGameProps) {
  const [pos, setPos] = useState(50);
  const [result, setResult] = useState<Zone | null>(null);
  const dirRef = useRef(1);        // 1 = вправо, -1 = влево
  const posRef = useRef(50);
  const rafRef = useRef<number>(0);
  const doneRef = useRef(false);

  // Скорость: полный проход шкалы за ~1.2 секунды
  const SPEED = 100 / 1200;

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      if (!doneRef.current) {
        posRef.current += dirRef.current * SPEED * dt;
        if (posRef.current >= 100) { posRef.current = 100; dirRef.current = -1; }
        if (posRef.current <= 0)   { posRef.current = 0;   dirRef.current = 1; }
        setPos(posRef.current);
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const stop = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const zone = getZone(posRef.current);
    setResult(zone);
    if (navigator.vibrate) navigator.vibrate(zone === 'perfect' ? [50, 30, 50] : 50);

    setTimeout(() => onFinish(ZONE_MULTIPLIER[zone]), 1400);
  };

  const bonusText = () => {
    if (result === 'perfect') return '+' + resultPrice + '💰 бонус!';
if (result === 'good')    return '+' + Math.round(resultPrice * 0.5) + '💰 бонус!';
    if (result === 'ok')      return 'Без бонуса';
    return 'В следующий раз точнее!';
  };

  return (
    <div className="cooking-overlay">
      <div className="cooking-modal" onClick={() => { if (!result) stop(); }}>
        <div className="cooking-title">🍳 Готовим: {recipeName}</div>
        <div className="cooking-sub">
          {result ? 'Результат:' : 'Останови маркер в зелёной зоне!'}
        </div>

        <div className="cooking-bar">
          <div className="czone czone-miss"    style={{ left: 0,      width: '15%' }} />
          <div className="czone czone-ok"      style={{ left: '15%', width: '15%' }} />
          <div className="czone czone-good"    style={{ left: '30%', width: '12%' }} />
          <div className="czone czone-perfect" style={{ left: '42%', width: '16%' }} />
          <div className="czone czone-good"    style={{ left: '58%', width: '12%' }} />
          <div className="czone czone-ok"      style={{ left: '70%', width: '15%' }} />
          <div className="czone czone-miss"    style={{ left: '85%', width: '15%' }} />

          <div className="cmarker" style={{ left: pos + '%' }} />
        </div>

        {!result ? (
          <button className="cooking-stop-btn" onClick={(e) => { e.stopPropagation(); stop(); }}>
            СТОП!
          </button>
        ) : (
          <div className={'cooking-result cooking-result-' + result}>
            <div className="cooking-result-label">{ZONE_LABEL[result]}</div>
            <div className="cooking-result-bonus">{bonusText()}</div>
          </div>
        )}

        {!result && (
          <button className="cooking-cancel-btn" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
            Отмена
          </button>
        )}
      </div>
    </div>
  );
}
 export default CookingGame;