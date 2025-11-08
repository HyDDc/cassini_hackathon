import React, { useState } from "react";
import "./App.css";
import ImageViewer from "./components/ImageViewer";

export default function App() {
  const [src, setSrc] = useState<string | null>("/sample.jpg");

  return (
    <div className="app">
      <main>
        <div className="controls" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <label style={{ background: "#eef2ff", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
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

        <ImageViewer src="/noise.png" />
      </main>
    </div>
  );
}
