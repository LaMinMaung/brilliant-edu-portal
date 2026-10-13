import React, { useEffect, useState } from "react";
import pb from "../lib/pocketbase";

/* Keyframe injected once per page load */
const KEYFRAME_CSS = `
@keyframes gallery-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
`;

const CARD_WIDTH  = 320; /* px — keeps 3/2/1 visible at desktop/tablet/mobile */
const CARD_HEIGHT = 210; /* px — equal height, object-cover */
const GAP         = 16;  /* px */

const GalleryStrip: React.FC = () => {
  const [items, setItems]   = useState<any[]>([]);
  const [ready, setReady]   = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    pb.collection("gallery")
      .getFullList({
        filter: 'status = "active"',
        sort: "displayOrder,created",
        requestKey: null,
      })
      .then(setItems)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  /* Hide section entirely when there are no active items */
  if (!ready || items.length === 0) return null;

  /*
   * Build the scroll track:
   *  – Repeat items until we have at least 8 so even 1-2 image galleries
   *    fill the viewport on all screen sizes.
   *  – Then double the result so translateX(-50%) scrolls exactly one half,
   *    producing a perfectly seamless infinite loop.
   */
  const repeatTimes = Math.max(1, Math.ceil(8 / items.length));
  const half        = Array.from({ length: repeatTimes }, () => items).flat();
  const track       = [...half, ...half];

  /* Speed: ~70 px/s feels comfortable; floor at 20 s for very few items */
  const totalHalfWidth = half.length * (CARD_WIDTH + GAP);
  const duration       = Math.max(totalHalfWidth / 70, 20);

  return (
    <>
      <style>{KEYFRAME_CSS}</style>

      <section className="py-16 lg:py-20 border-t border-border bg-bg overflow-hidden">

        {/* Section heading */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
          <span className="inline-block text-secondary text-sm font-semibold tracking-widest uppercase mb-3">
            Gallery
          </span>
          <h2 className="font-heading font-bold text-3xl lg:text-4xl text-primary">
            Life at BEI
          </h2>
          <p className="mt-3 text-text-muted text-base max-w-xl mx-auto">
            A glimpse into our learning environment, community, and student life.
          </p>
        </div>

        {/* Infinite marquee — edge-faded with mask-image */}
        <div
          className="relative overflow-hidden"
          style={{
            /* Fade 5% on each side for a polished entry/exit */
            maskImage:
              "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="flex"
            style={{
              gap:              `${GAP}px`,
              paddingLeft:      `${GAP}px`,
              /* GPU-accelerated continuous scroll */
              animation:        `gallery-scroll ${duration}s linear infinite`,
              animationPlayState: paused ? "paused" : "running",
              willChange:       "transform",
            }}
          >
            {track.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="shrink-0 overflow-hidden rounded-xl shadow-md group"
                style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
              >
                <img
                  src={pb.files.getURL(item, item.image, { thumb: "400x280" })}
                  alt={item.title || "BEI Gallery"}
                  title={item.title || undefined}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  loading="lazy"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default GalleryStrip;
