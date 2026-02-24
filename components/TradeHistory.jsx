import { useState } from "react";
import { getPrefectureCode, getCityCode } from "../lib/prefectures";

const fmtMan = (v) => v ? `¥${Math.round(v / 10000).toLocaleString()}万` : "-";

const YEARS = ["2024", "2023", "2022", "2021", "2020"];
const TYPES = [
  { value: "all", label: "すべて" },
  { value: "中古マンション等", label: "中古マンション" },
  { value: "宅地(土地と建物)", label: "宅地(土地と建物)" },
  { value: "土地", label: "土地" },
];

export default function TradeHistory({ params }) {
  const [trades, setTrades]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [searched, setSearched]   = useState(false);
  const [page, setPage]           = useState(1);
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder]   = useState("none");
  const [selectedYear, setSelectedYear] = useState("2024");
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
    setPage(1);
    try {
      const res = await fetch("/api/trade-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: areaCode, city: cityCode, year: selectedYear }),
      });
      const data = await res.json();
      const items = data.data || [];
      console.log("total from API:", items.length);
      setTrades(items);
      setSearched(true);
    } catch (e) {
      setError("データの取得に失敗しました: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // フィルタ・ソート
  let filtered = [...trades];
  if (filterType !== "all") filtered = filtered.filter(t => t.Type === filterType);
  if (sortOrder === "asc") filtered.sort((a, b) => (a.TradePrice/a.Area||0) - (b.TradePrice/b.Area||0));
  if (sortOrder === "district_asc") filtered.sort((a, b) => (a.DistrictName||'').localeCompare(b.DistrictName||'', 'ja'));
  if (sortOrder === "district_desc") filtered.sort((a, b) => (b.DistrictName||'').localeCompare(a.DistrictName||'', 'ja'));
  if (sortOrder === "desc") filtered.sort((a, b) => (b.TradePrice/b.Area||0) - (a.TradePrice/a.Area||0));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const selectStyle = {
    padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1",
    fontSize: 12, color: "#1a2540", background: "#fff", cursor: "pointer",
  };

  return (
    <div style={{ padding: 24 }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2540" }}>周辺取引事例</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>国土交通省 不動産情報ライブラリ</div>
        </div>
        <button
          onClick={search}
          disabled={loading}
          style={{
            padding: "10px 24px",
            background: loading ? "#cbd5e1" : "linear-gradient(135deg, #2563eb, #7c3aed)",
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "取得中..." : "取引事例を取得"}
        </button>
      </div>

      {/* 検索条件 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#475569" }}>取得年：</span>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={selectStyle}>
            {YEARS.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
        </div>
        {searched && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#475569" }}>種類：</span>
              <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} style={selectStyle}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#475569" }}>坪単価：</span>
              <select value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPage(1); }} style={selectStyle}>
                <option value="none">ソートなし</option>
                <option value="desc">高い順</option>
                <option value="asc">低い順</option>
                <option value="district_asc">地区名（昇順）</option>
                <option value="district_desc">地区名（降順）</option>
              </select>
            </div>
          </>
        )}
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

      {filtered.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {filtered.length}件（{(page-1)*PAGE_SIZE+1}〜{Math.min(page*PAGE_SIZE, filtered.length)}件を表示）
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #cbd5e1", background: page===1?"#f1f5f9":"#fff", cursor: page===1?"not-allowed":"pointer", fontSize: 12 }}>
                ← 前へ
              </button>
              <span style={{ fontSize: 12, color: "#475569" }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #cbd5e1", background: page===totalPages?"#f1f5f9":"#fff", cursor: page===totalPages?"not-allowed":"pointer", fontSize: 12 }}>
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
                {paged.map((t, i) => {
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

      {searched && filtered.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
          条件に合う取引事例が見つかりませんでした
        </div>
      )}
    </div>
  );
}