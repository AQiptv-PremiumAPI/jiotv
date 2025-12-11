export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Fetch M3U
    const m3u = await fetch("https://jiotvplaylist.teachub.workers.dev/").then(r => r.text());

    // Find block of the given id
    const part = m3u.split("#EXTINF:").find(x => x.includes(`tvg-id="${id}"`));

    if (!part) return res.status(404).send("Channel not found");

    // Get the first URL after EXTINF
    const url = part.trim().split("\n")[1];

    // Redirect to that URL
    res.writeHead(302, { Location: url });
    res.end();
  } catch (e) {
    res.status(500).send("Error");
  }
}
