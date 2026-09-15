const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const colors = ['normal', 'blue', 'green', 'orange', 'red', 'purple', 'bronze', 'silver', 'gold', 'platinum', 'rainbow'];
const dir = path.resolve(__dirname, '../assets/rating/wahlap');
async function main() {
  fs.mkdirSync(dir, { recursive: true });
  const files = await Promise.all(colors.map(async (color, i) => {
    const name = `rating_base_${color}.png`;
    const url = `https://maimai.wahlap.com/maimai-mobile/img/${name}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw Error(`${url}: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.readUInt32BE(0) !== 0x89504e47 || bytes.readUInt32BE(16) !== 296 || bytes.readUInt32BE(20) !== 86) throw Error(`Unexpected image: ${name}`);
    fs.writeFileSync(path.join(dir, name), bytes);
    return { tier: i + 1, file: name, url, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  }));
  fs.writeFileSync(path.join(dir, 'sources.json'), JSON.stringify({ source: '华立舞萌 DX 国服官网', files }, null, 2));
  console.log(`Saved ${files.length} unmodified mainland Rating frames.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
