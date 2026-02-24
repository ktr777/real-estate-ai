import { useState } from "react";
import { fmtM, fmtP } from "../lib/calc";

export default function PDFExport({ params, results }) {
  const [loading, setLoading] = useState(false);

  const exportPDF = async () => {
    setLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const element = document.getElementById("pdf-content");
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth  = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth   = pageWidth - 20;
      const imgHeight  = (canvas.height * imgWidth) / canvas.width;

      let y = 10;
      let remainingHeight = imgHeight;

      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, pageHeight - 20);
        const sourceY = imgHeight - remainingHeight;

        pdf.addImage(imgData, "PNG", 10, y, imgWidth, imgHeight, "", "FAST", 0);

        remainingHeight -= sliceHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
          y = 10;
        }
      }

      const fileName = `DDレポート_${params.area_name || "物件"}_${new Date().toLocaleDateString("ja-JP").replace(/\//g, "")}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error(e);
      alert("PDF出力に失敗しました: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const r = results;
  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      {/* 出力ボタン */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={exportPDF}
          disabled={loading}
          style={{
            padding: "9px 24px",
            background: loading ? "#cbd5e1" : "linear-gradient(135deg, #1d4ed8, #7c3aed)",
            color: loading ? "#64748b" : "#fff",
            border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          {loading ? "生成中..." : "📄 PDFをダウンロード"}
        </button>
      </div>

      {/* PDF対象コンテンツ */}
      <div id="pdf-content" style={{
        background: "#ffffff", color: "#1a2540", padding: 32, borderRadius: 12,
        fontFamily: "'Noto Sans JP', sans-serif",
      }}>
        {/* ヘッダー */}
        <div style={{ borderBottom: "2px solid #1d4ed8", paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#3b82f6", marginBottom: 6 }}>
            REAL ESTATE INVESTMENT AI — REPORT
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#1a2540" }}>
            投資収益シミュレーション レポート
          </h1>
          <div style={{ fontSize: 12, color: "#475569" }}>
            作成日：{today}　／　
            {params.area_name && `エリア：${params.area_name}　／　`}
            {params.usage && `用途：${params.usage}`}
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "NOI",         value: fmtM(r.noi),                   sub: "年間純収益" },
            { label: "Cap Rate",    value: fmtP(r.capRate),                sub: "還元利回り" },
            { label: "IRR",         value: fmtP(r.irr),                   sub: "内部収益率", accent: true },
            { label: "DSCR",        value: r.dscr.toFixed(2),              sub: "債務返済余力" },
            { label: "Equity ×",   value: `${r.equityMultiple.toFixed(2)}x`, sub: "エクイティ倍率" },
            { label: "FCF/年",      value: fmtM(r.fcf),                   sub: "フリーCF" },
          ].map(({ label, value, sub, accent }) => (
            <div key={label} style={{
              background: accent ? "#dbeafe" : "#f8fafc",
              border: `1px solid ${accent ? "#3b82f6" : "#cbd5e1"}`,
              borderRadius: 8, padding: "12px 16px",
            }}>
              <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#475569", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: 700, color: accent ? "#2563eb" : "#1a2540" }}>{value}</div>
              <div style={{ fontSize: 9, color: "#1a2540", marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* 2カラム */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {/* NOI内訳 */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#475569", marginBottom: 12 }}>NOI 内訳</div>
            {[
              { label: "満室想定賃料",      value: r.grossRent,     color: "#3b82f6" },
              { label: "有効賃料（空室後）", value: r.effectiveRent, color: "#2563eb" },
              { label: "管理費（△）",      value: -r.managementFee, color: "#f87171" },
              { label: "修繕積立（△）",    value: -r.repairReserve, color: "#f87171" },
              { label: "固定資産税（△）",  value: -r.propertyTax,   color: "#f87171" },
              { label: "NOI",              value: r.noi,             color: "#10b981", bold: true },
              { label: "元利返済（△）",    value: -r.annualDebt,    color: "#f87171" },
              { label: "FCF",              value: r.fcf,             color: r.fcf >= 0 ? "#10b981" : "#ef4444", bold: true },
            ].map(({ label, value, color, bold }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, color: "#475569", fontWeight: bold ? 600 : 400 }}>{label}</span>
                <span style={{ fontSize: 12, fontFamily: "monospace", color, fontWeight: bold ? 700 : 400 }}>
                  {value >= 0 ? "" : "▲ "}{fmtM(Math.abs(value))}
                </span>
              </div>
            ))}
          </div>

          {/* 資金計画 */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#475569", marginBottom: 12 }}>資金計画</div>
            {[
              { label: "物件価格",     value: fmtM(params.price) },
              { label: "取得諸費用",   value: fmtM(r.acquisitionCost) },
              { label: "自己資金合計", value: fmtM(r.totalEquity), bold: true },
              { label: "借入額",       value: fmtM(r.loanAmount) },
              { label: "LTV",          value: fmtP(params.ltv) },
              { label: "借入金利",     value: fmtP(params.interestRate) },
              { label: "想定売却価格", value: fmtM(r.exitPrice) },
              { label: "売却手取り",   value: fmtM(r.exitProceeds) },
            ].map(({ label, value, bold }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, color: "#475569", fontWeight: bold ? 600 : 400 }}>{label}</span>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: "#1a2540", fontWeight: bold ? 700 : 400 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 年次CF表 */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#475569", marginBottom: 12 }}>年次キャッシュフロー</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                {["年次", "NOI", "元利返済", "FCF", "残債"].map((h) => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "right", color: "#475569", borderBottom: "1px solid #e2e8f0", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.yearlyData.slice(0, 10).map((row) => (
                <tr key={row.year}>
                  {[row.year, fmtM(row.NOI), fmtM(row.元利返済), fmtM(row.FCF), fmtM(row.残債)].map((v, i) => (
                    <td key={i} style={{ padding: "6px 8px", textAlign: "right", fontFamily: "monospace", color: i === 3 ? (row.FCF >= 0 ? "#10b981" : "#ef4444") : "#94a3b8", borderBottom: "1px solid #e2e8f0" }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* フッター */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, fontSize: 10, color: "#1a2540", textAlign: "center" }}>
          本レポートはAIによる自動生成です。投資判断は必ず専門家にご相談ください。　／　Generated by Investment AI
        </div>
      </div>
    </div>
  );
}
