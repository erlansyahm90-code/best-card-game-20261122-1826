// Four Winds Duel — render.js
// Semua yang terlihat di layar: meja, kartu, HUD, banner niat Raka,
// angka damage melayang, dan keempat layar (title, meja, menang, kalah).
// Render murni dari state — tidak ada logika permainan di sini.

import { ELEMENTS } from './config.js';

// Ikon elemen sebagai SVG path — bentuk + warna, bukan teks. Setiap path
// digambar dengan currentColor sehingga warna elemen mengalir dari CSS.
const ICON_PATHS = {
  flame:
    'M12 2 C14 5 17 7 17 11 A5 5 0 0 1 7 11 C7 9 8 8 9 7 C9 9 10 9.5 10 8 C10 5 11 3 12 2 Z',
  drop: 'M12 2 C12 2 6 10 6 14 A6 6 0 0 0 18 14 C18 10 12 2 12 2 Z',
  leaf: 'M20 4 C10 4 4 10 4 20 C14 20 20 14 20 4 Z M5.5 18.5 C9 13 13 9.5 18.5 5.5',
  star:
    'M12 2 L14.7 8.6 L21.5 9 L16.5 13.4 L18.2 20 L12 16.6 L5.8 20 L7.5 13.4 L2.5 9 L9.3 8.6 Z',
};

export function iconSvg(elementId, size = 24) {
  const el = ELEMENTS[elementId];
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON_PATHS[el.icon]}" fill="currentColor"/></svg>`;
}

export function elementName(elementId) {
  return ELEMENTS[elementId].name;
}

function kindLabel(card) {
  if (card.kind === 'serang') return 'SERANG';
  if (card.kind === 'perisai') return 'PERISAI';
  return 'TRIK';
}

function effectText(card) {
  if (card.kind === 'serang') return `Damage ${card.value} ke Raka`;
  if (card.kind === 'perisai') return `Perisai +${card.value} untukmu`;
  if (card.effect === 'draw') return `Tarik ${card.value} kartu`;
  if (card.effect === 'heal') return `Pulihkan ${card.value} HP`;
  if (card.effect === 'steal') return `Curi ${card.value} ember Raka`;
  if (card.effect === 'double') return 'Serangan berikut ×2';
  return '';
}

// Satu kartu menghadap ke atas. Nilai + cost besar dan tebal supaya terbaca
// saat screenshot dikecilkan ke 768×480.
export function cardHtml(card, opts = {}) {
  const el = ELEMENTS[card.element];
  const playable = opts.playable === true;
  const dimmed = opts.dimmed === true;
  return `<div class="card el-${card.element} kind-${card.kind}${playable ? ' playable' : ''}${dimmed ? ' dimmed' : ''}" data-uid="${card.uid}" style="--el:${el.color};--eld:${el.dark};--elg:${el.glow}">
    <div class="card-cost" title="Biaya ember">${card.cost}</div>
    <div class="card-icon">${iconSvg(card.element, 44)}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-kind">${kindLabel(card)} · ${el.name}</div>
    <div class="card-value">${card.kind === 'trik' ? '✦' : card.value}</div>
    <div class="card-effect">${effectText(card)}</div>
    ${opts.keyHint ? `<div class="card-key">${opts.keyHint}</div>` : ''}
  </div>`;
}

// Kartu lawan menghadap ke bawah: punggung kartu dengan pusaran angin.
export function cardBackHtml() {
  return `<div class="card back"><div class="back-swirl">🌀</div><div class="back-mark">FW</div></div>`;
}

function emberPips(current, max) {
  let pips = '';
  for (let i = 1; i <= 10; i += 1) {
    const filled = i <= current;
    const unlocked = i <= max;
    pips += `<span class="pip${filled ? ' on' : ''}${unlocked ? '' : ' locked'}">●</span>`;
  }
  return pips;
}

function hpBarHtml(hp, maxHp) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const low = pct <= 33 ? ' low' : '';
  return `<div class="hpbar${low}"><div class="hpfill" style="width:${pct}%"></div><span class="hptext">${hp} / ${maxHp}</span></div>`;
}

// ---- Render meja dari state ---------------------------------------------

