// audio.js — Web Audio API beep sounds for timer alerts
const Audio = (() => {
  let ctx = null;

  function getContext() {
    if (!ctx || ctx.state === 'closed') {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function beep(freq, duration, type = 'sine') {
    const c = getContext();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.5, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  return {
    // Short tick for countdown 3-2-1
    tick() {
      beep(800, 0.15);
    },

    // Work starts — high pitched go!
    work() {
      beep(1200, 0.4);
    },

    // Rest starts — lower tone
    rest() {
      beep(440, 0.4);
    },

    // Workout complete — triple beep
    complete() {
      const c = getContext();
      [0, 0.2, 0.4].forEach(delay => {
        setTimeout(() => beep(1000, 0.25, 'square'), delay * 1000);
      });
    },

    // Ensure AudioContext is unlocked (call on first user gesture)
    unlock() {
      const c = getContext();
      const osc = c.createOscillator();
      const gain = c.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.001);
    }
  };
})();

export default Audio;
