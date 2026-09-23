const aliases = require('../data/song-aliases.cjs');
const normalize = text => String(text).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

function createSongSearch(songs) {
  const index = new Map(songs.map(song => [song.id, normalize([
    song.title, song.artist, song.id, ...(aliases[song.id] || [])
  ].join(' '))]));
  return (song, query) => index.get(song.id)?.includes(normalize(query)) || false;
}

module.exports = {createSongSearch};
