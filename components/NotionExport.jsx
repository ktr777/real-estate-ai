import { useState } from "react";

export default function NotionExport({ params, results, ddReport }) {
  const [status, setStatus] = useState("idle");
  const [pageUrl, setPageUrl] = useState("");
  const [error, setError] = useState("");

  const exportToNotion = async () => {
    setStatus("loading");
    setError("");
    setPageUrl("");
    try {
      const res = await fetch("/api/notion-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params, results, ddReport }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");
      setPageUrl(data.url);
      setStatus("success");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  };

  return (
    <div style={{ fontFamily: "Noto Sans JP, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>Notion 書き出し</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>シミュレーション結果をNotionデータベースに保存します</div>
        </div>
        <button onClick={exportToNotion} disabled={status === "loading"} style={{ padding: "9px 24px", background: status === "loading" ? "#1e293b" : "#000", color: status === "loading" ? "#64748b" : "#fff", border: "1px solid #333", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: status === "loading" ? "not-allowed" : "pointer" }}>
          {status === "loading" ? "書き出し中..." : "N  Notionに書き出す"}
        </button>
      </div>

      {status === "success" && (
        <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 600, marginBottom: 6 }}>✅ Notionに書き出しました！</div>
          <a href={pageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#86efac", textDecoration: "underline" }}>Notionで開く →</a>
        </div>
      )}

      {status === "error" && (
        <div style={{ background: "#1f0a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#fca5a5", fontWeight: 600, marginBottom: 4 }}>❌ エラーが発生しました</div>
          <div style={{ fontSize: 12, color: "#f87171" }}>{error}</div>
        </div>
      )}

      <div style={{ background: "#060d1b", border: "1px solid #1e293b", borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#475569", marginBottom: 16 }}>書き出し内容プレビュー</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>基本情報</div>
            {[
              { label: "エリア", value: params.area_name || "未設定" },
              { label: "用途",   value: params.usage || "未設定" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0a1f3d", fontSize: 12 }}>
                <span style={{ color: "#64748b" }}>{label}</span>
                <span style={{ color: "#e2e8f0" }}>{value}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>主要指標</div>
            {[
              { label: "物件価格", value: "¥" + Math.round(params.price/10000).toLocaleString() + "万" },
              { label: "NOI",      value: "¥" + Math.round(results.noi/10000).toLocaleString() + "万" },
              { label: "Cap Rate", value: (results.capRate*100).toFixed(2) + "%" },
              { label: "IRR",      value: (results.irr*100).toFixed(2) + "%" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #0a1f3d", fontSize: 12 }}>
                <span style={{ color: "#64748b" }}>{label}</span>
                <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        {!ddReport && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: "#0a1628", borderRadius: 8, border: "1px dashed #1e293b", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#334155" }}>💡 DDレポートタブでレポートを生成してから書き出すと本文も含まれます</div>
          </div>
        )}
      </div>
    </div>
  );
}