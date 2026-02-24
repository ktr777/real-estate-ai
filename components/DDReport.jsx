import { useState, useRef } from "react";
import styles from "../styles/App.module.css";

function parseMarkdown(text) {
  return text
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|p])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

export default function DDReport({ params, results, onReportGenerated }) {
  const [report, setReport]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const abortRef = useRef(null);

  const generate = async () => {
    setLoading(true);
    setReport("");
    setError("");

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/dd-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params, results }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const e = await res.text();
        throw new Error(e || "APIエラー");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setReport(text);
        if (onReportGenerated) onReportGenerated(text);
      }
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(report);
  };

  return (
    <div className={styles.ddSection}>
      <div className={styles.ddHeader}>
        <div>
          <div className={styles.ddTitle}>DD レポート</div>
          <div className={styles.ddSub}>Claude AI による自動生成</div>
        </div>
        <div className={styles.ddActions}>
          {report && !loading && (
            <button className={styles.btnSecondary} onClick={copy}>コピー</button>
          )}
          {loading ? (
            <button className={styles.btnStop} onClick={stop}>停止</button>
          ) : (
            <button className={styles.btnGenerate} onClick={generate}>
              {report ? "再生成" : "レポート生成"}
            </button>
          )}
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {!report && !loading && (
        <div className={styles.ddPlaceholder}>
          <div className={styles.ddPlaceholderIcon}>📋</div>
          <div>「レポート生成」ボタンを押すと、入力した物件情報をもとに</div>
          <div>AIが投資DDレポートを自動作成します。</div>
          <div className={styles.ddPlaceholderNote}>※ ANTHROPIC_API_KEY の設定が必要です</div>
        </div>
      )}

      {(report || loading) && (
        <div className={styles.ddContent}>
          <div
            className={styles.ddText}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(report) }}
          />
          {loading && <span className={styles.cursor} />}
        </div>
      )}
    </div>
  );
}