export function renderTable(state) {
  const $ = (id) => document.getElementById(id);
  const p = state.player;
  const f = state.foe;

  // Lawan (atas)
  $('foe-name').textContent = 'Raka, Penjaga Angin';
  $('foe-mode').textContent = `Mode: ${f.mode.name} — ${f.mode.tagline}`;
  $('foe-hp').innerHTML = hpBarHtml(f.hp, state.maxHp);
  $('foe-shield').textContent = f.shield > 0 ? `🛡 ${f.shield}` : '';
  $('foe-ember').innerHTML = emberPips(f.ember, f.maxEmber);
  $('foe-deck').textContent = `Deck ${f.deck.length}`;
  $('foe-hand').innerHTML = f.hand.map(() => cardBackHtml()).join('');

  // Kartu terakhir yang dimainkan lawan — selalu terlihat menghadap ke atas.
  const lastFoe = f.played[f.played.length - 1];
  $('foe-played').innerHTML = lastFoe
    ? `<div class="played-label">Kartu terakhir Raka</div>${cardHtml(lastFoe)}`
    : '<div class="played-label">Raka belum memainkan kartu</div>';

  // Pemain (bawah)
  $('player-hp').innerHTML = hpBarHtml(p.hp, state.maxHp);
  $('player-shield').textContent = p.shield > 0 ? `🛡 ${p.shield}` : '';
  $('player-ember').innerHTML = emberPips(p.ember, p.maxEmber);
  $('player-deck').textContent = `Deck ${p.deck.length}`;
  $('turn-badge').textContent =
    state.turnSide === 'player'
      ? `Giliran ${state.turn} · GILIRANMU — mainkan kartu lalu akhiri giliran`
      : `Giliran ${state.turn} · Raka sedang bermain…`;
  $('end-turn').disabled = state.turnSide !== 'player' || state.screen !== 'table';

  const handEl = $('player-hand');
  handEl.innerHTML = p.hand
    .map((card, i) =>
      cardHtml(card, {
        playable: state.turnSide === 'player' && card.cost <= p.ember,
        keyHint: String(i + 1),
      }),
    )
    .join('');

  // Log giliran — 5 baris terakhir.
  $('log-list').innerHTML = state.log
    .slice(-5)
    .map((line) => `<li>${line}</li>`)
    .join('');

  // Indikator Resonansi aktif + Ganda Angin.
  $('resonance').textContent = p.doubleNext
    ? '✦ GANDA ANGIN AKTIF — serangan berikut ×2'
    : p.playedThisTurn.length > 0
      ? `Resonansi: ${elementName(p.playedThisTurn[p.playedThisTurn.length - 1].element)} — kartu selemen +2`
      : 'Resonansi: mainkan 2 kartu selemen dalam satu giliran (+2)';
}

// ---- Banner niat Raka ----------------------------------------------------

export function showIntent(text, hint) {
  const banner = document.getElementById('intent-banner');
  banner.querySelector('.intent-text').textContent = text;
  document.getElementById('intent-hint').textContent = hint;
  banner.classList.add('show');
}

export function hideIntent() {
  document.getElementById('intent-banner').classList.remove('show');
}

// ---- Efek: angka melayang + getar layar + kilat Resonansi -----------------

export function floatText(text, kind, target) {
  const layer = document.getElementById('float-layer');
  const span = document.createElement('div');
  span.className = `float-text ${kind}`;
  span.textContent = text;
  const rect = target === 'foe' ? { x: 640, y: 150 } : { x: 640, y: 470 };
  span.style.left = `${rect.x}px`;
  span.style.top = `${rect.y}px`;
  layer.appendChild(span);
  window.setTimeout(() => span.remove(), 1400);
}

export function shakeStage() {
  const stage = document.getElementById('stage');
  stage.classList.remove('shake');
  void stage.offsetWidth; // restart animasi
  stage.classList.add('shake');
}

export function resonanceFlash() {
  const el = document.getElementById('resonance-flash');
  el.classList.remove('go');
  void el.offsetWidth;
  el.classList.add('go');
}

// ---- Layar: title / menang / kalah ----------------------------------------

export function showScreen(name) {
  for (const id of ['screen-title', 'screen-win', 'screen-loss']) {
    document.getElementById(id).classList.toggle('hidden', id !== `screen-${name}`);
  }
  document.getElementById('table').classList.toggle('dimmed-table', name !== 'table');
}

export function renderWinStats(state) {
  const s = state.stats;
  document.getElementById('win-stats').innerHTML =
    `<div class="stat"><b>${s.turns}</b><span>giliran</span></div>` +
    `<div class="stat"><b>${s.damageDealt}</b><span>damage diberikan</span></div>` +
    `<div class="stat"><b>${s.cardsPlayed}</b><span>kartu dimainkan</span></div>` +
    `<div class="stat"><b>${state.player.hp}</b><span>HP tersisa</span></div>`;
}

export function renderLossStats(state) {
  const s = state.stats;
  document.getElementById('loss-stats').innerHTML =
    `<div class="stat"><b>${s.turns}</b><span>giliran bertahan</span></div>` +
    `<div class="stat"><b>${s.damageDealt}</b><span>damage diberikan</span></div>` +
    `<div class="stat"><b>${state.foe.hp}</b><span>HP Raka tersisa</span></div>`;
}
