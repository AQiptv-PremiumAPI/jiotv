export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Fetch M3U file
    const m3uRes = await fetch(
      "https://raw.githubusercontent.com/alex8875/m3u/refs/heads/main/z5.m3u"
    );
    const m3u = await m3uRes.text();

    // Extract block by tvg-id
    const block = m3u
      .split("#EXTINF:")
      .find(p => p.includes(`tvg-id="${id}"`));

    if (!block) {
      return res.status(404).send("Channel Not Found");
    }

    // Find streaming URL
    const lines = block.trim().split("\n").map(l => l.trim());
    const streamUrl = lines.reverse().find(l => l.startsWith("http"));

    if (!streamUrl) {
      return res.status(404).send("Stream URL Not Found");
    }

    // Custom User-Agent (backend ka)
    const USER_AGENT =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 ygx/69.1 Safari/537.36";

    // Fetch stream as proxy
    const streamRes = await fetch(streamUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Referer": "https://www.zee5.com/",
        "Origin": "https://www.zee5.com"
      }
    });

    if (!streamRes.ok) {
      return res.status(502).send("Failed to fetch stream");
    }

    // Pass headers (important for m3u8/mpd)
    res.setHeader(
      "Content-Type",
      streamRes.headers.get("content-type") || "application/octet-stream"
    );

    // Stream pipe (no redirect)
    const reader = streamRes.body.getReader();
    const encoder = new TextEncoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }

    res.end();

  } catch (err) {
    console.error(err);
    return res.status(500).send("Error fetching data");
  }
}
