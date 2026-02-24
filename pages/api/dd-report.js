export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { params, results } = await req.json();

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
## 3. リスク分析
## 4. 投資判断
## 5. 改善提案`;

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await anthropicRes.json();
  const text = data.content?.[0]?.text || "レポートの生成に失敗しました";

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}