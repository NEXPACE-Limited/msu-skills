---
name: maple-core-rendering
description: |
  Common sprite rendering rules: CDN, flip rules (anchor correction + socket mirroring),
  two rendering approaches (img tag vs Canvas), Phaser framework integration, and frame iteration.
  Applies to ALL entity types (mob, character, NPC, pet, morph, reactor, tamingmob).
  Load when rendering any sprite or integrating with Phaser.
---

# Sprite Rendering — Common Rules

These rules apply to **all** entity types: mob, character, NPC, pet, morph, reactor, tamingmob.
For entity-specific structure → see each entity's dedicated reference file.
For character socket assembly → see `maple-character-rendering.md`.

## CDN

- **Base URL**: `https://resource-static.msu.io/data/`
- All `_path` values in JSON are relative to this base URL
- **No CORS headers.** The CDN sends no `Access-Control-Allow-Origin` for any origin, on
  JSON or PNG. `<img>` and `canvas drawImage()` work; browser `fetch()` is blocked, and a
  drawn CDN image taints the canvas, so `getImageData()` and `toDataURL()` then throw.
  Fetch JSON through `maple-lookup` and inline it into the HTML — never `fetch()` it in the page.

## Sprite Direction

> **ALL sprites face LEFT by default.** Every mob, character, NPC, pet, morph sprite faces LEFT.
> If the game requires the sprite to face RIGHT, you MUST flip it explicitly:
> - **Phaser**: `sprite.setFlipX(true)`
> - **Canvas**: `ctx.save(); ctx.scale(-1, 1); ctx.drawImage(...); ctx.restore();`
> - **CSS/HTML**: `transform: scaleX(-1)`
>
> Do NOT assume sprites face right. Do NOT forget to flip when the entity moves or faces right.

## Draw Formula (Origin-Based Positioning)

All sprites use an `origin` anchor point. The origin pixel is the "foot" or attachment reference:

```
draw_x = world_x - frame.origin.x
draw_y = world_y - frame.origin.y
```

> **Scale warning:** `origin`, `map` (socket), `lt`, `rb` values are all in **sprite original pixel units**.
> When rendering at N× scale, multiply all offsets by SCALE:
> ```
> draw_x = world_x - origin.x * SCALE
> draw_y = world_y - origin.y * SCALE
> ```
> Socket attachment also requires SCALE:
> ```
> childOriginWorld = parentOriginWorld + (parentSocket - childSocket) * SCALE
> ```
> Forgetting `* SCALE` causes parts to overlap (offset is only a few pixels instead of tens).

> **Every sprite carries its own `origin` value.** In animations, this means each frame has its own `origin` — image dimensions (and therefore `origin`) can differ between frames within the same state and across different states. Do not reuse or share `origin` values across sprites or frames.

## Horizontal Flip Rendering Rules

When flipping a sprite horizontally, **both** of the following must be applied.

### 1. Anchor Pixel Correction

When a sprite is flipped, pixel positions within the image shift. A pixel at `x = origin.x` moves to `x = width - origin.x`:

```
anchorX = flip ? (width - origin.x) : origin.x
anchorY = origin.y
```

This applies to **all** entity types (mob, NPC, pet, morph, etc.).

### 2. Socket Coordinate Mirroring (multi-part entities only)

For entities with socket attachment (character, tamingmob), also negate socket X coordinates:

```
mirroredSocket = flip ? { x: -socket.x, y: socket.y } : socket

childOriginWorld = parentOriginWorld + mirror(parentSocket) - mirror(childSocket)
```

Omitting either step causes parts to be misaligned by tens of pixels.

## Frame Iteration

Non-numeric keys in animation states are **flags, not frames** (e.g. `zigzag: 1`, `speak: {...}`).
Always filter when iterating:

```javascript
const frames = Object.keys(state).filter(k => !isNaN(Number(k)));
```

## Two Rendering Approaches

**Approach 1: `<img>` tag switching (Recommended for simple cases)**

Best for: mob/NPC/pet display, animation preview, any case without pixel manipulation.

```html
<div id="stage" style="position:relative; width:300px; height:250px; overflow:hidden;"></div>
```
```javascript
const CDN = "https://resource-static.msu.io/data/";

// Pre-create an <img> for each frame
const img = document.createElement("img");
img.src = CDN + frame._path;
img.style.cssText = "position:absolute; display:none; image-rendering:pixelated;";
stage.appendChild(img);

// Animation loop: hide previous, position and show current
if (activeImg) activeImg.style.display = "none";
img.style.left = (stageW / 2 - frame.origin.x) + "px";
img.style.top  = (groundY - frame.origin.y) + "px";
img.style.display = "block";
activeImg = img;
```

**Approach 2: Canvas `drawImage()` (Required for complex rendering)**

Best for: character socket assembly, multi-layer compositing, horizontal flip.

```javascript
const img = new Image();
img.src = CDN + frame._path;

// In render loop:
ctx.drawImage(img, drawX, drawY);
```

**When to use which:**

