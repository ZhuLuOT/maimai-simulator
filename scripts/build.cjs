const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');
const {createHash}=require('node:crypto');

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
  'social.css',
  'world.js',
  'major-life.js',
  'major.css',
  'precision.js',
  'judgement.js',
  'gameplay.js',
  'city.js',
  'competition.js',
  'romance.js',
  'lin-life.js',
  'guidance.js',
  'rest-life.js',
  'needs.js',
  'b50.js',
  'collection.js',
  'systems.js',
  'social-life.js',
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
const hash=createHash('sha256');
function hashFile(file){hash.update(file).update(fs.readFileSync(path.join(rootDir,file)));}
function hashDirectory(directory){for(const entry of fs.readdirSync(path.join(rootDir,directory),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=directory+'/'+entry.name;entry.isDirectory()?hashDirectory(file):hashFile(file);}}
for(const file of [...filesToCopy,'app.js','life-ui.js','package.json','package-lock.json','scripts/build.cjs'])hashFile(file);
for(const directory of ['src',...directoriesToCopy])hashDirectory(directory);
const version=hash.digest('hex').slice(0,16);
await build({
  absWorkingDir: rootDir,
  tsconfigRaw: {},
  entryPoints: [path.join(rootDir, 'src/main.js')],
  bundle: true,
  format: 'iife',
  outfile: path.join(distDir, 'app.js'),
  minify: true,
  define:{__APP_VERSION__:JSON.stringify(version)},
  sourcemap: true,
  target: ['es2022'],
  logLevel: 'info',
  // Resolve only this project's files; native parent-directory discovery is blocked in managed workspaces.
  plugins: [{name: 'project-files', setup(builder) {
    builder.onResolve({filter: /.*/}, args => {
      const from = args.importer || path.join(rootDir, 'package.json');
      let resolved = path.isAbsolute(args.path) ? args.path : args.path.startsWith('.') ? path.resolve(path.dirname(from), args.path) : browserModule(args.path);
      if (!path.extname(resolved) && fs.existsSync(resolved + '.js')) resolved += '.js';
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
const release=JSON.stringify({version,...require('../src/release-notes.cjs')});
fs.writeFileSync(path.join(rootDir,'version.json'),release);
fs.writeFileSync(path.join(outDir,'version.json'),release);
const index=fs.readFileSync(path.join(rootDir,'index.html'),'utf8').replace(/((?:src|href)="[^"?]+\.(?:js|css))"/g,'$1?v='+version+'"');
fs.writeFileSync(path.join(outDir,'index.html'),index);
fs.writeFileSync(path.join(outDir,'_headers'),'/\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/version.json\n  Cache-Control: no-store\n');

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
