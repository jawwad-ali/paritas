'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { COLLAGE_SETS, PLACEMENTS } from './collage-pieces';
import { GrainGround } from './grain-ground';

/** The collage is composed at this size and scaled to fit its box, so every width shows the same picture. */
const DESIGN_WIDTH = 628;
const DESIGN_HEIGHT = 716;
/** One set holds 2.8 s; the change takes 0.7 s (out, then in). */
const SET_HOLD_MS = 2800;

/** Scale that fits the design canvas inside the element, re-measured as it resizes. */
const useFitScale = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const { width, height } = entry.contentRect;
        setScale(Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT));
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, scale] as const;
};

/**
 * What Paritas does, as its own interface: matching, then exceptions, then
 * reports, one set at a time on the grain field. Decorative: the words beside
 * it say the same thing. Holds the first set on a phone and under reduced motion.
 */
export const ProductCollage = ({ className }: { className?: string }) => {
  const [boxRef, scale] = useFitScale();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const phone = useMediaQuery('(max-width: 767px)');
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const cycling = !reducedMotion && !phone;
  const shown = cycling ? active : 0;

  useEffect(() => {
    if (!cycling || paused) {
      return undefined;
    }
    const timer = setInterval(
      () => setActive((current) => (current + 1) % COLLAGE_SETS.length),
      SET_HOLD_MS,
    );
    return () => clearInterval(timer);
  }, [cycling, paused]);

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      {/* Absolute, so the layout sizes the box and the canvas scales to it (never the reverse). */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            'relative shrink-0 origin-center transition-opacity duration-500',
            scale === null ? 'opacity-0' : 'opacity-100',
          )}
          style={{
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `scale(${scale ?? 1})`,
            margin: `${(DESIGN_HEIGHT * ((scale ?? 1) - 1)) / 2}px ${(DESIGN_WIDTH * ((scale ?? 1) - 1)) / 2}px`,
          }}
        >
          <div aria-hidden="true">
            <GrainGround className="absolute top-0 left-0 h-[86%] w-[82%] overflow-hidden rounded-lg" />
            {COLLAGE_SETS.map((set, index) => (
              <div
                key={set.id}
                className={cn(
                  // The old set leaves before the new one arrives (0.35 s each), so text never lies on text.
                  'absolute inset-0 transition-opacity duration-[350ms] ease-out',
                  index === shown ? 'opacity-100 delay-[350ms]' : 'pointer-events-none opacity-0',
                )}
              >
                {set.pieces.map((PieceComponent, pieceIndex) => (
                  // A fixed list: the position is the identity.
                  <PieceComponent key={pieceIndex} />
                ))}
              </div>
            ))}
          </div>
          {cycling && (
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? 'Play the product preview' : 'Pause the product preview'}
              aria-pressed={paused}
              className="absolute flex size-10 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background text-foreground shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
              style={{
                right: PLACEMENTS.corner.right,
                bottom: PLACEMENTS.corner.bottom,
              }}
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
