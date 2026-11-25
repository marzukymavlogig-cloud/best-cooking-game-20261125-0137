// Boot and the one loop: input is read once per frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between four screens: title, play, paused and shift over.
//
// ?seed=N fixes the order queue. ?shot=cover|serve|play|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_CLOSED, EVENT_SHIFT_END } from './world.js';
import {
  ACTION_CONFIRM,
  ACTION_INTERACT,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  createInput,
} from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();
const world = createWorld(createRandom(seed), audio);
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best, '');
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let interactQueued = false;

  // Test hooks: the play-test drives the real game through these.
  window.__game = {
    world,
    screen: () => screen,
    start: () => startShift(1),
  };

  function announce(message) {
    status.textContent = message;
  }

  function startShift(day) {
    world.reset(day);
    accumulator = 0;
    interactQueued = false;
    screen = SCREEN_PLAY;
    announce(`Day ${day}. Serve the orders before time runs out!`);
  }

  function endShift() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Shift over. Score ${world.state.score}. Best ${best}.`);
  }

  /** Screen changes from this frame's actions. Runs once per frame. */
  function handleActions(actions) {
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_INTERACT) interactQueued = true;
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) {
      startShift(world.state.day);
      return;
    }
    if (actions & ACTION_CONFIRM && screen === SCREEN_TITLE) startShift(1);
    else if (actions & ACTION_CONFIRM && screen === SCREEN_OVER) startShift(world.state.day + 1);
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopSizzle();
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    const dir = input.direction();
    const click = input.takeClick();
    if (click) audio.unlock();
    const pressed = interactQueued;
    interactQueued = false;
    const events = world.step(STEP, dir, pressed, click);
    if (events & (EVENT_SHIFT_END | EVENT_CLOSED)) endShift();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions(input.takeActions());
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      input.takeClick();
    }
    const hint = screen === SCREEN_PLAY ? world.hintFor(world.nearestStation()) : '';
    renderer.draw(world, screen, best, hint);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopSizzle();
      announce('Paused.');
    }
  });

  announce('Ember and Oak Rush Hour Kitchen. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
