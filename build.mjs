// Bundles src/ into one self-contained HTML file: dist/culinary-express-prototype.html.
// React loads from cdnjs (UMD); everything else, including the logo and screenshot, is inlined.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const result = await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  write: false,
  format: 'iife',
  minify: true,
  target: 'es2020',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  loader: { '.svg': 'text', '.jpg': 'dataurl' },
  charset: 'utf8',
  legalComments: 'none',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync('src/styles.css', 'utf8');

const html = `<title>Cülinary Expréss Prototype</title>
<meta name="description" content="Clickable prototype of the Cülinary Expréss key flow: landing, Dispatch Builder, Dispatch Ticket, sharing, suggested changes and the staff mobile view.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap">
<style>
${css}
</style>
<div id="root"></div>
<noscript><p style="padding:24px">This prototype needs JavaScript.</p></noscript>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
<script>
${js}
</script>
`;
mkdirSync('dist', { recursive: true });
writeFileSync('dist/culinary-express-prototype.html', html);
// A full-document copy for local testing in a browser (the artifact host adds the skeleton itself).
// It loads React from node_modules because cdnjs may be unreachable from the build machine.
const local = html
  .replace('https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js', '../node_modules/react/umd/react.production.min.js')
  .replace('https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js', '../node_modules/react-dom/umd/react-dom.production.min.js')
  .replaceAll(' crossorigin="anonymous"', '');
writeFileSync('dist/local-preview.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>${local}</body></html>`);
console.log(`dist/culinary-express-prototype.html  ${(html.length / 1024).toFixed(0)} KB`);
