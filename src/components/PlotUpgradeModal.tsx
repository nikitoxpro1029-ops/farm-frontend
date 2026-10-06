import { useState } from 'react';

interface PlotUpgradeModalProps {
  plotIndex: number;
  currentLevel: number;
  currentBonuses: { time: number; income: number };
  nextBonuses: { time: number; income: number };
  cost: { coins: number; crystals: number };
  balance: number;
  crystals: number;
  onUpgrade: (plotIndex: number) => Promise<void>;
  onClose: () => void;
}

function PlotUpgradeModal({
  plotIndex, currentLevel, currentBonuses, nextBonuses,
  cost, balance, crystals, onUpgrade, onClose,
}: PlotUpgradeModalProps) {
  const [upgrading, setUpgrading] = useState(false);
  const isMax = currentLevel >= 30;
  const canAfford = balance >= cost.coins && crystals >= cost.crystals;

  const handleUpgrade = async () => {
    if (isMax || !canAfford) return;
    setUpgrading(true);
    try {
      await onUpgrade(plotIndex);
      onClose();
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="upgrade-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upgrade-title">⬆️ Улучшение грядки #{plotIndex + 1}</div>

        <div className="upgrade-levels">
          <span className="upgrade-current">Ур. {currentLevel}</span>
          {!isMax && <span className="upgrade-arrow">→</span>}
          {!isMax && <span className="upgrade-next">Ур. {currentLevel + 1}</span>}
        </div>

        <div className="upgrade-bonuses">
          <div className="upgrade-row">
            <span>⏱️ Время роста</span>
            <span>
              −{currentBonuses.time}%
              {!isMax && <strong> → −{nextBonuses.time}%</strong>}
            </span>
          </div>
          <div className="upgrade-row">
            <span>💰 Доход</span>
            <span>
              +{currentBonuses.income}%
              {!isMax && <strong> → +{nextBonuses.income}%</strong>}
            </span>
          </div>
        </div>

        {isMax ? (
          <div className="upgrade-max">🏆 Максимальный уровень!</div>
        ) : (
          <>
            <div className="upgrade-cost">
              Стоимость: <strong>{cost.coins}💰</strong>
              {cost.crystals > 0 && <> + <strong>{cost.crystals}💎</strong></>}
            </div>
            <button
              className="upgrade-confirm-btn"
              onClick={handleUpgrade}
              disabled={upgrading || !canAfford}
            >
              {upgrading ? 'Улучшаем...' : canAfford ? 'Улучшить' : 'Не хватает ресурсов'}
            </button>
          </>
        )}

        <button className="upgrade-cancel-btn" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
}

export default PlotUpgradeModal;