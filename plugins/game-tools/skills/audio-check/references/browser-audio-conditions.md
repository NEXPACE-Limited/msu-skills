# Browser audio conditions

Each condition states the symptom a player reports, an observable predicate, what a healthy
game does, the fix, and how to reproduce it. Observe state rather than assume a policy: the
names change between releases, `ctx.state` and a `play()` rejection do not. Version numbers
appear only where the source states them.

A game that loads no audio file — synthesized sound only — skips conditions 10, 11, 12, and 14,
and condition 5 when it has no media element; the report names the skipped conditions, and the
rest are walked in full.

## Activation

### 1. No user activation yet

- **Symptom.** Silent until the player does something — or for good, when the game tries once on
  load and never again.
- **Observe.** `ctx.state === 'suspended'`; `element.play()` rejects with `NotAllowedError`;
  `navigator.userActivation.hasBeenActive === false`. Every current browser starts an
  `AudioContext` created before a gesture in `suspended` and blocks audible media playback until
  the page has been interacted with.
- **Healthy.** Nothing sounds before the first gesture. The context is resumed and music started
  from a gesture handler, and a rejected `play()` is retried from the next one.
- **Fix.** Resume inside a qualifying handler (condition 2), start music once `resume()` resolves
  and `state` reads `running`, and add a tap-to-start screen when the game has no natural first
  input.
- **Reproduce.** Fresh profile or private window, load, touch nothing.

### 2. The unlock listens to the wrong event

- **Symptom.** Sound unlocks with a mouse or a keyboard but never on a touch screen, or the
  reverse.
- **Observe.** The event the resume runs from. Events that grant activation (HTML spec): `keydown`
  except Escape, `mousedown`, `pointerdown` with `pointerType === 'mouse'`, `pointerup` with any
  other pointer type, and `touchend`. Events that do not: `touchstart`, a touch `pointerdown`,
  `mousemove`, `wheel`, `scroll`, `keyup`. `click` fires inside the window its `mousedown`,
  `pointerup`, or `touchend` opened, so a `click` handler is safe. WebKit documents `touchend`,
  `click`, `doubleclick`, and `keydown` for iOS.
- **Healthy.** Listeners on `pointerup`, `touchend`, `keydown`, and `click`, left attached: a
  resume after an interruption (condition 7) needs a gesture too.
- **Fix.** Move the resume; log `ctx.state` after it resolves.
- **Reproduce.** A phone. Emulated touch in desktop DevTools proves only what it emulates.

### 3. Works for the builder, silent for players

- **Symptom.** The builder's Chrome plays on load; a first-time visitor hears nothing until they
  interact, or never.
- **Observe.** `chrome://media-engagement` lists the builder's site with a high score. Chrome's
  Media Engagement Index lets a site the user has played media on often autoplay with sound on
  desktop, so the builder's profile is the least representative one available.
- **Healthy.** The game never depends on playing before the first gesture.
- **Fix.** Condition 1.
- **Reproduce.** A private window or a fresh profile. `--autoplay-policy=no-user-gesture-required`
  hides the problem; never test with it on.

## Device

### 4. iOS ringer switch

- **Symptom.** Silent on an iPhone that plays other apps; the usual "silent on my friend's phone".
- **Observe.** The switch (or Control Centre silent mode) is on. It mutes Web Audio output and
  does not stop `<audio>` or `<video>` playback. Where `navigator.audioSession` exists its
  `type` reads `'auto'` by default.
- **Healthy.** A stated decision: respect the switch (the default), or set
  `navigator.audioSession.type = 'playback'` where the API exists — that plays through the
  switch and pauses the player's own music app. A visible mute indicator either way.
- **Fix.** A policy row in the report. If the builder chooses to play through, set the type
  before the first playback and guard it (`if (navigator.audioSession)`); the API is
  WebKit-only.
- **Reproduce.** An iPhone, switch both ways.

### 5. `HTMLMediaElement.volume` on iOS

- **Symptom.** The volume slider does nothing on an iPhone; music always plays at full level.
- **Observe.** Writes to `volume` are ignored on iOS (the hardware buttons own it); `muted` works.
- **Healthy.** A media element's level goes through a gain node (`createMediaElementSource`
  into a `GainNode`, same-origin or CORS per condition 11), or the element gets a mute control
  only.
- **Fix.** Route through the graph, or drop the slider for that path and say so.
- **Reproduce.** An iPhone, drag the slider.

## Lifecycle

