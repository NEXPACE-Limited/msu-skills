#!/usr/bin/env node
// Checks a game's audio foundation without a browser: stub AudioContext, events, storage and
// fetch, run the audio script, assert the code contract the conditions require. Policies —
// activation, the ringer switch, the embed — cannot be checked here and stay inferred.
//
//   node contract-check.js                    checks setup-pattern.js beside this file
//   node contract-check.js path/to/audio.js   checks a game's own audio script
//   EXPOSE='__audio = { ctx: audioCtx, gains, play, load, setSetting, get music() { return bgm; } }' \
//     node contract-check.js path/to/audio.js   same, with the script's own names
//
// EXPOSE names what the script keeps private: ctx, gains (master/music/sfx), play(name, {group,
// loop}), load(name), setSetting(key, value), music. The DOM stub covers what an audio script
// usually touches (element lookup, listeners, timers); extend it when the script needs more.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const file = process.argv[2] || path.join(__dirname, 'setup-pattern.js');
const EXPOSE = '\n;' + (process.env.EXPOSE || '__audio = { ctx, gains, play, load, setSetting, get music() { return music; } };');

// Web Audio stubs: enough surface for a game's audio script (gain, buffers, sources, oscillators,
// filters, offline rendering for synthesized placeholders). Nothing renders; only calls are recorded.
const param = v => ({ value: v, setValueAtTime() { return this; }, linearRampToValueAtTime() { return this; },
                      exponentialRampToValueAtTime() { return this; }, setTargetAtTime() { return this; },
                      cancelScheduledValues() { return this; } });
const node = () => ({ connect(t) { this.target = t; return t; }, disconnect() {}, start() { this.started = true; },
                      stop() {}, type: 'sine', frequency: param(440), detune: param(0), Q: param(1),
                      playbackRate: param(1), pan: param(0) });
const buffer = (ch, len, rate) => ({ numberOfChannels: ch, length: len, sampleRate: rate, duration: len / rate,
                                     getChannelData: () => new Float32Array(len), copyToChannel() {} });
class Gain { constructor() { this.gain = param(1); } connect(t) { this.target = t; return t; } disconnect() {} }
class Source {
  constructor(list) { this.loop = false; this.buffer = null; this.started = false; this.playbackRate = param(1); list.push(this); }
  connect(t) { this.target = t; return t; }
  start() { this.started = true; }
  stop() {}
}
class FakeAudioContext {
  constructor(opts) {
    this.opts = opts; this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 48000;
    this.destination = {}; this.sources = []; this.suspends = 0; this.allowResume = true;
  }
  createGain() { return new Gain(); }
  createBufferSource() { return new Source(this.sources); }
  createBuffer(ch, len, rate) { return buffer(ch, len, rate); }
  createOscillator() { return node(); }
  createBiquadFilter() { return node(); }
  createStereoPanner() { return node(); }
  createDynamicsCompressor() { return node(); }
  async decodeAudioData(buf) { return buffer(1, buf.byteLength, this.sampleRate); }
  async resume() { if (this.allowResume) this.state = 'running'; }   // no activation: stays put
  async suspend() { this.suspends++; this.state = 'suspended'; }
  addEventListener() {}
}
class FakeOfflineAudioContext extends FakeAudioContext {
  constructor(ch, len, rate) { super({}); this.state = 'running'; this.length = len; this.sampleRate = rate; }
  async startRendering() { return buffer(1, this.length, this.sampleRate); }
}

