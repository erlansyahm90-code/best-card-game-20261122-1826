// Four Winds Duel — deck.js
// Membangun deck 30 kartu, mengocoknya, dan menarik kartu. Deck kedua pemain
// memakai komposisi yang sama persis, jadi tidak ada yang menang karena deck.

// Satu baris = satu kartu. kind: 'serang' | 'perisai' | 'trik'.
// value: damage untuk serang, shield untuk perisai, jumlah efek untuk trik.
// effect: hanya untuk trik — 'draw' | 'heal' | 'steal' | 'double'.
const DECK_BLUEPRINT = [
  // --- Serang (16) ---
  { element: 'api', kind: 'serang', cost: 1, value: 3, copies: 2 },
  { element: 'api', kind: 'serang', cost: 3, value: 6, copies: 2 },
  { element: 'api', kind: 'serang', cost: 5, value: 8, copies: 1 },
  { element: 'air', kind: 'serang', cost: 2, value: 4, copies: 2 },
  { element: 'air', kind: 'serang', cost: 4, value: 7, copies: 1 },
  { element: 'daun', kind: 'serang', cost: 2, value: 4, copies: 2 },
  { element: 'daun', kind: 'serang', cost: 4, value: 6, copies: 1 },
  { element: 'bintang', kind: 'serang', cost: 3, value: 5, copies: 2 },
  { element: 'bintang', kind: 'serang', cost: 6, value: 8, copies: 1 },
  { element: 'bintang', kind: 'serang', cost: 2, value: 3, copies: 2 },
  // --- Perisai (7) ---
  { element: 'daun', kind: 'perisai', cost: 1, value: 3, copies: 2 },
  { element: 'air', kind: 'perisai', cost: 2, value: 4, copies: 2 },
  { element: 'api', kind: 'perisai', cost: 2, value: 5, copies: 1 },
  { element: 'bintang', kind: 'perisai', cost: 3, value: 7, copies: 1 },
  { element: 'api', kind: 'perisai', cost: 4, value: 8, copies: 1 },
  // --- Trik (7) ---
  { element: 'bintang', kind: 'trik', cost: 2, value: 2, effect: 'draw', copies: 2 },
  { element: 'air', kind: 'trik', cost: 2, value: 4, effect: 'heal', copies: 2 },
  { element: 'daun', kind: 'trik', cost: 3, value: 2, effect: 'steal', copies: 1 },
  { element: 'bintang', kind: 'trik', cost: 2, value: 2, effect: 'double', copies: 2 },
];

// Nama kartu diambil berurutan dari config, supaya dua salinan kartu yang
// sama tidak memakai nama yang sama.
import { CARD_NAMES } from './config.js';

let uidCounter = 0;

export function buildDeck() {
  const nameIndex = {};
  const deck = [];
  for (const spec of DECK_BLUEPRINT) {
    const pool = CARD_NAMES[spec.kind][spec.element];
    const key = `${spec.kind}:${spec.element}`;
    nameIndex[key] = nameIndex[key] ?? 0;
    for (let i = 0; i < spec.copies; i += 1) {
      const name = pool[nameIndex[key] % pool.length];
      nameIndex[key] += 1;
      deck.push({
        uid: `c${uidCounter++}`,
        name,
        element: spec.element,
        kind: spec.kind,
        cost: spec.cost,
        value: spec.value,
        effect: spec.effect ?? null,
      });
    }
  }
  return deck;
}

// RNG kecil ber-seed (mulberry32) — cukup untuk mengocok deck dan untuk
// mode ?shot= yang harus sama di setiap render.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, rng) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Menarik n kartu dari deck ke tangan. Kartu habis = deck kosong, bukan kalah:
// duel kartu yang bagus tidak menghukum pemain karena deck menipis.
export function drawCards(deck, hand, n) {
  for (let i = 0; i < n && deck.length > 0; i += 1) {
    hand.push(deck.pop());
  }
  return hand;
}
