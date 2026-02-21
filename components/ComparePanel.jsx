import { useState, useMemo } from "react";
import { calculate, fmtM, fmtP } from "../lib/calc";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import styles from "../styles/Compare.module.css";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#a78bfa"];

const DEFAULT_PROPERTY = {
  price: 100000000, area: 80, rentPerSqm: 3500,
  vacancyRate: 0.05, opexRatio: 0.20, ltv: 0.70,
  interestRate: 0.015, loanYears: 30, holdYears: 10,
  exitCapRate: 0.05, area_name: "", buildingAge: "", structure: "", usage: "",
};

const SLIDERS = [
  { label: "物件価格",  key: "price",        min: 10000000,  max: 500000000, step: 1000000,  fmt: (v) => `¥${(v/100000000).toFixed(2)}億` },
  { label: "専有面積",  key: "area",         min: 20,        max: 1000,      step: 5,        fmt: (v) => `${v}㎡` },
  { label: "賃料単価",  key: "rentPerSqm",   min: 500,       max: 15000,     step: 100,      fmt: (v) => `¥${v.toLocaleString()}/㎡` },
  { label: "空室率",    key: "vacancyRate",  min: 0,         max: 0.40,      step: 0.01,     fmt: (v) => `${(v*100).toFixed(0)}%` },
  { label: "LTV",       key: "ltv",          min: 0.30,      max: 0.90,      step: 0.05,     fmt: (v) => `${(v*100).toFixed(0)}%` },
  { label: "借入金利",  key: "interestRate", min: 0.005,     max: 0.05,      step: 0.0005,   fmt: (v) => `${(v*100).toFixed(2)}%` },
  { label: "保有期間",  key: "holdYears",    min: 1,         max: 30,        step: 1,        fmt: (v) => `${v}年` },
  { label: "出口Cap率", key: "exitCapRate",  min: 0.02,      max: 0.12,      step: 0.005,    fmt: (v) => `${(v*100).toFixed(1)}%` },
];

