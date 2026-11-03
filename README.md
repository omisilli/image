# image

What neither the browser nor next/image does for an image: a grey ground
until it is there, a framed image shown whole once loaded — faded in where
you ask for it — and no broken-image icon when it fails. One script, one stylesheet, no dependencies, framework-agnostic.

```html
<div data-pg-image-frame style="aspect-ratio: 3 / 2; overflow: hidden">
    <img data-pg-image loading="lazy" src="horse.jpg" width="800" height="533" alt="…"
         style="width: 100%; height: 100%; object-fit: cover" />
</div>
```

```sh
npm install github:omisilli/image#v2.0.0
```

```ts
import { initImage } from "@plusguard/image";
import "@plusguard/image/index.css";

initImage();
```

Or from CSS, which lets you pick the cascade layer:

```css
@import "@plusguard/image/index.css" layer(components);
```

### Without a build step

Load both halves straight from jsDelivr — no install, and the page works
when opened by double-clicking:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/omisilli/image@v2.0.0/index.css" />

<script type="module">
    import { initImage } from "https://cdn.jsdelivr.net/gh/omisilli/image@v2.0.0/dist/index.js";

    initImage();
</script>
```

Pin the version (`@v2.0.0`) on a live site. A pinned URL never changes;
`@1` follows the newest 1.x release.

## Who does what

An image needs more than this package. Most of it is already in the
browser, or in next/image — this package does not do it again.

| What an image needs                    | React / Next                                  | Static site                                         |
| -------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| Load only when near the screen         | next/image (lazy by default)                  | `loading="lazy"`                                    |
| Its space kept before it arrives       | `width` / `height`, or an imported file       | `width` / `height`, or `aspect-ratio`               |
| Load first, for the image at the top   | `preload` (`priority` before Next 16)         | `fetchpriority="high"`, no `loading="lazy"`         |
| The right file size for the screen     | `sizes` — next/image writes the `srcset`      | `srcset` + `sizes`                                  |
| A different image per screen           | `getImageProps()` inside a `<picture>`        | `<picture>` + `<source media>`                      |
| Resizing, AVIF / WebP                  | Next's image server                           | the server (CMS, CDN) prepares the files            |
| Long caching                           | Next's image server                           | the server's headers                                |
| A blurred preview                      | `placeholder="blur"`                          | the server's small preview as a background          |
| **Grey ground while loading**          | **this package**                              | **this package**                                    |
| **Shown whole, or faded in, when loaded** | **this package**                            | **this package**                                    |
| **No broken icon, box kept on error**  | **this package**                              | **this package**                                    |
| **State to style: loading / loaded / error** | **this package**                        | **this package**                                    |

### What this package adds

|                                     | Browser                                | next/image                                        | image                                            |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| Grey ground until loaded            | —                                      | only with `placeholder`, needs a preview image    | ✓ any image, no preview needed                   |
| Fade-in                             | —                                      | —                                                 | ✓ inside a frame, where asked for                |
| On error                            | broken icon and alt text               | the same                                          | ✓ the empty box and its grey stay                |
| The address that failed             | —                                      | —                                                 | ✓ `data-pg-image-src`                            |
| State in the markup                 | — (`complete` in JS only)              | `onLoad` / `onError` — Client Components only     | ✓ `data-pg-image-state`, from a Server Component |
| Images added later                  | —                                      | —                                                 | ✓ one listener on `document`                     |

## Files

| File              | For                                                              |
| ----------------- | ---------------------------------------------------------------- |
| `index.ts`        | TypeScript source — import it directly in a TS / bundler project |
| `index.css`       | The CSS half: the grey ground, hiding until loaded, the fade     |
| `dist/index.js`   | Compiled ES module — plain HTML, no build step                   |
| `dist/index.d.ts` | Types for `dist/index.js`                                        |

Importing `dist/index.js` from your own files? Serve the page over HTTP —
browsers block module imports on `file://`.

`dist/` is committed. After editing `index.ts`, rebuild it:

```sh
npx -p typescript tsc index.ts --outDir dist --declaration --target es2020 --module es2020 --lib dom,es2020 --strict
```

## Attributes

| Attribute              | On                 | Meaning                                                        |
| ---------------------- | ------------------ | -------------------------------------------------------------- |
| `data-pg-image`        | `<img>`            | Watch this image                                               |
| `data-pg-image-frame`  | a wrapper          | Carries the grey; the image inside shows once loaded           |
| `data-pg-image-state`  | `<img>`            | `"loaded"` or `"error"`, written by image. None yet: loading   |
| `data-pg-image-src`    | `<img>`            | On error: the address it tried, written by image               |
| `data-pg-image-fade`   | framed `<img>`     | Fade in when loaded. Bare: `--pg-image-fade`; a value: its own, in ms |

No fade unless an image asks for one. Without the attribute a framed image
is hidden until loaded, then shown at once — as YouTube's thumbnails do:

```html
<div data-pg-image-frame><img data-pg-image …></div>                          <!-- at once -->
<div data-pg-image-frame><img data-pg-image data-pg-image-fade …></div>       <!-- 400ms -->
<div data-pg-image-frame><img data-pg-image data-pg-image-fade="1200" …></div> <!-- 1200ms -->
```

In JSX a bare attribute is `data-pg-image-fade=""`.

Style anything on the state — a caption over failed images, say:

```css
figure:has([data-pg-image-state="error"]) figcaption::after {
    content: " · not available";
}
```

## Behaviour

- **Loading:** a grey ground, on the frame or, without one, on the image
  itself.
- **Loaded:** the grey goes. A framed image, hidden until now, shows whole
  — at once, or fading in with `data-pg-image-fade`. An image without a
  frame is drawn over its grey as it arrives, and is never faded: fading
  it would fade its own grey with it.
- **Failed:** the image is swapped for an empty one, so its box and grey
  stay and the browser draws no broken icon and no alt text. Inside a
  `<picture>` the `<source>`s are cleared too — the browser does not fall
  back to the `<img>`'s own `src` when a source fails.
- **Already done when the script runs** (cached, server-rendered): checked
  once at start and marked the same way.

Until the script runs, an unframed image that has already failed shows the
browser's broken icon; a framed one is hidden. Put
`color: transparent` on images too, so their alt text never shows while
loading.

Without JavaScript nothing is hidden: images show as they arrive, with no
fade. With reduced motion asked for, framed images appear without fading.

## CSS

| Variable                 | Default                     | Meaning                                    |
| ------------------------ | --------------------------- | ------------------------------------------ |
| `--pg-image-placeholder` | `rgb(127 127 127 / 0.15)`   | The ground — suits light and dark themes   |
| `--pg-image-fade`        | `400ms`                     | The fade of a bare `data-pg-image-fade`    |

Set them anywhere above the image — on `:root` for the whole site, on a
section for its images. A value on `data-pg-image-fade` wins over
`--pg-image-fade`.

The ground is not the text colour on
purpose: an image's colour is made transparent to hide its alt text, and a
share of transparent is transparent.

## Recipes

**A box with a fixed shape**, the image cropped to fill it — what
`padding-bottom: 56.25%` used to do:

```html
<div data-pg-image-frame style="aspect-ratio: 16 / 9; overflow: hidden">
    <img data-pg-image src="a.jpg" width="1600" height="900" alt="…"
         style="width: 100%; height: 100%; object-fit: cover" />
</div>
```

**The right file for the screen.** `sizes` says how wide the image is
drawn; the browser picks from `srcset` by that width and the screen's pixel
density:

```html
<img data-pg-image loading="lazy"
     src="a-1000.jpg"
     srcset="a-500.jpg 500w, a-1000.jpg 1000w, a-1500.jpg 1500w"
     sizes="(width >= 64rem) 33vw, 100vw"
     width="1500" height="1000" alt="…" />
```

For lazy images Chrome also takes `sizes="auto, (width >= 64rem) 33vw, 100vw"`
— it measures the drawn width itself and the rest is the fallback for
browsers that do not.

**A different image per screen.** When the shape changes, give each
`<source>` its own `width` and `height`, or the page jumps as it arrives.
The image's attributes stay on the `<img>`:

```html
<div data-pg-image-frame>
    <picture>
        <source media="(width >= 48rem)" srcset="wide.jpg" width="1600" height="900" />
        <img data-pg-image src="tall.jpg" width="800" height="1000" alt="…" />
    </picture>
</div>
```

**From the old lazy loader** — everything is the browser's now:

| Before                          | Now                                                                 |
| ------------------------------- | ------------------------------------------------------------------- |
| load at once                    | a plain `src`, no `loading="lazy"`                                  |
| load on scroll, down or sideways | `loading="lazy"` — sideways sliders included                       |
| load on click                   | `loading="lazy"` inside what the click opens: a closed `<details>`, a `hidden` panel |
| load only below a width         | hide it with CSS above that width — a `display: none` lazy image is not fetched |
| `data-src`                      | `src`                                                               |
| a "loaded" class                | `data-pg-image-state="loaded"`                                      |

## React

Call `initImage` once, in an effect, high in the tree — it returns its own
cleanup:

```tsx
useEffect(() => initImage(), []);
```

The images themselves need no client code. Pass `data-pg-image` straight
through next/image — it can stay in a Server Component, no `onLoad` or
`onError`:

```tsx
import Image from "next/image";
import horse from "./horse.jpg";

<div data-pg-image-frame className="aspect-[3/2] overflow-hidden">
    <Image data-pg-image src={horse} alt="…" sizes="(width >= 64rem) 33vw, 100vw"
           className="h-full w-full object-cover" />
</div>
```

If `initImage` is called again before the first cleanup runs (React
remounting in development), only the newest call answers.

One thing to know: when an image fails **before React has hydrated** the
page, image has already swapped its `src`, and React in development may
warn that an attribute differs from the server's. Only a development
warning; nothing breaks.

See [`examples/react/Example.tsx`](examples/react/Example.tsx). A plain HTML
version, with every case above, is in
[`examples/static/index.html`](examples/static/index.html).
