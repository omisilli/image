/*
 * image — what neither the browser nor next/image does for an image.
 *
 *   <img data-pg-image loading="lazy" src="a.jpg" width="800" height="600" alt="…" />
 *   <Image data-pg-image src={…} width={800} height={600} alt="…" />   (next/image)
 *
 * Writes the image's state to data-pg-image-state: "loaded" or "error"
 * (no attribute yet: still loading). index.css shows a grey ground until
 * then, fades the image in inside a data-pg-image-frame, and keeps the grey
 * when it fails.
 *
 * On error the image is swapped for an empty one, so its box and grey
 * ground stay and the browser draws no broken-image icon or alt text. The
 * address it tried is kept in data-pg-image-src.
 *
 * Lazy loading, sizes, formats: not here. The browser (loading="lazy",
 * srcset, <picture>) or next/image does those.
 *
 * Listening happens once, on document, so images rendered later — another
 * route, a fetched list — are covered, and next/image needs no onLoad or
 * onError: it can stay in a Server Component.
 */

const ATTR = "data-pg-image";
const STATE = "data-pg-image-state";
const SRC = "data-pg-image-src";

/* A transparent 1×1 GIF: the stand-in for an image that failed. */
const EMPTY = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function isWatched(target: EventTarget | null): target is HTMLImageElement {
    return target instanceof HTMLImageElement && target.hasAttribute(ATTR);
}

function isStandIn(img: HTMLImageElement): boolean {
    return img.getAttribute("src") === EMPTY;
}

function markLoaded(img: HTMLImageElement): void {
    // The stand-in loading is not the image loading.
    if (isStandIn(img)) return;
    img.setAttribute(STATE, "loaded");
}

function markFailed(img: HTMLImageElement): void {
    if (isStandIn(img)) return;
    img.setAttribute(SRC, img.currentSrc || img.getAttribute("src") || "");
    img.setAttribute(STATE, "error");

    // Inside <picture> the sources win over the img's own src: clear them,
    // or the browser keeps showing the one that failed.
    const picture = img.parentElement;
    if (picture instanceof HTMLPictureElement) {
        picture.querySelectorAll("source").forEach((source) => source.removeAttribute("srcset"));
    }
    img.removeAttribute("srcset");
    img.src = EMPTY;
}

/* Only the newest call answers events — a late cleanup from an older one
   (React remounting) cannot switch it off. Same rule as the other packages. */
let live: object | null = null;

/* Start listening; returns the cleanup for a React effect. */
export function initImage(): () => void {
    if (typeof document === "undefined") return () => {};

    const self = {};
    live = self;

    // load and error do not bubble; listening in the capture phase on
    // document still sees every image's.
    const onLoad = (event: Event): void => {
        if (live === self && isWatched(event.target)) markLoaded(event.target);
    };
    const onError = (event: Event): void => {
        if (live === self && isWatched(event.target)) markFailed(event.target);
    };

    document.addEventListener("load", onLoad, true);
    document.addEventListener("error", onError, true);

    // Images that finished before this ran — a server-rendered page, the
    // browser's cache. decode() tells success from failure even for an SVG
    // without a size of its own, where naturalWidth can read 0.
    document.querySelectorAll<HTMLImageElement>(`img[${ATTR}]`).forEach((img) => {
        if (!img.complete || img.hasAttribute(STATE) || isStandIn(img)) return;
        img.decode().then(
            () => markLoaded(img),
            () => markFailed(img),
        );
    });

    return () => {
        document.removeEventListener("load", onLoad, true);
        document.removeEventListener("error", onError, true);
        if (live === self) live = null;
    };
}
