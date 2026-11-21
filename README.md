# Matrículas · Parking Salamanca Colón – Plaza Mayor

App para la ronda de matrículas: importa la lista de coches que exporta el portal
(**Matrículas en Aparcamiento → Buscar → Exportar .csv**, que descarga un `open_transactions_….xlsx`)
y permite marcar en el móvil los coches que se van viendo.

- Lee `.xlsx` y `.csv` sin internet y detecta la columna de matrículas sola.
- «Abrir con → Matrículas» desde Gmail, Drive o Archivos, y «Compartir» desde WhatsApp.
- Marcas guardadas en el móvil; al importar una lista nueva se conservan.
- Matrículas vistas que no están en el sistema, resumen para copiar o enviar.
- Guía para el personal dentro de la app (botón **Guía**).
- Novedades la primera vez que se abre tras actualizar, y aviso de versión nueva (lee la última *release* de este repo).

## Estructura

| Carpeta / archivo | Qué es |
|---|---|
| `src/app.html` | Toda la app (HTML, CSS y JS). Es lo único que se edita para cambiar la app. |
| `scripts/build-web.mjs` | Genera `www/index.html` (para Android) y `dist/artifact.html` (página web). |
| `android-src/` | `MainActivity.java` («Abrir con»), iconos y la clave de firma. |
| `scripts/patch-android.mjs` | Aplica lo anterior al proyecto `android/` que crea Capacitor y pone la versión de `package.json`. |
| `build-apk.bat` | Compila el APK en Windows. |
| `.github/workflows/build-apk.yml` | Compila el APK en GitHub y lo publica como *release*. |

## Compilar en el PC (Windows)

Requisitos: Node 22 y Android Studio (lo mismo que para Pellet Control).

```bat
build-apk.bat
```

Deja `Matriculas-v2.0.0.apk` en la carpeta. Pásalo al móvil e instálalo.

## Compilar en GitHub (sin PC)

1. Sube el proyecto a `alebarzal/matriculas-parking`.
2. Crea una etiqueta con la versión: `git tag v2.0.0 && git push --tags`.
3. GitHub compila y publica el APK en **Releases**. El personal lo descarga desde ahí.

## Sacar una versión nueva

1. Cambia lo que haga falta en `src/app.html`.
2. Sube el número en **dos** sitios: `package.json` → `"version"` y `src/app.html` → `APP_VERSION`.
3. Añade la versión al principio de `CHANGELOG` en `src/app.html` y escribe las novedades en `NOVEDADES.md`.
4. `git commit`, `git tag vX.Y.Z`, `git push --tags`.

Las apps instaladas verán el aviso «Hay una versión nueva» al abrirse (si tienen internet), y tras instalarla
verán la pantalla de novedades.

**Prueba del aviso:** en la app, *Guía → Probar aviso de actualización* muestra el aviso con una versión ficticia (9.9.9).
Para una prueba real, publica `v2.0.1` con cualquier cambio pequeño y abre la app con la 2.0.0 instalada.

## Firma

`android-src/matriculas.keystore` (contraseña y alias `matriculas`) firma todas las versiones. Así cada APK nuevo
se instala encima del anterior sin perder datos. No la cambies, o habrá que desinstalar la app en todos los móviles.
Es una clave para uso interno; si algún día la app se publica en Google Play, crea una clave privada nueva.
