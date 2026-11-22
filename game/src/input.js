// Four Winds Duel — input.js
// Semua input pemain: klik kartu, klik tombol, dan keyboard. File ini hanya
// menerjemahkan input menjadi panggilan ke handlers yang disediakan main.js —
// tidak ada aturan permainan di sini.

export function bindInput(handlers) {
  const stage = document.getElementById('stage');

  // Klik kartu di tangan pemain (event delegation — tangan di-render ulang
  // setiap giliran, jadi listener menempel di wadahnya, bukan di kartu).
  document.getElementById('player-hand').addEventListener('click', (event) => {
    const cardEl = event.target.closest('.card');
    if (!cardEl) return;
    handlers.onPlayCard(cardEl.dataset.uid);
  });

  document.getElementById('end-turn').addEventListener('click', () => {
    handlers.onEndTurn();
  });

  document.getElementById('mute-btn').addEventListener('click', () => {
    handlers.onToggleMute();
  });

  // Tombol-tombol layar: MAIN, Main Lagi, dan cara main.
  for (const btn of document.querySelectorAll('[data-action="start"]')) {
    btn.addEventListener('click', () => handlers.onStart());
  }
  for (const btn of document.querySelectorAll('[data-action="restart"]')) {
    btn.addEventListener('click', () => handlers.onRestart());
  }

  // Keyboard: 1–5 = mainkan kartu ke-1..5; Space/Enter = akhiri giliran;
  // R = mulai lagi; M = bisu.
  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '5') {
      handlers.onPlayCardIndex(Number(key) - 1);
      event.preventDefault();
    } else if (key === ' ' || key === 'enter') {
      handlers.onEndTurn();
      event.preventDefault();
    } else if (key === 'r') {
      handlers.onRestart();
    } else if (key === 'm') {
      handlers.onToggleMute();
    }
  });

  // Klik di mana saja sekali membangunkan AudioContext (aturan browser).
  stage.addEventListener('pointerdown', () => handlers.onFirstGesture(), { once: true });
}