### 6. Hidden tab, background, screen lock

- **Symptom.** Music keeps playing over a frozen game after a tab switch; on a phone the music
  stops on lock and never comes back.
- **Observe.** `document.visibilityState`. Desktop browsers keep `<audio>` and Web Audio playing
  in a hidden tab while `requestAnimationFrame` callbacks stop. iOS suspends the context when
  the page is backgrounded or the screen locks. Chrome throttles timers to once a minute in a
  tab that has been hidden for five minutes and silent for thirty seconds, which stalls a
  look-ahead scheduler built on `setTimeout`.
- **Healthy.** On `visibilitychange`: hidden → pause music and `ctx.suspend()`; visible →
  `ctx.resume()`, with the gesture listeners finishing the job where a gesture is required.
  Anything timed against audio is scheduled on `ctx.currentTime`, not on frames or timers.
- **Fix.** The handler in the setup pattern.
- **Reproduce.** Switch tabs for ten seconds and return; on a phone, lock and unlock.

### 7. Interruption

- **Symptom.** Silent after a phone call, Siri, another app's audio, or a closed laptop lid.
- **Observe.** `ctx.state === 'interrupted'` — WebKit first, Chrome since 136 on desktop,
  Android and WebView, now in the specification's state list, absent in Firefox — with a
  `statechange` event. On Android a media
  element pauses when headphones disconnect or audio focus is lost.
- **Healthy.** A `statechange` listener; the next gesture resumes; music resumes or restarts and
  the game shows its paused state.
- **Fix.** Listen; never assume `running`.
- **Reproduce.** A phone call; on Android, unplug headphones.

## Delivery

### 8. Embedded in an iframe

- **Symptom.** Plays on the bare page, silent on the portal.
- **Observe.** `window.self !== window.top`. A cross-origin iframe's `autoplay` permission
  defaults to `self`, so it cannot autoplay with sound unless the parent sets
  `allow="autoplay"`; a gesture inside the frame activates that frame on its own.
  `Permissions-Policy: autoplay=()` on the parent disables it entirely.
  `document.featurePolicy.allowsFeature('autoplay')` reports it in Chromium only;
  `document.permissionsPolicy` is specified but ships nowhere.
- **Healthy.** Sound starts from a gesture inside the game's own frame; the embed page carries
  `allow="autoplay"` when the builder controls it, and when not, the report names the attribute
  the host must set.
- **Fix.** The attribute, and a tap-to-start inside the frame.
- **Reproduce.** The real embed, cross-origin — a second local port is another origin.

### 9. In-app browsers and webviews

- **Symptom.** Silent inside a messenger's or a social app's in-app browser; plays in Safari or
  Chrome.
- **Observe.** Android `WebView` requires a gesture for media by default
  (`setMediaPlaybackRequiresUserGesture`, default `true`); `WKWebView` requires user action for
  every media type by default (`mediaTypesRequiringUserActionForPlayback`, default `.all`). The
  host app decides, and its default is stricter than the browser's.
- **Healthy.** The same gesture-first design; no autoplay assumption anywhere.
- **Fix.** Conditions 1 and 2; report that the rest belongs to the host app.
- **Reproduce.** Open the link from the app in question.

## Resource

### 10. A format the browser cannot decode

- **Symptom.** Silent in Safari on macOS and iOS, plays in Chrome and Firefox;
  `decodeAudioData` rejects with `EncodingError`; `play()` rejects with `NotSupportedError`.
- **Observe.** `canPlayType()` per format (the probe below). MP3 and AAC in MP4/M4A play in
  every current browser; WAV and FLAC broadly; Ogg Vorbis never in Safari; Opus in Safari only
  in a CAF container until recent versions (caniuse marks full Opus in iOS Safari from 18.4).
- **Healthy.** MP3 or AAC as the baseline; Ogg or Opus only as a smaller alternative selected
  with `canPlayType`, never alone.
- **Fix.** Encode an MP3 or M4A set; `<source>` order with the universal format first, or the
  `FORMATS` selection in the setup pattern.
- **Reproduce.** Safari.

### 11. Cross-origin audio through the graph

- **Symptom.** The `<audio>` element plays on its own and goes silent once routed through
  `createMediaElementSource`; `decodeAudioData` on a fetched file fails.
