import { normalizeAmbience } from './cozy-model.js';

// Locally synthesized loops: no audio downloads, microphones, or autoplay.
export function ambientLevels(prefs, scene) {
  const p = normalizeAmbience(prefs);
  scene = ['courtyard','shared','discoveries'].includes(scene) ? 'village' : ['wardrobe','clockwork'].includes(scene) ? 'room' : scene === 'apprentices' ? 'tavern' : scene;
  return {
    rain: p.rain && p.weather === 'rain' && ['village', 'room', 'lake'].includes(scene) ? p.volume * (scene === 'room' ? .018 : .035) : 0,
    fire: p.fire && ['room', 'tavern'].includes(scene) ? p.volume * .055 : 0,
    cafe: p.cafe && ['village', 'tavern', 'festival'].includes(scene) ? p.volume * .024 : 0
  };
}
export function createAmbience(readPrefs, readScene, { doc = document, win = window } = {}) {
  let context = null, channels = null, activated = false, focused = true, disposed = false;
  const listeners = [];
  const listen = (target, type, fn) => { target.addEventListener(type, fn); listeners.push(() => target.removeEventListener(type, fn)); };
  const create = () => {
    const Audio = win.AudioContext || win.webkitAudioContext;
    if (!Audio) return;
    context = new Audio(); channels = {};
    for (const kind of ['rain', 'fire', 'cafe']) {
      const buffer = context.createBuffer(1, context.sampleRate * 8, context.sampleRate), data = buffer.getChannelData(0);
      let smooth = 0;
      for (let i = 0; i < data.length; i++) {
        const noise = Math.random() * 2 - 1, t = i / context.sampleRate;
        smooth = .985 * smooth + .015 * noise;
        if (kind === 'rain') data[i] = noise * .35;
        if (kind === 'fire') data[i] = smooth * 3 + (Math.random() < .0002 ? noise * .35 : 0);
        if (kind === 'cafe') {
          const phase = t % 2.6;
          data[i] = smooth * 1.5 + (phase < .18 ? Math.sin(2 * Math.PI * 1800 * phase) * Math.exp(-phase * 35) * .08 : 0);
        }
        // Silence at the seam keeps the loop from clicking.
        data[i] *= Math.min(1, t / .06, (8 - t) / .06);
      }
      const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
      source.buffer = buffer; source.loop = true; filter.type = 'lowpass'; filter.frequency.value = kind === 'rain' ? 2400 : kind === 'fire' ? 1200 : 2200;
      gain.gain.value = 0; source.connect(filter); filter.connect(gain); gain.connect(context.destination); source.start();
      channels[kind] = { source, gain };
    }
  };
  const update = () => {
    if (disposed) return;
    const levels = ambientLevels(readPrefs(), readScene());
    const audible = activated && focused && !doc.hidden && Object.values(levels).some(level => level > 0);
    try {
      if (!context && audible) create();
      if (!context) return;
      for (const [kind, channel] of Object.entries(channels)) channel.gain.gain.setTargetAtTime(audible ? levels[kind] : 0, context.currentTime, .15);
      if (audible) context.resume().catch(() => {});
      else context.suspend().catch(() => {});
    } catch { /* Optional audio never blocks the game. */ }
  };
  const activate = () => { activated = true; update(); };
  listen(doc, 'pointerdown', activate); listen(doc, 'keydown', activate);
  listen(doc, 'visibilitychange', update);
  listen(win, 'blur', () => { focused = false; update(); });
  listen(win, 'focus', () => { focused = true; update(); });
  listen(win, 'pagehide', () => { focused = false; update(); });
  listen(win, 'pageshow', () => { focused = true; update(); });
  return {
    update,
    dispose() {
      if (disposed) return; disposed = true; listeners.splice(0).forEach(remove => remove());
      for (const channel of Object.values(channels || {})) { channel.source.stop(); channel.source.disconnect(); channel.gain.disconnect(); }
      context?.close().catch(() => {}); channels = null; context = null;
    }
  };
}
