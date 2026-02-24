import { useEffect, useRef, useState } from "react";

export default function TradeMap({ trades, areaName }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [geocoding, setGeocoding] = useState(false);
  const [plotted, setPlotted] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    if (mapRef.current._leaflet_id) return;

    import("leaflet").then((L) => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (mapRef.current._leaflet_id) return;
      const map = L.map(mapRef.current, { preferCanvas: true }).setView([33.5902, 130.4017], 13);
      mapInstanceRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || trades.length === 0) return;

    const map = mapInstanceRef.current;

    // 既存マーカーを削除
    import("leaflet").then(async (L) => {
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];

      // 地区名をユニーク化してジオコーディング
      const districtMap = {};
      const uniqueDistricts = [...new Set(trades.map(t => t.DistrictName).filter(Boolean))].slice(0, 30);

      setGeocoding(true);
      let count = 0;

      for (const district of uniqueDistricts) {
        const address = `${areaName || "福岡市中央区"}${district}`;
        try {
          const res = await fetch("/api/geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address }),
          });
          if (res.ok) {
            const { lat, lon } = await res.json();
            districtMap[district] = { lat, lon };
          }
        } catch {}
        await new Promise(r => setTimeout(r, 200)); // Nominatim制限対応
      }

      // マーカー追加
      let plotCount = 0;
      trades.forEach((t) => {
        const coords = districtMap[t.DistrictName];
        if (!coords) return;

        // 微小なランダムオフセット（同一地点の重複を避ける）
        const lat = coords.lat + (Math.random() - 0.5) * 0.002;
        const lon = coords.lon + (Math.random() - 0.5) * 0.002;

        const tsubo = t.Area && t.TradePrice
          ? Math.round(parseInt(t.TradePrice) / (parseInt(t.Area) * 0.3025) / 10000) : null;

        const marker = L.circleMarker([lat, lon], {
          radius: 6, fillColor: "#2563eb", color: "#1d4ed8",
          weight: 1, opacity: 1, fillOpacity: 0.7,
        }).bindPopup(`
          <div style="font-size:12px;min-width:160px">
            <div style="font-weight:700;margin-bottom:4px">${t.DistrictName || "-"}</div>
            <div>種類：${t.Type || "-"}</div>
            <div>面積：${t.Area ? t.Area + "㎡" : "-"}</div>
            <div>取引価格：<b style="color:#2563eb">¥${t.TradePrice ? Math.round(parseInt(t.TradePrice)/10000).toLocaleString() + "万" : "-"}</b></div>
            <div>坪単価：${tsubo ? tsubo + "万/坪" : "-"}</div>
            <div>築年：${t.BuildingYear || "-"}</div>
          </div>
        `).addTo(map);

        markersRef.current.push(marker);
        plotCount++;
      });

      setPlotted(plotCount);
      setGeocoding(false);

      // 最初のマーカーにズーム
      if (markersRef.current.length > 0) {
        const firstCoords = Object.values(districtMap)[0];
        if (firstCoords) map.setView([firstCoords.lat, firstCoords.lon], 14);
      }
    });
  }, [trades]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: 450, borderRadius: 8, border: "1px solid #e2e8f0" }} />
      {geocoding && (
        <div style={{
          position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
          background: "rgba(37,99,235,0.9)", color: "#fff", padding: "6px 16px",
          borderRadius: 20, fontSize: 12, zIndex: 1000,
        }}>
          📍 地区名から座標を取得中...
        </div>
      )}
      {!geocoding && plotted > 0 && (
        <div style={{
          position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
          background: "rgba(16,185,129,0.9)", color: "#fff", padding: "6px 16px",
          borderRadius: 20, fontSize: 12, zIndex: 1000,
        }}>
          📍 {plotted}件をプロット済み
        </div>
      )}
    </div>
  );
}