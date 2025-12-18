export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const m3u = await fetch(
      "https://raw.githubusercontent.com/alex8875/m3u/refs/heads/main/z5.m3u"
    ).then(r => r.text());

    const block = m3u
      .split("#EXTINF:")
      .find(p => p.includes(`tvg-id="${id}"`));

    if (!block) return res.status(404).send("Channel Not Found");

    const lines = block.trim().split("\n").map(l => l.trim());
    const streamUrl = lines.reverse().find(l => l.startsWith("http"));

    if (!streamUrl) return res.status(404).send("Stream URL Not Found");

    // 🔥 Universal User-Agent (ALL channels)
    const streamRes = await fetch(streamUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 ygx/69.1 Safari/537.36",
      },
    });

    if (!streamRes.ok) {
      return res.status(502).send("Failed to fetch stream");
    }

    res.setHeader(
      "Content-Type",
      streamRes.headers.get("content-type") ||
        "application/vnd.apple.mpegurl"
    );

    // Stream direct pipe
    streamRes.body.pipe(res);

  } catch (err) {
    console.error(err);
    return res.status(500).send("Error fetching data");
  }
}
