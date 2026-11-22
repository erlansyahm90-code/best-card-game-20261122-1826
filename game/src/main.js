// Four Winds Duel — main.js
// State machine + loop permainan. Menghubungkan config, deck, rules, ai,
// render, input dan audio menjadi satu duel yang bisa dimainkan.
// Mode ?shot=start|play|win|loss me-render state yang diminta langsung,
// supaya screenshot diambil tanpa bermain manual.

import { GAME } from './config.js';
import { buildDeck, drawCards, makeRng, shuffle } from './deck.js';
import { checkWinner, playCard, startTurn } from './rules.js';
import { chooseMode, counterHint, intentText, MODES, planTurn } from './ai.js';
import {
  floatText,
  hideIntent,
  renderLossStats,
  renderTable,
  renderWinStats,
  resonanceFlash,
  shakeStage,
  showIntent,
  showScreen,
} from './render.js';
import { bindInput } from './input.js';
import { sfx, toggleMute } from './audio.js';

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 7) || 7;

function freshFighter(rng) {
  return {
    hp: GAME.maxHp,
    shield: 0,
    ember: 0,
    maxEmber: 0,
    deck: shuffle(buildDeck(), rng),
    hand: [],
    played: [],
    playedThisTurn: [],
    lastElement: null,
    doubleNext: false,
    mode: null,
  };
}

function newGame() {
  const rng = makeRng(seed);
  const state = {
    screen: 'title',
    turn: 1,
    turnSide: 'player',
    maxHp: GAME.maxHp,
    player: freshFighter(rng),
    foe: freshFighter(rng),
    log: ['Duel dimulai. Empat angin menunggu pemenangnya.'],
    stats: { turns: 0, damageDealt: 0, cardsPlayed: 0 },
    winner: null,
    busy: false,
  };
  state.foe.mode = chooseMode(state);
  // Tangan awal 4 kartu; startTurn di bawah menarik 1 lagi, jadi giliran
  // pertama dimulai dengan 5 kartu di tangan, sesuai aturan.
  drawCards(state.player.deck, state.player.hand, GAME.handSize - 1);
  drawCards(state.foe.deck, state.foe.hand, GAME.handSize - 1);
  startTurn(state, 'player');
  return state;
}

let state = newGame();

function pushLog(line) {
  state.log.push(line);
  if (state.log.length > 40) state.log.splice(0, state.log.length - 40);
}

function refresh() {
  renderTable(state);
}

function finishIfOver() {
  const winner = checkWinner(state);
  if (!winner) return false;
  state.winner = winner;
  state.screen = winner === 'player' ? 'win' : 'loss';
  if (winner === 'player') {
    renderWinStats(state);
    sfx.win();
  } else {
    renderLossStats(state);
    sfx.lose();
  }
  showScreen(state.screen);
  return true;
}

// --- Aksi pemain -----------------------------------------------------------

function onPlayCard(uid) {
  if (state.screen !== 'table' || state.turnSide !== 'player' || state.busy) return;
  const card = state.player.hand.find((c) => c.uid === uid);
  if (!card) return;
  const report = playCard(state, 'player', uid);
  if (!report.ok) {
    pushLog(report.reason);
    refresh();
    return;
  }
  state.stats.cardsPlayed += 1;
  state.stats.damageDealt += report.damage;
  pushLog(report.log);
  sfx.play(card.element);
  if (report.resonance) {
    resonanceFlash();
    sfx.resonance();
    floatText('RESONANSI +2!', 'resonance', 'player');
  }
  if (report.damage > 0) {
    floatText(`-${report.damage}`, 'damage', 'foe');
    shakeStage();
    sfx.hit();
  }
  if (report.shield > 0) sfx.shield();
  if (report.healed > 0) floatText(`+${report.healed} HP`, 'heal', 'player');
  if (report.stolen > 0) floatText(`+${report.stolen} ember`, 'steal', 'player');
  refresh();
  if (finishIfOver()) return;
}

