export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const { id } = req.query;

  try {
    // 1️⃣ Fetch M3U playlist
    const m3uRes = await fetch(
      "https://raw.githubusercontent.com/alex8875/m3u/refs/heads/main/z5.m3u"
    );

    if (!m3uRes.ok) {
      return new Response("Failed to fetch M3U", { status: 500 });
    }

    const m3u = await m3uRes.text();

    // 2️⃣ Find channel block
    const block = m3u
      .split("#EXTINF:")
      .find(b => b.includes(`tvg-id="${id}"`));

    if (!block) {
      return new Response("Channel Not Found", { status: 404 });
    }

    // 3️⃣ Extract stream URL
    const streamUrl = block
      .split("\n")
      .map(l => l.trim())
      .find(l => l.startsWith("http"));

    if (!streamUrl) {
      return new Response("Stream URL Not Found", { status: 404 });
    }

    // 4️⃣ Backend User-Agent (VERY IMPORTANT)
    const USER_AGENT =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 ygx/69.1 Safari/537.36";

    // 5️⃣ Fetch stream as proxy (NO REDIRECT)
    const streamRes = await fetch(streamUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Referer": "https://www.zee5.com/",
        "Origin": "https://www.zee5.com",
      },
    });

    if (!streamRes.ok || !streamRes.body) {
      return new Response("Failed to fetch stream", { status: 502 });
    }

    // 6️⃣ Pass-through response (important headers)
    return new Response(streamRes.body, {
      status: 200,
      headers: {
        "Content-Type":
          streamRes.headers.get("content-type") ||
          "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });

  } catch (err) {
    console.error(err);
    return new Response("Internal Error", { status: 500 });
  }
}
