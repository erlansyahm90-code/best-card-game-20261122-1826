// Four Winds Duel — ai.js
// Otak Raka, Penjaga Angin. Raka bukan kotak hitam: setiap giliran ia
// mengumumkan NIATNYA lewat banner sebelum bertindak, dalam satu dari tiga
// mode bernama — jadi pemain bisa membaca dan melawannya dengan elemen
// atau perisai yang tepat. Mode dipilih dari kondisi meja yang terlihat.

import { ELEMENT_WHEEL, GAME } from './config.js';
import { hasAdvantage, resonanceBonus } from './rules.js';

// Tiga mode Raka. Nama mode tampil di badge meja lawan dan di banner niat.
export const MODES = {
  agresif: {
    id: 'agresif',
    name: 'Agresif',
    tagline: 'menyerang tanpa ampun',
  },
  bertahan: {
    id: 'bertahan',
    name: 'Bertahan',
    tagline: 'berlindung di balik perisai',
  },
  perangkai: {
    id: 'perangkai',
    name: 'Perangkai',
    tagline: 'merangkai kombo elemen',
  },
};

// Pilih mode dari kondisi meja — aturan yang bisa ditebak pemain:
// HP kritis → bertahan; dua kartu selemen murah di tangan → merangkai kombo;
// pemain hampir kalah → habisi.
export function chooseMode(state) {
  const foe = state.foe;
  const player = state.player;
  const attacks = foe.hand.filter((c) => c.kind === 'serang');
  const lethal = attacks.some((c) => c.cost <= foe.ember && c.value >= player.hp);
  if (lethal || player.hp <= 8) return MODES.agresif;
  if (foe.hp <= 10) return MODES.bertahan;
  const affordable = foe.hand.filter((c) => c.cost <= foe.ember);
  const byElement = {};
  for (const card of affordable) {
    byElement[card.element] = (byElement[card.element] ?? 0) + 1;
  }
  const hasPair = Object.values(byElement).some((n) => n >= 2);
  if (hasPair) return MODES.perangkai;
  return MODES.agresif;
}

// Skor satu kartu di tangan Raka, menurut mode yang sedang aktif.
// Skor tinggi = lebih dulu dimainkan.
function scoreCard(state, card, mode) {
  const foe = state.foe;
  let score = card.value;
  if (card.kind === 'serang') {
    score += 4;
    if (hasAdvantage(card.element, state.player.lastElement)) score += 3;
    if (mode.id === 'agresif') score += 3;
    if (mode.id === 'bertahan') score -= 2;
  } else if (card.kind === 'perisai') {
    score += foe.hp <= 12 ? 5 : 1;
    if (mode.id === 'bertahan') score += 4;
    if (mode.id === 'agresif') score -= 1;
  } else if (card.kind === 'trik') {
    if (card.effect === 'heal') score += foe.hp <= 18 ? 6 : 1;
    if (card.effect === 'draw') score += foe.hand.length <= 2 ? 5 : 1;
    if (card.effect === 'steal') score += state.player.ember >= 4 ? 4 : 1;
    if (card.effect === 'double') {
      const bigAttack = foe.hand.some(
        (c) => c.kind === 'serang' && c.cost + card.cost <= foe.ember,
      );
      score += bigAttack ? 6 : 1;
    }
    if (mode.id === 'perangkai') score += 1;
  }
  // Resonansi: kartu selemen dengan yang sudah dimainkan giliran ini naik.
  score += resonanceBonus(card, foe.playedThisTurn);
  // Kartu murah lebih luwes dimainkan berurutan.
  score -= card.cost * 0.4;
  return score;
}

// Rencana giliran Raka: urutan UID kartu yang akan ia mainkan, berdasarkan
// ember yang ia punya saat ini. Rencana dibuat SEKALI, lalu dijalankan
// kartu demi kartu supaya banner niatnya jujur.
export function planTurn(state, mode) {
  const foe = state.foe;
  let ember = foe.ember;
  const plan = [];
  const pool = [...foe.hand];
  const playedSim = [];
  while (pool.length > 0) {
    const affordable = pool.filter((c) => c.cost <= ember);
    if (affordable.length === 0) break;
    // Perangkai: dahulukan pasangan selemen supaya Resonansi menyala.
    let pick = affordable[0];
    if (mode.id === 'perangkai') {
      const pair = affordable.find(
        (c) => playedSim.length > 0 && c.element === playedSim[playedSim.length - 1].element,
      );
      if (pair) pick = pair;
    }
    if (!pick || (mode.id !== 'perangkai' && playedSim.length === 0)) {
      pick = affordable.reduce((best, c) =>
        scoreCard(state, c, mode) > scoreCard(state, best, mode) ? c : best,
      );
    }
    // Raka berhenti setelah 3 kartu — gilirannya tetap cepat dan terbaca.
    if (plan.length >= 3) break;
    plan.push(pick.uid);
    playedSim.push(pick);
    ember -= pick.cost;
    pool.splice(pool.indexOf(pick), 1);
  }
  return plan;
}

// Kalimat niat yang tampil di banner SEBELUM Raka bertindak. Pemain yang
// membaca ini bisa menyiapkan perisai atau elemen penangkal.
export function intentText(state, mode, plan) {
  const foe = state.foe;
  const first = plan.length > 0 ? foe.hand.find((c) => c.uid === plan[0]) : null;
  if (mode.id === 'bertahan') {
    return 'Raka bertahan di balik Perisai — serangannya melemah, perisainya menebal.';
  }
  if (mode.id === 'perangkai') {
    return 'Raka merangkai kombo! Dua kartu selemen berarti Resonansi +2 — potong dengan elemen penangkal.';
  }
  if (first && first.kind === 'serang') {
    const elementName = { api: 'Api', air: 'Air', daun: 'Daun', bintang: 'Bintang' }[first.element];
    const beats = ELEMENT_WHEEL[first.element]
      ? ` — ${elementName} mengungguli ${{ api: 'Api', air: 'Air', daun: 'Daun', bintang: 'Bintang' }[ELEMENT_WHEEL[first.element]]}`
      : '';
    return `Raka menyiapkan Serangan ${elementName}!${beats} Siapkan perisai atau elemen penangkal.`;
  }
  return 'Raka menyiapkan serangan — waspada!';
}

// Elemen yang mengalahkan elemen kartu pertama rencana Raka: petunjuk counter
// yang tampil kecil di bawah banner niat.
export function counterHint(plan, hand) {
  if (plan.length === 0) return '';
  const first = hand.find((c) => c.uid === plan[0]);
  if (!first || first.kind !== 'serang') return '';
  const counter = Object.keys(ELEMENT_WHEEL).find((el) => ELEMENT_WHEEL[el] === first.element);
  if (!counter) return 'Bintang netral — tidak ada penangkal elemen.';
  const names = { api: 'Api', air: 'Air', daun: 'Daun', bintang: 'Bintang' };
  return `Penangkal: ${names[counter]} mengungguli ${names[first.element]} (+2 damage).`;
}

export { GAME };
