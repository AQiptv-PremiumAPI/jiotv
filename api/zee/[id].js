export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).send("Missing id");

    const m3uRes = await fetch(
      "https://raw.githubusercontent.com/alex8875/m3u/refs/heads/main/z5.m3u"
    );

    if (!m3uRes.ok) {
      return res.status(500).send("Failed to fetch M3U");
    }

    const m3u = await m3uRes.text();

    const block = m3u
      .split("#EXTINF:")
      .find(b => b.includes(`tvg-id="${id}"`));

    if (!block) {
      return res.status(404).send("Channel Not Found");
    }

    const streamUrl = block
      .split("\n")
      .map(l => l.trim())
      .find(l => l.startsWith("http"));

    if (!streamUrl) {
      return res.status(404).send("Stream URL Not Found");
    }

    const streamRes = await fetch(streamUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Referer: "https://www.zee5.com/",
        Origin: "https://www.zee5.com",
      },
    });

    if (!streamRes.ok) {
      return res.status(502).send("Stream fetch failed");
    }

    res.setHeader(
      "Content-Type",
      streamRes.headers.get("content-type") ||
        "application/vnd.apple.mpegurl"
    );
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");

    streamRes.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Error");
  }
}
