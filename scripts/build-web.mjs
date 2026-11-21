// Genera www/index.html (app Android) y dist/artifact.html (página web) a partir de src/app.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const img = 'data:image/jpeg;base64,' + readFileSync(join(root, 'scripts/guia-portal.jpg')).toString('base64');
const app = readFileSync(join(root, 'src/app.html'), 'utf8').replace('__GUIA_IMG__', img);
const full = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1d4ed8">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style>
</head>
<body>
${app}
</body>
</html>
`;
mkdirSync(join(root, 'www'), { recursive: true });
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'www/index.html'), full);
writeFileSync(join(root, 'dist/artifact.html'), app);
console.log('www/index.html y dist/artifact.html generados');
