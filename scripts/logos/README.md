# Card logos

Cards show a logo at 50 px in their header. Every logo follows one style so they sit together:

- one colour: white on a transparent 512 x 512 PNG (cards invert it in light mode)
- trimmed and centred, sized to the existing set: wide marks about 430 px across, square ones about 370 px, tall ones about 380 px high
- no taglines: anything that turns to noise at 50 px is cut

## Make a logo from an organisation's file

```sh
node scripts/logos/make-logo.mjs <source.svg|png|jpg> public/logos/<name>-logo.png [options]
```

| Option | Use it when |
|---|---|
| `--ink any` (default) | A coloured or dark logo on white or transparent. White inside the logo becomes a cut-out. |
| `--ink alpha` | The logo is already white on transparent. |
| `--ink dark` | A dark mark sits on a coloured tile, like an app icon. Only the dark part is kept. |
| `--crop x,y,w,h` | Keep part of the source, as fractions of its size. `0,0,1,0.5` keeps the top half. |
| `--erase x,y,w,h` | Blank part of the source, same units, for a tagline beside part of the mark. |
| `--stack` | A long one-line wordmark: split at the widest word gap and stack the halves. |
| `--box w,h` | Change the space the mark may fill. Shrink a heavy solid mark, widen a thin one. |

Prefer an official vector (Wikimedia Commons, the organisation's brand page) over a screenshot.
Record the source and options in `sources.json` so the logo can be rebuilt.

## Check it before it ships

```sh
node scripts/logos/preview.mjs /tmp/sheet.png public/logos/zoox-logo.png public/logos/wsu-logo.png <new logos...>
```

The sheet shows each logo large, then at 50 px on a dark card and on a light card, next to existing
logos. Adjust `--box` until a new logo looks neither louder nor quieter than its neighbours.
