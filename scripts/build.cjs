const { buildSync } = require('esbuild');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const outDir = path.join(rootDir, 'out');

const filesToCopy = [
  'index.html',
  'style.css',
  'spring.css',
  'life.css',
  'expansion.css',
  'update.css',
  'judgement.js',
  'gameplay.js',
  'city.js',
  'competition.js',
  'b50.js',
  'collection.js',
  'systems.js',
  'engine.js',
];

const directoriesToCopy = ['assets', 'data', 'vendor'];
require('./cache-b50-headers.cjs');

buildSync({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  outfile: path.join(distDir, 'app.js'),
  minify: true,
  sourcemap: true,
  target: ['es2022'],
  logLevel: 'info',
});

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of filesToCopy) {
  fs.copyFileSync(path.join(rootDir, file), path.join(outDir, file));
}

for (const directory of directoriesToCopy) {
  fs.cpSync(path.join(rootDir, directory), path.join(outDir, directory), {
    recursive: true,
  });
}

fs.mkdirSync(path.join(outDir, 'dist'), { recursive: true });
fs.copyFileSync(
  path.join(distDir, 'app.js'),
  path.join(outDir, 'dist', 'app.js')
);
