import styles from "../styles/App.module.css";

function irrColor(irr) {
  if (irr >= 0.08) return "#10b981";
  if (irr >= 0.05) return "#f59e0b";
  if (irr >= 0.02) return "#f97316";
  return "#ef4444";
}

function irrLabel(irr) {
  if (irr >= 0.08) return "優良";
  if (irr >= 0.05) return "良好";
  if (irr >= 0.02) return "要検討";
  return "低水準";
}

export default function KPICards({ r }) {
  const color = irrColor(r.irr);

  const cards = [
    { label: "NOI",         value: `¥${Math.round(r.noi/10000).toLocaleString()}万/年`, sub: "純収益",          accent: false },
    { label: "Cap Rate",    value: `${(r.capRate*100).toFixed(2)}%`,                  sub: "還元利回り",       accent: false },
    { label: "DSCR",        value: r.dscr.toFixed(2),                                sub: "債務返済余力",     accent: r.dscr < 1.2 },
    { label: "IRR",         value: `${(r.irr*100).toFixed(2)}%`,                     sub: irrLabel(r.irr),    accent: true, color },
    { label: "Equity ×",    value: `${r.equityMultiple.toFixed(2)}x`,                sub: "エクイティ倍率",   accent: false },
    { label: "FCF/年",      value: `¥${Math.round(r.fcf/10000).toLocaleString()}万`, sub: "フリーCF",         accent: r.fcf < 0 },
  ];

  return (
    <div className={styles.kpiGrid}>
      {cards.map(({ label, value, sub, accent, color: c }) => (
        <div
          key={label}
          className={styles.kpiCard}
          style={accent ? { borderColor: c || "#ef4444", background: `${c || "#ef4444"}11` } : {}}
        >
          <div className={styles.kpiLabel}>{label}</div>
          <div className={styles.kpiValue} style={accent ? { color: c || "#ef4444" } : {}}>
            {value}
          </div>
          <div className={styles.kpiSub}>{sub}</div>
        </div>
      ))}
    </div>
  );
}
