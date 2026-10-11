// Folds `dist-artifact/` (built with `vite build --mode artifact`) into a single
// HTML fragment: <title>, inline <style>, #root and an inline module script.
// No external requests, so the page runs inside sandboxed hosts and offline.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outDir = new URL('../dist-artifact/', import.meta.url).pathname;
const html = await readFile(join(outDir, 'index.html'), 'utf8');

const pick = (pattern, label) => {
  const match = html.match(pattern);
  if (!match?.[1]) throw new Error(`Could not find ${label} in dist-artifact/index.html`);
  return match[1];
};

const title = pick(/<title>([^<]*)<\/title>/, '<title>');
const scriptPath = pick(/<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/, 'entry script');
const stylePath = pick(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/, 'stylesheet');

const read = (assetPath) => readFile(join(outDir, assetPath.replace(/^\//, '')), 'utf8');
const [js, css] = await Promise.all([read(scriptPath), read(stylePath)]);

if (/<\/style/i.test(css)) throw new Error('Inlined CSS contains a closing </style> sequence');

// `</script` inside the bundle would end the inline tag early; `<\/` is equivalent in JS strings and regexes.
const safeJs = js.replace(/<\/script/gi, '<\\/script');

const fragment = [
  `<title>${title}</title>`,
  `<meta name="description" content="Block puzzle de gemas: complete linhas e colunas e transforme gemas em moedas.">`,
  `<style>${css}</style>`,
  // The host page owns <html>, so the language goes on the app root for screen readers.
  `<div id="root" lang="pt-BR"></div>`,
  `<script type="module">${safeJs}</script>`,
  '',
].join('\n');

const target = join(outDir, 'lazuli-blocks.html');
await writeFile(target, fragment, 'utf8');
console.log(`artifact ready: ${target} (${(fragment.length / 1024).toFixed(1)} KiB)`);
