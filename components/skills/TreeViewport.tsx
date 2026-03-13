'use client';

import { useRef, useLayoutEffect, useCallback, useEffect, useState } from 'react';
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
  const containerRef  = useRef<HTMLDivElement>(null);
  const lastDistRef   = useRef(0);       // pinch distance from previous frame
  const isPinchingRef = useRef(false);   // fast ref for touchmove guard

  // Disable Framer drag while a pinch is active so the two systems
  // don't fight each other and cause drift.
  const [isPinching, setIsPinching] = useState(false);

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
   * Core zoom primitive — zooms toward an arbitrary focal point in
   * screen (client) coordinates so the content under the focal point
   * stays visually fixed during the transform.
   */
  const zoomAt = useCallback(
    (delta: number, focalClientX: number, focalClientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const oldS = scale.get();
      const newS = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldS + delta));
      if (newS === oldS) return;
      const ratio = newS / oldS;
      // Convert screen focal point to viewport-local coordinates.
      const rect = el.getBoundingClientRect();
      const lx = focalClientX - rect.left;
      const ly = focalClientY - rect.top;
      x.set(lx + (x.get() - lx) * ratio);
      y.set(ly + (y.get() - ly) * ratio);
      scale.set(newS);
    },
    [scale, x, y],
  );

  /**
   * Convenience wrapper — zooms toward the viewport center.
   * Used by the mouse wheel and the ± buttons.
   */
  const zoom = useCallback(
    (delta: number) => {
      const el = containerRef.current;
      if (!el) return;
      const { left, top, width, height } = el.getBoundingClientRect();
      zoomAt(delta, left + width / 2, top + height / 2);
    },
    [zoomAt],
  );

  // Scroll-to-zoom (desktop) — non-passive so we can call preventDefault().
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

  // Pinch-to-zoom (touch devices).
  //
  // Drift fixes applied here:
  //   1. Zoom pivots around the midpoint of the two fingers, not the
  //      viewport center — the main cause of apparent drift.
  //   2. `isPinching` state disables Framer's drag prop while a pinch is
  //      active so the two gesture systems don't fight each other.
  //   3. `lastDistRef` is reset on both touchstart and touchend to ensure
  //      the first frame of every new pinch has zero delta.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinchingRef.current = true;
        setIsPinching(true);
        lastDistRef.current = 0;   // always start fresh
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPinchingRef.current || e.touches.length !== 2) return;
      e.preventDefault();

      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dx   = t0.clientX - t1.clientX;
      const dy   = t0.clientY - t1.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (lastDistRef.current > 0) {
        // Focal point = midpoint between the two fingers in screen coords.
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;
        zoomAt((dist - lastDistRef.current) * 0.003, midX, midY);
      }
      lastDistRef.current = dist;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinchingRef.current = false;
        setIsPinching(false);
        lastDistRef.current = 0;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [zoomAt]);

  return (
    <div className="relative">
      {/* ── Viewport ────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl bg-slate-950/40"
        style={{ height: 620, touchAction: 'none' }}
      >
        {/* Hint */}
        <p className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 select-none text-[11px] text-slate-600">
          Drag to pan&nbsp;·&nbsp;Scroll to zoom
        </p>

        {/* Draggable canvas — drag disabled while pinching to prevent drift */}
        <motion.div
          drag={!isPinching}
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
