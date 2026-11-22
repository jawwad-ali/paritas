'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/** Ocean Sunset: ink field, petrol and teal shapes, the sunset amber drifting in across from the calm side. */
const PALETTE = {
  bg: '#001219',
  surface: '#005f73',
  ink: '#e6f1f0',
  muted: '#0a9396',
  accent: '#ca6702',
  accentInk: '#001219',
};

/** Fixed seed: the same composition on every visit. Calm area top-left, where the first card sits. */
const SEED = 2611;
const PARAMS = { speed: 0.35, calmX: 0.3, calmY: 0.3, calm: 0.45, tint: 0.55 };

/**
 * The Taste-Skill effects runtime, copied unchanged from the kit into
 * `public/vendor/taste-fx` (fx.js + grain-gradient/effect.js). The browser loads
 * it as a plain module, outside the bundler: fx.js imports each effect by URL.
 * Replace the files from the kit; never edit them here.
 */
const FX_RUNTIME_URL = '/vendor/taste-fx/fx.js';
const EFFECT_ID = 'grain-gradient';

interface Controller {
  destroy: () => void;
}

interface FxRuntime {
  mount: (
    element: HTMLElement,
    effect: string,
    options: { palette: typeof PALETTE; seed: number; params: typeof PARAMS },
  ) => Promise<Controller>;
}

/**
 * The page's one effect: the grain gradient, drawn by the kit's own runtime
 * (WebGL, paused off-screen, one still frame under reduced motion, a CSS picture
 * when WebGL is unavailable). Purely decorative.
 */
export const GrainGround = ({ className }: { className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }
    let controller: Controller | null = null;
    let cancelled = false;
    void (async () => {
      const { default: fx } = (await import(/* webpackIgnore: true */ FX_RUNTIME_URL)) as {
        default: FxRuntime;
      };
      // Unmounted while loading (React re-runs effects in development): never mount twice on one element.
      if (cancelled) {
        return;
      }
      const mounted = await fx.mount(element, EFFECT_ID, {
        palette: PALETTE,
        seed: SEED,
        params: PARAMS,
      });
      if (cancelled) {
        mounted.destroy();
      } else {
        controller = mounted;
      }
    })().catch(() => {
      // No effect is not an error: the panel keeps its flat ink ground.
    });
    return () => {
      cancelled = true;
      controller?.destroy();
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className={cn('isolate bg-[#001219]', className)} />;
};