- **Observe.** The element's `src` is another origin and it has no `crossorigin="anonymous"`,
  or the response has no `Access-Control-Allow-Origin`: the source node outputs zeroes by
  specification. A cross-origin `fetch()` needs CORS like any fetch; a cross-origin-isolated
  page (`Cross-Origin-Embedder-Policy: require-corp`) also needs CORP or CORS on the audio host.
- **Healthy.** Same-origin assets, or the `crossorigin` attribute plus CORS headers on the CDN.
- **Fix.** Attribute and headers, or serve audio from the page's origin.
- **Reproduce.** The Network panel shows the failed CORS check; open the audio URL and read the
  response headers.

### 12. Blocked before it plays

- **Symptom.** Nothing loads; the console shows a CSP violation, a mixed-content block, or a 404.
- **Observe.** `Content-Security-Policy` `media-src` (or `default-src` with no `media-src`)
  without the audio host; an HTTPS page requesting `http://` audio; a wrong path — case,
  extension, or the base path of a project site.
- **Healthy.** Assets from allowed origins over HTTPS at the path the build writes.
- **Fix.** The policy or the URL.
- **Reproduce.** The Network panel.

## Graph

### 13. Several contexts

- **Symptom.** Sounds drop out or stop after a while; the first ones worked.
- **Observe.** `new AudioContext()` inside a play or decode function. The old Chrome cap (six,
  before Chrome 66) is gone; one context per page is still the rule — an `AudioBuffer` can be
  shared across contexts, a node cannot, and every context costs an output stream.
- **Healthy.** One context, one master gain, one gain per group.
- **Fix.** The setup pattern.

### 14. The loop seam

- **Symptom.** A gap or a click at the loop point of `<audio loop>`.
- **Observe.** MP3 pads its last frame with silence and adds decoder delay; a media element
  loops the file, padding included.
- **Healthy.** Music as a decoded buffer with `loop = true`, `loopStart`/`loopEnd` trimmed
  when the file has a lead-in; or a track cut to loop cleanly when it must stream.
- **Fix.** Buffer loop for anything short enough to decode.

### 15. Sounds scheduled while the clock is stopped

- **Symptom.** The first tap, or the return from a call, releases a burst of stacked sounds;
  on a device where the unlock never succeeds, memory grows and nothing ever plays.
- **Observe.** A play function that starts sources while `ctx.state !== 'running'`. While the
  context is suspended or interrupted `currentTime` does not advance, so every source started
  then is scheduled at the same frozen time, fires no `ended`, and all of them begin together
  on resume. Condition 2 produces this state on every touch device.
- **Healthy.** Playback drops a request while the clock is stopped — one lost sound instead
  of a burst — and music starts from the resume path, not from the first play call.
- **Fix.** The guard in `play()` of the setup pattern; the contract check asserts it.
- **Reproduce.** Fresh profile; trigger several sounds through events that grant no activation
  (a touch `pointerdown`, `mousemove`), then one click.

### 16. Unmuting without a gesture

- **Symptom.** A muted intro autoplays, then stops the moment the game unmutes it.
- **Observe.** Chrome pauses a playing muted element when a script sets `muted = false` outside
  a gesture.
- **Healthy.** Unmute from a gesture handler.

### 17. Sound-only cues

Not a browser condition, but the same audit: a hit, a warning, or a countdown carried only by
sound leaves a player on mute, on silent, in a noisy room, or deaf without the information.
Pair every gameplay-critical cue with a visual one.

## Probe

```js
// Paste into the console before and after the first tap. It changes nothing in the game.
(() => {
  const a = document.createElement('audio');
  const types = ['audio/mpeg', 'audio/mp4; codecs="mp4a.40.2"', 'audio/ogg; codecs="vorbis"',
                 'audio/ogg; codecs="opus"', 'audio/webm; codecs="opus"', 'audio/wav'];
  const ua = navigator.userActivation;
  console.table({
    activation: ua ? `hasBeenActive=${ua.hasBeenActive} isActive=${ua.isActive}` : 'unsupported',
    frame: window.self === window.top ? 'top-level' : `iframe on ${location.origin}`,
    autoplayAllowed: document.featurePolicy?.allowsFeature?.('autoplay') ?? 'unknown (Chromium reports this; others do not)',
    visibility: document.visibilityState,
    audioSession: navigator.audioSession ? navigator.audioSession.type : 'unsupported',
    ...Object.fromEntries(types.map(t => [t, a.canPlayType(t) || 'no'])),
  });
})();
```

