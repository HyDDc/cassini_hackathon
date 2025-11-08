import React, { useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

interface ImageViewerProps {
  src?: string | null;
  minZoom?: number;
  maxZoom?: number;
  style?: React.CSSProperties;
}

export default function ImageViewer({
  src,
  minZoom = 0.2,
  maxZoom = 4,
  style
}: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragging = useRef(false);
  const last = useRef<Point>({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    setZoom(1);
    setPos({ x: 0, y: 0 });
  }, [src]);

  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

  const onWheel: React.WheelEventHandler = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((z) => clamp(z + delta, minZoom, maxZoom));
  };

  const onMouseDown: React.MouseEventHandler = (e) => {
    if (e.button !== 0) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).closest && (e.target as Element).closest("div")?.classList.add("dragging");
  };

  const onMouseMove: React.MouseEventHandler = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const stopDrag = () => {
    dragging.current = false;
    containerRef.current?.classList.remove("dragging");
  };

  const zoomTo = (factor: number) => {
    setZoom((z) => clamp(z * factor, minZoom, maxZoom));
  };

  return (
    <div style={{ width: "100%", ...style }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <button onClick={() => zoomTo(1 / 1.2)} aria-label="zoom out">−</button>
        <div style={{ minWidth: 56, textAlign: "center" }}>{Math.round(zoom * 100)}%</div>
        <button onClick={() => zoomTo(1.2)} aria-label="zoom in">+</button>
        <button
          onClick={() => {
            setZoom(1);
            setPos({ x: 0, y: 0 });
          }}
        >
          Reset
        </button>
      </div>

      <div
        ref={containerRef}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        style={{
          width: "100%",
          height: 600,
          overflow: "hidden",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: "none",
          userSelect: "none"
        }}
      >
        {src ? (
          <img
            ref={imgRef}
            src={src}
            alt="viewer"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
              transformOrigin: "top left",
              cursor: dragging.current ? "grabbing" : "grab",
              willChange: "transform",
              maxWidth: "none",
              maxHeight: "none"
            }}
          />
        ) : (
          <div style={{ color: "#ddd" }}>No image</div>
        )}
      </div>
    </div>
  );
}