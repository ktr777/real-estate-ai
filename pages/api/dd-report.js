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

# 投資DDレポート
## 1. エグゼクティブサマリー
## 2. 収益性分析
## 3. リスク分析
## 4. 投資判断
## 5. 改善提案`;

  const anthropicRes = await fetch("https://api.notion.com/v1/messages".replace("notion.com", "anthropic.com"), {
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

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  (async () => {
    const reader = anthropicRes.body.getReader();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) { await writer.close(); break; }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          if (json.type === "content_block_delta" && json.delta?.type === "text_delta" && json.delta.text) {
            await writer.write(encoder.encode(json.delta.text));
          }
        } catch {}
      }
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}