function onPlayCardIndex(index) {
  const card = state.player.hand[index];
  if (card) onPlayCard(card.uid);
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

// Giliran Raka: umumkan niat, tunggu, mainkan kartu satu per satu.
async function runFoeTurn() {
  state.busy = true;
  state.turnSide = 'foe';
  refresh();
  startTurn(state, 'foe');
  const mode = chooseMode(state);
  state.foe.mode = mode;
  const plan = planTurn(state, mode);
  showIntent(intentText(state, mode, plan), counterHint(plan, state.foe.hand));
  refresh();
  await sleep(1100);
  for (const uid of plan) {
    const card = state.foe.hand.find((c) => c.uid === uid);
    if (!card) continue;
    const report = playCard(state, 'foe', uid);
    if (!report.ok) continue;
    pushLog(report.log);
    sfx.play(card.element);
    if (report.resonance) {
      resonanceFlash();
      sfx.resonance();
    }
    if (report.damage > 0) {
      floatText(`-${report.damage}`, 'damage', 'player');
      shakeStage();
      sfx.hit();
    }
    if (report.shield > 0) sfx.shield();
    refresh();
    if (finishIfOver()) {
      hideIntent();
      state.busy = false;
      return;
    }
    await sleep(650);
  }
  hideIntent();
  state.turn += 1;
  state.stats.turns = state.turn;
  state.turnSide = 'player';
  pushLog(startTurn(state, 'player'));
  state.busy = false;
  refresh();
}

function onEndTurn() {
  if (state.screen !== 'table' || state.turnSide !== 'player' || state.busy) return;
  sfx.endTurn();
  pushLog('Kamu mengakhiri giliran.');
  void runFoeTurn();
}

function onStart() {
  state.screen = 'table';
  showScreen('table');
  sfx.deal();
  refresh();
}

function onRestart() {
  state = newGame();
  state.screen = 'table';
  showScreen('table');
  refresh();
}

function onToggleMute() {
  const muted = toggleMute();
  document.getElementById('mute-btn').textContent = muted ? '🔇 Bisu' : '🔊 Suara (M)';
}

function onFirstGesture() {
  // Membangunkan AudioContext lewat interaksi pertama (aturan browser).
  sfx.deal();
}

// --- Mode ?shot= : staging deterministik untuk screenshot ------------------

function stageShot(shot) {
  if (shot === 'start') {
    state.screen = 'title';
    showScreen('title');
    return;
  }
  if (shot === 'play') {
    // Meja mid-game yang dramatis: HP menipis, ember penuh, Raka menyerang.
    state.screen = 'table';
    state.turn = 6;
    state.stats.turns = 6;
    state.player.hp = 18;
    state.player.shield = 4;
    state.player.ember = 6;
    state.player.maxEmber = 7;
    state.foe.hp = 14;
    state.foe.shield = 2;
    state.foe.ember = 3;
    state.foe.maxEmber = 7;
    state.foe.mode = chooseMode(state);
    state.player.lastElement = 'api';
    state.foe.lastElement = 'daun';
    // Tangan lawan penuh: 5 punggung kartu di atas meja.
    drawCards(state.foe.deck, state.foe.hand, 1);
    // Tangan pemain: 5 kartu yang menampilkan semua jenis + elemen.
    const hand = state.player.hand;
    const byKey = {};
    for (const card of [...state.player.deck, ...hand]) {
      byKey[`${card.element}:${card.kind}:${card.effect ?? ''}`] = card;
    }
    const wanted = [
      byKey['api:serang:'],
      byKey['air:serang:'],
      byKey['daun:perisai:'],
      byKey['bintang:trik:draw'],
      byKey['bintang:serang:'],
    ].filter(Boolean);
    state.player.hand = wanted.length === 5 ? wanted : hand;
    // Kartu terakhir Raka: serangan Api yang besar.
    const bigApi = state.foe.deck.find((c) => c.kind === 'serang' && c.element === 'api' && c.value >= 6)
      ?? state.foe.hand.find((c) => c.kind === 'serang');
    if (bigApi) state.foe.played = [bigApi];
    // Mode dipaksa Agresif supaya badge mode cocok dengan banner niat.
    state.foe.mode = MODES.agresif;
    state.log = [
      'Giliran 5: Ledakan Api Raka — 6 damage!',
      'Kamu: Perisai Lumut +3.',
      'Resonansi Daun menyala (+2).',
      'Raka menyiapkan Serangan Api!',
    ];
    showIntent(
      'Raka menyiapkan Serangan Api! — Api mengungguli Daun. Siapkan perisai atau elemen penangkal.',
      'Penangkal: Air mengungguli Api (+2 damage).',
    );
    showScreen('table');
    refresh();
    return;
  }
  if (shot === 'win') {
    state.screen = 'win';
    state.stats = { turns: 9, damageDealt: 34, cardsPlayed: 14 };
    state.player.hp = 11;
    state.foe.hp = 0;
    renderWinStats(state);
    showScreen('win');
    return;
  }
  if (shot === 'loss') {
    state.screen = 'loss';
    state.stats = { turns: 8, damageDealt: 22, cardsPlayed: 11 };
    state.player.hp = 0;
    state.foe.hp = 9;
    renderLossStats(state);
    showScreen('loss');
  }
}

// --- Boot ------------------------------------------------------------------

bindInput({
  onPlayCard,
  onPlayCardIndex,
  onEndTurn,
  onStart,
  onRestart,
  onToggleMute,
  onFirstGesture,
});

refresh();
const shot = params.get('shot');
if (shot) {
  stageShot(shot);
} else {
  showScreen('title');
}
