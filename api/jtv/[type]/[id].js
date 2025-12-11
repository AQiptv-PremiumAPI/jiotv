export default async function handler(req, res) {
  const { type, id } = req.query;   // type = mpd | key

  try {
    // Fetch playlist
    const m3u = await fetch("https://jiotvplaylist.teachub.workers.dev/")
      .then(r => r.text());

    // Find channel block
    const block = m3u.split("#EXTINF:").find(b => b.includes(`tvg-id="${id}"`));
    if (!block) return res.status(404).send("Channel Not Found");

    const lines = block.trim().split("\n").map(x => x.trim());

    // ---------- MPD ----------
    if (type === "mpd") {
      const mpd = lines.reverse().find(x => x.startsWith("http"));
      if (!mpd) return res.status(404).send("MPD Not Found");
      return res.redirect(mpd);
    }

    // ---------- KEY ----------
    if (type === "key") {
      const key = lines.find(x => x.includes("license_key="))
        ?.split("license_key=")[1];
      if (!key) return res.status(404).send("Key Not Found");
      return res.send(key);
    }

    res.send("Use mpd or key");

  } catch (e) {
    res.status(500).send("Error: " + e.message);
  }
}
