'use client';

import { useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const MIN_SCALE     = 0.30;
const MAX_SCALE     = 1.50;
const DEFAULT_SCALE = 0.58;   // Shows the full 1100px canvas inside a ~640px viewport

interface TreeViewportProps {
  canvasWidth:  number;
  canvasHeight: number;
  children: React.ReactNode;
}

export default function TreeViewport({
  canvasWidth,
  canvasHeight,
  children,
}: TreeViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // All three transform axes as MotionValues so framer-motion
  // applies them as a single CSS transform (no layout recalc).
  const x     = useMotionValue(0);
  const y     = useMotionValue(0);
  const scale = useMotionValue(DEFAULT_SCALE);

  /** Center the canvas inside the viewport and reset scale. */
  const resetView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    scale.set(DEFAULT_SCALE);
    x.set((width  - canvasWidth  * DEFAULT_SCALE) / 2);
    y.set((height - canvasHeight * DEFAULT_SCALE) / 2);
  }, [canvasWidth, canvasHeight, x, y, scale]);

  // Center on first paint.
  useLayoutEffect(() => { resetView(); }, [resetView]);

  /**
   * Zoom toward the center of the viewport.
   * Adjusts x/y so the point currently at the viewport center stays fixed.
   */
  const zoom = useCallback(
    (delta: number) => {
      const el = containerRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const oldS  = scale.get();
      const newS  = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldS + delta));
      if (newS === oldS) return;
      const ratio = newS / oldS;
      const cx    = width  / 2;
      const cy    = height / 2;
      x.set(cx + (x.get() - cx) * ratio);
      y.set(cy + (y.get() - cy) * ratio);
      scale.set(newS);
    },
    [scale, x, y],
  );

  // Scroll-to-zoom — must be a non-passive native listener so we can
  // call preventDefault() and prevent the page from scrolling.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      zoom(e.deltaY > 0 ? -0.06 : 0.06);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [zoom]);

  return (
    <div className="relative">
      {/* ── Viewport ────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl bg-slate-950/40"
        style={{ height: 620 }}
      >
        {/* Hint */}
        <p className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 select-none text-[11px] text-slate-600">
          Drag to pan&nbsp;·&nbsp;Scroll to zoom
        </p>

        {/* Draggable canvas */}
        <motion.div
          drag
          dragMomentum={false}
          style={{
            x,
            y,
            scale,
            width:           canvasWidth,
            height:          canvasHeight,
            transformOrigin: 'top left',
          }}
          className="absolute cursor-grab active:cursor-grabbing"
        >
          {children}
        </motion.div>
      </div>

      {/* ── Controls ────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
        <ViewportBtn title="Zoom In"    onClick={() => zoom( 0.10)}><ZoomIn    size={14} /></ViewportBtn>
        <ViewportBtn title="Zoom Out"   onClick={() => zoom(-0.10)}><ZoomOut   size={14} /></ViewportBtn>
        <ViewportBtn title="Reset View" onClick={resetView}        ><RotateCcw size={14} /></ViewportBtn>
      </div>
    </div>
  );
}

function ViewportBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/90 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
    >
      {children}
    </button>
  );
}
