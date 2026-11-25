// Ember & Oak — Rush Hour Kitchen: the whole simulation.
// Stations, orders, cooking, serving, scoring and the shift timer live here;
// rendering and input only read this state. No DOM, no network.
import {
  BURN_AFTER,
  CHOP_SECONDS,
  CHOPPABLE,
  COMBO_CAP,
  CUSTOMERS,
  CHEF,
  COOK_SECONDS,
  MAX_HEARTS,
  MAX_ORDERS,
  REACH,
  RECIPES,
  SHIFT_SECONDS,
  STATIONS,
  patienceFor,
  spawnEveryFor,
} from './config.js';
import { pick } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_SERVE = 1;
export const EVENT_EXPIRE = 2;
export const EVENT_SHIFT_END = 4;
export const EVENT_CLOSED = 8;
export const EVENT_BURN = 16;

/** The walkable floor: stations sit outside it, close enough to reach. */
const FLOOR = { x0: 178, y0: 336, x1: 1256, y1: 836 };

function stationCenter(st) {
  return { x: st.x + st.w / 2, y: st.y + st.h / 2 };
}

function distToRect(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

/** All stations as {id, rect, label} for reach checks and clicks. */
export function allStations() {
  const list = STATIONS.crates.map((c) => ({ id: `crate-${c.kind}`, rect: c, label: c.kind }));
  list.push({ id: 'chop', rect: STATIONS.chop, label: 'chop' });
  list.push({ id: 'grill', rect: STATIONS.grill, label: 'grill' });
  list.push({ id: 'plate', rect: STATIONS.plate, label: 'plate' });
  list.push({ id: 'serve', rect: STATIONS.serve, label: 'serve' });
  list.push({ id: 'trash', rect: STATIONS.trash, label: 'trash' });
  return list;
}

/** Does this plate hold exactly the ingredients a recipe needs? */
export function plateMatches(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const have = plateItems.map((i) => `${i.kind}:${i.state}`).sort();
  const want = recipe.needs.map((n) => `${n.kind}:${n.state}`).sort();
  return have.every((h, i) => h === want[i]);
}

export function createWorld(random, audio) {
  const state = {
    day: 1,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    hearts: MAX_HEARTS,
    chef: { x: 640, y: 620, moving: false, face: 1, target: null, targetStation: null },
    hands: null,
    orders: [],
    chop: { item: null, progress: 0 },
    grill: [{ item: null }, { item: null }],
    plate: null,
    spawnTimer: 4,
    orderSeq: 0,
    particles: [],
    popups: [],
    over: false,
    closed: false,
    message: '',
    messageTimer: 0,
    sizzleOn: false,
    lastTickSecond: -1,
  };

  function say(text, seconds = 2.5) {
    state.message = text;
    state.messageTimer = seconds;
  }

  function popup(x, y, text, color = '#fff7e6') {
    state.popups.push({ x, y, text, color, life: 1.4 });
  }

  function spawnOrder() {
    const menu = RECIPES.filter((r) => r.minDay <= state.day);
    const recipe = pick(random, menu);
    const customer = pick(random, CUSTOMERS);
    const patience = patienceFor(state.day);
    state.orders.push({
      id: state.orderSeq,
      recipe,
      customer,
      patience,
      maxPatience: patience,
    });
    state.orderSeq += 1;
  }

  function reset(day = 1) {
    state.day = day;
    state.timeLeft = SHIFT_SECONDS;
    state.score = 0;
    state.coins = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.served = 0;
    state.missed = 0;
    state.hearts = MAX_HEARTS;
    state.chef = { x: 640, y: 620, moving: false, face: 1, target: null, targetStation: null };
    state.hands = null;
    state.orders = [];
    state.chop = { item: null, progress: 0 };
    state.grill = [{ item: null }, { item: null }];
    state.plate = null;
    state.spawnTimer = 4;
    state.orderSeq = 0;
    state.particles = [];
    state.popups = [];
    state.over = false;
    state.closed = false;
    state.message = '';
    state.messageTimer = 0;
    state.sizzleOn = false;
    state.lastTickSecond = -1;
    spawnOrder();
  }

  function nearestStation() {
    let best = null;
    let bestDist = Infinity;
    for (const st of allStations()) {
      const d = distToRect(state.chef.x, state.chef.y, st.rect);
      if (d < bestDist) {
        bestDist = d;
        best = st;
      }
    }
    return bestDist <= REACH ? best : null;
  }

  /** What pressing E right now would do, for the hint line. */
  function hintFor(station) {
    if (!station) return 'Walk to a station — WASD / arrows or click';
    const h = state.hands;
    if (station.id.startsWith('crate-')) {
      const kind = station.id.slice(6);
      return h ? 'Hands full — serve or trash what you hold' : `Pick up ${kind}`;
    }
    if (station.id === 'chop') {
      if (state.chop.item) return 'Chopping… stay close';
      if (h && CHOPPABLE.includes(h.kind) && h.state === 'raw') return `Chop the ${h.kind}`;
      return 'Bring a tomato or lettuce to chop';
    }
    if (station.id === 'grill') {
      if (h && h.kind === 'patty' && h.state === 'raw') return 'Put the patty on the grill';
      const ready = state.grill.find((s) => s.item && s.item.state !== 'raw');
      if (!h && ready) return ready.item.state === 'burnt' ? 'Take the burnt patty (trash it!)' : 'Take the cooked patty';
      return 'Grill a raw patty here';
    }
    if (station.id === 'plate') {
      if (h && h.kind === 'plate') return 'Set the plate down';
      if (h && state.plate && state.plate.items.length < 4) return `Add ${h.kind} to the plate`;
      if (h && !state.plate) return `Start a plate with ${h.kind}`;
      if (!h && state.plate) return state.plate.items.length ? 'Pick up the finished plate' : 'Pick up the plate';
      if (!h && !state.plate) return 'Take a clean plate';
      return 'Plating counter — build dishes here';
    }
    if (station.id === 'serve') {
      if (h && h.kind === 'plate') return 'Serve the plate!';
      return 'Serving window — bring a finished plate';
    }
    if (station.id === 'trash') return h ? 'Throw away what you hold' : 'Trash bin';
    return '';
  }

  function servePlate() {
    const plate = state.hands;
    const match = state.orders.find((o) => plateMatches(plate.items, o.recipe));
    if (!match) {
      audio.reject();
      state.combo = 0;
      say('No order wants that plate — check the tickets!', 2.5);
      popup(state.chef.x, state.chef.y - 60, 'WRONG ORDER', '#ff6b5e');
      return;
    }
    const tip = Math.round(50 * (match.patience / match.maxPatience));
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const mult = Math.min(1 + 0.25 * (state.combo - 1), COMBO_CAP);
    const earned = Math.round((match.recipe.price * 10 + tip) * mult);
    const coins = match.recipe.price + Math.round(tip / 10);
    state.score += earned;
    state.coins += coins;
    state.served += 1;
    state.orders = state.orders.filter((o) => o.id !== match.id);
    state.hands = { kind: 'plate', items: [] };
    audio.serve();
    popup(1158, 260, `+${earned}  COMBO x${mult.toFixed(2).replace(/\.?0+$/, '')}`, '#ffd166');
    popup(state.chef.x, state.chef.y - 60, `Served ${match.customer.name}!`, '#9be37e');
    for (let i = 0; i < 14; i += 1) {
      state.particles.push({
        x: 1158 + (random() - 0.5) * 120,
        y: 250 + (random() - 0.5) * 40,
        vx: (random() - 0.5) * 60,
        vy: -40 - random() * 60,
        life: 0.9,
        color: '#ffd166',
        size: 3 + random() * 3,
      });
    }
    say(`${match.recipe.name} served — +${coins} coins${state.combo > 1 ? `, combo x${state.combo}!` : ''}`, 2.5);
  }

  function interact(stationOverride) {
    const station = stationOverride || nearestStation();
    if (!station) return;
    const h = state.hands;
    if (station.id.startsWith('crate-')) {
      if (h) {
        say('Hands full — serve or trash what you hold', 2);
        return;
      }
      const kind = station.id.slice(6);
      state.hands = { kind, state: 'raw' };
      audio.pickup();
      return;
    }
    if (station.id === 'chop') {
      if (state.chop.item) return;
      if (h && CHOPPABLE.includes(h.kind) && h.state === 'raw') {
        state.chop.item = { kind: h.kind };
        state.chop.progress = 0;
        state.hands = null;
        audio.place();
        say(`Chopping ${h.kind} — stay at the board…`, 2);
      }
      return;
    }
    if (station.id === 'grill') {
      if (h && h.kind === 'patty' && h.state === 'raw') {
        const slot = state.grill.find((s) => !s.item);
        if (slot) {
          slot.item = { kind: 'patty', state: 'raw', timer: 0 };
          state.hands = null;
          audio.place();
        } else say('Grill is full!', 2);
        return;
      }
      if (!h) {
        const cooked = state.grill.find((s) => s.item && s.item.state === 'cooked');
        const burnt = state.grill.find((s) => s.item && s.item.state === 'burnt');
        const slot = cooked || burnt;
        if (slot) {
          state.hands = { kind: 'patty', state: slot.item.state };
          slot.item = null;
          audio.pickup();
          if (state.hands.state === 'burnt') say('Burnt! Trash it and grill a fresh one.', 2.5);
        }
      }
      return;
    }
    if (station.id === 'plate') {
      if (h && h.kind === 'plate') {
        if (!state.plate) {
          state.plate = h;
          state.hands = null;
          audio.place();
        }
        return;
      }
      if (h && state.plate && state.plate.items.length < 4) {
        state.plate.items.push({ kind: h.kind, state: h.state });
        state.hands = null;
        audio.place();
        return;
      }
      if (h && !state.plate) {
        // No plate out yet: take a clean one and start the dish on it.
        state.plate = { kind: 'plate', items: [{ kind: h.kind, state: h.state }] };
        state.hands = null;
        audio.place();
        say(`Started a plate with ${h.kind}`, 2);
        return;
      }
      if (!h && state.plate) {
        state.hands = state.plate;
        state.plate = null;
        audio.pickup();
        return;
      }
      if (!h && !state.plate) {
        // The counter keeps a stack of clean plates: take one out.
        state.plate = { kind: 'plate', items: [] };
        audio.place();
        say('Clean plate on the counter — build the dish on it', 2);
      }
      return;
    }
    if (station.id === 'serve') {
      if (h && h.kind === 'plate') {
        if (h.items.length === 0) {
          say('Empty plate — build a dish first!', 2);
          audio.reject();
          return;
        }
        servePlate();
      }
      return;
    }
    if (station.id === 'trash') {
      if (h) {
        // Whatever the chef holds goes — plates included; the counter
        // always has a fresh clean plate.
        state.hands = null;
        say('Tossed', 1.2);
        audio.place();
      }
      return;
    }
  }

  function moveChef(dt, dir) {
    const chef = state.chef;
    let mx = dir.x;
    let my = dir.y;
    if (chef.target) {
      const dx = chef.target.x - chef.x;
      const dy = chef.target.y - chef.y;
      const d = Math.hypot(dx, dy);
      if (d < 8) {
        chef.target = null;
        if (chef.targetStation) {
          const st = chef.targetStation;
          chef.targetStation = null;
          // Use the station that was clicked, not whichever is nearest to
          // the approach point: crates sit close together.
          interact(st);
          return;
        }
      } else {
        mx = dx / d;
        my = dy / d;
      }
    }
    chef.moving = mx !== 0 || my !== 0;
    if (chef.moving) {
      if (mx !== 0) chef.face = mx > 0 ? 1 : -1;
      chef.x = Math.min(FLOOR.x1, Math.max(FLOOR.x0, chef.x + mx * CHEF.speed * dt));
      chef.y = Math.min(FLOOR.y1, Math.max(FLOOR.y0, chef.y + my * CHEF.speed * dt));
    }
  }

  function step(dt, dir, interactPressed, click) {
    if (state.over || state.closed) return EVENT_NONE;
    let events = EVENT_NONE;

    if (click) {
      const st = allStations().find(
        (s) => click.x >= s.rect.x - 20 && click.x <= s.rect.x + s.rect.w + 20 && click.y >= s.rect.y - 20 && click.y <= s.rect.y + s.rect.h + 20,
      );
      if (st) {
        const c = stationCenter(st.rect);
        state.chef.target = {
          x: Math.min(FLOOR.x1, Math.max(FLOOR.x0, c.x)),
          y: Math.min(FLOOR.y1, Math.max(FLOOR.y0, c.y)),
        };
        state.chef.targetStation = st;
      } else {
        state.chef.target = {
          x: Math.min(FLOOR.x1, Math.max(FLOOR.x0, click.x)),
          y: Math.min(FLOOR.y1, Math.max(FLOOR.y0, click.y)),
        };
        state.chef.targetStation = null;
      }
    }
    if (dir.x !== 0 || dir.y !== 0) state.chef.target = null;

    moveChef(dt, dir);
    if (interactPressed) interact();

    // Chopping: progress while the chef stays at the board.
    if (state.chop.item) {
      const d = distToRect(state.chef.x, state.chef.y, STATIONS.chop);
      if (d <= REACH) {
        state.chop.progress += dt;
        if (Math.floor(state.chop.progress * 3) !== Math.floor((state.chop.progress - dt) * 3)) audio.chop();
        if (state.chop.progress >= CHOP_SECONDS) {
          const kind = state.chop.item.kind;
          state.chop.item = null;
          state.chop.progress = 0;
          state.hands = { kind, state: 'chopped' };
          audio.chopDone();
          popup(state.chef.x, state.chef.y - 60, 'Chopped!', '#9be37e');
        }
      }
    }

    // Grill: raw -> cooked -> burnt.
    let cooking = false;
    for (const slot of state.grill) {
      if (!slot.item) continue;
      slot.item.timer += dt;
      if (slot.item.state === 'raw') {
        cooking = true;
        if (slot.item.timer >= COOK_SECONDS) {
          slot.item.state = 'cooked';
          audio.chopDone();
          popup(595, 200, 'Cooked!', '#ffd166');
        }
      } else if (slot.item.state === 'cooked') {
        cooking = true;
        if (slot.item.timer >= COOK_SECONDS + BURN_AFTER) {
          slot.item.state = 'burnt';
          events |= EVENT_BURN;
          audio.expire();
          popup(595, 200, 'BURNT!', '#ff6b5e');
          say('A patty burnt on the grill!', 2.5);
        }
      }
      if (slot.item.state === 'burnt' && random() < dt * 6) {
        state.particles.push({
          x: 540 + random() * 110,
          y: 225,
          vx: (random() - 0.5) * 20,
          vy: -30 - random() * 30,
          life: 0.8,
          color: '#888888',
          size: 4 + random() * 4,
        });
      }
    }
    if (cooking && !state.sizzleOn) {
      state.sizzleOn = true;
      audio.startSizzle();
    } else if (!cooking && state.sizzleOn) {
      state.sizzleOn = false;
      audio.stopSizzle();
    }
    if (cooking && random() < dt * 8) {
      state.particles.push({
        x: 500 + random() * 190,
        y: 225,
        vx: (random() - 0.5) * 16,
        vy: -26 - random() * 26,
        life: 0.7,
        color: '#ffffff',
        size: 2 + random() * 3,
      });
    }

    // Orders: spawn and patience.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      state.spawnTimer = spawnEveryFor(state.day);
      if (state.orders.length < MAX_ORDERS) spawnOrder();
    }
    for (const order of [...state.orders]) {
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders = state.orders.filter((o) => o.id !== order.id);
        state.missed += 1;
        state.combo = 0;
        state.hearts -= 1;
        events |= EVENT_EXPIRE;
        audio.expire();
        popup(640, 200, `${order.customer.name} walked out!`, '#ff6b5e');
        say(`${order.customer.name} left hungry — patience ran out!`, 2.5);
        if (state.hearts <= 0) {
          state.closed = true;
          events |= EVENT_CLOSED;
          audio.stopSizzle();
        }
      }
    }

    // Shift timer.
    state.timeLeft -= dt;
    const whole = Math.ceil(state.timeLeft);
    if (state.timeLeft <= 10.5 && whole !== state.lastTickSecond && whole > 0) {
      state.lastTickSecond = whole;
      audio.tick();
    }
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.over = true;
      events |= EVENT_SHIFT_END;
      audio.stopSizzle();
      audio.shiftEnd();
    }

    if (state.messageTimer > 0) state.messageTimer -= dt;
    for (const p of state.popups) p.life -= dt;
    state.popups = state.popups.filter((p) => p.life > 0);
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    return events;
  }

  /** Stars earned for the finished shift (0–3). */
  function stars() {
    if (state.served >= 7) return 3;
    if (state.served >= 5) return 2;
    if (state.served >= 2) return 1;
    return 0;
  }

  reset(1);
  return { state, reset, step, interact, nearestStation, hintFor, stars };
}
