export default async function handler(req, res) {
  const { type, id } = req.query;

  try {
    // Fetch full playlist
    const m3u = await fetch("https://jtvplus.streamflex.workers.dev/JTVPLUSONLY.m3u")
      .then(r => r.text());

    // Find channel block by tvg-id
    const block = m3u.split("#EXTINF:").find(b => b.includes(`tvg-id="${id}"`));
    if (!block) return res.status(404).send("Channel Not Found");

    const lines = block.trim().split("\n").map(x => x.trim());

    // ============= MPD =============
    if (type === "mpd") {
      const mpd = lines.reverse().find(x => x.startsWith("http"));
      if (!mpd) return res.status(404).send("MPD Not Found");
      return res.redirect(mpd);
    }

    // ============= KEY (URL-SAFE BASE64) =============
    if (type === "key") {
      const raw = lines.find(x => x.includes("license_key="))
        ?.split("license_key=")[1];

      if (!raw) return res.status(404).send("Key Not Found");

      const [kidHex, keyHex] = raw.split(":");

      const toBase64Url = (hex) =>
        Buffer.from(hex.replace(/[^0-9a-f]/gi, ""), "hex")
          .toString("base64")
          .replace(/=/g, "")
          .replace(/\+/g, "_")

      const result = {
        keys: [
          {
            kty: "oct",
            k: toBase64Url(keyHex),
            kid: toBase64Url(kidHex)
          }
        ],
        type: "temporary"
      };

      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify(result));
    }

    res.send("Use /api/mpd/ID or /api/key/ID");

  } catch (e) {
    res.status(500).send("Error");
  }
}
