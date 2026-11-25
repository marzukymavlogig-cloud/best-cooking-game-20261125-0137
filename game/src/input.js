// Keyboard and mouse, read once a frame. WASD / arrows move the chef,
// E or Space uses the nearest station, P or Escape pauses, R restarts,
// M mutes, Enter confirms on menus. Clicking sets a walk target; clicking
// a station walks the chef there and uses it on arrival.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;
export const ACTION_INTERACT = 16;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let click = null;
  let clickConsumed = true;

  function codeOf(e) {
    return e.code;
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'Enter') actions |= ACTION_CONFIRM;
    if (e.code === 'Space') actions |= ACTION_CONFIRM | ACTION_INTERACT;
    if (e.code === 'KeyP' || e.code === 'Escape') actions |= ACTION_PAUSE;
    if (e.code === 'KeyR') actions |= ACTION_RESTART;
    if (e.code === 'KeyM') actions |= ACTION_MUTE;
    if (e.code === 'KeyE') actions |= ACTION_INTERACT;
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    click = { x, y };
    clickConsumed = false;
  });

  return {
    /** Movement vector from held keys, normalised. */
    direction() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        const len = Math.hypot(x, y);
        x /= len;
        y /= len;
      }
      return { x, y };
    },
    /** True while E or Space is held (chop keeps working while held). */
    interactHeld() {
      return keys.has('KeyE') || keys.has('Space');
    },
    takeActions() {
      const out = actions;
      actions = 0;
      return out;
    },
    takeClick() {
      if (clickConsumed || !click) return null;
      clickConsumed = true;
      return click;
    },
    clearClick() {
      clickConsumed = true;
    },
  };
}
