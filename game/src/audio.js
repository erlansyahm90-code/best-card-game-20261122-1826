// Four Winds Duel — audio.js
// Semua bunyi disintesis dengan WebAudio (oscillator + noise) — tanpa file
// audio, tanpa request network. Tombol M atau tombol bisu mematikan semuanya.

let ctx = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
  if (muted) return;
  const audio = ensureCtx();
  if (!audio) return;
  const t0 = audio.currentTime + when;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol = 0.08, when = 0) {
  if (muted) return;
  const audio = ensureCtx();
  if (!audio) return;
  const t0 = audio.currentTime + when;
  const len = Math.floor(audio.sampleRate * dur);
  const buffer = audio.createBuffer(1, len, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const gain = audio.createGain();
  gain.gain.value = vol;
  src.connect(gain).connect(audio.destination);
  src.start(t0);
}

export const sfx = {
  // Kartu dibagikan: gesekan lembut.
  deal() {
    noiseBurst(0.12, 0.05);
    tone(520, 0.08, 'triangle', 0.05, 0.02);
  },
  // Kartu dimainkan: ketukan + nada elemen.
  play(element) {
    const base = { api: 220, air: 330, daun: 262, bintang: 392 }[element] ?? 300;
    tone(base, 0.12, 'triangle', 0.1);
    tone(base * 1.5, 0.16, 'sine', 0.08, 0.05);
  },
  // Serangan kena: dentuman turun + noise.
  hit() {
    tone(180, 0.25, 'sawtooth', 0.12, 0, 60);
    noiseBurst(0.18, 0.1);
  },
  // Perisai: dengung pelindung.
  shield() {
    tone(440, 0.2, 'sine', 0.08, 0, 660);
    tone(660, 0.25, 'sine', 0.05, 0.08);
  },
  // Resonansi: arpeggio naik dua nada.
  resonance() {
    tone(523, 0.12, 'triangle', 0.1);
    tone(659, 0.12, 'triangle', 0.1, 0.09);
    tone(784, 0.2, 'triangle', 0.1, 0.18);
  },
  // Giliran berakhir: ketukan kayu.
  endTurn() {
    tone(196, 0.1, 'square', 0.06);
    tone(147, 0.14, 'square', 0.05, 0.08);
  },
  // Menang: fanfare empat nada naik.
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.11, i * 0.12));
  },
  // Kalah: dua nada turun.
  lose() {
    tone(392, 0.3, 'sine', 0.1);
    tone(262, 0.5, 'sine', 0.1, 0.25);
  },
};
