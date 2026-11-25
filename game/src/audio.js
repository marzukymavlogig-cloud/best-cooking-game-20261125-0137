// All sound is synthesized with WebAudio: no audio files, no network.
// Short oscillator blips and filtered noise make the chop, sizzle, ding and
// buzz. Nothing plays until the player first presses a key or clicks, and
// M toggles mute at any time.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let sizzle = null;

  function ensure() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, gain, filterFreq) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(ac.destination);
    src.start(t);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopSizzle();
      return muted;
    },
    isMuted() {
      return muted;
    },
    chop() {
      noise(0.09, 0.25, 1800);
      tone(180, 0.07, 'triangle', 0.12, 90);
    },
    chopDone() {
      tone(520, 0.09, 'square', 0.08);
      tone(780, 0.12, 'square', 0.08);
    },
    place() {
      tone(300, 0.06, 'sine', 0.12, 220);
    },
    pickup() {
      tone(440, 0.07, 'sine', 0.1, 560);
    },
    serve() {
      tone(660, 0.1, 'sine', 0.14);
      setTimeout(() => tone(880, 0.14, 'sine', 0.14), 90);
      setTimeout(() => tone(1320, 0.18, 'sine', 0.1), 180);
    },
    reject() {
      tone(160, 0.18, 'sawtooth', 0.12, 110);
    },
    expire() {
      tone(220, 0.25, 'triangle', 0.12, 140);
    },
    tick() {
      tone(980, 0.05, 'square', 0.05);
    },
    startSizzle() {
      if (muted || sizzle) return;
      const ac = ensure();
      if (!ac) return;
      const len = ac.sampleRate;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      const g = ac.createGain();
      g.gain.value = 0.035;
      src.connect(filter).connect(g).connect(ac.destination);
      src.start();
      sizzle = { src, g };
    },
    stopSizzle() {
      if (!sizzle) return;
      try {
        sizzle.src.stop();
      } catch {
        // Already stopped.
      }
      sizzle = null;
    },
    shiftEnd() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'sine', 0.12), i * 130));
    },
  };
}
