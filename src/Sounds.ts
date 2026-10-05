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
}

// ============ РУЛЕТКА CS:GO СТИЛЬ ============
let audioCtx: AudioContext | null = null;
let tickBuffer: AudioBuffer | null = null;
let tickLoading = false;

async function loadTickBuffer() {
  if (tickBuffer || tickLoading) return;
  tickLoading = true;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const response = await fetch(SOUNDS.roulette);
    const arrayBuffer = await response.arrayBuffer();
    tickBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (e) {
    console.error('Failed to load tick buffer', e);
  } finally {
    tickLoading = false;
  }
}

export function playRouletteSpin(totalDuration = 4200) {
  if (!sfxEnabled) return;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (!tickBuffer) {
    loadTickBuffer().then(() => playRouletteSpin(totalDuration));
    return;
  }

  // Генерируем серию задержек с ускорением → замедлением
  const delays: number[] = [];
  let elapsed = 0;
  let interval = 50;

  while (elapsed < totalDuration - 200) {
    delays.push(elapsed);
    const progress = elapsed / totalDuration;
    interval *= progress > 0.35 ? 1.16 : 1.04;
    elapsed += interval;
  }
  delays.push(totalDuration - 100);

  // Планируем все тики через AudioContext (точно и без лагов)
  const startTime = audioCtx.currentTime;
  delays.forEach((delay, index) => {
    const progress = index / delays.length;
    const volume = 0.4 - progress * 0.2;
    const when = startTime + delay / 1000;

    try {
      const source = audioCtx!.createBufferSource();
      source.buffer = tickBuffer!;
      const gain = audioCtx!.createGain();
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(audioCtx!.destination);
      source.start(when);
    } catch (e) {}
  });
}