import { useState } from "react";
import { getPrefectureCode, getCityCode } from "../lib/prefectures";

const fmtMan = (v) => v ? `¥${Math.round(v / 10000).toLocaleString()}万` : "-";

export default function TradeHistory({ params }) {
  const [trades, setTrades]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const search = async () => {
    const cityCode = getCityCode(params.area_name || "");
    const areaCode = getPrefectureCode(params.area_name || "");
    if (!areaCode && !cityCode) {
      setError("エリア名に都道府県名または市区町村名を含めてください（例：福岡市中央区、東京都渋谷区）");
      return;
    }

    setLoading(true);
    setError("");
    setTrades([]);

    try {
      const res = await fetch("/api/trade-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: areaCode, city: cityCode, year: "2024" }),
      });
      const data = await res.json();
      const items = (data.data || [])
        .filter(d => d.Type === "中古マンション等" || d.Type === "宅地(土地と建物)")
        ;
      console.log("total from API:", data.data?.length, "filtered:", items.length);
      setTrades(items);
      setPage(1);
      setSearched(true);
    } catch (e) {
      setError("データの取得に失敗しました: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2540" }}>周辺取引事例</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            国土交通省 不動産情報ライブラリ（2024年）
          </div>
        </div>
        <button
          onClick={search}
          disabled={loading}
          style={{
            padding: "10px 24px",
            background: loading ? "#cbd5e1" : "linear-gradient(135deg, #2563eb, #7c3aed)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "取得中..." : "取引事例を取得"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#dc2626", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!searched && !loading && (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
          <div>「取引事例を取得」ボタンを押すと</div>
          <div>入力したエリアの周辺取引事例を表示します</div>
          <div style={{ fontSize: 11, marginTop: 8, color: "#cbd5e1" }}>※ エリア欄に都道府県名を含めてください</div>
        </div>
      )}

      {trades.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{trades.length}件の取引事例（{(page-1)*PAGE_SIZE+1}〜{Math.min(page*PAGE_SIZE, trades.length)}件を表示）</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #cbd5e1", background: page===1?"#f1f5f9":"#fff", cursor: page===1?"not-allowed":"pointer", fontSize: 12 }}>
                ← 前へ
              </button>
              <span style={{ fontSize: 12, color: "#475569" }}>{page} / {Math.ceil(trades.length/PAGE_SIZE)}</span>
              <button onClick={() => setPage(p => Math.min(Math.ceil(trades.length/PAGE_SIZE), p+1))} disabled={page===Math.ceil(trades.length/PAGE_SIZE)}
                style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #cbd5e1", background: page===Math.ceil(trades.length/PAGE_SIZE)?"#f1f5f9":"#fff", cursor: page===Math.ceil(trades.length/PAGE_SIZE)?"not-allowed":"pointer", fontSize: 12 }}>
                次へ →
              </button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  {["取引時期", "種類", "地区名", "面積", "取引価格", "坪単価", "築年数", "構造"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#475569", fontWeight: 600, borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((t, i) => {
                  const tsubo = t.Area && t.TradePrice ? Math.round(t.TradePrice / (t.Area * 0.3025) / 10000) : null;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={{ padding: "10px 12px", color: "#1a2540" }}>{t.Period || "-"}</td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{t.Type || "-"}</td>
                      <td style={{ padding: "10px 12px", color: "#1a2540" }}>{t.DistrictName || "-"}</td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{t.Area ? `${t.Area}㎡` : "-"}</td>
                      <td style={{ padding: "10px 12px", color: "#2563eb", fontWeight: 600 }}>{fmtMan(t.TradePrice)}</td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{tsubo ? `${tsubo}万/坪` : "-"}</td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{t.BuildingYear || "-"}</td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{t.Structure || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {searched && trades.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
          取引事例が見つかりませんでした
        </div>
      )}
    </div>
  );
}