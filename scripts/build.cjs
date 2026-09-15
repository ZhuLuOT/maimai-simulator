require('esbuild').buildSync({entryPoints:['src/main.js'],bundle:true,format:'iife',outfile:'dist/app.js',minify:true,sourcemap:true,target:['es2022'],logLevel:'info'});
