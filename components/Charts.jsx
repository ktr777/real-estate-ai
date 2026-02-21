import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import styles from "../styles/App.module.css";

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: 8,
  fontSize: 12,
  color: "#e2e8f0",
};

const fmtM = (v) => `${Math.round(v / 10000).toLocaleString()}万`;

export function CashflowChart({ data }) {
  return (
    <div className={styles.chartBlock}>
      <div className={styles.chartTitle}>年次キャッシュフロー</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#64748b" }} />
          <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={fmtM} />
          <Tooltip formatter={(v, name) => [`¥${fmtM(v)}`, name]} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="NOI"     fill="#3b82f6" radius={[3,3,0,0]} />
          <Bar dataKey="元利返済" fill="#f87171" radius={[3,3,0,0]} />
          <Bar dataKey="FCF"     fill="#10b981" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CumulativeFCFChart({ data }) {
  return (
    <div className={styles.chartBlock}>
      <div className={styles.chartTitle}>累積FCF推移</div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#64748b" }} />
          <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={fmtM} />
          <Tooltip formatter={(v) => [`¥${fmtM(v)}`, "累積FCF"]} contentStyle={tooltipStyle} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" />
          <Line type="monotone" dataKey="累積FCF" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SensitivityChart({ data, dataKey, color, title, xLabel }) {
  return (
    <div className={styles.chartBlock}>
      <div className={styles.chartTitle}>{title}</div>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey={xLabel} tick={{ fontSize: 10, fill: "#64748b" }} />
          <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v) => [`${v}%`, "IRR"]} contentStyle={tooltipStyle} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LoanBalanceChart({ data }) {
  return (
    <div className={styles.chartBlock}>
      <div className={styles.chartTitle}>残債推移</div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#64748b" }} />
          <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={fmtM} />
          <Tooltip formatter={(v) => [`¥${fmtM(v)}`, "残債"]} contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="残債" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
