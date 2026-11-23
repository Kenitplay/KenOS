// ============================================================
// KenOS Sound Engine
// Small synthesized UI sounds (Web Audio API) shared by the boot screen,
// the OS <-> Web transition, icon reset, and windows.
// - One shared AudioContext, created lazily and resumed on first user gesture
//   (browsers block audio until the visitor interacts with the page).
// - Respects the taskbar mute toggle (remembered in localStorage).
// ============================================================
(function () {
  'use strict';

  const MUTE_KEY = 'kenos_sound_muted';
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let muted = false;
  let humNodes = null;

  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) {
    muted = false;
  }

  function getCtx() {
    if (ctx) return ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  // Unlock audio on the first interaction
  function unlock() {
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, unlock, { capture: true, passive: true });
  });

  function ready() {
    if (muted) return null;
    const c = getCtx();
    if (!c) return null;
    if (c.state === 'suspended') c.resume();
    return c;
  }

  function getNoise(c) {
    if (noiseBuffer) return noiseBuffer;
    const len = c.sampleRate * 1.5;
    noiseBuffer = c.createBuffer(1, len, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return noiseBuffer;
  }

  // ---------- primitives ----------

  // Simple enveloped oscillator, optional pitch glide
  function tone(freq, opts) {
    const c = ready();
    if (!c) return;
    const o = Object.assign({ type: 'sine', duration: 0.15, volume: 0.05, delay: 0, glideTo: null, attack: 0.008 }, opts);
    const t0 = c.currentTime + o.delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = o.type;
    osc.frequency.setValueAtTime(freq, t0);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, t0 + o.duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(o.volume, t0 + o.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + o.duration + 0.05);
  }

  // Filtered noise sweep — "whoosh" up (opening) or down (closing)
  function whoosh(direction, opts) {
    const c = ready();
    if (!c) return;
    const o = Object.assign({ duration: 0.7, volume: 0.09, delay: 0 }, opts);
    const t0 = c.currentTime + o.delay;
    const src = c.createBufferSource();
    src.buffer = getNoise(c);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.4;
    const from = direction === 'down' ? 3200 : 260;
    const to = direction === 'down' ? 220 : 3600;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(to, t0 + o.duration);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(o.volume, t0 + o.duration * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
    src.stop(t0 + o.duration + 0.05);
  }

  // Tiny noise tick — keyboard / relay click
  function click(opts) {
    const c = ready();
    if (!c) return;
    const o = Object.assign({ volume: 0.035, delay: 0, freq: 2400 }, opts);
    const t0 = c.currentTime + o.delay;
    const src = c.createBufferSource();
    src.buffer = getNoise(c);
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = o.freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(o.volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0, Math.random());
    src.stop(t0 + 0.05);
  }

  // ---------- composed effects ----------

  const Sound = {
    get muted() { return muted; },

    setMuted(value) {
      muted = !!value;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* ignore */ }
      if (muted) Sound.humStop();
      document.dispatchEvent(new CustomEvent('kenos:mute', { detail: { muted } }));
    },

    toggleMute() {
      Sound.setMuted(!muted);
      if (!muted) Sound.confirm();
      return muted;
    },

    tone,
    whoosh,
    click,

    // Soft key-press for typewriter text
    type() {
      click({ volume: 0.018 + Math.random() * 0.012, freq: 2000 + Math.random() * 1500 });
    },

    // Short UI blip
    blip(freq, type) {
      tone(freq || 880, { type: type || 'sine', duration: 0.09, volume: 0.04 });
    },

    // Stage step in the transition: blip + relay click
    step(freq, type) {
      tone(freq, { type: type || 'triangle', duration: 0.14, volume: 0.045 });
      tone(freq * 2, { type: 'sine', duration: 0.08, volume: 0.015, delay: 0.03 });
      click({ volume: 0.03, delay: 0.005 });
    },

    // Ascending arpeggio — "system ready"
    ready(base) {
      const b = base || 523.25;
      [1, 1.25, 1.5, 2].forEach((m, i) => {
        tone(b * m, { type: 'triangle', duration: 0.32, volume: 0.05, delay: i * 0.075 });
      });
      tone(b * 4, { type: 'sine', duration: 0.6, volume: 0.02, delay: 0.3 });
    },

    // Confirmation double-beep
    confirm() {
      tone(660, { type: 'sine', duration: 0.08, volume: 0.04 });
      tone(990, { type: 'sine', duration: 0.12, volume: 0.04, delay: 0.09 });
    },

    // Low sci-fi hum that swells while the transition runs
    humStart(freq) {
      const c = ready();
      if (!c || humNodes) return;
      const f = freq || 55;
      const t0 = c.currentTime;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.035, t0 + 0.8);
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, t0);
      filter.frequency.linearRampToValueAtTime(1400, t0 + 3.5);
      const o1 = c.createOscillator();
      const o2 = c.createOscillator();
      o1.type = 'sawtooth';
      o2.type = 'sawtooth';
      o1.frequency.setValueAtTime(f, t0);
      o2.frequency.setValueAtTime(f * 1.007, t0);
      o1.frequency.exponentialRampToValueAtTime(f * 2, t0 + 3.6);
      o2.frequency.exponentialRampToValueAtTime(f * 2.014, t0 + 3.6);
      // gentle wobble
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 5;
      lfoGain.gain.value = 60;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      o1.connect(filter);
      o2.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      o1.start(t0);
      o2.start(t0);
      lfo.start(t0);
      humNodes = { gain, oscs: [o1, o2, lfo] };
    },

    humStop() {
      if (!humNodes || !ctx) return;
      const t0 = ctx.currentTime;
      const nodes = humNodes;
      humNodes = null;
      nodes.gain.gain.cancelScheduledValues(t0);
      nodes.gain.gain.setValueAtTime(Math.max(nodes.gain.gain.value, 0.0001), t0);
      nodes.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      nodes.oscs.forEach(o => o.stop(t0 + 0.55));
    },

    // Icon reset: whoosh as they lift off, then a pop per icon landing
    resetStart() {
      whoosh('up', { duration: 0.45, volume: 0.05 });
      tone(330, { type: 'triangle', duration: 0.25, volume: 0.035, glideTo: 660 });
    },

    pop(index) {
      const scale = [523.25, 587.33, 659.25, 783.99, 880, 987.77, 1046.5, 1174.66];
      const f = scale[(index || 0) % scale.length];
      tone(f, { type: 'sine', duration: 0.12, volume: 0.04, glideTo: f * 1.5 });
      click({ volume: 0.02 });
    },

    // Windows
    windowOpen() {
      tone(440, { type: 'sine', duration: 0.12, volume: 0.035, glideTo: 880 });
      click({ volume: 0.02, delay: 0.02 });
    },

    windowClose() {
      tone(700, { type: 'sine', duration: 0.12, volume: 0.03, glideTo: 350 });
    },

    // Boot chime (only audible if the visitor has already interacted)
    boot() {
      Sound.ready(440);
    }
  };

  window.KenOSSound = Sound;
})();
