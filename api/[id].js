export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Fetch full M3U
    const response = await fetch("https://jiotvplaylist.teachub.workers.dev/");
    const text = await response.text();

    // Split into channels
    const channels = text.split("#EXTINF:");

    // Find channel by tvg-id
    let channel = channels.find(c => c.includes(`tvg-id="${id}"`));

    if (!channel) {
      return res.status(404).send(`#EXTM3U\n#EXTINF:-1, Channel Not Found`);
    }

    // Return channel block
    res.setHeader("Content-Type", "text/plain");
    res.send("#EXTINF:" + channel.trim());
  } catch (err) {
    res.status(500).send("Error fetching M3U");
  }
}
