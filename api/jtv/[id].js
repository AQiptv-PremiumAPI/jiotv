export default async function handler(req, res) {
  const { id } = req.query;
  const url = req.url;

  try {
    // Fetch source M3U
    const m3u = await fetch("https://jiotvplaylist.teachub.workers.dev/").then(r => r.text());

    // Find block by tvg-id
    const block = m3u.split("#EXTINF:").find(b => b.includes(`tvg-id="${id}"`));
    if (!block) return res.status(404).send("Not Found");

    const lines = block.trim().split("\n").map(x => x.trim());

    // ---- MPD ----
    if (url.includes("/mpd/")) {
      const mpd = lines.reverse().find(x => x.startsWith("http"));
      return res.redirect(mpd);
    }

    // ---- KEY ----
    if (url.includes("/key/")) {
      const key = lines.find(x => x.includes("license_key="))
        ?.split("license_key=")[1];
      return res.send(key);
    }

    res.send("Use /mpd/ID or /key/ID");

  } catch (e) {
    res.status(500).send("Error");
  }
}
