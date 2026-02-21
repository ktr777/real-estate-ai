export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { params, results } = await req.json();

  const prompt = `あなたは不動産投資の専門アナリストです。以下の物件情報と収益シミュレーション結果をもとに、投資DDレポートを作成してください。

## 物件情報
- 物件価格: ${(params.price / 100000000).toFixed(2)}億円
- 専有面積: ${params.area}㎡
- エリア: ${params.area_name || "未指定"}
- 築年数: ${params.buildingAge || "未指定"}年
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

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); break; }
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]" || !data) continue;
          try {
            const json = JSON.parse(data);
            if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
              controller.enqueue(encoder.encode(json.delta.text));
            }
          } catch {}
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}