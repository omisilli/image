"use client";

import { useEffect } from "react";
import { initImage } from "@plusguard/image";
import "@plusguard/image/index.css";

/* Mount once, high in the tree — in the root layout, say. Images rendered
   later, on another route or from fetched data, are covered too. */
export function Images() {
    useEffect(() => initImage(), []);
    return null;
}

/* The images themselves need no client code: this part can be a Server
   Component. With next/image, pass data-pg-image straight through:

     import Image from "next/image";
     import horse from "./horse.jpg";

     <div data-pg-image-frame className="aspect-[3/2] overflow-hidden rounded-lg">
         <Image data-pg-image suppressHydrationWarning src={horse} alt="…"
                sizes="(width >= 64rem) 33vw, 100vw" className="h-full w-full object-cover" />
     </div>

   suppressHydrationWarning: image writes data-pg-image-state as soon as an
   image loads — before React hydrates it, if it loads first.
*/
export function Example() {
    return (
        <>
            <Images />

            <div className="grid gap-4 sm:grid-cols-2">
                {/* Framed: grey on the frame, the image shows whole once loaded.
                    data-pg-image-fade="" fades it in (400ms, or --pg-image-fade);
                    a value is its own, in ms. Leave it out for no fade. */}
                <div data-pg-image-frame className="aspect-[3/2] overflow-hidden rounded-lg">
                    <img
                        data-pg-image
                        suppressHydrationWarning
                        data-pg-image-fade=""
                        src="/images/horse-01.jpg"
                        width={800}
                        height={533}
                        alt="A white horse running"
                        className="h-full w-full object-cover"
                    />
                </div>

                {/* No frame: grey on the image itself until it is there. Lazy:
                    the browser fetches it when it comes near. */}
                <img
                    data-pg-image
                    suppressHydrationWarning
                    loading="lazy"
                    src="/images/horse-02.jpg"
                    width={800}
                    height={533}
                    alt="A horse under a cloudy sky"
                    className="aspect-[3/2] w-full rounded-lg object-cover"
                />

                {/* Failed: stays a grey box, no broken-image icon. Style it further
                    through the state, e.g. data-[pg-image-state=error]:… */}
                <div data-pg-image-frame className="aspect-[3/2] overflow-hidden rounded-lg">
                    <img
                        data-pg-image
                        suppressHydrationWarning
                        src="/images/missing.jpg"
                        width={800}
                        height={533}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                </div>
            </div>
        </>
    );
}
