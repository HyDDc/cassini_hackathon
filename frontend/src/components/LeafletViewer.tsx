import React, { useEffect } from "react";
import { MapContainer, TileLayer, ImageOverlay, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  imageUrl: string;
  bounds: LatLngBoundsExpression;
  geotiffUrl?: string;
  center?: [number, number];
  zoom?: number;
  style?: React.CSSProperties;
  showBaseMap?: boolean;
}

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    try {
      map.fitBounds(bounds as any, { animate: false, padding: [20, 20] });
    } catch (e) {
      // ignore
    }
  }, [map, bounds]);
  return null;
}

/**
 * Fullscreen Leaflet viewer (fixed, covers viewport).
 */
export default function LeafletViewer({
  imageUrl,
  bounds,
  geotiffUrl,
  center,
  zoom = 2,
  style,
  showBaseMap = true
}: Props) {
  const defaultCenter =
    center ??
    ((bounds as any)?.[0]
      ? [((bounds as any)[0][0] + (bounds as any)[1][0]) / 2, ((bounds as any)[0][1] + (bounds as any)[1][1]) / 2]
      : [0, 0]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1000,
        ...style
      }}
    >
      <MapContainer
        center={defaultCenter as any}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
        className="leaflet-fullscreen-container"
      >
        {showBaseMap && (
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        )}

        <ImageOverlay url={imageUrl} bounds={bounds} opacity={1} />
        {/* optional geotiff layer handling left as-is */}
        <FitBounds bounds={bounds} />
      </MapContainer>
    </div>
  );
}