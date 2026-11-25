// Ember & Oak — Rush Hour Kitchen: every tunable number and the menu.
// One job: constants. Nothing here touches the canvas or the network.
export const VIEW = { width: 1280, height: 860 };
export const STEP = 1 / 60;
export const BEST_KEY = 'ember-oak-best-coins';

export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 4;
export const COMBO_CAP = 3;

/** Ingredient kinds the crates hand out. */
export const INGREDIENTS = {
  bun: { label: 'Bun', color: '#e8b96a', dark: '#b98a3e' },
  patty: { label: 'Patty', color: '#8a5a3b', dark: '#5f3a24' },
  cheese: { label: 'Cheese', color: '#f7c948', dark: '#d9a41f' },
  tomato: { label: 'Tomato', color: '#e4572e', dark: '#b23a1a' },
  lettuce: { label: 'Lettuce', color: '#7bc96f', dark: '#4d9b42' },
};

/** Which raw ingredients must be chopped before they can be plated. */
export const CHOPPABLE = ['tomato', 'lettuce'];
/** How long chopping takes, in seconds, while the chef stays at the board. */
export const CHOP_SECONDS = 2.2;
/** Grill timings: raw -> cooked after COOK_SECONDS, then BURN_AFTER more seconds it burns. */
export const COOK_SECONDS = 7;
export const BURN_AFTER = 6;

/** The menu. `needs` lists ingredient kinds with the state they must be in. */
export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    price: 8,
    minDay: 1,
    needs: [
      { kind: 'lettuce', state: 'chopped' },
      { kind: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'burger',
    name: 'Oak Cheeseburger',
    price: 12,
    minDay: 1,
    needs: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'cheese', state: 'raw' },
    ],
  },
  {
    id: 'melt',
    name: 'Ember Melt',
    price: 16,
    minDay: 1,
    needs: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'cheese', state: 'raw' },
      { kind: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'garden-burger',
    name: 'Garden Burger',
    price: 18,
    minDay: 2,
    needs: [
      { kind: 'bun', state: 'raw' },
      { kind: 'patty', state: 'cooked' },
      { kind: 'lettuce', state: 'chopped' },
      { kind: 'tomato', state: 'chopped' },
    ],
  },
];

/** Customers who walk up to the order board. Names are invented. */
export const CUSTOMERS = [
  { name: 'Mara', color: '#e07856' },
  { name: 'Theo', color: '#5b8dd9' },
  { name: 'June', color: '#c86dd7' },
  { name: 'Pip', color: '#e0a33e' },
  { name: 'Sable', color: '#4fae8d' },
  { name: 'Rook', color: '#8a7fd6' },
];

export const CHEF = { speed: 250, radius: 26 };

/** Station rectangles on the kitchen floor (logical pixels). */
export const STATIONS = {
  crates: [
    { kind: 'bun', x: 24, y: 340, w: 132, h: 92 },
    { kind: 'patty', x: 24, y: 444, w: 132, h: 92 },
    { kind: 'cheese', x: 24, y: 548, w: 132, h: 92 },
    { kind: 'tomato', x: 24, y: 652, w: 132, h: 92 },
    { kind: 'lettuce', x: 24, y: 756, w: 132, h: 92 },
  ],
  chop: { x: 220, y: 208, w: 200, h: 108 },
  grill: { x: 470, y: 208, w: 250, h: 108 },
  plate: { x: 770, y: 208, w: 240, h: 108 },
  serve: { x: 1060, y: 208, w: 196, h: 108 },
  trash: { x: 1124, y: 756, w: 132, h: 92 },
};

/** How close the chef must be to a station to use it. */
export const REACH = 108;
/** Patience (seconds) an order starts with, by day. */
export function patienceFor(day) {
  return Math.max(34, 58 - (day - 1) * 6);
}
/** Seconds between new orders, by day. */
export function spawnEveryFor(day) {
  return Math.max(8, 15 - (day - 1) * 2);
}
