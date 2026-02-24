export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { area, city, year } = await req.json();

  const params = new URLSearchParams({
    year: year || "2024",
    area: area,
    ...(city ? { city } : {}),
    priceClassification: "01",
  });

  const res = await fetch(
    `https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001?${params}`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.REINFOLIB_API_KEY,
      },
    }
  );

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}