const SOUNDS = {
  click: '/sounds/click.mp3',
  harvest: '/sounds/harvest.mp3',
  roulette: '/sounds/roulette-tick.mp3',
  win: '/sounds/win.mp3',
  water: '/sounds/water.mp3',
  error: '/sounds/error.mp3',
  coins: '/sounds/coins.mp3',
};

let musicAudio: HTMLAudioElement | null = null;
let musicEnabled = true;
let sfxEnabled = true;

try {
  const savedMusic = localStorage.getItem('music_enabled');
  const savedSfx = localStorage.getItem('sfx_enabled');
  if (savedMusic !== null) musicEnabled = savedMusic === 'true';
  if (savedSfx !== null) sfxEnabled = savedSfx === 'true';
} catch {}

export function playSound(name: keyof typeof SOUNDS, volume = 0.5) {
  if (!sfxEnabled) return;
  try {
    const audio = new Audio(SOUNDS[name]);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {}
}

export function startMusic() {
  if (!musicEnabled) return;
  if (musicAudio) return;
  try {
    musicAudio = new Audio('/sounds/music.mp3');
    musicAudio.loop = true;
    musicAudio.volume = 0.2;
    musicAudio.play().catch(() => {});
  } catch {}
}

export function stopMusic() {
  if (musicAudio) {
    musicAudio.pause();
    musicAudio.currentTime = 0;
    musicAudio = null;
  }
}

export function toggleMusic(): boolean {
  musicEnabled = !musicEnabled;
  try {
    localStorage.setItem('music_enabled', String(musicEnabled));
  } catch {}
  if (musicEnabled) startMusic();
  else stopMusic();
  return musicEnabled;
}

export function toggleSfx(): boolean {
  sfxEnabled = !sfxEnabled;
  try {
    localStorage.setItem('sfx_enabled', String(sfxEnabled));
  } catch {}
  return sfxEnabled;
}

export function isMusicEnabled() {
  return musicEnabled;
}

export function isSfxEnabled() {
  return sfxEnabled;
}export function playRouletteSpin(totalDuration = 4200) {
  if (!sfxEnabled) return;

  let elapsed = 0;
  let interval = 40; // стартовый интервал в мс — очень плотный
  const ticks: number[] = [];

  while (elapsed < totalDuration - 100) {
    ticks.push(elapsed);

    // После 40% времени — плавное замедление
    const progress = elapsed / totalDuration;
    if (progress > 0.4) {
      interval *= 1.13;
    } else {
      interval *= 1.03;
    }
    elapsed += interval;
  }

  // Финальный тик точно в момент остановки
  ticks.push(totalDuration);

  ticks.forEach((delay, index) => {
    setTimeout(() => {
      try {
        const audio = new Audio(SOUNDS.roulette);
        // Первые тики чуть громче, последние — тише (эффект удаления)
        const progress = index / ticks.length;
        audio.volume = 0.35 - progress * 0.15;
        audio.play().catch(() => {});
      } catch {}
    }, delay);
  });
}