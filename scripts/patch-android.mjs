// Ajusta el proyecto android/ que crea Capacitor: MainActivity propia, «Abrir con»,
// iconos, versión (desde package.json) y firma fija para que las actualizaciones se instalen encima.
// Se puede ejecutar todas las veces que haga falta.
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'android/app');
if (!existsSync(app)) { console.error('Falta la carpeta android/. Ejecuta antes: npx cap add android'); process.exit(1); }

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const [ma, mi, pa] = pkg.version.split('.').map(Number);
const versionCode = ma * 10000 + mi * 100 + pa;

// 1. MainActivity
const javaDir = join(app, 'src/main/java/es/alebarzal/matriculas');
mkdirSync(javaDir, { recursive: true });
cpSync(join(root, 'android-src/MainActivity.java'), join(javaDir, 'MainActivity.java'));

// 2. Manifest: abrir .xlsx/.csv desde otras apps
const manPath = join(app, 'src/main/AndroidManifest.xml');
let man = readFileSync(manPath, 'utf8');
if (!man.includes('<!-- matriculas:abrir-con -->')) {
  const mimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/comma-separated-values', 'application/csv',
    'application/vnd.ms-excel', 'application/octet-stream'
  ];
  const data = mimes.map(m => `                <data android:mimeType="${m}" />`).join('\n');
  const filters = `
            <!-- matriculas:abrir-con -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="content" />
                <data android:scheme="file" />
${data}
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
${data}
            </intent-filter>
`;
  const i = man.indexOf('</activity>');
  if (i < 0) { console.error('No encuentro </activity> en el AndroidManifest.xml'); process.exit(1); }
  man = man.slice(0, i) + filters + '        ' + man.slice(i);
  writeFileSync(manPath, man);
}

// 3. Iconos
const resSrc = join(root, 'android-src/res');
for (const d of readdirSync(resSrc)) cpSync(join(resSrc, d), join(app, 'src/main/res', d), { recursive: true });
const adaptive = '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background" />\n    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n</adaptive-icon>\n';
mkdirSync(join(app, 'src/main/res/mipmap-anydpi-v26'), { recursive: true });
writeFileSync(join(app, 'src/main/res/mipmap-anydpi-v26/ic_launcher.xml'), adaptive);
writeFileSync(join(app, 'src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml'), adaptive);

// 4. Versión y firma
const gPath = join(app, 'build.gradle');
let g = readFileSync(gPath, 'utf8');
g = g.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`).replace(/versionName\s+"[^"]*"/, `versionName "${pkg.version}"`);
if (!g.includes('matriculasKey')) {
  g = g.replace(/android\s*\{/, `android {
    signingConfigs {
        matriculasKey {
            storeFile file("../../android-src/matriculas.keystore")
            storePassword "matriculas"
            keyAlias "matriculas"
            keyPassword "matriculas"
        }
    }`);
  g = g.replace(/buildTypes\s*\{\s*release\s*\{/, m => m + '\n            signingConfig signingConfigs.matriculasKey');
  g = g.replace(/buildTypes\s*\{/, m => m + '\n        debug {\n            signingConfig signingConfigs.matriculasKey\n        }');
}
writeFileSync(gPath, g);

console.log(`Android listo: versión ${pkg.version} (code ${versionCode})`);
