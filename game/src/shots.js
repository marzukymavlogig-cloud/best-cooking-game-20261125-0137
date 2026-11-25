// The screenshot scenes behind ?shot=cover|serve|play|end. Each one stages a
// fixed, real game state (orders, a dish mid-assembly, a patty on the grill,
// the timer, a plate ready to serve) and returns the screen to draw over it,
// so the frame is what real play looks like and never changes between runs.
import { RECIPES } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

function makeOrder(world, id, recipeId, customerName, customerColor, patience, maxPatience) {
  return {
    id,
    recipe: recipeById(recipeId),
    customer: { name: customerName, color: customerColor },
    patience,
    maxPatience,
  };
}

/**
 * Set `world` to the named scene and return the screen to draw and the best
 * score to show. Any unknown name stages the cover.
 */
export function stageShot(name, world) {
  const s = world.state;
  world.reset(1);
  if (name === 'end') {
    s.timeLeft = 0;
    s.score = 486;
    s.coins = 41;
    s.served = 7;
    s.missed = 1;
    s.bestCombo = 3;
    s.hearts = 2;
    s.over = true;
    s.orders = [];
    return { screen: SCREEN_OVER, best: 486 };
  }
  if (name === 'serve') {
    s.timeLeft = 121;
    s.score = 312;
    s.coins = 27;
    s.combo = 2;
    s.bestCombo = 2;
    s.served = 3;
    s.orders = [
      makeOrder(world, 0, 'burger', 'Mara', '#e07856', 34, 58),
      makeOrder(world, 1, 'salad', 'Theo', '#5b8dd9', 22, 58),
    ];
    s.chef.x = 1060;
    s.chef.y = 380;
    s.hands = {
      kind: 'plate',
      items: [
        { kind: 'bun', state: 'raw' },
        { kind: 'patty', state: 'cooked' },
        { kind: 'cheese', state: 'raw' },
      ],
    };
    s.grill[0].item = { kind: 'patty', state: 'cooked', timer: 8 };
    return { screen: SCREEN_PLAY, best: 312 };
  }
  if (name === 'play') {
    s.timeLeft = 132;
    s.score = 96;
    s.coins = 12;
    s.combo = 1;
    s.served = 1;
    s.orders = [
      makeOrder(world, 0, 'melt', 'June', '#c86dd7', 41, 58),
      makeOrder(world, 1, 'salad', 'Pip', '#e0a33e', 18, 58),
    ];
    s.chef.x = 330;
    s.chef.y = 400;
    s.chop.item = { kind: 'tomato' };
    s.chop.progress = 1.4;
    s.grill[0].item = { kind: 'patty', state: 'raw', timer: 3.5 };
    s.plate = { items: [{ kind: 'bun', state: 'raw' }] };
    return { screen: SCREEN_PLAY, best: 96 };
  }
  // Cover: the busiest honest frame — three tickets, a dish mid-assembly on
  // the plating counter, a patty cooking, a tomato half-chopped, the timer
  // running and a plated dish ready at the chef's hands.
  s.timeLeft = 98;
  s.score = 240;
  s.coins = 19;
  s.combo = 2;
  s.bestCombo = 2;
  s.served = 2;
  s.orders = [
    makeOrder(world, 0, 'burger', 'Mara', '#e07856', 38, 58),
    makeOrder(world, 1, 'melt', 'Theo', '#5b8dd9', 27, 58),
    makeOrder(world, 2, 'salad', 'June', '#c86dd7', 12, 58),
  ];
  s.chef.x = 700;
  s.chef.y = 420;
  s.chef.face = -1;
  s.hands = { kind: 'lettuce', state: 'chopped' };
  s.chop.item = { kind: 'tomato' };
  s.chop.progress = 1.1;
  s.grill[0].item = { kind: 'patty', state: 'raw', timer: 4.5 };
  s.grill[1].item = { kind: 'patty', state: 'cooked', timer: 9 };
  s.plate = {
    items: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'cheese', state: 'raw' },
    ],
  };
  s.message = 'Burger plated — serve it before Mara walks out!';
  s.messageTimer = 99;
  return { screen: SCREEN_PLAY, best: 240 };
}

export { SCREEN_TITLE };
