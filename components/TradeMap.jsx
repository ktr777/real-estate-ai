export default function TradeMap({ trades, areaName }) {
  // エリア名から検索クエリを生成
  const query = encodeURIComponent(areaName || "福岡市中央区");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=130.3,33.5,130.5,33.7&layer=mapnik&marker=33.5902,130.4017`;

  const hasCoords = trades.filter(t => t.Latitude && t.Longitude).length > 0;

  return (
    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      <iframe
        src={src}
        style={{ width: "100%", height: 400, border: "none", display: "block" }}
        title="周辺地図"
      />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "rgba(255,255,255,0.9)", padding: "8px 12px",
        fontSize: 11, color: "#64748b", textAlign: "center",
      }}>
        ※ 取引事例の個別プロットにはGoogle Maps APIキーが必要です。現在はエリアの概略地図を表示しています。
      </div>
    </div>
  );
}