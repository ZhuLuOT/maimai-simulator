const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const url = 'https://www.diving-fish.com/maibot/static.zip';
async function range(start, end) {
  const response = await fetch(url, { headers: { Range: `bytes=${start}-${end}` }, signal: AbortSignal.timeout(30000) });
  if (response.status !== 206) throw Error(`Expected partial archive response, got ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
async function main() {
  const head = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(30000) });
  if (!head.ok) throw Error(`Archive unavailable: ${head.status}`);
  const size = Number(head.headers.get('content-length'));
  const tail = await range(size - 65536, size - 1);
  const end = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw Error('ZIP directory not found');
  const offset = tail.readUInt32LE(end + 16), length = tail.readUInt32LE(end + 12);
  const directory = await range(offset, offset + length - 1);
  const output = path.resolve(__dirname, '../assets/rating/diving-fish');
  fs.mkdirSync(output, { recursive: true });
  for (let pos = 0; pos < directory.length;) {
    if (directory.readUInt32LE(pos) !== 0x02014b50) throw Error('Invalid ZIP directory');
    const nameLength = directory.readUInt16LE(pos + 28), extra = directory.readUInt16LE(pos + 30), comment = directory.readUInt16LE(pos + 32);
    const name = directory.subarray(pos + 46, pos + 46 + nameLength).toString();
    if (/\/UI_(CMN_DXRating_S_\d+|NUM_Drating_\d)\.png$/.test(name)) {
      const start = directory.readUInt32LE(pos + 42), packedSize = directory.readUInt32LE(pos + 20), method = directory.readUInt16LE(pos + 10);
      const header = await range(start, start + 29);
      const dataStart = start + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
      const packed = await range(dataStart, dataStart + packedSize - 1);
      const data = method === 8 ? zlib.inflateRawSync(packed) : method === 0 ? packed : null;
      if (!data || data.readUInt32BE(0) !== 0x89504e47) throw Error(`Invalid PNG: ${name}`);
      fs.writeFileSync(path.join(output, path.basename(name)), data);
      console.log(`${path.basename(name)} ${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`);
    }
    pos += 46 + nameLength + extra + comment;
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
