import { useEffect, useRef } from "react";

export default function TradeMap({ trades }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return;

    // Leaflet動的インポート
    import("leaflet").then((L) => {
      // CSSを動的に追加
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current).setView([35.6762, 139.6503], 13);
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

      // 既存マーカーを削除
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });

      // ジオコーディング（地区名→座標）は難しいため、
      // 市区町村の中心座標を使ってランダムオフセットでプロット
      const tradesWithCoords = trades
        .filter(t => t.Latitude && t.Longitude)
        .slice(0, 200);

      if (tradesWithCoords.length > 0) {
        tradesWithCoords.forEach((t) => {
          const tsubo = t.Area && t.TradePrice
            ? Math.round(t.TradePrice / (t.Area * 0.3025) / 10000)
            : null;

          L.circleMarker([t.Latitude, t.Longitude], {
            radius: 6,
            fillColor: "#2563eb",
            color: "#1d4ed8",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7,
          })
            .bindPopup(`
              <div style="font-size:12px;min-width:160px">
                <div style="font-weight:700;margin-bottom:4px">${t.DistrictName || "-"}</div>
                <div>種類：${t.Type || "-"}</div>
                <div>面積：${t.Area ? t.Area + "㎡" : "-"}</div>
                <div>取引価格：<b style="color:#2563eb">¥${t.TradePrice ? Math.round(t.TradePrice/10000).toLocaleString() + "万" : "-"}</b></div>
                <div>坪単価：${tsubo ? tsubo + "万/坪" : "-"}</div>
                <div>築年：${t.BuildingYear || "-"}</div>
              </div>
            `)
            .addTo(map);
        });

        // 最初のポイントにズーム
        map.setView([tradesWithCoords[0].Latitude, tradesWithCoords[0].Longitude], 14);
      }
    });
  }, [trades]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: 450, borderRadius: 8, border: "1px solid #e2e8f0" }}
    />
  );
}