const fs = require('node:fs');
const path = require('node:path');
const input = process.argv[2] || path.join(process.env.TEMP, 'maimai-music-data.json');
const raw = JSON.parse(fs.readFileSync(input, 'utf8'));
const songs = raw.map(s => ({ id: s.id, title: s.title, type: s.type, ds: s.ds, level: s.level, artist: s.basic_info.artist, genre: s.basic_info.genre, bpm: s.basic_info.bpm, version: s.basic_info.from, isNew: s.basic_info.is_new, notes:s.charts.map(c=>c.notes), cover:`https://www.diving-fish.com/covers/${s.id.padStart(5,'0')}.png` }));
fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../data/music.js'), 'window.MUSIC_DATA = ' + JSON.stringify(songs) + ';\n');
fs.writeFileSync(path.join(__dirname, '../data/source.json'), JSON.stringify({ source: 'https://www.diving-fish.com/api/maimaidxprober/music_data', retrievedAt: new Date().toISOString(), count: songs.length, note: 'Public community snapshot; chart constants and new-version grouping follow this snapshot, not a guarantee of current official availability.' }, null, 2));
console.log(`Imported ${songs.length} songs.`);
