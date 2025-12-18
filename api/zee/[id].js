export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Fetch M3U file
    const m3u = await fetch("https://raw.githubusercontent.com/alex8875/m3u/refs/heads/main/z5.m3u").then(r => r.text());

    // Extract block by tvg-id
    const block = m3u.split("#EXTINF:").find(p => p.includes(`tvg-id="${id}"`));

    if (!block) return res.status(404).send("Channel Not Found");

    // Find the streaming URL (last non-empty line)
    const lines = block.trim().split("\n").map(l => l.trim());
    const streamUrl = lines.reverse().find(l => l.startsWith("http"));

    if (!streamUrl) return res.status(404).send("Stream URL Not Found");

    // Redirect directly to MPD/M3U8
    res.writeHead(302, { Location: streamUrl });
    return res.end();

  } catch (err) {
    return res.status(500).send("Error fetching data");
  }
}
