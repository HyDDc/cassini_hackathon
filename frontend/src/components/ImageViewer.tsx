import React, { useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

interface Props {
  src?: string | null;
  minZoom?: number;
  maxZoom?: number;
  onClose?: () => void; // optional close handler
}

/**
 * Mobile-first fullscreen image viewer with:
 * - fit-to-screen on load
 * - pan (drag)
 * - wheel/controls for desktop
 * - pinch-to-zoom (pointer events) for mobile
 * - double-tap to toggle zoom
 *
 * This component renders fullscreen (covers viewport) to prioritize mobile UX.
 */
export default function ImageViewer({
  src,
  minZoom = 0.5,
  maxZoom = 6,
  onClose
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const pointers = useRef<Map<number, Point>>(new Map());
  const pinchState = useRef<{ startDist: number; startZoom: number; midpoint: Point } | null>(null);
  const lastTap = useRef<number>(0);

  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState<Point>({ x: 0, y: 0 });
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [fitZoom, setFitZoom] = useState<number>(1);

  // Fit image to viewport and center
  const fitAndCenter = (imgW: number, imgH: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const z = Math.max(minZoom, Math.min(maxZoom, Math.min(cw / imgW, ch / imgH)));
    setFitZoom(z);
    setZoom(z);
    const x = Math.round((cw - imgW * z) / 2);
    const y = Math.round((ch - imgH * z) / 2);
    setPos({ x, y });
  };

  useEffect(() => {
    // reset when src changes
    setZoom(1);
    setPos({ x: 0, y: 0 });
    setNatural(null);
  }, [src]);

  // image load handler -> compute natural size and fit
  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    fitAndCenter(img.naturalWidth, img.naturalHeight);
  };

  const clamp = (v: number) => Math.min(maxZoom, Math.max(minZoom, v));

  // pointer events for pan + pinch
  const onPointerDown: React.PointerEventHandler = (e) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      // start pinch
      const pts = Array.from(pointers.current.values());
      const a = pts[0], b = pts[1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      pinchState.current = { startDist: dist, startZoom: zoom, midpoint };
    }
  };

  const onPointerMove: React.PointerEventHandler = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      // pan
      const p = pointers.current.values().next().value as Point;
      // we need previous position => track via pinchState temporarily when single pointer drag we use last known pos stored in pinchState.startDist as hack
      // simpler: use lastTap to store last pointer pos in pinchState.startDist as previous coords
      if (!("prev" in pinchState.current as any)) {
        pinchState.current = { startDist: 0, startZoom: zoom, midpoint: { x: e.clientX, y: e.clientY } };
        (pinchState.current as any).prev = { x: e.clientX, y: e.clientY };
        return;
      }
      const prev = (pinchState.current as any).prev as Point;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      (pinchState.current as any).prev = { x: e.clientX, y: e.clientY };
      setPos((p0) => ({ x: p0.x + dx, y: p0.y + dy }));
    } else if (pointers.current.size === 2 && pinchState.current) {
      const pts = Array.from(pointers.current.values());
      const a = pts[0], b = pts[1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const scale = dist / pinchState.current.startDist;
      const newZoom = clamp(pinchState.current.startZoom * scale);

      // maintain midpoint anchor: convert midpoint screen -> image coords then compute new pos
      const container = containerRef.current;
      const img = imgRef.current;
      if (container && img) {
        const rect = container.getBoundingClientRect();
        const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const mx = midpoint.x - rect.left;
        const my = midpoint.y - rect.top;

        // image point in image-space before zoom
        const imgX = (mx - pos.x) / zoom;
        const imgY = (my - pos.y) / zoom;

        // new pos so that imgX,imgY maps to same mx,my with newZoom
        const newPosX = mx - imgX * newZoom;
        const newPosY = my - imgY * newZoom;

        setZoom(newZoom);
        setPos({ x: newPosX, y: newPosY });
      } else {
        setZoom(newZoom);
      }
    }
  };

  const onPointerUp: React.PointerEventHandler = (e) => {
    pointers.current.delete(e.pointerId);
    // clean pinch state for single pointer end
    if (pointers.current.size < 2) pinchState.current = null;
  };

  // double-tap / double-click to toggle between fitZoom and 2x (or fitZoom*2)
  const onTap = (clientX?: number, clientY?: number) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // double tap
      const targetZoom = clamp(Math.max(fitZoom * 2, fitZoom * 1.5));
      if (Math.abs(zoom - fitZoom) < 0.05) {
        // zoom in centered on tap
        if (clientX != null && clientY != null && containerRef.current && imgRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const mx = clientX - rect.left;
          const my = clientY - rect.top;
          const imgX = (mx - pos.x) / zoom;
          const imgY = (my - pos.y) / zoom;
          const newPosX = mx - imgX * targetZoom;
          const newPosY = my - imgY * targetZoom;
          setZoom(targetZoom);
          setPos({ x: newPosX, y: newPosY });
        } else {
          setZoom(targetZoom);
        }
      } else {
        // reset to fit
        setZoom(fitZoom);
        setPos((p) => {
          if (!natural || !containerRef.current) return { x: 0, y: 0 };
          const cw = containerRef.current.clientWidth;
          const ch = containerRef.current.clientHeight;
          return { x: (cw - natural.w * fitZoom) / 2, y: (ch - natural.h * fitZoom) / 2 };
        });
      }
    }
    lastTap.current = now;
  };

  // mouse wheel for desktop zoom
  const onWheel: React.WheelEventHandler = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const newZoom = clamp(zoom + delta);
    // zoom to cursor
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const imgX = (mx - pos.x) / zoom;
      const imgY = (my - pos.y) / zoom;
      const newPosX = mx - imgX * newZoom;
      const newPosY = my - imgY * newZoom;
      setZoom(newZoom);
      setPos({ x: newPosX, y: newPosY });
    } else {
      setZoom(newZoom);
    }
  };

  // keyboard Escape to close (if onClose provided)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // layout changes -> refit if natural exists
  useEffect(() => {
    const onResize = () => {
      if (natural) fitAndCenter(natural.w, natural.h);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural]);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onDoubleClick={(e) => onTap(e.clientX, e.clientY)}
      onClick={(e) => {
        // single click registers tap for mobile double-tap detection
        onTap(e.clientX, e.clientY);
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none" /* enable pointer-based gestures */,
        userSelect: "none"
      }}
    >
      {/* top controls */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          display: "flex",
          gap: 8,
          zIndex: 10000,
          alignItems: "center"
        }}
      >
        <button
          onClick={() => {
            const nz = clamp(zoom / 1.2);
            setZoom(nz);
          }}
          aria-label="zoom out"
          style={{ padding: "8px 10px", borderRadius: 6 }}
        >
          −
        </button>

        <div
          style={{
            color: "#fff",
            minWidth: 56,
            textAlign: "center",
            background: "rgba(0,0,0,0.4)",
            padding: "6px 8px",
            borderRadius: 6
          }}
        >
          {Math.round(zoom * 100)}%
        </div>

        <button
          onClick={() => {
            const nz = clamp(zoom * 1.2);
            setZoom(nz);
          }}
          aria-label="zoom in"
          style={{ padding: "8px 10px", borderRadius: 6 }}
        >
          +
        </button>

        <button
          onClick={() => {
            if (!natural) return;
            fitAndCenter(natural.w, natural.h);
          }}
          style={{ padding: "8px 10px", borderRadius: 6 }}
        >
          Fit
        </button>
      </div>

      {/* close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10000,
            padding: "8px 10px",
            borderRadius: 6
          }}
        >
          Close
        </button>
      )}

      {/* image */}
      {src ? (
        // keep image element natural-sizing and transform with translate+scale
        <img
          ref={imgRef}
          src={src}
          onLoad={onImgLoad}
          alt="viewer"
          draggable={false}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
            transformOrigin: "top left",
            willChange: "transform",
            maxWidth: "none",
            maxHeight: "none",
            touchAction: "none"
          }}
        />
      ) : (
        <div style={{ color: "#ddd" }}>No image</div>
      )}
    </div>
  );
}