const { build } = require('esbuild');
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
  'mobile.css',
  'judgement.js',
  'gameplay.js',
  'city.js',
  'competition.js',
  'romance.js',
  'guidance.js',
  'rest-life.js',
  'needs.js',
  'b50.js',
  'collection.js',
  'systems.js',
  'engine.js',
];

const directoriesToCopy = ['assets', 'data', 'vendor'];
function browserModule(specifier) {
  const parts=specifier.split('/'),name=parts.slice(0,specifier.startsWith('@')?2:1).join('/');
  const folder=path.join(rootDir,'node_modules',name),pkg=JSON.parse(fs.readFileSync(path.join(folder,'package.json'),'utf8'));
  const sub=specifier===name?'.':'.'+specifier.slice(name.length);
  let target=pkg.exports?.[sub];
  while(target&&typeof target==='object')target=target.browser||target.import||target.default;
  if(typeof target!=='string')throw Error('No browser export for '+specifier);
  return path.resolve(folder,target);
}
require('./cache-b50-headers.cjs');

async function main() {
await build({
  absWorkingDir: rootDir,
  tsconfigRaw: {},
  entryPoints: [path.join(rootDir, 'src/main.js')],
  bundle: true,
  format: 'iife',
  outfile: path.join(distDir, 'app.js'),
  minify: true,
  sourcemap: true,
  target: ['es2022'],
  logLevel: 'info',
  // Resolve only this project's files; native parent-directory discovery is blocked in managed workspaces.
  plugins: [{name: 'project-files', setup(builder) {
    builder.onResolve({filter: /.*/}, args => {
      const from = args.importer || path.join(rootDir, 'package.json');
      const resolved = path.isAbsolute(args.path) ? args.path : args.path.startsWith('.') ? path.resolve(path.dirname(from), args.path) : browserModule(args.path);
      const relative = path.relative(rootDir, resolved);
      if(relative.startsWith('..') || path.isAbsolute(relative)) throw Error('Build input is outside the project: '+args.path);
      return {path:resolved,namespace:'project-files'};
    });
    builder.onLoad({filter:/.*/,namespace:'project-files'}, args => ({contents:fs.readFileSync(args.path,'utf8'),loader:'js'}));
  }}],
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
}
main().catch(error => {console.error(error);process.exitCode=1;});
