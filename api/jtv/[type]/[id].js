export default async function handler(req, res) {
  const { type, id } = req.query; // type = mpd | key

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

    // ---------- KEY (JSON format) ----------
    if (type === "key") {
      const raw = lines.find(x => x.includes("license_key="))
        ?.split("license_key=")[1];

      if (!raw) return res.status(404).send("Key Not Found");

      // raw format = KID:KEY  (hex)
      const [kidHex, keyHex] = raw.split(":");

      if (!kidHex || !keyHex)
        return res.status(400).send("Invalid key format");

      // Convert Hex → Base64
      const hexToBase64 = (hex) =>
        Buffer.from(hex.replace(/[^0-9a-f]/gi, ""), "hex").toString("base64");

      const jsonKeyFormat = {
        keys: [
          {
            kty: "oct",
            k: hexToBase64(keyHex),
            kid: hexToBase64(kidHex)
          }
        ],
        type: "temporary"
      };

      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify(jsonKeyFormat));
    }

    res.send("Use /mpd/ID or /key/ID");

  } catch (e) {
    res.status(500).send("Error: " + e.message);
  }
}
