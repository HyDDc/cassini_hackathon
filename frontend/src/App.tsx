import React, { useState } from "react";
import "./App.css";
import LeafletViewer from "./components/LeafletViewer";

export default function App() {
  const [src, setSrc] = useState<string | null>("/sample.jpg");

  // Example bounds for a small area (southWest, northEast)
  const sampleBounds = [
    [37.7036, -122.5233], // southWest: [lat, lng]
    [37.8120, -122.3566]  // northEast: [lat, lng]
  ];

  return (
    <div className="app">
      <main>
        <div className="controls" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <label style={{ background: "#5b1c5bff", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
            Choose image
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setSrc(URL.createObjectURL(f));
              }}
            />
          </label>
        </div>

        <LeafletViewer imageUrl="/sample.jpg" bounds={sampleBounds} />
      </main>
    </div>
  );
}
