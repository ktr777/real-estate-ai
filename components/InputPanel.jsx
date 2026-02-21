import styles from "../styles/App.module.css";

const fmtPct = (v) => `${(v * 100).toFixed(1)}%`;
const fmtYen = (v) => `¥${new Intl.NumberFormat("ja-JP").format(v)}`;

const SLIDERS = [
  {
    section: "物件",
    items: [
      { label: "物件価格",   key: "price",        unit: "円",    min: 5000000,  max: 500000000, step: 1000000,  fmt: (v) => `¥${(v/100000000).toFixed(2)}億` },
      { label: "専有面積",   key: "area",         unit: "㎡",   min: 20,       max: 1000,      step: 5,        fmt: (v) => `${v}㎡` },
      { label: "賃料単価",   key: "rentPerSqm",   unit: "円/㎡", min: 500,      max: 15000,     step: 100,      fmt: (v) => `¥${v.toLocaleString()}/㎡` },
    ],
  },
  {
    section: "収益",
    items: [
      { label: "空室率",     key: "vacancyRate",  unit: "%",    min: 0,        max: 0.40,      step: 0.01,     fmt: fmtPct },
      { label: "運営費率",   key: "opexRatio",    unit: "%",    min: 0.10,     max: 0.50,      step: 0.01,     fmt: fmtPct },
    ],
  },
  {
    section: "ファイナンス",
    items: [
      { label: "LTV",        key: "ltv",          unit: "%",    min: 0.30,     max: 0.90,      step: 0.05,     fmt: fmtPct },
      { label: "借入金利",   key: "interestRate", unit: "%",    min: 0.005,    max: 0.05,      step: 0.0005,   fmt: (v) => `${(v*100).toFixed(2)}%` },
      { label: "借入期間",   key: "loanYears",    unit: "年",   min: 10,       max: 35,        step: 1,        fmt: (v) => `${v}年` },
    ],
  },
  {
    section: "出口戦略",
    items: [
      { label: "保有期間",   key: "holdYears",    unit: "年",   min: 1,        max: 30,        step: 1,        fmt: (v) => `${v}年` },
      { label: "出口Cap率",  key: "exitCapRate",  unit: "%",    min: 0.02,     max: 0.12,      step: 0.005,    fmt: (v) => `${(v*100).toFixed(1)}%` },
    ],
  },
];

const TEXT_FIELDS = [
  { label: "エリア",   key: "area_name",    placeholder: "例：東京都渋谷区" },
  { label: "築年数",   key: "buildingAge",  placeholder: "例：15" },
  { label: "構造",     key: "structure",    placeholder: "例：RC造" },
  { label: "用途",     key: "usage",        placeholder: "例：レジデンシャル" },
];

export default function InputPanel({ params, onChange }) {
  const set = (key, value) => onChange({ ...params, [key]: value });

  return (
    <div className={styles.inputPanel}>
      <div className={styles.inputHeader}>
        <span className={styles.badge}>INPUT</span>
        <span className={styles.inputTitle}>物件パラメータ</span>
      </div>

      {/* テキスト入力 */}
      <div className={styles.textSection}>
        {TEXT_FIELDS.map(({ label, key, placeholder }) => (
          <div key={key} className={styles.textField}>
            <label className={styles.textLabel}>{label}</label>
            <input
              className={styles.textInput}
              type="text"
              placeholder={placeholder}
              value={params[key] || ""}
              onChange={(e) => set(key, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* スライダー */}
      {SLIDERS.map(({ section, items }) => (
        <div key={section} className={styles.sliderSection}>
          <div className={styles.sectionLabel}>{section}</div>
          {items.map(({ label, key, min, max, step, fmt }) => (
            <div key={key} className={styles.sliderRow}>
              <div className={styles.sliderMeta}>
                <span className={styles.sliderLabel}>{label}</span>
                <span className={styles.sliderValue}>{fmt(params[key])}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={params[key]}
                onChange={(e) => set(key, parseFloat(e.target.value))}
                className={styles.slider}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
