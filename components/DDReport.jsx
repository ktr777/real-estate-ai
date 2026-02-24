import { useState, useRef } from "react";
import styles from "../styles/App.module.css";

function parseMarkdown(text) {
  return text
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|p])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
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

    const prompt = `あなたは不動産投資の専門アナリストです。以下の物件情報をもとに投資DDレポートを日本語で作成してください。

物件価格: ${(params.price / 100000000).toFixed(2)}億円
エリア: ${params.area_name || "未指定"}
用途: ${params.usage || "レジデンシャル"}
NOI: ${(results.noi / 10000).toFixed(0)}万円/年
Cap Rate: ${(results.capRate * 100).toFixed(2)}%
IRR: ${(results.irr * 100).toFixed(2)}%
DSCR: ${results.dscr.toFixed(2)}倍
LTV: ${(params.ltv * 100).toFixed(0)}%
保有期間: ${params.holdYears}年

# 投資DDレポート
## 1. エグゼクティブサマリー
## 2. 収益性分析
### 2-1. 利回り評価
### 2-2. キャッシュフロー評価
### 2-3. IRR・エクイティマルチプル評価
## 3. リスク分析
### 3-1. 空室リスク
### 3-2. 金利上昇リスク
### 3-3. 出口リスク
## 4. 投資判断
## 5. 改善提案・条件交渉ポイント`;

    try {
      abortRef.current = new AbortController();
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          stream: true,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: abortRef.current.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            if (json.type === "content_block_delta" && json.delta?.type === "text_delta" && json.delta.text) {
              text += json.delta.text;
              setReport(text);
              if (onReportGenerated) onReportGenerated(text);
            }
          } catch {}
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const stop = () => { abortRef.current?.abort(); setLoading(false); };
  const copy = () => { navigator.clipboard.writeText(report); };

  return (
    <div className={styles.ddSection}>
      <div className={styles.ddHeader}>
        <div>
          <div className={styles.ddTitle}>DD レポート</div>
          <div className={styles.ddSub}>Claude AI による自動生成</div>
        </div>
        <div className={styles.ddActions}>
          {report && !loading && <button className={styles.btnSecondary} onClick={copy}>コピー</button>}
          {loading
            ? <button className={styles.btnStop} onClick={stop}>停止</button>
            : <button className={styles.btnGenerate} onClick={generate}>{report ? "再生成" : "レポート生成"}</button>
          }
        </div>
      </div>
      {error && <div className={styles.errorBox}>{error}</div>}
      {!report && !loading && (
        <div className={styles.ddPlaceholder}>
          <div className={styles.ddPlaceholderIcon}>📋</div>
          <div>「レポート生成」ボタンを押すと、入力した物件情報をもとに</div>
          <div>AIが投資DDレポートを自動作成します。</div>
        </div>
      )}
      {(report || loading) && (
        <div className={styles.ddContent}>
          <div className={styles.ddText} dangerouslySetInnerHTML={{ __html: parseMarkdown(report) }} />
          {loading && <span className={styles.cursor} />}
        </div>
      )}
    </div>
  );
}