| Entity type | Recommended approach | Reason |
|-------------|---------------------|--------|
| Single sprite (mob, NPC, pet, morph) | `<img>` tag or **Phaser Image 1 per frame** | No socket math needed |
| Multi-part entity (character, tamingmob) | **Phaser Image per part** (`setOrigin(0,0)` + manual coords) | See each entity's dedicated reference file for assembly code |
| Multi-layer compositing (custom) | Canvas `drawImage()` | Full pixel control |

> **Phaser + Canvas mixing warning:** `RenderTexture.draw()` accepts only Phaser GameObjects, NOT `HTMLCanvasElement`. Do not render to an HTML Canvas and try to upload it to a RenderTexture — use Phaser Image objects instead.

---

## Phaser Framework Integration

MapleStory sprites are individual PNGs per frame — NOT spritesheets. Phaser requires specific handling.

### Critical Rules — getFirstTick TypeError Prevention

The `getFirstTick` error (`Cannot read properties of undefined (reading 'duration')`) means the animation's `frames` array is empty at runtime. Root causes:

1. **Use `load.image` per frame** — do NOT use `load.spritesheet` (frames have different sizes)
2. **Always set `frameRate` or `duration`** in `anims.create()` — omitting both causes crash
3. **Build frames array manually** with `[{ key: 'textureKey' }, ...]` — each entry maps to one `load.image` call
4. **NEVER use `generateFrameNumbers()` or `generateFrameNames()`** — these are for spritesheet/atlas only, return EMPTY array for `load.image` textures → causes getFirstTick crash
5. **NEVER add `frame` property** (e.g. `{ key: 'x', frame: 0 }`) — single-image textures have no numbered frames

### Loading Sprites

```javascript
// In preload() — load each animation frame as individual image
const CDN = "https://resource-static.msu.io/data/";

frames.forEach((frame, i) => {
  this.load.image(`sprite_stand_${i}`, CDN + frame._path);
});
```

### Creating Animations (Avoiding getFirstTick Error)

```javascript
// In create() — after all images are loaded

// ✅ CORRECT: provide frameRate derived from delay
const delay = spriteData.stand["0"].delay || 200; // ms per frame
this.anims.create({
  key: "sprite_stand",
  frames: Object.keys(spriteData.stand)
    .filter(k => spriteData.stand[k]._path) // skip non-frame keys
    .map(k => ({ key: `sprite_stand_${k}` })), // { key: textureKey } only
  frameRate: 1000 / delay,
  repeat: -1,
});

// ❌ WRONG: generateFrameNumbers with load.image → EMPTY frames → getFirstTick crash
this.anims.create({
  key: "sprite_stand",
  frames: this.anims.generateFrameNumbers("sprite_stand", { start: 0, end: 3 }),
  frameRate: 5, repeat: -1,
});

// ❌ WRONG: missing frameRate/duration → getFirstTick crash
this.anims.create({
  key: "sprite_stand",
  frames: [{ key: "sprite_stand_0" }],
  repeat: -1,
});

// ❌ WRONG: adding frame property for single-image texture
this.anims.create({
  key: "sprite_stand",
  frames: [{ key: "sprite_stand_0", frame: 0 }],
  frameRate: 5, repeat: -1,
});
```

### Playing Animation

```javascript
// Create sprite with first frame texture
const sprite = this.add.sprite(400, 300, "sprite_stand_0");
sprite.play("sprite_stand");

// Flip to face right (sprites default to LEFT)
sprite.setFlipX(true);
```

### Phaser Origin Positioning (Single Sprite)

```javascript
// ALWAYS use setOrigin(0, 0) — never use setOrigin(fraction, fraction).
// Phaser's setOrigin controls the pivot point, NOT the draw offset.
// Using origin.x/width as fraction causes misalignment, especially after setScale.

const SCALE = 2; // render magnification
const frame = spriteData.stand["0"];
const img = this.add.image(0, 0, "sprite_stand_0").setOrigin(0, 0).setScale(SCALE);

// Position so the origin pixel lands at (worldX, worldY):
img.x = worldX - frame.origin.x * SCALE;
img.y = worldY - frame.origin.y * SCALE;

// When flipped (facing right):
img.setFlipX(true);
img.x = worldX - (img.width - frame.origin.x) * SCALE;
// Phaser img.width = frame.realWidth = original texture pixel width (unaffected by scale)
```

### Variable Per-Frame Delay

MapleStory frames often have different `delay` values. Two approaches:

```javascript
// Approach 1: Average delay (simple, good enough for most sprites)
const frames = Object.values(spriteData.stand).filter(f => f._path);
const avgDelay = frames.reduce((sum, f) => sum + (f.delay || 200), 0) / frames.length;

this.anims.create({
  key: "sprite_stand",
  frames: frames.map((_, i) => ({ key: `sprite_stand_${i}` })),
  frameRate: 1000 / avgDelay,
  repeat: -1,
});

// Approach 2: Total duration (distributes time evenly across frames)
const totalDuration = frames.reduce((sum, f) => sum + (f.delay || 200), 0);

this.anims.create({
  key: "sprite_stand",
  frames: frames.map((_, i) => ({ key: `sprite_stand_${i}` })),
  duration: totalDuration,
  repeat: -1,
});
```
