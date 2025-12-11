export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // 1. Fetch full M3U
    const response = await fetch("https://jiotvplaylist.teachub.workers.dev/");
    const text = await response.text();

    // 2. Split M3U into channel blocks
    const blocks = text.split("#EXTINF:");

    // 3. Find required channel by tvg-id
    const block = blocks.find(b => b.includes(`tvg-id="${id}"`));

    if (!block) {
      return res.status(404).send("Channel Not Found");
    }

    // 4. Extract MPD or stream URL (first URL in block)
    const lines = block.trim().split("\n");
    const streamUrl = lines[1]; // First URL after EXTINF

    if (!streamUrl) {
      return res.status(500).send("Stream URL Not Found");
    }

    // 5. Redirect to the stream/MPD URL
    res.writeHead(302, { Location: streamUrl });
    return res.end();

  } catch (err) {
    return res.status(500).send("Error fetching M3U");
  }
}
