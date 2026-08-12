/* ==== DEBUG PANEL v1 — verbatim library, do not edit (builder's tuning panel). Only the ENABLED and LANG lines may be changed. ==== */
/*!
 * debug-panel.js v1.2.0 — zero-dependency in-game debug/tuning panel (reference implementation).
 * Toggle: backtick (`) key, or the floating 🔧 button (top-right, draggable). On phones the panel is a
 * bottom sheet; it sits above GameStage controls so the wrench is always tappable.
 *
 *   const T = DebugPanel.define({ player: { speed: { value: 220, min: 0, max: 600 } } });
 *   function tick(now) {
 *     const dt = DebugPanel.frame((now - last) / 1000); last = now; // pause / slow-mo / step-frame
 *     player.x += T.player.speed * dt;                              // read T.* at the point of use
 *     requestAnimationFrame(tick);
 *   }
 *   DebugPanel.stat('enemies', () => enemies.length);   // live readout (FPS built in)
 *   DebugPanel.box('player', () => [{ x, y, w, h }]);   // hitbox overlay, canvas pixel coords
 *   DebugPanel.button('Restart', () => restart());      // action row (pair with restart:true values)
 *
 * Leaf spec: { value, min?, max?, step?, label?, options?, onChange?(v), cssVar?:'--name', unit?:'px',
 * restart?:true } or a bare number / boolean / '#hex' / string. Multiple define() calls merge.
 * Keys starting with '_' are meta (never tunables); a group may carry _label:'Display name';
 * a group keyed 'advanced' (or labelled Advanced/고급) renders collapsed.
 *
 * Guarantees: never throws into the game, no external requests, no eval, double-load safe, works in
 * sandboxed iframes and mobile Safari. ENABLED=false runs headless: no UI, but define()/frame()/cssVar
 * keep working so the game behaves identically.
 */
