// Four Winds Duel — rules.js
// Semua aturan duel: mulai giliran, memainkan kartu, damage, shield,
// keunggulan elemen, Resonansi, dan efek trik. Fungsi di sini murni —
// mereka menerima state dan mengembalikan hasil, tanpa menyentuh DOM.

import { ELEMENT_WHEEL, GAME } from './config.js';
import { drawCards } from './deck.js';

// Apakah elemen penyerang mengungguli elemen terakhir yang dimainkan lawan?
export function hasAdvantage(attackerElement, defenderLastElement) {
  if (!defenderLastElement) return false;
  return ELEMENT_WHEEL[attackerElement] === defenderLastElement;
}

// Bonus Resonansi: kartu ini selemen dengan kartu sebelumnya di giliran yang sama.
export function resonanceBonus(card, playedThisTurn) {
  if (playedThisTurn.length === 0) return 0;
  const previous = playedThisTurn[playedThisTurn.length - 1];
  return previous.element === card.element ? GAME.resonanceBonus : 0;
}

// Memulai giliran seorang pemain: ember naik 1 (maks 10) lalu isi penuh,
// lalu draw 1 kartu. Mengembalikan baris log untuk panel riwayat.
export function startTurn(state, side) {
  const fighter = state[side];
  fighter.maxEmber = Math.min(GAME.maxEmber, fighter.maxEmber + 1);
  fighter.ember = fighter.maxEmber;
  drawCards(fighter.deck, fighter.hand, GAME.drawPerTurn);
  fighter.playedThisTurn = [];
  fighter.lastElement = fighter.lastElement ?? null;
  return `${side === 'player' ? 'Kamu' : 'Raka'} mendapat ${fighter.maxEmber} ember.`;
}

// Damage masuk: shield menyerap dulu, sisanya mengurangi HP.
export function dealDamage(state, targetSide, amount) {
  const target = state[targetSide];
  let remaining = amount;
  let absorbed = 0;
  if (target.shield > 0) {
    absorbed = Math.min(target.shield, remaining);
    target.shield -= absorbed;
    remaining -= absorbed;
  }
  target.hp = Math.max(0, target.hp - remaining);
  return { dealt: remaining, absorbed, hpLeft: target.hp };
}

// Memainkan satu kartu dari tangan. Mengembalikan laporan lengkap yang
// dipakai render (angka melayang, bunyi, animasi) dan log giliran.
export function playCard(state, side, cardUid) {
  const fighter = state[side];
  const foeSide = side === 'player' ? 'foe' : 'player';
  const foe = state[foeSide];
  const index = fighter.hand.findIndex((c) => c.uid === cardUid);
  if (index === -1) return { ok: false, reason: 'Kartu tidak ada di tangan.' };
  const card = fighter.hand[index];
  if (card.cost > fighter.ember) {
    return { ok: false, reason: 'Ember tidak cukup.' };
  }

  fighter.ember -= card.cost;
  fighter.hand.splice(index, 1);
  fighter.played.push(card);
  const res = resonanceBonus(card, fighter.playedThisTurn);
  fighter.playedThisTurn.push(card);
  fighter.lastElement = card.element;

  const report = {
    ok: true,
    card,
    resonance: res > 0,
    advantage: false,
    damage: 0,
    shield: 0,
    healed: 0,
    stolen: 0,
    drawn: 0,
    doubled: false,
    log: '',
  };

  if (card.kind === 'serang') {
    let damage = card.value + res;
    if (hasAdvantage(card.element, foe.lastElement)) {
      damage += GAME.advantageBonus;
      report.advantage = true;
    }
    if (fighter.doubleNext) {
      damage *= 2;
      fighter.doubleNext = false;
      report.doubled = true;
    }
    const outcome = dealDamage(state, foeSide, damage);
    report.damage = damage;
    report.log =
      `${side === 'player' ? 'Kamu' : 'Raka'} memainkan ${card.name} — ${damage} damage` +
      (report.advantage ? ' (unggul elemen +2)' : '') +
      (res > 0 ? ' (Resonansi +2)' : '') +
      (report.doubled ? ' (Ganda ×2)' : '') +
      (outcome.absorbed > 0 ? `, ${outcome.absorbed} diserap perisai` : '') +
      '.';
  } else if (card.kind === 'perisai') {
    const shield = card.value + res;
    fighter.shield += shield;
    report.shield = shield;
    report.log =
      `${side === 'player' ? 'Kamu' : 'Raka'} memasang ${card.name} — perisai +${shield}` +
      (res > 0 ? ' (Resonansi +2)' : '') +
      '.';
  } else if (card.kind === 'trik') {
    if (card.effect === 'draw') {
      drawCards(fighter.deck, fighter.hand, card.value);
      report.drawn = card.value;
      report.log = `${side === 'player' ? 'Kamu' : 'Raka'} menarik ${card.value} kartu (Tarik Angin).`;
    } else if (card.effect === 'heal') {
      const healed = Math.min(card.value, GAME.healCap - fighter.hp);
      fighter.hp += healed;
      report.healed = healed;
      report.log = `${side === 'player' ? 'Kamu' : 'Raka'} memulihkan ${healed} HP (Embun Pagi).`;
    } else if (card.effect === 'steal') {
      const stolen = Math.min(card.value, foe.ember);
      foe.ember -= stolen;
      fighter.ember = Math.min(GAME.maxEmber, fighter.ember + stolen);
      report.stolen = stolen;
      report.log = `${side === 'player' ? 'Kamu' : 'Raka'} mencuri ${stolen} ember (Curi Ember).`;
    } else if (card.effect === 'double') {
      fighter.doubleNext = true;
      report.log = `${side === 'player' ? 'Kamu' : 'Raka'} menyiapkan Ganda Angin — kartu serang berikutnya ×2.`;
    }
  }

  return report;
}

export function checkWinner(state) {
  if (state.foe.hp <= 0 && state.player.hp <= 0) return 'draw';
  if (state.foe.hp <= 0) return 'player';
  if (state.player.hp <= 0) return 'foe';
  return null;
}
