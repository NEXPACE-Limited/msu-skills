// Audio foundation for a browser game: one context, one master gain, one gain per group,
// settings persisted, unlock on a qualifying gesture, pause when hidden. Slot names
// (`play('jump')`) are the game's; what plays behind a name is the builder's choice.
// A synthesized game replaces load() with a function that builds an AudioBuffer (or wires
// oscillators into the same gain groups); everything else stays.
const SETTINGS_KEY = 'audio-settings';
const readSettings = () => {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
};
let settings = { master: 0.8, music: 0.6, sfx: 1, muted: false, ...readSettings() };

// Created at load; every browser allows that. It stays `suspended` until a gesture resumes it.
const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
const gains = { master: ctx.createGain(), music: ctx.createGain(), sfx: ctx.createGain() };
gains.music.connect(gains.master);
gains.sfx.connect(gains.master);
gains.master.connect(ctx.destination);

function applySettings() {
  gains.master.gain.value = settings.muted ? 0 : settings.master;
  gains.music.gain.value = settings.music;
  gains.sfx.gain.value = settings.sfx;
}
function setSetting(key, value) {
  settings = { ...settings, [key]: value };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* storage off: in-memory only */ }
  applySettings();
}
applySettings();

// The first format the browser can decode wins. MP3 first: it plays everywhere.
const FORMATS = [['audio/mpeg', 'mp3'], ['audio/mp4; codecs="mp4a.40.2"', 'm4a'], ['audio/ogg; codecs="vorbis"', 'ogg']];
const ext = (FORMATS.find(([mime]) => document.createElement('audio').canPlayType(mime)) || FORMATS[0])[1];

const buffers = {};
async function load(name) {                      // load('jump') -> sfx/jump.mp3 (or .m4a, .ogg)
  const res = await fetch(`sfx/${name}.${ext}`);
  if (!res.ok) throw new Error(`audio ${name}: HTTP ${res.status}`);
  buffers[name] = await ctx.decodeAudioData(await res.arrayBuffer());   // decoding works while suspended
}

// Nothing is scheduled while the clock is stopped: a source started on a suspended or
// interrupted context waits at a frozen currentTime, and every one started that way begins
// together on resume. Dropping the request costs one sound; queuing it costs a burst.
function play(name, { group = 'sfx', loop = false } = {}) {
  if (!buffers[name] || ctx.state !== 'running') return null;
  const src = ctx.createBufferSource();
  src.buffer = buffers[name];
  src.loop = loop;                               // sample-accurate; no gap at the seam
  src.connect(gains[group]);
  src.start();
  return src;
}

let music = null;
function startMusic() {
  if (!music && buffers.music) music = play('music', { group: 'music', loop: true });
}

// Unlock on events that grant user activation. `touchstart` and a touch `pointerdown` do not,
// so a listener there leaves the context suspended on Chrome for Android. The listeners stay
// attached: a resume after an interruption (call, Siri, screen lock) needs a gesture too.
function unlock() {
  if (ctx.state === 'running') { startMusic(); return; }
  ctx.resume().then(() => { if (ctx.state === 'running') startMusic(); });
}
for (const type of ['pointerup', 'touchend', 'keydown', 'click']) {
  window.addEventListener(type, unlock, { passive: true });
}

// Hidden tab or backgrounded app: stop the clock; resume when visible. On WebKit the state may
// read `interrupted` instead of `suspended`, and the next gesture (above) finishes the resume.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) ctx.suspend(); else ctx.resume();
});

// Policy — the builder's call, stated in the report, not defaulted here:
//   play through the iOS ringer switch:  if (navigator.audioSession) navigator.audioSession.type = 'playback';
//   (it also pauses the player's own music app; the default 'auto' is silenced by the switch.)