For the game's own context — expose it (`window.__audio = ctx`) or find it in the engine
(`this.sound.context` in Phaser, `Howler.ctx`) — log `ctx.state`, `ctx.sampleRate`,
`ctx.baseLatency`, and `ctx.outputLatency` (Safari from 18.4), and attach
`ctx.onstatechange = () => console.log(ctx.state)`. For a media element,
`el.play().then(() => 'plays', e => e.name)`: `NotAllowedError` is activation,
`NotSupportedError` is the format or the URL, `AbortError` is a load that was interrupted.

## Setup pattern

[setup-pattern.js](setup-pattern.js) is the foundation section 6 of the skill builds:
engine-agnostic, one context, a master gain with one gain per group, settings persisted, unlock
on the events of condition 2, nothing scheduled while the clock is stopped, pause when hidden.
Map the gain groups onto the engine's own manager when one exists (table below) rather than
running two stacks. A synthesized game replaces `load()` with a function that builds an
`AudioBuffer`, or wires oscillators into the same gain groups; the slots and the rest stay.

[contract-check.js](contract-check.js) runs that file — or a game's own audio script, passed as
the argument — under a stubbed context, events, storage, and fetch, and asserts the contract:
one context, nothing at load, unlock on the right events and on none of the wrong ones, nothing
scheduled while suspended, hidden, or interrupted, music started once, settings written and
read back on the next load, suspend on hide, resume after an interruption. `EXPOSE` names the
script's private bindings; pass it in the environment when the script uses its own names. Its
Web Audio and DOM stubs cover what an audio script usually touches, including offline rendering
for synthesized placeholders; extend a copy when a script needs more. It proves the code, not
the browser: activation, the ringer switch, and the embed stay inferred.

```
node references/contract-check.js                 # the pattern itself
node references/contract-check.js src/audio.js    # the game's script, same names
EXPOSE='__audio = { ctx: audioCtx, gains, play, load, setSetting, get music() { return bgm; } }' \
  node references/contract-check.js src/audio.js  # the game's script, its own names
```

Music longer than a couple of minutes is streamed through a media element routed into the
music gain (`crossorigin` and CORS when it lives on another origin) rather than decoded: three
minutes of stereo PCM is about 60 MB. Rhythm games read `ctx.baseLatency + ctx.outputLatency`
and expose an offset the player can adjust; `latencyHint: 'interactive'` is already the default.

## Engines and libraries

| Stack | Unlock | Settings and pause | Caveat |
|---|---|---|---|
| Howler.js | `Howler.autoUnlock` (default `true`) on the first touch or click; `'unlock'` event | `Howler.volume()`, `Howler.mute()`; `Howler.autoSuspend` suspends the context after 30 s idle and resumes on play | `html5: true` streams through HTML5 Audio, outside the graph — condition 5 applies |
| Phaser 3 | `this.sound.locked`; `Phaser.Sound.Events.UNLOCKED` | `pauseOnBlur` (default `true`); config `audio: { disableWebAudio, noAudio, context }` | the HTML5 Audio backend carries the media-element conditions |
| `@pixi/sound` | auto-unlocks on `touchend` or `mousedown` | no visibility handling of its own — condition 6 is the game's | |
| Unity WebGL | its own Web Audio backend; nothing before a gesture | Audio Mixer: volume only | clips are transcoded to AAC and the first samples may shift, which glitches loops |
| Godot 4 web | gesture-first as the browser demands | — | the threaded export needs `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` (`SharedArrayBuffer`); a single-threaded export exists since 4.3; sample playback is the default since 4.3 and carries no `AudioEffect` |

## Test matrix

| Case | Toggle |
|---|---|
| Chrome desktop, fresh profile | load and touch nothing; first click; a ten-second tab switch |
| Firefox, defaults | audible autoplay blocked and Web Audio blocking on; the per-site permission untouched |
| Safari macOS | per-website Auto-Play at "Stop Media with Sound"; first click; the format set |
| iPhone Safari | ringer both ways; screen lock; a call or Siri; the volume slider |
| Android Chrome | first tap; headphone unplug |
| The embed | the portal page on another origin; the in-app browser the game ships through |

## Tools

Chrome DevTools has a Media panel; `chrome://media-engagement` shows the engagement score;
`--autoplay-policy=no-user-gesture-required` exists for local runs and makes them
unrepresentative. Safari keeps a per-website Auto-Play setting. Firefox exposes
`media.autoplay.default` in `about:config` (`0` allow, `1` block audible, `5` block all) and
`media.autoplay.block-webaudio`.
