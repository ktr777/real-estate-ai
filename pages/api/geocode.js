export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { address } = await req.json();
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "RealEstateAI/1.0" }
  });
  const data = await res.json();

  if (data.length > 0) {
    return new Response(JSON.stringify({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
}