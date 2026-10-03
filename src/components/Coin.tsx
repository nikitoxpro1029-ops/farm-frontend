interface CoinProps {
  size?: number;
}

function Coin({ size = 20 }: CoinProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <radialGradient id="coinGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff5b0" />
          <stop offset="40%" stopColor="#ffd700" />
          <stop offset="70%" stopColor="#f0b400" />
          <stop offset="100%" stopColor="#b8860b" />
        </radialGradient>
        <radialGradient id="coinShine" cx="30%" cy="25%" r="40%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="#a67c00" />
      <circle cx="16" cy="16" r="13.5" fill="url(#coinGrad)" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="#b8860b" strokeWidth="0.8" opacity="0.6" />
      <ellipse cx="11" cy="11" rx="5" ry="3.5" fill="url(#coinShine)" />
    </svg>
  );
}

export default Coin;