function boot(stored = {}) {
  const listeners = { window: {}, document: {} };
  const on = bag => (type, fn) => { (bag[type] ||= []).push(fn); };
  const storage = { ...stored };
  const contexts = [];
  const el = () => ({ addEventListener() {}, setAttribute() {}, getAttribute: () => null, removeAttribute() {},
                      appendChild() {}, focus() {}, textContent: '', value: '', hidden: false, style: {}, dataset: {},
                      classList: { add() {}, remove() {}, toggle() {} } });
  const sandbox = {
    console, navigator: {}, setTimeout, clearTimeout, setInterval, clearInterval,
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    localStorage: { getItem: k => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } },
    document: { hidden: false, visibilityState: 'visible', addEventListener: on(listeners.document),
                getElementById: el, querySelector: el, querySelectorAll: () => [], body: el(),
                createElement: () => ({ ...el(), canPlayType: t => (t.startsWith('audio/mpeg') ? 'probably' : '') }) },
    fetch: async () => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) }),
    AudioContext: function (opts) { const c = new FakeAudioContext(opts); contexts.push(c); return c; },
    OfflineAudioContext: FakeOfflineAudioContext,
  };
  sandbox.window = { addEventListener: on(listeners.window), AudioContext: sandbox.AudioContext,
                     OfflineAudioContext: FakeOfflineAudioContext };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, 'utf8') + EXPOSE, sandbox, { filename: file });
  const fire = (bag, type) => (listeners[bag][type] || []).forEach(fn => fn({ type }));
  return { A: sandbox.__audio, listeners, storage, contexts, fire, document: sandbox.document };
}
const tick = () => new Promise(r => setTimeout(r, 0));
let passed = 0;
const ok = (cond, what) => { assert(cond, what); passed++; console.log('ok  ' + what); };

(async () => {
  const { A, listeners, storage, contexts, fire, document } = boot();
  ok(contexts.length === 1, 'one AudioContext for the page');
  ok(A.ctx.state === 'suspended' && A.ctx.sources.length === 0, 'nothing plays at load');

  const types = Object.keys(listeners.window);
  for (const bad of ['touchstart', 'pointerdown', 'mousemove', 'wheel', 'scroll'])
    ok(!types.includes(bad), `no unlock on ${bad}, which grants no activation`);
  for (const good of ['pointerup', 'touchend', 'keydown', 'click'])
    ok(types.includes(good), `unlock listens on ${good}`);

  await A.load('jump'); await A.load('music');
  ok(A.play('jump') === null && A.ctx.sources.length === 0, 'play() while suspended drops the sound and schedules nothing');

  A.ctx.allowResume = false;
  fire('window', 'pointerup'); await tick();
  ok(A.ctx.state === 'suspended' && A.music === null, 'a resume the browser refuses starts no music');
  A.ctx.allowResume = true;
  fire('window', 'pointerup'); await tick();
  ok(A.ctx.state === 'running' && A.music && A.music.loop && A.music.started, 'a qualifying gesture resumes and starts looped music');
  ok(A.music.target === A.gains.music, 'music plays through the music gain');
  const s = A.play('jump');
  ok(s && s.started && s.target === A.gains.sfx, 'play() while running starts a source through the sfx gain');
  fire('window', 'click'); await tick();
  ok(A.ctx.sources.filter(x => x.loop).length === 1, 'a later gesture does not start music twice');

  A.setSetting('muted', true);
  ok(JSON.parse(storage['audio-settings']).muted === true, 'a changed setting is written to storage');
  ok(A.gains.master.gain.value === 0, 'mute drives the master gain to 0');
  A.setSetting('muted', false);
  ok(A.gains.master.gain.value === 0.8, 'unmute restores the master level');

  document.hidden = true; fire('document', 'visibilitychange'); await tick();
  ok(A.ctx.state === 'suspended' && A.ctx.suspends === 1, 'a hidden page suspends the context');
  ok(A.play('jump') === null, 'play() while hidden schedules nothing');
  document.hidden = false; fire('document', 'visibilitychange'); await tick();
  ok(A.ctx.state === 'running', 'a visible page resumes');

  A.ctx.state = 'interrupted';
  ok(A.play('jump') === null, 'play() while interrupted schedules nothing');
  fire('window', 'touchend'); await tick();
  ok(A.ctx.state === 'running', 'a gesture after an interruption resumes');

  const again = boot({ 'audio-settings': JSON.stringify({ master: 0.3 }) });
  ok(again.A.gains.master.gain.value === 0.3, 'a stored setting applies on the next load');

  console.log(`PASS ${passed} checks — ${path.basename(file)}`);
})().catch(e => { console.error('FAIL ' + (e.message || e)); process.exit(1); });
