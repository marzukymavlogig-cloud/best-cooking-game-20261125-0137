// Ember & Oak — Rush Hour Kitchen: everything painted on the canvas.
// One job: draw the state. It never changes the state.
import { CHEF, INGREDIENTS, RECIPES, STATIONS, VIEW } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = '700') {
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

/** Draw one ingredient as a little painted morsel. */
export function drawIngredient(ctx, kind, ingredientState, x, y, r) {
  const ing = INGREDIENTS[kind];
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 2, r, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-r, 0, r * 2, r * 0.35);
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-r * 0.4, -r * 0.45], [0, -r * 0.6], [r * 0.4, -r * 0.45]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = ingredientState === 'burnt' ? '#1f1a17' : ing.color;
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4);
    ctx.fill();
    ctx.fillStyle = ingredientState === 'burnt' ? '#3a332e' : ing.dark;
    for (const [sx, sy] of [[-r * 0.5, 0], [0, -r * 0.2], [r * 0.45, r * 0.15]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(r, r * 0.6);
    ctx.lineTo(0, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [sx, sy] of [[-r * 0.3, r * 0.2], [r * 0.25, r * 0.25]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8fce62';
    ctx.beginPath();
    ctx.arc(0, -r * 0.75, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    if (ingredientState === 'chopped') {
      ctx.strokeStyle = '#ffd9cf';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.4);
      ctx.lineTo(r * 0.6, r * 0.4);
      ctx.moveTo(r * 0.6, -r * 0.4);
      ctx.lineTo(-r * 0.6, r * 0.4);
      ctx.stroke();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(-r * 0.4, r * 0.2, r * 0.6, 0, Math.PI * 2);
    ctx.arc(r * 0.35, -r * 0.1, r * 0.65, 0, Math.PI * 2);
    ctx.arc(0, r * 0.35, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.7, 0.4, 2.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlate(ctx, items, x, y, r) {
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c2b2';
  ctx.lineWidth = 2;
  ctx.stroke();
  items.forEach((item, i) => {
    drawIngredient(ctx, item.kind, item.state, x + (i - (items.length - 1) / 2) * r * 0.85, y - 4 - i * 2, r * 0.42);
  });
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = VIEW.width * dpr;
  canvas.height = VIEW.height * dpr;
  ctx.scale(dpr, dpr);

  function drawHeader(s) {
    ctx.fillStyle = '#2b1d12';
    ctx.fillRect(0, 0, VIEW.width, 58);
    text(ctx, 'EMBER & OAK', 24, 30, 26, '#ffb347', 'left', '800');
    text(ctx, 'Rush Hour Kitchen', 210, 31, 15, '#d8c3a5');
    // Shift timer.
    const urgent = s.timeLeft <= 30;
    ctx.fillStyle = '#1a120b';
    roundRect(ctx, 470, 14, 220, 30, 15);
    ctx.fill();
    const frac = s.timeLeft / 150;
    ctx.fillStyle = urgent ? '#ff5a4e' : '#7bc96f';
    roundRect(ctx, 474, 18, 212 * frac, 22, 11);
    ctx.fill();
    text(ctx, `⏱ ${formatTime(s.timeLeft)}`, 580, 30, 17, '#fff7e6', 'center');
    text(ctx, `SCORE ${s.score}`, 740, 30, 18, '#fff7e6');
    text(ctx, `🪙 ${s.coins}`, 900, 30, 18, '#ffd166');
    text(ctx, s.combo > 1 ? `COMBO x${s.combo}` : '', 1000, 30, 16, '#ff9d5c');
    let hearts = '';
    for (let i = 0; i < 3; i += 1) hearts += i < s.hearts ? '♥' : '♡';
    text(ctx, hearts, 1120, 30, 20, '#ff6b7a');
    text(ctx, `DAY ${s.day}`, 1210, 30, 16, '#d8c3a5', 'right');
  }

  function drawOrders(s) {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(0, 64, VIEW.width, 122);
    text(ctx, 'ORDER BOARD', 24, 84, 13, '#c9a86a', 'left', '800');
    if (s.orders.length === 0) {
      text(ctx, 'No orders yet — the lunch rush is coming…', 180, 130, 18, '#d8c3a5');
      return;
    }
    s.orders.forEach((order, i) => {
      const x = 180 + i * 268;
      const y = 74;
      const w = 252;
      const h = 104;
      const urgent = order.patience < 15;
      const ink = urgent ? '#ffe9b8' : '#2b1d12';
      const sub = urgent ? '#f0c9a8' : '#6b4a2f';
      const priceColor = urgent ? '#9be37e' : '#2b7a3d';
      ctx.fillStyle = urgent ? '#5a2b22' : '#fff8e7';
      roundRect(ctx, x, y, w, h, 10);
      ctx.fill();
      ctx.strokeStyle = urgent ? '#ff6b5e' : '#d9c49a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = order.customer.color;
      ctx.beginPath();
      ctx.arc(x + 26, y + 26, 15, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, order.customer.name[0], x + 26, y + 27, 16, '#fff', 'center');
      text(ctx, order.customer.name, x + 50, y + 20, 15, ink);
      text(ctx, order.recipe.name, x + 50, y + 40, 13, sub);
      order.recipe.needs.forEach((need, j) => {
        drawIngredient(ctx, need.kind, need.state, x + 24 + j * 34, y + 74, 13);
      });
      text(ctx, `$${order.recipe.price}`, x + w - 14, y + 74, 15, priceColor, 'right');
      const frac = Math.max(0, order.patience / order.maxPatience);
      ctx.fillStyle = '#e5dcc8';
      roundRect(ctx, x + 12, y + h - 16, w - 24, 8, 4);
      ctx.fill();
      ctx.fillStyle = frac > 0.5 ? '#7bc96f' : frac > 0.25 ? '#f7c948' : '#ff5a4e';
      roundRect(ctx, x + 12, y + h - 16, (w - 24) * frac, 8, 4);
      ctx.fill();
    });
  }

  function drawStationLabel(x, y, w, label, sub) {
    text(ctx, label, x + w / 2, y + 18, 13, '#f4e8d0', 'center', '800');
    if (sub) text(ctx, sub, x + w / 2, y + 36, 11, '#c9b18a', 'center');
  }

  function drawStations(s, near) {
    // Crates along the left wall.
    for (const crate of STATIONS.crates) {
      const hot = near && near.id === `crate-${crate.kind}`;
      ctx.fillStyle = hot ? '#8a6a3f' : '#6b4a2f';
      roundRect(ctx, crate.x, crate.y, crate.w, crate.h, 10);
      ctx.fill();
      ctx.strokeStyle = hot ? '#ffd166' : '#4a3018';
      ctx.lineWidth = hot ? 3 : 2;
      ctx.stroke();
      drawIngredient(ctx, crate.kind, 'raw', crate.x + crate.w / 2, crate.y + 42, 20);
      text(ctx, INGREDIENTS[crate.kind].label.toUpperCase(), crate.x + crate.w / 2, crate.y + crate.h - 14, 12, '#f4e8d0', 'center', '800');
    }
    // Chopping board.
    const chopHot = near && near.id === 'chop';
    ctx.fillStyle = chopHot ? '#a97e4f' : '#8a6a3f';
    roundRect(ctx, STATIONS.chop.x, STATIONS.chop.y, STATIONS.chop.w, STATIONS.chop.h, 10);
    ctx.fill();
    ctx.strokeStyle = chopHot ? '#ffd166' : '#5f4126';
    ctx.lineWidth = chopHot ? 3 : 2;
    ctx.stroke();
    drawStationLabel(STATIONS.chop.x, STATIONS.chop.y, STATIONS.chop.w, 'CHOP BOARD', 'hold E nearby');
    if (s.chop.item) {
      drawIngredient(ctx, s.chop.item.kind, 'raw', STATIONS.chop.x + 100, STATIONS.chop.y + 66, 18);
      const frac = s.chop.progress / 2.2;
      ctx.fillStyle = '#e5dcc8';
      roundRect(ctx, STATIONS.chop.x + 30, STATIONS.chop.y + 90, 140, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#7bc96f';
      roundRect(ctx, STATIONS.chop.x + 30, STATIONS.chop.y + 90, 140 * frac, 8, 4);
      ctx.fill();
    } else {
      ctx.fillStyle = '#d9c49a';
      ctx.beginPath();
      ctx.arc(STATIONS.chop.x + 100, STATIONS.chop.y + 66, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a6a3f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(STATIONS.chop.x + 84, STATIONS.chop.y + 66);
      ctx.lineTo(STATIONS.chop.x + 116, STATIONS.chop.y + 66);
      ctx.stroke();
    }
    // Grill.
    const grillHot = near && near.id === 'grill';
    ctx.fillStyle = grillHot ? '#4a4a52' : '#33333a';
    roundRect(ctx, STATIONS.grill.x, STATIONS.grill.y, STATIONS.grill.w, STATIONS.grill.h, 10);
    ctx.fill();
    ctx.strokeStyle = grillHot ? '#ffd166' : '#1d1d22';
    ctx.lineWidth = grillHot ? 3 : 2;
    ctx.stroke();
    drawStationLabel(STATIONS.grill.x, STATIONS.grill.y, STATIONS.grill.w, 'GRILL', '7s to cook — don\'t burn it!');
    s.grill.forEach((slot, i) => {
      const cx = STATIONS.grill.x + 70 + i * 110;
      const cy = STATIONS.grill.y + 66;
      ctx.fillStyle = '#1d1d22';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 42, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      if (slot.item) {
        if (slot.item.state === 'raw') {
          ctx.fillStyle = '#ff9d5c';
          ctx.beginPath();
          ctx.moveTo(cx - 12, cy + 8);
          ctx.quadraticCurveTo(cx - 16, cy - 14, cx, cy - 18);
          ctx.quadraticCurveTo(cx + 16, cy - 14, cx + 12, cy + 8);
          ctx.closePath();
          ctx.fill();
        }
        drawIngredient(ctx, 'patty', slot.item.state, cx, cy - 4, 17);
        if (slot.item.state === 'raw' || slot.item.state === 'cooked') {
          const total = slot.item.state === 'raw' ? 7 : 13;
          const frac = Math.min(1, slot.item.timer / total);
          ctx.fillStyle = '#e5dcc8';
          roundRect(ctx, cx - 30, cy + 18, 60, 6, 3);
          ctx.fill();
          ctx.fillStyle = slot.item.state === 'raw' ? '#ff9d5c' : '#7bc96f';
          roundRect(ctx, cx - 30, cy + 18, 60 * frac, 6, 3);
          ctx.fill();
        } else {
          text(ctx, 'BURNT', cx, cy + 26, 11, '#ff6b5e', 'center', '800');
        }
      }
    });
    // Plating counter.
    const plateHot = near && near.id === 'plate';
    ctx.fillStyle = plateHot ? '#7a5c38' : '#5f4630';
    roundRect(ctx, STATIONS.plate.x, STATIONS.plate.y, STATIONS.plate.w, STATIONS.plate.h, 10);
    ctx.fill();
    ctx.strokeStyle = plateHot ? '#ffd166' : '#3f2d1c';
    ctx.lineWidth = plateHot ? 3 : 2;
    ctx.stroke();
    drawStationLabel(STATIONS.plate.x, STATIONS.plate.y, STATIONS.plate.w, 'PLATING', 'build the dish here');
    if (s.plate) {
      drawPlate(ctx, s.plate.items, STATIONS.plate.x + 120, STATIONS.plate.y + 68, 34);
      if (s.plate.items.length === 0) text(ctx, 'empty plate', STATIONS.plate.x + 120, STATIONS.plate.y + 92, 11, '#c9b18a', 'center');
    } else {
      ctx.strokeStyle = '#d9c49a';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(STATIONS.plate.x + 120, STATIONS.plate.y + 68, 34, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Serving window.
    const serveHot = near && near.id === 'serve';
    ctx.fillStyle = serveHot ? '#2f5d3a' : '#24452c';
    roundRect(ctx, STATIONS.serve.x, STATIONS.serve.y, STATIONS.serve.w, STATIONS.serve.h, 10);
    ctx.fill();
    ctx.strokeStyle = serveHot ? '#ffd166' : '#122a18';
    ctx.lineWidth = serveHot ? 3 : 2;
    ctx.stroke();
    drawStationLabel(STATIONS.serve.x, STATIONS.serve.y, STATIONS.serve.w, 'SERVE', 'ring the bell!');
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(STATIONS.serve.x + 98, STATIONS.serve.y + 62, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(STATIONS.serve.x + 92, STATIONS.serve.y + 62, 12, 4);
    text(ctx, '🔔', STATIONS.serve.x + 98, STATIONS.serve.y + 88, 16, '#fff', 'center');
    // Trash bin.
    const trashHot = near && near.id === 'trash';
    ctx.fillStyle = trashHot ? '#5a5a62' : '#3f3f46';
    roundRect(ctx, STATIONS.trash.x, STATIONS.trash.y, STATIONS.trash.w, STATIONS.trash.h, 10);
    ctx.fill();
    ctx.strokeStyle = trashHot ? '#ffd166' : '#26262b';
    ctx.lineWidth = trashHot ? 3 : 2;
    ctx.stroke();
    text(ctx, '🗑', STATIONS.trash.x + 66, STATIONS.trash.y + 38, 26, '#fff', 'center');
    text(ctx, 'TRASH', STATIONS.trash.x + 66, STATIONS.trash.y + STATIONS.trash.h - 14, 12, '#f4e8d0', 'center', '800');
  }

  function drawChef(s) {
    const c = s.chef;
    ctx.save();
    ctx.translate(c.x, c.y);
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body (apron) and head.
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath();
    ctx.arc(0, 6, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b96a';
    ctx.fillRect(-22, -2, 44, 8);
    ctx.fillStyle = '#f7d9a8';
    ctx.beginPath();
    ctx.arc(0, -20, 15, 0, Math.PI * 2);
    ctx.fill();
    // Chef hat.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -34, 9, 0, Math.PI * 2);
    ctx.arc(0, -38, 10, 0, Math.PI * 2);
    ctx.arc(8, -34, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-13, -36, 26, 6);
    // Eyes face the walking direction.
    ctx.fillStyle = '#2b1d12';
    ctx.beginPath();
    ctx.arc(c.face * 5 - 4, -20, 2, 0, Math.PI * 2);
    ctx.arc(c.face * 5 + 4, -20, 2, 0, Math.PI * 2);
    ctx.fill();
    // What the chef carries, held up high.
    if (s.hands) {
      if (s.hands.kind === 'plate') {
        drawPlate(ctx, s.hands.items, 0, -58, 26);
      } else {
        drawIngredient(ctx, s.hands.kind, s.hands.state, 0, -58, 16);
      }
    }
    ctx.restore();
  }

  function drawHint(s, hint) {
    ctx.fillStyle = 'rgba(43,29,18,0.92)';
    roundRect(ctx, 180, 800, 920, 44, 12);
    ctx.fill();
    const msg = s.messageTimer > 0 ? s.message : hint;
    text(ctx, msg, 640, 823, 16, '#ffe9b8', 'center');
  }

  function drawParticles(s) {
    for (const p of s.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const p of s.popups) {
      ctx.globalAlpha = Math.min(1, p.life);
      text(ctx, p.text, p.x, p.y - (1.4 - p.life) * 30, 18, p.color, 'center', '800');
    }
    ctx.globalAlpha = 1;
  }

  function drawFloor() {
    ctx.fillStyle = '#c98f5f';
    ctx.fillRect(0, 186, VIEW.width, VIEW.height - 186);
    ctx.fillStyle = '#bd8253';
    for (let y = 200; y < VIEW.height; y += 64) {
      for (let x = ((y / 64) % 2) * 64; x < VIEW.width; x += 128) {
        ctx.fillRect(x, y, 124, 4);
      }
    }
    // Rug in the middle of the floor.
    ctx.fillStyle = '#7a3b2e';
    roundRect(ctx, 480, 520, 320, 180, 16);
    ctx.fill();
    ctx.strokeStyle = '#e8b96a';
    ctx.lineWidth = 3;
    roundRect(ctx, 496, 536, 288, 148, 12);
    ctx.stroke();
    text(ctx, 'EMBER & OAK', 640, 610, 20, '#e8b96a', 'center', '800');
    // Window on the left wall, above the crates, with herb pots.
    ctx.fillStyle = '#8fb8d9';
    roundRect(ctx, 36, 208, 108, 96, 8);
    ctx.fill();
    ctx.strokeStyle = '#5f4126';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#d9c49a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, 208);
    ctx.lineTo(90, 304);
    ctx.moveTo(36, 256);
    ctx.lineTo(144, 256);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(118, 230, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b4632a';
    ctx.fillRect(44, 288, 22, 12);
    ctx.fillRect(112, 288, 22, 12);
    ctx.fillStyle = '#4d9b42';
    ctx.beginPath();
    ctx.arc(55, 284, 8, 0, Math.PI * 2);
    ctx.arc(123, 284, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(20,12,6,0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, 340, 190, 600, 440, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.stroke();
    text(ctx, title, 640, 250, 34, '#2b1d12', 'center', '800');
    lines.forEach((line, i) => {
      text(ctx, line, 640, 300 + i * 34, 18, '#4a3524', 'center');
    });
  }

  function draw(world, screen, best, hint) {
    const s = world.state;
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    drawFloor();
    drawHeader(s);
    drawOrders(s);
    drawStations(s, screen === SCREEN_PLAY ? world.nearestStation() : null);
    drawChef(s);
    drawParticles(s);
    if (screen === SCREEN_PLAY) drawHint(s, hint || '');
    if (screen === SCREEN_TITLE) {
      overlay('EMBER & OAK', [
        'Rush Hour Kitchen — a one-chef race against the lunch crowd.',
        '',
        'WASD / arrows to move  •  click a station to walk to it',
        'E to pick up, chop, grill, plate and serve',
        'Chop veg, grill patties (7s — they burn!), build the dish,',
        'and serve it before the customer walks out.',
        '',
        'Press SPACE or click to start the shift',
      ], '#ffb347');
    } else if (screen === SCREEN_PAUSED) {
      overlay('PAUSED', ['Take a breath, chef.', '', 'P / Esc to keep cooking   •   R to restart   •   M to mute'], '#8fb8ff');
    } else if (screen === SCREEN_OVER) {
      const stars = world.stars();
      const starLine = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      const lines = [
        starLine,
        `Dishes served: ${s.served}    Walk-outs: ${s.missed}`,
        `Coins earned: ${s.coins}    Best combo: x${s.bestCombo}`,
        `Final score: ${s.score}    Best: ${best}`,
        '',
        s.closed ? 'The kitchen closed — too many walk-outs!' : 'Shift complete!',
        '',
        'ENTER — next day (faster!)    •    R — replay this day',
      ];
      overlay(s.closed ? 'KITCHEN CLOSED' : 'SHIFT COMPLETE!', lines, '#ffd166');
    }
  }

  return { draw, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER };
}
