import { useEffect, useRef } from "react";

export default function TradeMap({ trades }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapRef.current) return;

    // 既に初期化済みの場合はスキップ
    if (mapRef.current._leaflet_id) return;

    import("leaflet").then((L) => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current, { preferCanvas: true }).setView([33.5902, 130.4017], 13);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;

      map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) map.removeLayer(layer);
      });

      const tradesWithCoords = trades.filter(t => t.Latitude && t.Longitude).slice(0, 200);

      if (tradesWithCoords.length > 0) {
        tradesWithCoords.forEach((t) => {
          const tsubo = t.Area && t.TradePrice
            ? Math.round(t.TradePrice / (t.Area * 0.3025) / 10000) : null;

          L.circleMarker([t.Latitude, t.Longitude], {
            radius: 6, fillColor: "#2563eb", color: "#1d4ed8",
            weight: 1, opacity: 1, fillOpacity: 0.7,
          }).bindPopup(`
            <div style="font-size:12px;min-width:160px">
              <div style="font-weight:700;margin-bottom:4px">${t.DistrictName || "-"}</div>
              <div>種類：${t.Type || "-"}</div>
              <div>面積：${t.Area ? t.Area + "㎡" : "-"}</div>
              <div>取引価格：<b style="color:#2563eb">¥${t.TradePrice ? Math.round(t.TradePrice/10000).toLocaleString() + "万" : "-"}</b></div>
              <div>坪単価：${tsubo ? tsubo + "万/坪" : "-"}</div>
              <div>築年：${t.BuildingYear || "-"}</div>
            </div>
          `).addTo(map);
        });
        map.setView([tradesWithCoords[0].Latitude, tradesWithCoords[0].Longitude], 14);
      }
    });
  }, [trades]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapRef} style={{ width: "100%", height: 450, borderRadius: 8, border: "1px solid #e2e8f0" }} />
      {trades.filter(t => t.Latitude && t.Longitude).length === 0 && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(248,250,252,0.85)", borderRadius: 8, flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontSize: 32 }}>🗺️</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>このデータには座標情報が含まれていません</div>
        </div>
      )}
    </div>
  );
}