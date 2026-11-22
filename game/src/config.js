// Four Winds Duel — config.js
// Satu-satunya sumber kebenaran untuk konstanta permainan: elemen, roda
// keunggulan, nyawa, ember, dan ukuran deck/tangan. Tidak ada logika di sini,
// hanya data yang dipakai deck.js, rules.js, ai.js dan render.js.

// Empat elemen orisinal. Setiap elemen punya warna DAN bentuk ikon sendiri
// (api, tetes, daun, bintang) — juri membedakan kartu dari warna + bentuk,
// bukan dari teks semata.
export const ELEMENTS = {
  api: {
    id: 'api',
    name: 'Api',
    color: '#e2483a',
    dark: '#8f1d12',
    glow: '#ff7a4d',
    // Ikon api: bentuk nyala, digambar sebagai SVG path di render.js.
    icon: 'flame',
  },
  air: {
    id: 'air',
    name: 'Air',
    color: '#2f7fe0',
    dark: '#123f7d',
    glow: '#6db3ff',
    icon: 'drop',
  },
  daun: {
    id: 'daun',
    name: 'Daun',
    color: '#2fae5f',
    dark: '#145c30',
    glow: '#7ed491',
    icon: 'leaf',
  },
  bintang: {
    id: 'bintang',
    name: 'Bintang',
    color: '#e0a92f',
    dark: '#7d5a10',
    glow: '#ffd76d',
    icon: 'star',
  },
};

// Roda elemen: Api membakar Daun, Daun menyerap Air, Air memadamkan Api.
// Bintang berdiri di luar roda — netral terhadap semuanya.
export const ELEMENT_WHEEL = {
  api: 'daun', // Api > Daun
  daun: 'air', // Daun > Air
  air: 'api', // Air > Api
  bintang: null, // Bintang netral
};

export const GAME = {
  maxHp: 30,
  maxEmber: 10,
  startingEmber: 1,
  handSize: 5,
  deckSize: 30,
  drawPerTurn: 1,
  advantageBonus: 2, // +2 damage saat elemenmu mengungguli elemen terakhir lawan
  resonanceBonus: 2, // +2 saat dua kartu selemen dimainkan dalam satu giliran
  healCap: 30,
};

// Nama kartu per jenis, supaya tiap kartu terasa seperti jurus, bukan angka.
export const CARD_NAMES = {
  serang: {
    api: ['Pukulan Bara', 'Ledakan Api', 'Inferno Angin'],
    air: ['Tembakan Ombak', 'Badai Pusaran'],
    daun: ['Cambuk Akar', 'Hujan Duri'],
    bintang: ['Tusuk Meteor', 'Hujan Bintang', 'Nova Kecil'],
  },
  perisai: {
    api: ['Dinding Bara', 'Perisai Magma'],
    air: ['Kubah Ombak', 'Tirai Hujan'],
    daun: ['Kulit Kayu', 'Perisai Lumut'],
    bintang: ['Aegis Bintang', 'Kubah Cahaya'],
  },
  trik: {
    bintang: ['Tarik Angin', 'Ganda Angin'],
    air: ['Embun Pagi'],
    daun: ['Curi Ember'],
  },
};
