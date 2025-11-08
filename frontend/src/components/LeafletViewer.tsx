import React, { useEffect } from "react";
import { MapContainer, TileLayer, ImageOverlay, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";

interface Props {
  imageUrl: string;
  bounds: LatLngBoundsExpression; // [[southLat, westLng], [northLat, eastLng]]
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
 * Simple Leaflet viewer that overlays an image on the map.
 * Pass georeferenced bounds like [[southLat, westLng], [northLat, eastLng]].
 */
export default function LeafletViewer({
  imageUrl,
  bounds,
  center,
  zoom = 2,
  style,
  showBaseMap = true
}: Props) {
  // fallback center if not provided
  const defaultCenter = center ?? ((bounds as any)?.[0] ? [((bounds as any)[0][0] + (bounds as any)[1][0]) / 2, ((bounds as any)[0][1] + (bounds as any)[1][1]) / 2] : [0, 0]);

  return (
    <div style={{ width: "100%", height: "600px", ...style }}>
      <MapContainer center={defaultCenter as any} zoom={zoom} style={{ width: "100%", height: "100%" }}>
        {showBaseMap && (
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        <ImageOverlay url={imageUrl} bounds={bounds} opacity={1} />
        <FitBounds bounds={bounds} />
      </MapContainer>
    </div>
  );
}