import { useState, useMemo } from "react";
import Head from "next/head";
import InputPanel    from "../components/InputPanel";
import KPICards      from "../components/KPICards";
import DDReport      from "../components/DDReport";
import PDFExport     from "../components/PDFExport";
import TradeHistory from "../components/TradeHistory";
import NotionExport  from "../components/NotionExport";
import ComparePanel  from "../components/ComparePanel";
import { CashflowChart, CumulativeFCFChart, SensitivityChart, LoanBalanceChart } from "../components/Charts";
import { calculate } from "../lib/calc";
import styles from "../styles/App.module.css";

const DEFAULTS = {
  price:        100000000,
  area:         80,
  rentPerSqm:   3500,
  vacancyRate:  0.05,
  opexRatio:    0.20,
  ltv:          0.70,
  interestRate: 0.015,
  loanYears:    30,
  holdYears:    10,
  exitCapRate:  0.05,
  area_name:    "",
  buildingAge:  "",
  structure:    "",
  usage:        "",
};

const TABS = ["サマリー", "CF推移", "感度分析", "物件比較", "PDF出力", "Notion書き出し", "周辺取引事例", "DDレポート"];

export default function Home() {
  const [params, setParams] = useState(DEFAULTS);
  const [tab, setTab]       = useState("サマリー");
  const [ddReport, setDdReport] = useState("");

  const r = useMemo(() => calculate(params), [params]);

  const fmtM = (v) => `¥${Math.round(v / 10000).toLocaleString()}万`;
  const fmtP = (v) => `${(v * 100).toFixed(2)}%`;

  return (
    <>
      <Head>
        <title>不動産投資AI | 収益シミュレーター</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className={styles.app}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.logo}>
              <span className={styles.logoMark}>RE</span>
              <span className={styles.logoText}>Investment AI</span>
            </div>
            <div className={styles.headerSub}>投資用不動産 収益シミュレーター & DD自動化</div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.layout}>
            {/* 左：入力 */}
            <aside className={styles.sidebar}>
              <InputPanel params={params} onChange={setParams} />
            </aside>

            {/* 右：出力 */}
            <section className={styles.content}>
              {/* KPI */}
              <KPICards r={r} />

              {/* タブ */}
              <div className={styles.tabs}>
                {TABS.map((t) => (
                  <button
                    key={t}
                    className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* サマリー */}
              {tab === "サマリー" && (
                <div className={styles.card}>
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryBlock}>
                      <div className={styles.summaryBlockTitle}>NOI 内訳</div>
                      {[
                        { label: "満室想定賃料",    value: r.grossRent,     color: "#3b82f6" },
                        { label: "有効賃料（空室後）", value: r.effectiveRent, color: "#60a5fa" },
                        { label: "管理費（△）",     value: -r.managementFee,color: "#f87171" },
                        { label: "修繕積立（△）",   value: -r.repairReserve,color: "#f87171" },
                        { label: "固定資産税（△）", value: -r.propertyTax,  color: "#f87171" },
                        { label: "NOI",             value: r.noi,           color: "#10b981", bold: true },
                        { label: "元利返済（△）",   value: -r.annualDebt,   color: "#f87171" },
                        { label: "FCF",             value: r.fcf,           color: r.fcf >= 0 ? "#10b981" : "#ef4444", bold: true },
                      ].map(({ label, value, color, bold }) => (
                        <div key={label} className={styles.summaryRow}>
                          <span className={styles.summaryLabel}>{label}</span>
                          <span className={styles.summaryValue} style={{ color, fontWeight: bold ? 700 : 400 }}>
                            {value >= 0 ? "" : "▲ "}{fmtM(Math.abs(value))}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.summaryBlock}>
                      <div className={styles.summaryBlockTitle}>資金計画</div>
                      {[
                        { label: "物件価格",     value: fmtM(params.price) },
                        { label: "取得諸費用",   value: fmtM(r.acquisitionCost) },
                        { label: "自己資金合計", value: fmtM(r.totalEquity), bold: true },
                        { label: "借入額",       value: fmtM(r.loanAmount) },
                        { label: "想定売却価格", value: fmtM(r.exitPrice) },
                        { label: "売却手取り",   value: fmtM(r.exitProceeds) },
                      ].map(({ label, value, bold }) => (
                        <div key={label} className={styles.summaryRow}>
                          <span className={styles.summaryLabel}>{label}</span>
                          <span className={styles.summaryValue} style={{ fontWeight: bold ? 700 : 400 }}>{value}</span>
                        </div>
                      ))}

                      <div className={styles.divider} />
                      <div className={styles.summaryBlockTitle}>評価</div>
                      <div className={styles.evaluationBox}>
                        <div className={styles.evalItem}>
                          <span>DSCR</span>
                          <span style={{ color: r.dscr >= 1.3 ? "#10b981" : r.dscr >= 1.0 ? "#f59e0b" : "#ef4444" }}>
                            {r.dscr.toFixed(2)}倍 {r.dscr >= 1.3 ? "✓ 安全" : r.dscr >= 1.0 ? "△ 注意" : "✗ 要再考"}
                          </span>
                        </div>
                        <div className={styles.evalItem}>
                          <span>Cap Rate vs 出口Cap</span>
                          <span style={{ color: params.capRate >= params.exitCapRate ? "#10b981" : "#f59e0b" }}>
                            {fmtP(r.capRate)} → {fmtP(params.exitCapRate)}
                            {r.capRate >= params.exitCapRate ? " ↑" : " ↓"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CF推移 */}
              {tab === "CF推移" && (
                <div className={styles.card}>
                  <CashflowChart    data={r.yearlyData} />
                  <CumulativeFCFChart data={r.yearlyData} />
                  <LoanBalanceChart  data={r.yearlyData} />
                </div>
              )}

              {/* 感度分析 */}
              {tab === "感度分析" && (
                <div className={styles.card}>
                  <SensitivityChart
                    data={r.sensitivityExitCap}
                    dataKey="IRR" xLabel="exitCap" color="#60a5fa"
                    title="出口Cap率 × IRR"
                  />
                  <SensitivityChart
                    data={r.sensitivityVacancy}
                    dataKey="IRR" xLabel="空室率" color="#10b981"
                    title="空室率 × IRR"
                  />
                  <SensitivityChart
                    data={r.sensitivityRate}
                    dataKey="IRR" xLabel="金利" color="#f59e0b"
                    title="借入金利 × IRR"
                  />
                </div>
              )}

              {/* 物件比較 */}
              {tab === "物件比較" && (
                <ComparePanel />
              )}

              {/* 物件比較 */}
              {tab === "物件比較" && (
                <div className={styles.card}>
                </div>
              )}

              {/* PDF出力 */}
              {tab === 'PDF出力' && (
                <div className={styles.card}>
                  <PDFExport params={params} results={r} />
                </div>
              )}

              {/* Notion書き出し */}
              {tab === 'Notion書き出し' && (
                <div className={styles.card}>
                  <NotionExport params={params} results={r} ddReport={ddReport} compareProperties={[]} compareResults={[]} />
                </div>
              )}

              {/* DDレポート */}
              {tab === "周辺取引事例", "DDレポート" && (
                <div className={styles.card}>
                  <DDReport params={params} results={r} onReportGenerated={setDdReport} />
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
