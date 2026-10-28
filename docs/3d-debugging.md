# Debugging the 3D scene

Lessons from fixing the prism ⇄ bubbles switch (October 2026), kept here so the same bugs aren't found twice.
Most of these looked fine on one machine and broke on another, so the main lesson is to test on more than
one device and to look at real frames, not just timings.

## Getting a report from a real device

- **Open the site with `?perf`.** `src/hooks/perfLog.js` shows a small panel with the frame rate. Its
  **Copy log** button copies a report:
  - the device and its GPU
  - the quality settings
  - the idle frame times
  - for each switch, its frame times, the hitches over 25 ms, and the long frames Chrome can explain
- **Also ask for a screen recording.** The frame log only times frames, so it can't see frames drawn with the
  wrong colours. A recording can (⌘⇧5 on a Mac; an `.mp4` dropped into the chat works). Step through it with
  ffmpeg:
  ```sh
  # 12 frames a second from 4.4 s to 7.6 s, laid out as a contact sheet
  ffmpeg -ss 4.4 -t 3.2 -i clip.mp4 -vf "fps=12,scale=400:-1,tile=6x7" sheet.jpg
  ```
  GIFs are a poor substitute: they have only 256 colours, which bands dark gradients into contour lines. Most
  GIF recorders also capture just 10–20 frames a second.

## Measuring locally

- **Measure in a visible Chrome window** (Playwright: `channel: 'chrome', headless: false`), logging the gap
  between frames inside the page. Headless screenshots and screencasts hid stalls of 1.5 s or more.
- **Profile the production build** (`npm run build`, then `astro preview`), not the dev server. React's dev
  mode roughly doubled the cost.
- **For iPhones, use the Xcode simulator.** `xcrun simctl openurl booted http://localhost:4321/` runs real
  WebKit WebGL. Every iPhone browser, Chrome included, uses WebKit.

## Shaders: write only what GLSL defines

The M4 Pro drew the switch solid white, magenta or teal and hid the prism, while an M2 drew it correctly. Same
Chrome version, and the frame times were perfect on both. Two patterns cause this. With constant arguments the
compiler often works them out ahead of time, which hides the problem. With uniforms, each GPU computes them
its own way.

| Undefined                              | Write instead                       |
| -------------------------------------- | ----------------------------------- |
| `smoothstep(hi, lo, x)` (edges reversed) | `1.0 - smoothstep(lo, hi, x)`       |
| `pow(x, 2.0)` where x can be negative  | `x * x`                             |
| `pow(c, vec3(2.2))` on a colour that can dip below 0 | `pow(max(c, 0.0), vec3(2.2))` |
| `atan(y, x)` at `(0, 0)`               | nudge x: `atan(y, x + 1e-5)`        |

One bad pixel doesn't stay put. Bloom blurs it across the screen, so a NaN in a small area can turn the whole
canvas one colour.

## Other things that broke

- **The float LUT turned iPhones black.** iPhones can't filter 32-bit float textures (there's no
  `OES_texture_float_linear`), so the colour grade is converted to half float.
- **Shaders compiled mid-switch.** three.js keys each compiled shader on its render target and the number of
  lights. The warm-up in `Canvas3D.jsx` therefore compiles every material for both lighting states with
  `compileAsync`, then draws it once so its GPU setup also happens up front. It starts as soon as the scene
  mounts, not when the browser is idle, because with the scene animating it almost never is.
- **Shader error checks made the page wait for the GPU.** `gl.debug.checkShaderErrors` is off in production.
- **View Transitions were dropped from the switch.** They froze every frame, the 3D included, while the page
  swapped. They also repainted a full-screen mask on the main thread every frame and flashed white in WebKit.
  Now the page's text fades with opacity only, and the 3D scene draws the colour sweep itself
  (`src/hooks/modeShift.js`, `src/components/ModeShift.jsx`).
- **Automatic resolution scaling resized the canvas mid-switch, blanking it for a frame.** Each device now
  gets a fixed resolution in `src/hooks/quality.js`.

## Checklist after changing the canvas, post-processing or the switch

1. Build, then run four switches in a visible Chrome window at desktop and phone sizes.
2. Check the iPhone simulator.
3. Check every shader you touched against the table above.
4. After deploying, switch modes on a real Mac and phone with `?perf`, and record the screen if anything looks
   off.
