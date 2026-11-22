# Four Winds Duel — Duel Empat Angin

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/erlansyahm90-code/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/erlansyahm90-code/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An entry for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826) — a complete, original 1v1 card battler that runs offline in a desktop browser from static files. You duel Raka, Penjaga Angin, with 30 HP, ember mana, four original elements, and an opponent who announces his intent before he acts.

## The game

A duel of four winds. You and Raka each hold 30 HP, a 30-card deck, and a hand of 5 cards. Each turn your ember grows by 1 (max 10) and you draw a card.

- **Four elements, told by colour and shape**: 🔥 Api (red flame), 💧 Air (blue drop), 🍃 Daun (green leaf), ⭐ Bintang (gold star). The wheel runs Api › Daun › Air › Api; Bintang is neutral. Beating the element your opponent just played deals +2 damage.
- **Three card kinds**: Serang (damage 2–8), Perisai (shield 3–8), Trik (draw 2, heal 4, steal 2 ember, double your next attack).
- **Resonansi**: play two cards of the same element in one turn for +2 and a golden flash.
- **A readable opponent**: before acting, Raka shows an intent banner ("Raka menyiapkan Serangan Api!") with its counter-hint, in one of three named modes — Agresif, Bertahan, Perangkai — so you can answer with the right element or shield.
- **Feel**: cards slide and flip in, hover lifts them, damage numbers float, the table shakes on a hit, and all sound is synthesized Web Audio (no audio files, zero network requests).

## Play it

```sh
node serve.ts
# then open http://localhost:8080
```

Keyboard: 1–5 play a card, Space/Enter ends the turn, R restarts, M mutes. Add `?shot=start|play|win|loss` to jump straight to a staged screen (title, mid-game table, win, loss).

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Layout

- `game/index.html` — the page (1280×720 stage)
- `game/style.css` — table, cards, screens, animations
- `game/src/config.js` — constants, elements, the element wheel
- `game/src/deck.js` — builds and shuffles the 30-card deck
- `game/src/rules.js` — turns, combat, resonance, element advantage
- `game/src/ai.js` — Raka's brain: modes, intent banner, turn planner
- `game/src/render.js` — table, cards, HUD, screens, floating numbers
- `game/src/input.js` — clicks and keyboard
- `game/src/audio.js` — synthesized sound (Web Audio API)
- `game/src/main.js` — state machine, game loop, `?shot=` staging
- `screenshots/` — 4 real renders of the running game (cover first)

## License

MIT — see [LICENSE](LICENSE).
