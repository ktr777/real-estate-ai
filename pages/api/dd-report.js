import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const config = {
  api: { responseLimit: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { params, results } = req.body;

  const prompt = `あなたは不動産投資の専門アナリストです。以下の物件情報と収益シミュレーション結果をもとに、投資DDレポートを作成してください。

## 物件情報
- 物件価格: ${(params.price / 100000000).toFixed(2)}億円
- 専有面積: ${params.area}㎡
- 賃料単価: ${params.rentPerSqm.toLocaleString()}円/㎡/月
- エリア: ${params.area_name || "未指定"}
- 築年数: ${params.buildingAge || "未指定"}年
- 構造: ${params.structure || "未指定"}
- 用途: ${params.usage || "レジデンシャル"}

## 収益シミュレーション結果
- NOI: ${(results.noi / 10000).toFixed(0)}万円/年
- Cap Rate: ${(results.capRate * 100).toFixed(2)}%
- IRR: ${(results.irr * 100).toFixed(2)}%
- DSCR: ${results.dscr.toFixed(2)}倍
- Equity Multiple: ${results.equityMultiple.toFixed(2)}倍
- LTV: ${(params.ltv * 100).toFixed(0)}%
- 保有期間: ${params.holdYears}年

以下の構成でレポートを作成してください。

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

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        res.write(chunk.delta.text);
      }
    }
    res.end();
  } catch (error) {
    res.status(500).end("APIエラー: " + error.message);
  }
}