(function () {
  'use strict';
  var ENABLED = true;  // set false when publishing: hides the panel, game keeps working identically
  var LANG = 'en';     // 'en' | 'ko' — panel UI language
  if (window.DebugPanel) return; // double-load: reuse the first instance
  try {

    // ---------------------------------------------------------------- strings
    const STR = {
      en: {
        title: '🔧 Tuning', filter: 'filter values…',
        gDebug: '⚙️ debug', gStats: '📊 stats', gErrors: '⚠️ errors',
        timeScale: 'time scale', pause: 'pause', step: 'step frame',
        hitboxes: 'show hitboxes', outline: 'outline UI',
        resetAll: 'Reset all', copyChanges: '📋 Copy changes', copyErrors: 'Copy errors',
        restored: n => '↩ restored ' + n + ' tuned', clear: 'clear',
        toast: '🔧 tuning panel — tap the wrench',
        copied: '✓ copied (also in console)', copyBlocked: 'copy blocked — select below',
        noChanges: 'nothing changed yet',
        resetTip: 'reset to default', restartTip: 'applies on restart',
        closeTip: 'close (`)', fabTip: 'tuning panel (`)',
        notice: 'Tweaks here are live on this screen only — not saved into the game yet. To make them permanent, tap 📋 Copy changes and paste it into the chat.',
        missing: 'Can\'t find a value you want to tune? Ask in the chat: "add ○○ to the tuning panel".',
        tuningHead: '[TUNING] Apply these as the new defaults. Edit ONLY these values inside DebugPanel.define — do not refactor, rebuild, or change any other code.',
        tuningFoot: n => '(' + n + (n === 1 ? ' change' : ' changes') + ' from the in-game tuning panel)',
        errorsHead: '[ERRORS] Fix ONLY this error with the smallest possible change. Keep my tuned values as they are.'
      },
      ko: {
        title: '🔧 튜닝', filter: '값 검색…',
        gDebug: '⚙️ 디버그', gStats: '📊 상태', gErrors: '⚠️ 에러',
        timeScale: '배속', pause: '일시정지', step: '한 프레임 진행',
        hitboxes: '히트박스 표시', outline: 'UI 영역 표시',
        resetAll: '전체 초기화', copyChanges: '📋 변경값 복사', copyErrors: '에러 복사',
        restored: n => '↩ 튜닝값 ' + n + '개 복원됨', clear: '지우기',
        toast: '🔧 튜닝 패널 — 렌치 버튼을 눌러보세요',
        copied: '✓ 복사됨 (콘솔에도 출력)', copyBlocked: '복사가 차단됨 — 아래에서 직접 복사',
        noChanges: '아직 변경된 값이 없어요',
        resetTip: '기본값으로 초기화', restartTip: '재시작 시 적용',
        closeTip: '닫기 (`)', fabTip: '튜닝 패널 (`)',
        notice: '여기서 바꾼 값은 지금 이 화면에만 적용되고, 아직 게임에 저장된 게 아니에요. 마음에 들면 📋 변경값 복사를 눌러 채팅에 붙여넣어 주세요.',
        missing: '조절하고 싶은 값이 여기 없나요? 채팅으로 "○○도 튜닝 패널에 추가해줘"라고 요청하세요.',
        tuningHead: '[TUNING] 아래 값을 새 기본값으로 반영해 주세요. DebugPanel.define 안의 이 값들만 수정하고, 그 외 코드는 절대 건드리지 마세요.',
        tuningFoot: n => '(인게임 튜닝 패널에서 ' + n + '개 값 변경)',
        errorsHead: '[ERRORS] 이 에러만 최소한의 수정으로 고쳐 주세요. 튜닝해 둔 값은 그대로 유지해 주세요.'
      }
    };
    const S = STR[LANG] || STR.en;

    // ---------------------------------------------------------------- state
    const reg = new Map();          // path -> tunable entry
    const groups = new Map();       // group path -> group body element
    const groupLabels = new Map();  // group path -> display label (_label)
    const stats = [];               // { name, fn, el }
    const boxProviders = [];        // { name, fn }
    const buttons = [];             // { label, fn, el }
    const errors = [];              // ring buffer: { key, msg, src, line, count, first, seq }
    const values = {};              // live values tree returned by define()
    const PALETTE = ['#39d4ff', '#ffd23c', '#ff5d5d', '#69f069', '#e879f9', '#ffa042'];
    const T0 = Date.now();
    let root = null, fab = null, badge = null, styleEl = null, tun = null, statsBox = null,
        utilBox = null, errGrp = null, errList = null, errCopyBtn = null,
        chip = null, chipT = null, ta = null, copyBtn = null, searchBox = null;
    let ov = null, octx = null, outBox = null;
    let open = false, mounted = false, showBoxes = false, outlineUI = false;
    let _ts = 1, _paused = false, stepQueued = false, tsSync = null, pauseSync = null;
    let storeKey = null, restoredCount = 0, saveTimer = 0, errSeq = 0;
    let fps = 0, frames = 0, lastFps = 0, lastUi = 0;

    const warn = (...a) => { try { console.warn('[DebugPanel]', ...a); } catch (_) {} };
    const store = { // localStorage may be blocked in sandboxed iframes — always guarded
      get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
      set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
      del(k) { try { localStorage.removeItem(k); } catch (_) {} }
    };
    // ------------------------------------------- define(): spec -> live values
    const isLeaf = n => n && typeof n === 'object' && !Array.isArray(n) &&
      ('value' in n) && (n.value === null || typeof n.value !== 'object');

    function inferNumber(e) { // sane slider range from value magnitude when omitted
      const v = e.def, s = e.spec;
      e.min = s.min !== undefined ? s.min : (v > 0 ? 0 : v < 0 ? v * 4 : 0);
      e.max = s.max !== undefined ? s.max : (v > 0 ? v * 4 : v < 0 ? -v : 10);
      if (e.max <= e.min) e.max = e.min + 1;
      e.step = s.step !== undefined ? s.step
        : (Number.isInteger(v) && e.max - e.min >= 4 ? 1 : +((e.max - e.min) / 100).toPrecision(1));
    }

    function stepDecimals(step) { // decimals implied by a step: 0.05 -> 2, 1 -> 0
      const s = String(+step || 1), i = s.indexOf('.');
      if (i >= 0) return Math.min(10, s.length - i - 1);
      const e = s.indexOf('e-');
      return e < 0 ? 0 : Math.min(10, +s.slice(e + 2));
    }

    function applyCssVar(e) { // DOM/CSS games: leaf drives a custom property
      try { document.documentElement.style.setProperty(e.cssVar, e.value + e.unit); } catch (_) {}
    }

    function register(keys, spec, target) {
      const path = keys.join('.'), key = keys[keys.length - 1];
      if (reg.has(path)) return null; // merged define(): keep existing entry + tuned value
      const v = spec.value;
      const e = { path, keys, spec, def: v, value: v, label: spec.label || key,
                  onChange: typeof spec.onChange === 'function' ? spec.onChange : null,
                  options: Array.isArray(spec.options) ? spec.options : null,
                  cssVar: typeof spec.cssVar === 'string' ? spec.cssVar : null,
                  unit: typeof spec.unit === 'string' ? spec.unit : '',
                  restart: !!spec.restart,
                  row: null, sync: null };
      e.type = e.options ? 'select'
        : typeof v === 'number' ? 'number'
        : typeof v === 'boolean' ? 'bool'
        : (typeof v === 'string' && v[0] === '#') ? 'color' : 'text';
      if (e.type === 'number') inferNumber(e);
      reg.set(path, e);
      if (e.cssVar) applyCssVar(e); // bind on define (also in headless mode)
      Object.defineProperty(target, key, { // game code reads plain values live
        configurable: true, enumerable: true,
        get: () => e.value,
        set: nv => setValue(e, nv)
      });
      return path;
    }

    function walk(spec, keys, target, added) {
      for (const k of Object.keys(spec)) {
        if (k.charAt(0) === '_') continue; // meta keys (_label, …) are never tunables
        const n = spec[k];
        try {
          if (isLeaf(n)) { const p = register(keys.concat(k), n, target); if (p) added.push(p); }
          else if (typeof n === 'number' || typeof n === 'boolean' || typeof n === 'string') {
            const p = register(keys.concat(k), { value: n }, target); if (p) added.push(p); // shorthand leaf
          } else if (n && typeof n === 'object' && !Array.isArray(n)) {
            if ('value' in n) { warn('unsupported value type (object/array) at', keys.concat(k).join('.'), '— skipped'); continue; }
            if (typeof n._label === 'string') groupLabels.set(keys.concat(k).join('.'), n._label);
            if (!target[k] || typeof target[k] !== 'object') target[k] = {}; // stable group refs across defines
            walk(n, keys.concat(k), target[k], added);
          } else warn('ignored spec node:', keys.concat(k).join('.'));
        } catch (err) { warn('bad spec node:', k, err); }
      }
    }

    function define(spec) {
      try {
        const added = [];
        walk(spec || {}, [], values, added);
        if (ENABLED) { // headless mode: live values + cssVar only, no persistence/UI
          if (!storeKey && added.length) // title-only key: adding/renaming tunables must never orphan
            storeKey = 'dbgp:' + (document.title || location.pathname || 'game').slice(0, 60); // saved tweaks (per-key {d,v} check handles collisions)
          restore(added);
          if (mounted) buildAllRows();
        }
      } catch (err) { warn('define failed:', err); }
      return values;
    }

    function setValue(e, v, silent) {
      if (e.type === 'number') { v = +v; if (Number.isNaN(v)) return; }
      else if (e.type === 'bool') v = !!v;
      if (v === e.value) return;
      e.value = v;
      if (e.cssVar) applyCssVar(e);
      if (e.sync) { try { e.sync(v); } catch (_) {} }
      if (e.row) e.row.classList.toggle('dbgp-dirty', e.value !== e.def);
      if (!silent && e.onChange) { try { e.onChange(v); } catch (err) { warn('onChange threw for', e.path, err); } }
      if (ENABLED) scheduleSave();
    }

    // ----------------------------------------------------------- persistence
    function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); }
    function save() {
      if (!storeKey) return;
      const leaves = {};
      for (const e of reg.values())
        if (e.value !== e.def) leaves[e.path] = { d: e.def, v: e.value }; // store default WITH value
      store.set(storeKey, JSON.stringify({ v: 1, leaves }));
    }
    function restore(paths) {
      if (!storeKey || !paths.length) return;
      let data = null;
      try { data = JSON.parse(store.get(storeKey) || 'null'); } catch (_) {}
      if (!data || !data.leaves) return;
      for (const p of paths) {
        const s = data.leaves[p], e = reg.get(p);
        if (!s || !e) continue;
        if (s.d !== e.def) continue; // code default changed since save -> stale, never override
        if (s.v === e.value) continue;
        setValue(e, s.v); restoredCount++;
      }
      updateChip();
    }

    // --------------------------------------------------- copy / reset / errors
    function emit(payload, btn) { // console; synchronous copy first (mobile-safe), then async API, then visible textarea
      try { console.log(payload); } catch (_) {}
      if (execCopy(payload)) { flash(btn, S.copied); return; } // in-gesture execCommand: works where the async API is blocked
      try {
        navigator.clipboard.writeText(payload).then(
          () => flash(btn, S.copied),
          () => { showTA(payload); flash(btn, S.copyBlocked); }
        );
      } catch (_) { showTA(payload); flash(btn, S.copyBlocked); }
    }
    function execCopy(text) { // document.execCommand('copy') inside the click gesture — the sandboxed-iframe / mobile path
      try {
        const t = document.createElement('textarea');
        t.value = text; t.setAttribute('aria-hidden', 'true');
        t.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px';
        (root || document.body).appendChild(t);
        t.focus(); t.select();
        try { t.setSelectionRange(0, text.length); } catch (_) {} // iOS needs an explicit range
        const ok = document.execCommand && document.execCommand('copy');
        t.remove();
        return !!ok;
      } catch (_) { return false; }
    }
    function fmtLeaf(e, v) { // numbers at step precision (no float junk); rest verbatim
      if (e.type === 'number') return String(parseFloat((+v).toFixed(stepDecimals(e.step))));
      if (e.type === 'bool') return v ? 'true' : 'false';
      return String(v);
    }
    function copyChanges() { // [TUNING] wire format — the LLM protocol depends on it
      const changed = [];
      for (const e of reg.values()) if (e.value !== e.def) changed.push(e);
      if (!changed.length) { flash(copyBtn, S.noChanges); return; }
      const lines = changed.map(e => e.path + ': ' + fmtLeaf(e, e.def) + ' -> ' + fmtLeaf(e, e.value));
      emit(S.tuningHead + '\n' + lines.join('\n') + '\n' + S.tuningFoot(changed.length), copyBtn);
    }
    function copyErrors() { // [ERRORS] wire format — latest 3, most recent first
      if (!errors.length) return;
      const latest = errors.slice().sort((a, b) => b.seq - a.seq).slice(0, 3);
      const lines = latest.map(e =>
        e.msg + ' — at ' + e.src + (e.line ? ':' + e.line : '') + ' — seen ' + e.count + '×');
      emit(S.errorsHead + '\n' + lines.join('\n'), errCopyBtn);
    }
    function resetAll() {
      for (const e of reg.values()) setValue(e, e.def);
      if (storeKey) store.del(storeKey);
      restoredCount = 0; updateChip();
    }

    function pushError(msg, src, line) { // dedupe by message+source+line, ring of 20
      try {
        msg = String(msg || 'Unknown error').slice(0, 300);
        src = shortSrc(src); line = +line || 0;
        const key = msg + '|' + src + '|' + line;
        let e = errors.find(x => x.key === key);
        if (e) e.count++;
        else {
          e = { key, msg, src, line, count: 1, first: Date.now() - T0, seq: 0 };
          errors.push(e);
          if (errors.length > 20) errors.shift();
        }
        e.seq = ++errSeq;
        renderErrors();
      } catch (_) {}
    }
    function shortSrc(s) {
      s = String(s || '');
      if (!s) return 'inline';
      s = s.split('?')[0].split('#')[0];
      const parts = s.split('/');
      return parts[parts.length - 1] || s;
    }
    function mmss(ms) {
      const s = Math.max(0, Math.floor(ms / 1000));
      return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }
    function renderErrors() {
      try {
        if (badge) {
          let total = 0; for (const e of errors) total += e.count;
          badge.textContent = total > 99 ? '99+' : String(total);
          badge.style.display = total ? 'flex' : 'none';
        }
        if (!errGrp) return;
        errGrp.hidden = !errors.length; // group appears on first error
        if (!errors.length) return;
        errList.textContent = '';
        const latest = errors.slice().sort((a, b) => b.seq - a.seq).slice(0, 5);
        for (const e of latest) {
          const row = document.createElement('div'); row.className = 'dbgp-erow';
          const m = document.createElement('div'); m.className = 'dbgp-emsg';
          m.textContent = e.msg.length > 160 ? e.msg.slice(0, 159) + '…' : e.msg;
          const meta = document.createElement('div'); meta.className = 'dbgp-emeta';
          meta.textContent = e.src + (e.line ? ':' + e.line : '') + ' · ' + e.count + '× · ' + mmss(e.first);
          row.append(m, meta); errList.appendChild(row);
        }
      } catch (_) {}
    }

    // --------------------------------------------------- stat / box / button
    function stat(name, fn) {
      if (!ENABLED) return;
      try {
        const s = stats.find(x => x.name === name);
        if (s) { s.fn = fn; return; }
        stats.push({ name, fn, el: null });
        if (mounted) buildAllRows();
      } catch (err) { warn('stat failed:', err); }
    }
    function box(name, fn) {
      if (!ENABLED) return;
      try {
        const b = boxProviders.find(x => x.name === name);
        if (b) b.fn = fn; else boxProviders.push({ name, fn });
      } catch (err) { warn('box failed:', err); }
    }
    function button(label, fn) {
      if (!ENABLED) return;
      try {
        const b = buttons.find(x => x.label === label);
        if (b) { b.fn = fn; return; }
        buttons.push({ label, fn, el: null });
        if (mounted) buildAllRows();
      } catch (err) { warn('button failed:', err); }
    }

    // ------------------------------------------------------- frame(): dt hook
    function frame(rawDt) { // one line in the game loop wires pause / slow-mo / step
      if (!ENABLED) return rawDt;
      if (_paused) {
        if (stepQueued) { stepQueued = false; return 1 / 60; }
        return 0;
      }
      const dt = +rawDt;
      return Number.isNaN(dt) ? 0 : dt * _ts;
    }

    // ------------------------------------------------------------------- css
    const CSS = `
#dbgp,.dbgp-fab,.dbgp-toast,.dbgp-ov,.dbgp-outs{
 --s0:#14161b;--s1:#1b1e26;--s2:#232833;--s3:#2c313d;--bd:#333a47;--bds:#252a33;
 --tx:#e7e9ee;--txd:#9aa3b2;--txm:#6a7280;--ac:#5b9dff;--acd:#87b4ff;
 --warn:#ffd05a;--ok:#5bd48d;--err:#ff6b6b;--outline:#ff49d0;--z:2147483646;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#dbgp{position:fixed;top:0;right:0;height:100%;width:340px;max-width:92vw;z-index:var(--z);
 display:flex;flex-direction:column;background:var(--s0);color:var(--tx);font-size:13px;line-height:1.45;
 border-left:1px solid var(--bd);box-shadow:-14px 0 46px rgba(0,0,0,.5);
 transform:translateX(103%);transition:transform .24s cubic-bezier(.2,.7,.2,1);overscroll-behavior:contain}
#dbgp.dbgp-open{transform:none}
#dbgp *{box-sizing:border-box;font-family:inherit}
#dbgp button{background:var(--s2);color:var(--tx);border:1px solid var(--bd);border-radius:7px;
 padding:7px 11px;cursor:pointer;min-height:34px;font-size:13px;transition:background .1s,border-color .1s,transform .05s}
#dbgp button:hover{background:var(--s3)}
#dbgp button:active{transform:translateY(1px)}
#dbgp input,#dbgp select,#dbgp textarea{font-size:13px}
#dbgp *:focus-visible{outline:2px solid var(--ac);outline-offset:1px}
.dbgp-hd{display:flex;align-items:center;gap:8px;padding:13px 14px;border-bottom:1px solid var(--bds);flex-shrink:0}
.dbgp-ttl{font-weight:700;flex:1;font-size:14px;letter-spacing:-.01em}
.dbgp-x{min-width:38px;padding:6px}
.dbgp-chip{background:rgba(91,212,141,.12);color:var(--ok);border:1px solid rgba(91,212,141,.3);
 border-radius:999px;padding:3px 10px;font-size:11px;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
#dbgp .dbgp-chip button{min-height:0;padding:0 2px;border:0;background:none;color:var(--ok);text-decoration:underline;font-size:11px}
.dbgp-note{margin:12px 14px 0;padding:9px 11px;background:rgba(91,157,255,.09);border:1px solid rgba(91,157,255,.22);
 border-radius:8px;color:var(--txd);font-size:11.5px;line-height:1.55}
.dbgp-miss{margin:14px 6px 2px;color:var(--txm);font-size:11px;line-height:1.5;text-align:center}
.dbgp-q{margin:12px 14px 0;padding:9px 11px;background:var(--s2);color:var(--tx);border:1px solid var(--bd);
 border-radius:8px;font-size:13px;-webkit-appearance:none;appearance:none}
.dbgp-q::placeholder{color:var(--txm)}
.dbgp-body{flex:1;overflow-y:auto;padding:2px 14px 16px;-webkit-overflow-scrolling:touch}
.dbgp-grp{margin-top:10px;border:1px solid var(--bds);border-radius:10px;background:var(--s1);overflow:hidden}
.dbgp-grp>summary{cursor:pointer;padding:0 12px;font-weight:600;color:var(--acd);user-select:none;
 min-height:42px;display:flex;align-items:center;gap:9px;list-style:none}
.dbgp-grp>summary::-webkit-details-marker{display:none}
.dbgp-grp>summary::before{content:"";width:6px;height:6px;border-right:2px solid var(--txm);
 border-bottom:2px solid var(--txm);transform:rotate(-45deg);transition:transform .15s;flex-shrink:0}
.dbgp-grp[open]>summary::before{transform:rotate(45deg)}
.dbgp-gb{padding:0 12px 10px}
.dbgp-row{display:grid;grid-template-columns:1fr auto auto;gap:3px 8px;align-items:center;min-height:42px;padding:3px 0}
.dbgp-lab{color:var(--txd);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px}
.dbgp-row input[type=range]{grid-column:1/-1;width:100%;height:26px;accent-color:var(--ac);margin:2px 0 0;touch-action:none}
.dbgp-num{width:76px;background:var(--s2);color:var(--warn);border:1px solid var(--bd);border-radius:7px;
 padding:7px;text-align:right;font-family:ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums;-webkit-appearance:none;appearance:none}
.dbgp-stpw{display:flex;align-items:center;gap:4px}
.dbgp-stpw .dbgp-num{width:58px}
#dbgp .dbgp-stp{min-width:34px;padding:0;font-size:18px;line-height:1;color:var(--txd)}
.dbgp-txt,.dbgp-sel{width:138px;background:var(--s2);color:var(--tx);border:1px solid var(--bd);border-radius:7px;padding:7px;min-height:34px}
.dbgp-col{width:48px;height:34px;padding:2px;border:1px solid var(--bd);border-radius:7px;background:var(--s2);cursor:pointer}
.dbgp-cb{width:26px;height:26px;accent-color:var(--ac);cursor:pointer}
#dbgp .dbgp-rst{min-width:34px;opacity:.3;padding:6px 0;background:none;border:0;font-size:15px;color:var(--txd)}
#dbgp .dbgp-rst:hover{background:var(--s2);opacity:.7}
.dbgp-dirty .dbgp-lab{color:var(--tx)}
.dbgp-dirty .dbgp-rst{opacity:1;color:var(--warn)}
.dbgp-val{font-family:ui-monospace,Menlo,monospace;color:var(--ok);font-variant-numeric:tabular-nums}
.dbgp-brow{display:flex;padding:5px 0;gap:8px}
#dbgp .dbgp-brow button{flex:1;min-height:38px}
.dbgp-erow{padding:8px 0;border-top:1px solid var(--bds)}
.dbgp-erow:first-child{border-top:0}
.dbgp-emsg{color:var(--err);font:11px/1.45 ui-monospace,Menlo,monospace;word-break:break-word}
.dbgp-emeta{color:var(--txm);font-size:11px;margin-top:3px}
.dbgp-ft{display:flex;gap:9px;padding:12px 14px;border-top:1px solid var(--bds);flex-shrink:0}
#dbgp .dbgp-ft button{min-height:42px;font-weight:600}
#dbgp .dbgp-ft .dbgp-reset{flex:0 0 auto;min-width:92px;color:var(--txd)}
#dbgp .dbgp-ft .dbgp-copy{flex:1;background:var(--ac);border-color:var(--ac);color:#0a1424}
#dbgp .dbgp-ft .dbgp-copy:hover{background:var(--acd);border-color:var(--acd)}
.dbgp-ta{margin:8px 14px 0;height:118px;background:var(--s2);color:var(--tx);border:1px solid var(--bd);
 border-radius:8px;padding:9px;font-family:ui-monospace,Menlo,monospace;font-size:11px;resize:none}
.dbgp-fab{position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);right:calc(env(safe-area-inset-right,0px) + 10px);
 width:40px;height:40px;border-radius:12px;background:rgba(20,22,27,.82);border:1px solid var(--bd);color:var(--tx);
 font-size:18px;line-height:1;z-index:var(--z);opacity:.6;cursor:pointer;touch-action:none;padding:0;
 display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,.4);
 -webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);transition:opacity .12s,transform .06s}
.dbgp-fab:hover{opacity:1}
.dbgp-fab:active{opacity:1;transform:scale(.93)}
.dbgp-fab:focus-visible{outline:2px solid var(--ac);outline-offset:2px;opacity:1}
.dbgp-bdg{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;border-radius:999px;background:var(--err);
 color:#fff;font:700 10px/18px system-ui,sans-serif;padding:0 4px;display:none;align-items:center;justify-content:center;
 pointer-events:none;box-shadow:0 0 0 2px var(--s0)}
.dbgp-toast{position:fixed;top:calc(env(safe-area-inset-top,0px) + 60px);right:calc(env(safe-area-inset-right,0px) + 10px);
 background:var(--s0);color:var(--tx);border:1px solid var(--bd);border-radius:10px;padding:9px 13px;z-index:var(--z);
 font:12px system-ui,sans-serif;opacity:0;transition:opacity .3s;pointer-events:none;max-width:74vw;box-shadow:0 6px 20px rgba(0,0,0,.45)}
.dbgp-ov{position:fixed;pointer-events:none;z-index:2147483640}
.dbgp-outs{position:fixed;inset:0;pointer-events:none;z-index:2147483640;display:none}
.dbgp-outs i{position:absolute;border:1px dashed var(--outline);box-sizing:border-box}
.dbgp-outs b{position:absolute;left:0;top:-14px;background:var(--outline);color:#000;
 font:600 10px/1.3 ui-monospace,Menlo,monospace;padding:0 3px;white-space:nowrap;border-radius:3px}
@media (max-width:520px){
 #dbgp{top:auto;bottom:0;left:0;right:0;width:100%;max-width:100%;height:auto;max-height:66vh;
  border-left:0;border-top:1px solid var(--bd);border-radius:16px 16px 0 0;transform:translateY(103%);
  box-shadow:0 -14px 46px rgba(0,0,0,.5)}
 #dbgp.dbgp-open{transform:none}
}
@media (prefers-reduced-motion:reduce){#dbgp,.dbgp-fab,.dbgp-toast,#dbgp button,.dbgp-grp>summary::before{transition:none}}`;

    // ------------------------------------------------------------ row builder
    function makeRow(o, parent) { // o: {type,label,path?,value,min,max,step,options,restart?,set,reset?}
      const row = document.createElement('div');
      row.className = 'dbgp-row';
      if (o.path) row.dataset.q = (o.path + ' ' + o.label).toLowerCase();
      const lab = document.createElement('span');
      lab.className = 'dbgp-lab';
      lab.textContent = o.label + (o.restart ? ' ↻' : '');
      lab.title = o.restart ? S.restartTip : (o.path || o.label);
      row.appendChild(lab);
      const inp = (tag, props) => Object.assign(document.createElement(tag), props);
      let sync = null;
      if (o.type === 'number') {
        let cur = +o.value; // −/+ steppers: mobile fine-tuning where sliders are too coarse
        const wrap = document.createElement('span'); wrap.className = 'dbgp-stpw';
        const minus = inp('button', { type: 'button', className: 'dbgp-stp', textContent: '−' });
        const num = inp('input', { type: 'number', className: 'dbgp-num', step: o.step, value: o.value });
        const plus = inp('button', { type: 'button', className: 'dbgp-stp', textContent: '+' });
        const bump = dir => {
          let v = +(cur + dir * (+o.step || 1)).toFixed(stepDecimals(o.step));
          if (typeof o.min === 'number') v = Math.max(o.min, v);
          if (typeof o.max === 'number') v = Math.min(o.max, v);
          o.set(v);
        };
        minus.addEventListener('click', () => bump(-1));
        plus.addEventListener('click', () => bump(1));
        num.addEventListener('change', () => o.set(num.value)); // 'change' not 'input': don't fight the caret
        wrap.append(minus, num, plus);
        row.appendChild(wrap); appendReset(row, o);
        const rng = inp('input', { type: 'range', min: o.min, max: o.max, step: o.step, value: o.value });
        rng.addEventListener('input', () => o.set(rng.value));
        row.appendChild(rng);
        sync = v => { cur = +v; num.value = v; rng.value = v; };
      } else if (o.type === 'bool') {
        const cb = inp('input', { type: 'checkbox', className: 'dbgp-cb', checked: !!o.value });
        cb.addEventListener('change', () => o.set(cb.checked));
        lab.style.cursor = 'pointer'; // the whole ~42px row label toggles — the box alone is a poor phone target
        lab.addEventListener('click', () => { cb.checked = !cb.checked; o.set(cb.checked); });
        row.appendChild(cb); appendReset(row, o);
        sync = v => { cb.checked = !!v; };
      } else if (o.type === 'select') {
        const sel = inp('select', { className: 'dbgp-sel' });
        o.options.forEach((op, i) => sel.appendChild(inp('option', { value: i, textContent: String(op) })));
        sel.selectedIndex = Math.max(0, o.options.indexOf(o.value));
        sel.addEventListener('change', () => o.set(o.options[sel.selectedIndex])); // preserves option types
        row.appendChild(sel); appendReset(row, o);
        sync = v => { sel.selectedIndex = Math.max(0, o.options.indexOf(v)); };
      } else if (o.type === 'color') {
        const c = inp('input', { type: 'color', className: 'dbgp-col', value: normColor(o.value) });
        c.addEventListener('input', () => o.set(c.value));
        row.appendChild(c); appendReset(row, o);
        sync = v => { c.value = normColor(v); };
      } else {
        const t = inp('input', { type: 'text', className: 'dbgp-txt', value: o.value });
        t.addEventListener('change', () => o.set(t.value));
        row.appendChild(t); appendReset(row, o);
        sync = v => { t.value = v; };
      }
      parent.appendChild(row);
      return { row, sync };
    }
    function appendReset(row, o) {
      if (!o.reset) return;
      const b = document.createElement('button');
      b.className = 'dbgp-rst'; b.textContent = '↺'; b.title = S.resetTip;
      b.addEventListener('click', o.reset);
      row.appendChild(b);
    }
    function normColor(v) {
      if (typeof v !== 'string') return '#000000';
      if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
      return /^#[0-9a-f]{6}$/i.test(v) ? v : '#000000';
    }

    function getGroup(keys) { // nested collapsible <details> per group path
      if (!keys.length) return tun;
      const gp = keys.join('.');
      let g = groups.get(gp);
      if (!g) {
        const parent = getGroup(keys.slice(0, -1));
        const key = keys[keys.length - 1];
        const label = groupLabels.get(gp) || key;
        const d = document.createElement('details'); d.className = 'dbgp-grp';
        d.open = !(/^advanced$/i.test(key) || /advanced|고급/i.test(label)); // overflow group starts collapsed
        const s = document.createElement('summary'); s.textContent = label;
        d.appendChild(s);
        g = document.createElement('div'); g.className = 'dbgp-gb'; d.appendChild(g);
        parent.appendChild(d); groups.set(gp, g);
      }
      return g;
    }

    function buildAllRows() {
      for (const e of reg.values()) {
        if (e.row) continue;
        const r = makeRow({
          type: e.type, label: e.label, path: e.path, value: e.value,
          min: e.min, max: e.max, step: e.step, options: e.options, restart: e.restart,
          set: v => setValue(e, v), reset: () => setValue(e, e.def)
        }, getGroup(e.keys.slice(0, -1)));
        e.row = r.row; e.sync = r.sync;
        e.row.classList.toggle('dbgp-dirty', e.value !== e.def);
      }
      for (const s of stats) {
        if (s.el) continue;
        const row = document.createElement('div'); row.className = 'dbgp-row';
        const l = document.createElement('span'); l.className = 'dbgp-lab'; l.textContent = s.name;
        const v = document.createElement('span'); v.className = 'dbgp-val';
        row.append(l, v); statsBox.appendChild(row); s.el = v;
      }
      for (const b of buttons) { // DebugPanel.button() action rows
        if (b.el) continue;
        const row = document.createElement('div'); row.className = 'dbgp-brow';
        const btn = document.createElement('button'); btn.textContent = b.label;
        btn.addEventListener('click', () => { try { b.fn(); } catch (err) { warn('button "' + b.label + '" threw:', err); } });
        row.appendChild(btn); utilBox.appendChild(row); b.el = btn;
      }
      applyFilter();
    }

    // ------------------------------------------------------------------ mount
    function mount() {
      if (mounted || !document.body) return;
      mounted = true;
      styleEl = document.createElement('style');
      styleEl.textContent = CSS;
      (document.head || document.body).appendChild(styleEl);

      root = document.createElement('div');
      root.id = 'dbgp';
      root.innerHTML =
        '<div class="dbgp-hd"><span class="dbgp-ttl">' + S.title + '</span>' +
        '<span class="dbgp-chip" hidden><span></span><button>' + S.clear + '</button></span>' +
        '<button class="dbgp-x">✕</button></div>' +
        '<div class="dbgp-note">' + S.notice + '</div>' +
        '<input class="dbgp-q" type="search" placeholder="' + S.filter + '">' +
        '<div class="dbgp-body">' +
        '<details class="dbgp-grp" open><summary>' + S.gDebug + '</summary><div class="dbgp-gb dbgp-util"></div></details>' +
        '<details class="dbgp-grp" open><summary>' + S.gStats + '</summary><div class="dbgp-gb dbgp-stats"></div></details>' +
        '<details class="dbgp-grp dbgp-egrp" open hidden><summary>' + S.gErrors + '</summary>' +
        '<div class="dbgp-gb"><div class="dbgp-errs"></div>' +
        '<div class="dbgp-brow"><button class="dbgp-ecopy">' + S.copyErrors + '</button></div></div></details>' +
        '<div class="dbgp-tun"></div>' +
        '<div class="dbgp-miss">' + S.missing + '</div></div>' +
        '<textarea class="dbgp-ta" hidden readonly></textarea>' +
        '<div class="dbgp-ft"><button class="dbgp-reset">' + S.resetAll + '</button>' +
        '<button class="dbgp-copy">' + S.copyChanges + '</button></div>';
      document.body.appendChild(root);
      const $ = s => root.querySelector(s);
      tun = $('.dbgp-tun'); statsBox = $('.dbgp-stats'); utilBox = $('.dbgp-util');
      errGrp = $('.dbgp-egrp'); errList = $('.dbgp-errs'); errCopyBtn = $('.dbgp-ecopy');
      chip = $('.dbgp-chip'); chipT = chip.querySelector('span');
      ta = $('.dbgp-ta'); copyBtn = $('.dbgp-copy'); searchBox = $('.dbgp-q');

      // input isolation: nothing that happens inside the panel reaches game handlers
      ['pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick',
       'touchstart', 'touchmove', 'touchend', 'keydown', 'keyup', 'keypress', 'wheel', 'contextmenu']
        .forEach(t => root.addEventListener(t, e => e.stopPropagation()));
      // buttons/toggles must not keep focus after a click: a focused panel control
      // swallows the game's key input (key events target it and are stopped above)
      root.addEventListener('click', e => {
        const t = e.target && e.target.closest ? e.target.closest('button,input[type=checkbox]') : null;
        if (t) { try { t.blur(); } catch (_) {} }
      });

      $('.dbgp-x').title = S.closeTip;
      $('.dbgp-x').addEventListener('click', () => setOpen(false));
      $('.dbgp-reset').addEventListener('click', resetAll);
      copyBtn.addEventListener('click', copyChanges);
      errCopyBtn.addEventListener('click', copyErrors);
      chip.querySelector('button').addEventListener('click', resetAll);
      searchBox.addEventListener('input', applyFilter);

      // built-in utility rows
      tsSync = makeRow({ type: 'number', label: S.timeScale, min: 0.1, max: 2, step: 0.05, value: 1,
        set: v => { api.timeScale = v; } }, utilBox).sync;
      pauseSync = makeRow({ type: 'bool', label: S.pause, value: false, set: v => { api.paused = v; } }, utilBox).sync;
      const stepRow = document.createElement('div'); stepRow.className = 'dbgp-brow';
      const stepBtn = document.createElement('button'); stepBtn.textContent = S.step;
      stepBtn.addEventListener('click', () => { api.paused = true; stepQueued = true; }); // frame() returns 1/60 once
      stepRow.appendChild(stepBtn); utilBox.appendChild(stepRow);
      makeRow({ type: 'bool', label: S.hitboxes, value: false, set: v => { showBoxes = !!v; } }, utilBox);
      makeRow({ type: 'bool', label: S.outline, value: false,
        set: v => { outlineUI = !!v; if (!outlineUI) clearOutlines(); } }, utilBox);

      // floating 🔧 button (mobile users have no backtick key) + error badge
      fab = document.createElement('button');
      fab.className = 'dbgp-fab'; fab.textContent = '🔧'; fab.title = S.fabTip;
      badge = document.createElement('span'); badge.className = 'dbgp-bdg';
      fab.appendChild(badge);
      document.body.appendChild(fab);
      // isolate the FAB from the game: pointer events too, or a stage/game document listener sees the
      // wrench tap/drag as a world pointer (polluting GameStage.pointer()/onPointer).
      ['click', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend',
       'pointerdown', 'pointermove', 'pointerup', 'pointercancel']
        .forEach(t => fab.addEventListener(t, e => e.stopPropagation()));
      fab.addEventListener('pointerdown', startFabDrag);

      buildAllRows();
      updateChip();
      renderErrors(); // errors may have queued before mount
      if (open) root.classList.add('dbgp-open');
      firstRunToast();
    }

    function startFabDrag(e) {
      e.stopPropagation(); e.preventDefault();
      const sx = e.clientX, sy = e.clientY, r = fab.getBoundingClientRect();
      let moved = false;
      const mv = ev => {
        ev.stopPropagation(); // capture phase: keep the drag out of the game's document pointer listeners
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 6) moved = true;
        if (!moved) return;
        fab.style.left = Math.max(2, Math.min(innerWidth - 44, r.left + ev.clientX - sx)) + 'px';
        fab.style.top = Math.max(2, Math.min(innerHeight - 44, r.top + ev.clientY - sy)) + 'px';
        fab.style.right = fab.style.bottom = 'auto';
      };
      const up = ev => {
        try { ev.stopPropagation(); } catch (_) {} // same: the release must not reach game handlers
        window.removeEventListener('pointermove', mv, true);
        window.removeEventListener('pointerup', up, true);
        window.removeEventListener('pointercancel', up, true);
        try { fab.blur(); } catch (_) {} // a focused fab would eat Space/Enter as re-toggles
        if (!moved) setOpen(!open); // tap (no drag) toggles the panel
      };
      window.addEventListener('pointermove', mv, true);
      window.addEventListener('pointerup', up, true);
      window.addEventListener('pointercancel', up, true);
    }

    function setOpen(v) {
      if (!ENABLED) return;
      open = !!v;
      if (root) {
        root.classList.toggle('dbgp-open', open);
        if (!open) { // closing hides the panel via CSS only — a still-focused control
          const a = document.activeElement; // would keep swallowing the game's keys
          if (a && (root.contains(a) || a === fab)) { try { a.blur(); } catch (_) {} }
        }
      }
      if (fab) fab.style.display = open ? 'none' : 'flex'; // ✕ closes; hiding the FAB avoids overlapping the header
      if (open) refreshStats();
    }

    function applyFilter() {
      if (!root) return;
      const q = (searchBox.value || '').trim().toLowerCase();
      tun.querySelectorAll('.dbgp-row').forEach(r => {
        r.style.display = !q || (r.dataset.q || '').includes(q) ? '' : 'none';
      });
      tun.querySelectorAll('details').forEach(d => {
        const any = [...d.querySelectorAll('.dbgp-row')].some(r => r.style.display !== 'none');
        d.style.display = any ? '' : 'none';
        if (q && any) d.open = true;
      });
    }

    function updateChip() {
      if (!chip) return;
      chip.hidden = restoredCount <= 0;
      if (restoredCount > 0) chipT.textContent = S.restored(restoredCount);
    }
    function flash(btn, txt) {
      if (!btn) return;
      const old = btn.textContent; btn.textContent = txt;
      setTimeout(() => { btn.textContent = old; }, 1400);
    }
    function showTA(text) {
      if (!ta) return;
      ta.hidden = false; ta.value = text;
      try { ta.focus(); ta.select(); } catch (_) {}
    }

    function refreshStats() {
      for (const s of stats) {
        if (!s.el) continue;
        let v; try { v = s.fn(); } catch (_) { v = 'ERR'; }
        s.el.textContent = fmt(v);
      }
    }
    function fmt(v) {
      if (typeof v === 'number') return String(Math.abs(v) >= 100 ? Math.round(v) : +v.toFixed(2));
      if (v && typeof v === 'object') { try { return JSON.stringify(v); } catch (_) { return String(v); } }
      return String(v);
    }

    // -------------------------------------------------- hitbox canvas overlay
    function findGameCanvas() { // largest visible canvas that isn't ours
      let best = null, bestA = 0;
      for (const c of document.querySelectorAll('canvas')) {
        if (c === ov || (root && root.contains(c))) continue;
        const r = c.getBoundingClientRect(), a = r.width * r.height;
        if (a > bestA) { bestA = a; best = c; }
      }
      return best;
    }
    function drawBoxes() {
      const gc = findGameCanvas();
      if (!gc) { if (ov) ov.style.display = 'none'; return; }
      if (!ov) {
        ov = document.createElement('canvas'); ov.className = 'dbgp-ov';
        document.body.appendChild(ov); octx = ov.getContext('2d');
      }
      const r = gc.getBoundingClientRect();
      if (ov.width !== gc.width) ov.width = gc.width;   // match internal pixels ->
      if (ov.height !== gc.height) ov.height = gc.height; // providers use canvas coords
      ov.style.display = 'block';
      ov.style.left = r.left + 'px'; ov.style.top = r.top + 'px';
      ov.style.width = r.width + 'px'; ov.style.height = r.height + 'px';
      octx.clearRect(0, 0, ov.width, ov.height);
      octx.font = '10px ui-monospace,monospace'; octx.lineWidth = 1.5; octx.textBaseline = 'bottom';
      boxProviders.forEach((p, i) => {
        let res; try { res = p.fn(octx); } catch (_) { return; }
        if (!Array.isArray(res)) return; // provider may have drawn directly via the ctx arg
        const base = PALETTE[i % PALETTE.length];
        res.forEach((b, j) => {
          if (!b) return;
          const col = b.color || base;
          octx.strokeStyle = col; octx.fillStyle = col;
          octx.globalAlpha = 0.12; octx.fillRect(b.x, b.y, b.w, b.h);
          octx.globalAlpha = 1; octx.strokeRect(b.x, b.y, b.w, b.h);
          if (j === 0) octx.fillText(p.name, b.x + 2, b.y - 2);
        });
      });
    }

    // ----------------------------------- DOM UI outlines (no game DOM mutation)
    const UI_SEL = 'button,a,input,select,textarea,[onclick],[role=button],[data-ui]';
    function clearOutlines() { if (outBox) { outBox.innerHTML = ''; outBox.style.display = 'none'; } }
    function refreshOutlines() {
      if (!outBox) {
        outBox = document.createElement('div'); outBox.className = 'dbgp-outs';
        document.body.appendChild(outBox);
      }
      outBox.style.display = 'block';
      let html = '';
      document.querySelectorAll(UI_SEL).forEach(el => {
        if ((root && root.contains(el)) || el === fab || outBox.contains(el)) return;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        html += '<i style="left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' +
          r.height + 'px"><b>' + Math.round(r.width) + '×' + Math.round(r.height) + '</b></i>';
      });
      outBox.innerHTML = html;
    }

    // -------------------------------------------------------------- main loop
    function loop(t) {
      requestAnimationFrame(loop);
      frames++;
      if (t - lastFps >= 500) { fps = Math.round(frames * 1000 / (t - lastFps)); frames = 0; lastFps = t; }
      try {
        if (showBoxes) drawBoxes(); else if (ov) ov.style.display = 'none';
        if (t - lastUi > 250) {
          lastUi = t;
          if (open) refreshStats();
          if (outlineUI) refreshOutlines();
        }
      } catch (_) {}
    }

    function reattach() { // games that nuke document.body.innerHTML must not kill the panel
      try {
        if (!mounted || !document.body) return;
        if (styleEl && !styleEl.isConnected) (document.head || document.body).appendChild(styleEl);
        if (root && !root.isConnected) document.body.appendChild(root);
        if (fab && !fab.isConnected) document.body.appendChild(fab);
        if (ov && !ov.isConnected) document.body.appendChild(ov);
        if (outBox && !outBox.isConnected) document.body.appendChild(outBox);
      } catch (_) {}
    }

    function firstRunToast() { // adoption: builders must learn the panel exists (per-game key: each game shows it once)
      const seenKey = 'dbgp:seen:' + (document.title || location.pathname || 'game').slice(0, 60);
      if (store.get(seenKey)) return;
      store.set(seenKey, '1');
      const t = document.createElement('div');
      t.className = 'dbgp-toast'; t.textContent = S.toast;
      document.body.appendChild(t);
      requestAnimationFrame(() => { t.style.opacity = '1'; });
      setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 4000);
    }

    // -------------------------------------------------------------- public API
    const api = {
      define, stat, box, button, frame, values,
      open: () => setOpen(true), close: () => setOpen(false), toggle: () => setOpen(!open),
      version: '1.2.0'
    };
    Object.defineProperty(api, 'timeScale', { // game loops: dt *= DebugPanel.timeScale
      enumerable: true, get: () => _ts,
      set: v => { v = +v; if (!Number.isNaN(v)) { _ts = v; if (tsSync) tsSync(v); } }
    });
    Object.defineProperty(api, 'paused', { // game loops: if (DebugPanel.paused) skip update
      enumerable: true, get: () => _paused,
      set: v => { _paused = !!v; if (pauseSync) pauseSync(_paused); }
    });
    window.DebugPanel = api;

    // -------------------------------------------------------------------- boot
    if (ENABLED) {
      window.addEventListener('keydown', e => { // capture: runs before game key handlers
        if (e.key !== '`' && e.code !== 'Backquote') return; // e.code: works on non-US layouts (Korean ₩ key)
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        e.preventDefault();
        setOpen(!open);
      }, true);

      window.addEventListener('error', ev => { // bubble phase: script errors
        try { pushError(ev.message, ev.filename, ev.lineno); } catch (_) {}
      });
      window.addEventListener('error', ev => { // capture phase: resource load failures (img/audio/script src) — the
        try {                                   // dominant embedded-game runtime failure (COEP block, CDN 403, sprite 404). They
          const tgt = ev.target;                // don't bubble and carry no ev.message, so classify by the failing element.
          if (tgt && tgt !== window && tgt.tagName && !ev.message) {
            const url = tgt.src || tgt.currentSrc || tgt.href || '';
            if (url) pushError('Failed to load ' + tgt.tagName.toLowerCase() + ': ' + shortSrc(url), url, 0);
          }
        } catch (_) {}
      }, true);
      window.addEventListener('unhandledrejection', ev => {
        try {
          const r = ev.reason;
          let msg, src = 'promise', line = 0;
          if (r instanceof Error || (r && r.message)) {
            msg = String(r);
            const m = /([^\/\\()\s@]+\.(?:html?|m?js|ts)):(\d+)/.exec(String(r.stack || ''));
            if (m) { src = m[1]; line = +m[2]; }
          } else msg = 'Unhandled rejection: ' + fmt(r);
          pushError(msg, src, line);
        } catch (_) {}
      });

      stats.push({ name: 'FPS', fn: () => fps, el: null }); // built-in stat
      if (document.body) mount();
      else document.addEventListener('DOMContentLoaded', mount, { once: true });
      requestAnimationFrame(loop);
      setInterval(reattach, 1000);
    }

  } catch (err) {
    // Never break the game: log, and leave a no-op shim so game code still runs.
    try { console.warn('[DebugPanel] disabled after init error:', err); } catch (_) {}
    if (!window.DebugPanel) {
      const vals = {};
      const strip = (s, out) => {
        const o = out || {};
        for (const k in s) {
          if (k.charAt(0) === '_') continue;
          const n = s[k];
          if (n && typeof n === 'object' && !Array.isArray(n) && 'value' in n) {
            o[k] = n.value;
            if (typeof n.cssVar === 'string') { // best-effort: DOM games keep their layout
              try { document.documentElement.style.setProperty(n.cssVar, n.value + (n.unit || '')); } catch (_) {}
            }
          } else if (n && typeof n === 'object' && !Array.isArray(n)) o[k] = strip(n, o[k]);
          else o[k] = n;
        }
        return o;
      };
      window.DebugPanel = { define: s => strip(s || {}, vals), frame: dt => dt,
        stat() {}, box() {}, button() {}, open() {}, close() {}, toggle() {},
        timeScale: 1, paused: false, values: vals, version: '1.2.0' };
    }
  }
})();
/* ==== END DEBUG PANEL ==== */
