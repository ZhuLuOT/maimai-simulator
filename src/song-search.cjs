const aliases = require('../data/song-aliases.cjs');
const normalize = text => String(text).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
const isExactSongTitle = (song, query) => normalize(song.title) === normalize(query);

function createSongSearch(songs) {
  const index = new Map(songs.map(song => [song.id, normalize([
    song.title, song.artist, song.id, ...(aliases[song.id] || [])
  ].join(' '))]));
  return (song, query) => index.get(song.id)?.includes(normalize(query)) || false;
}

function createLevelQuery(songs, levels) {
  const titles = new Set(songs.map(song => normalize(song.title)));
  const availableLevels = new Set(levels.map(normalize));
  return query => {
    const value = normalize(query);
    return availableLevels.has(value) && !titles.has(value) ? value : null;
  };
}

module.exports = {createSongSearch, createLevelQuery, isExactSongTitle};
