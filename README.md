# Ember & Oak — Rush Hour Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/marzukymavlogig-cloud/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/marzukymavlogig-cloud/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A complete, original cooking game for the
[make.fun "Make the best cooking game" bounty](https://make.fun/bounty/best-cooking-game-20261125-0137).
Vanilla JS + canvas, no libraries, no network requests. Keyboard + mouse.

## The game

You are the only chef at **Ember & Oak**, a tiny oak-fired kitchen, and the
lunch rush just walked in. Orders appear on the board with a patience bar.
Run the kitchen: grab ingredients from the crates, chop tomatoes and lettuce
at the board, grill patties (7 seconds to cooked — leave them and they burn),
build each dish on the plating counter, and ring the bell at the serving
window before the customer walks out.

- **Menu** — Garden Salad, Oak Cheeseburger, Ember Melt, and (from Day 2) the
  Garden Burger. Each dish is a different ingredient chain.
- **Pressure that grows** — every new day spawns orders faster, patience
  drains quicker, and a new recipe joins the menu.
- **Scoring** — serve fast for tips, chain serves into a combo multiplier
  (up to x3). Three walk-outs and the kitchen closes.
- **Shift flow** — 150-second shifts, a shift-end summary with stars, and a
  next-day button. Pause with P/Esc, restart with R, mute with M.
- **Sound** — all synthesized with WebAudio: chops, grill sizzle, serve
  chimes, rejection buzz. No audio files.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move the chef |
| E / Space | Use the nearest station (pick up, chop, grill, plate, serve, trash) |
| Click | Walk to a spot; click a station to walk there and use it |
| P / Esc | Pause |
| R | Restart the day |
| M | Mute |
| Enter | Start / next day |

## Play

```sh
node serve.ts   # then open http://localhost:8080
```

## Layout

- `game/index.html` — the page, canvas only
- `game/src/config.js` — constants, menu, stations
- `game/src/random.js` — seeded RNG
- `game/src/audio.js` — WebAudio synth sounds
- `game/src/input.js` — keyboard + mouse
- `game/src/world.js` — simulation: stations, orders, cooking, serving, scoring
- `game/src/render.js` — all canvas drawing
- `game/src/shots.js` — staged screenshot scenes (`?shot=cover|play|serve|end`)
- `game/src/main.js` — boot, fixed-step loop, screens
- `main.ts` — copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## Screenshots

`?shot=cover` stages the busiest honest frame (order board, mid-assembly
dish, patty on the grill, timer, plated dish); `?shot=play`, `?shot=serve`
and `?shot=end` stage mid-shift, serving and shift-end frames.
