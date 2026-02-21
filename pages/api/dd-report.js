export const config = { runtime: "edge" };

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { params, results } = req.body;

  const prompt = `
あなたは不動産投資の専門アナリストです。以下の物件情報と収益シミュレーション結果をもとに、投資DDレポートを作成してください。

## 物件情報
- 物件価格: ${(params.price / 100000000).toFixed(2)}億円
- 専有面積: ${params.area}㎡
- 賃料単価: ${params.rentPerSqm.toLocaleString()}円/㎡/月
- エリア: ${params.area_name || "未指定"}
- 築年数: ${params.buildingAge || "未指定"}年
- 構造: ${params.structure || "未指定"}
- 用途: ${params.usage || "レジデンシャル"}

## 収益シミュレーション結果
- 満室想定賃料: ${(results.grossRent / 10000).toFixed(0)}万円/年
- 実効賃料: ${(results.effectiveRent / 10000).toFixed(0)}万円/年
- NOI: ${(results.noi / 10000).toFixed(0)}万円/年
- 表面利回り（グロス）: ${(results.grossRent / params.price * 100).toFixed(2)}%
- 還元利回り（Cap Rate）: ${(results.capRate * 100).toFixed(2)}%
- IRR: ${(results.irr * 100).toFixed(2)}%
- DSCR: ${results.dscr.toFixed(2)}倍
- Equity Multiple: ${results.equityMultiple.toFixed(2)}倍
- LTV: ${(params.ltv * 100).toFixed(0)}%
- 借入金利: ${(params.interestRate * 100).toFixed(2)}%
- 保有期間: ${params.holdYears}年
- 出口Cap率想定: ${(params.exitCapRate * 100).toFixed(2)}%
- 想定売却価格: ${(results.exitPrice / 100000000).toFixed(2)}億円

以下の構成でレポートを作成してください。日本語でプロフェッショナルなトーンで記述してください。

# 投資DDレポート

## 1. エグゼクティブサマリー
（3〜5文で投資判断の要点をまとめる）

## 2. 収益性分析
### 2-1. 利回り評価
### 2-2. キャッシュフロー評価
### 2-3. IRR・エクイティマルチプル評価

## 3. リスク分析
### 3-1. 空室リスク
### 3-2. 金利上昇リスク
### 3-3. 出口リスク（流動性・価格変動）
### 3-4. 物件固有リスク（築年数・修繕リスク）

## 4. 市場環境
（エリア・用途別の市場環境について一般的な観点から言及）

## 5. 投資判断
（総合評価：推奨 / 要条件確認 / 非推奨 のいずれかを明記し、理由を述べる）

## 6. 改善提案・条件交渉ポイント
（価格・条件面で改善余地があれば具体的に提案）
`;

  try {
    // ストリーミングレスポンス
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        res.write(chunk.delta.text);
      }
    }

    res.end();
  } catch (error) {
    console.error("Claude API error:", error);
    res.status(500).json({ error: "APIエラーが発生しました: " + error.message });
  }
}