function PropertyCard({ index, params, onChange, onRemove, result, color }) {
  const set = (key, value) => onChange({ ...params, [key]: value });

  return (
    <div className={styles.propertyCard} style={{ borderColor: color }}>
      <div className={styles.cardHeader} style={{ background: `${color}22` }}>
        <div className={styles.cardTitle}>
          <span className={styles.colorDot} style={{ background: color }} />
          <input
            className={styles.propertyName}
            placeholder={`物件 ${index + 1}`}
            value={params.name || ""}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        {onRemove && (
          <button className={styles.removeBtn} onClick={onRemove}>×</button>
        )}
      </div>

      <div className={styles.textRow}>
        <input className={styles.textInput} placeholder="エリア" value={params.area_name || ""} onChange={(e) => set("area_name", e.target.value)} />
        <input className={styles.textInput} placeholder="用途" value={params.usage || ""} onChange={(e) => set("usage", e.target.value)} />
      </div>

      <div className={styles.sliders}>
        {SLIDERS.map(({ label, key, min, max, step, fmt: fmtFn }) => (
          <div key={key} className={styles.sliderRow}>
            <div className={styles.sliderMeta}>
              <span className={styles.sliderLabel}>{label}</span>
              <span className={styles.sliderValue} style={{ color }}>{fmtFn(params[key])}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={params[key]}
              onChange={(e) => set(key, parseFloat(e.target.value))}
              className={styles.slider} style={{ accentColor: color }} />
          </div>
        ))}
      </div>

      {result && (
        <div className={styles.miniKpi}>
          {[
            { label: "NOI",      value: fmtM(result.noi) },
            { label: "Cap Rate", value: fmtP(result.capRate) },
            { label: "IRR",      value: fmtP(result.irr) },
            { label: "DSCR",     value: result.dscr.toFixed(2) },
          ].map(({ label, value }) => (
            <div key={label} className={styles.miniKpiItem}>
              <div className={styles.miniKpiLabel}>{label}</div>
              <div className={styles.miniKpiValue} style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const tooltipStyle = {
  background: "#0f172a", border: "1px solid #1e293b",
  borderRadius: 8, fontSize: 11, color: "#e2e8f0",
};

export default function ComparePanel() {
  const [properties, setProperties] = useState([
    { ...DEFAULT_PROPERTY, name: "物件A", area_name: "東京都渋谷区", usage: "レジデンシャル" },
    { ...DEFAULT_PROPERTY, name: "物件B", price: 80000000, rentPerSqm: 3000, area_name: "大阪市北区", exitCapRate: 0.055 },
  ]);

  const results = useMemo(() => properties.map((p) => calculate(p)), [properties]);

  const addProperty = () => {
    if (properties.length >= 4) return;
    setProperties([...properties, { ...DEFAULT_PROPERTY, name: `物件${["A","B","C","D"][properties.length]}` }]);
  };

  const removeProperty = (i) => setProperties(properties.filter((_, idx) => idx !== i));
  const updateProperty = (i, updated) => setProperties(properties.map((p, idx) => idx === i ? updated : p));

  const compareRows = [
    { label: "物件価格",     fn: (r, p) => fmtM(p.price) },
    { label: "NOI",          fn: (r)    => fmtM(r.noi) },
    { label: "Cap Rate",     fn: (r)    => fmtP(r.capRate) },
    { label: "表面利回り",   fn: (r, p) => fmtP(r.grossRent / p.price) },
    { label: "IRR",          fn: (r)    => fmtP(r.irr), highlight: true },
    { label: "Equity ×",    fn: (r)    => `${r.equityMultiple.toFixed(2)}x` },
    { label: "DSCR",         fn: (r)    => r.dscr.toFixed(2) },
    { label: "FCF/年",       fn: (r)    => fmtM(r.fcf) },
    { label: "自己資金",     fn: (r)    => fmtM(r.totalEquity) },
    { label: "想定売却価格", fn: (r)    => fmtM(r.exitPrice) },
  ];

  const bestIrrIdx = results.reduce((best, r, i) => r.irr > results[best].irr ? i : best, 0);

  const radarMetrics = ["IRR", "CapRate", "DSCR", "FCF", "EquityX"];
  const radarData = radarMetrics.map((metric) => {
    const entry = { metric };
    results.forEach((r, i) => {
      const name = properties[i].name || `物件${i+1}`;
      const raw = {
        IRR:     r.irr * 100,
        CapRate: r.capRate * 100,
        DSCR:    r.dscr,
        FCF:     Math.max(0, r.fcf / 1000000),
        EquityX: r.equityMultiple,
      }[metric];
      entry[name] = parseFloat(Math.max(0, raw).toFixed(2));
    });
    return entry;
  });

  const sensData = results[0]?.sensitivityExitCap.map((d, i) => {
    const entry = { exitCap: d.exitCap };
    results.forEach((r, idx) => {
      entry[properties[idx].name || `物件${idx+1}`] = r.sensitivityExitCap[i]?.IRR ?? 0;
    });
    return entry;
  });

  return (
    <div className={styles.wrap}>

      {/* 物件カード */}
      <div className={styles.cardsGrid} style={{ gridTemplateColumns: `repeat(${properties.length}, 1fr)` }}>
        {properties.map((p, i) => (
          <PropertyCard key={i} index={i} params={p} color={COLORS[i]} result={results[i]}
            onChange={(u) => updateProperty(i, u)}
            onRemove={properties.length > 2 ? () => removeProperty(i) : null} />
        ))}
      </div>

      {properties.length < 4 && (
        <button className={styles.addBtn} onClick={addProperty}>＋ 物件を追加（最大4件）</button>
      )}

      {/* 比較テーブル */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>📊 指標比較表</div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>指標</th>
                {properties.map((p, i) => (
                  <th key={i} className={styles.th} style={{ color: COLORS[i] }}>
                    {p.name || `物件${i+1}`}
                  </th>
                ))}
                <th className={styles.th}>最優位</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map(({ label, fn, highlight }) => {
                const values = results.map((r, i) => fn(r, properties[i]));
                const nums = values.map((v) => parseFloat(v.replace(/[¥,万%x億]/g, "")) || 0);
                const bestIdx = nums.indexOf(Math.max(...nums));
                return (
                  <tr key={label} className={highlight ? styles.highlightRow : ""}>
                    <td className={styles.tdLabel}>{label}</td>
                    {values.map((v, i) => (
                      <td key={i} className={styles.td}
                        style={{ color: i === bestIdx ? COLORS[i] : undefined, fontWeight: i === bestIdx ? 700 : 400 }}>
                        {v}
                      </td>
                    ))}
                    <td className={styles.td} style={{ color: COLORS[bestIdx] }}>
                      {properties[bestIdx].name || `物件${bestIdx+1}`} ✓
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI総評 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>🤖 AI 総評</div>
        <div className={styles.aiComment}>
          {(() => {
            const best = results[bestIrrIdx];
            const bestName = properties[bestIrrIdx].name || `物件${bestIrrIdx+1}`;
            const irrSpread = Math.max(...results.map(r => r.irr)) - Math.min(...results.map(r => r.irr));
            const bestEmIdx = results.reduce((b, r, i) => r.equityMultiple > results[b].equityMultiple ? i : b, 0);
            const warnings = results.map((r, i) => {
              const name = properties[i].name || `物件${i+1}`;
              if (r.dscr < 1.2) return `${name}はDSCR ${r.dscr.toFixed(2)}と債務返済余力が薄く要注意。`;
              if (r.fcf < 0)    return `${name}はFCFがマイナスのため月次キャッシュアウトが続く。`;
              return null;
            }).filter(Boolean);

            return (
              <>
                <p>IRRベースでは <strong style={{ color: COLORS[bestIrrIdx] }}>{bestName}</strong> が <strong style={{ color: COLORS[bestIrrIdx] }}>{fmtP(best.irr)}</strong> で最高水準。{irrSpread > 0.02 ? `物件間のIRR差は${fmtP(irrSpread)}と大きく、物件選択がリターンを左右します。` : `物件間のIRR差は${fmtP(irrSpread)}と僅差で拮抗しています。`}</p>
                {warnings.length > 0 && <p style={{ color: "#fca5a5" }}>⚠️ {warnings.join(" ")}</p>}
                <p>資金効率（Equity Multiple）では <strong style={{ color: COLORS[bestEmIdx] }}>{properties[bestEmIdx].name || `物件${bestEmIdx+1}`}（{results[bestEmIdx].equityMultiple.toFixed(2)}x）</strong> が最も優れています。</p>
              </>
            );
          })()}
        </div>
      </div>

      {/* チャート */}
      <div className={styles.chartsRow}>
        <div className={styles.chartBlock}>
          <div className={styles.chartTitle}>総合評価レーダー</div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#64748b" }} />
              {properties.map((p, i) => (
                <Radar key={i} name={p.name || `物件${i+1}`}
                  dataKey={p.name || `物件${i+1}`}
                  stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartBlock}>
          <div className={styles.chartTitle}>出口Cap率 × IRR 比較</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={sensData} margin={{ top: 4, right: 4, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="exitCap" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, "IRR"]} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {properties.map((p, i) => (
                <Line key={i} type="monotone"
                  dataKey={p.name || `物件${i+1}`}
                  stroke={COLORS[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
