package es.alebarzal.matriculas;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * Recibe el archivo del portal cuando se abre con «Abrir con → Matrículas»
 * (Gmail, Drive, Archivos) o con «Compartir» (WhatsApp) y se lo pasa a la web
 * llamando a window.__recibirArchivo({name, b64}).
 */
public class MainActivity extends BridgeActivity {
    private static final int MAX_BYTES = 15 * 1024 * 1024;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private String pendingJs;
    private int tries;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    @SuppressWarnings("deprecation")
    private void handleIntent(Intent intent) {
        if (intent == null) return;
        Uri uri = null;
        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action)) {
            uri = intent.getData();
        } else if (Intent.ACTION_SEND.equals(action)) {
            if (Build.VERSION.SDK_INT >= 33) uri = intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri.class);
            else uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        }
        if (uri == null) return;
        intent.setAction(Intent.ACTION_MAIN); // que no se vuelva a importar al girar la pantalla
        try {
            byte[] data = readAll(uri);
            JSONObject o = new JSONObject();
            o.put("name", displayName(uri));
            o.put("b64", Base64.encodeToString(data, Base64.NO_WRAP));
            pendingJs = "(window.__recibirArchivo ? window.__recibirArchivo(" + o + ") : false)";
            tries = 0;
            deliver();
        } catch (Exception e) {
            pendingJs = "(window.__errorArchivo ? window.__errorArchivo('No se pudo abrir el archivo') : false)";
            tries = 0;
            deliver();
        }
    }

    /** Reintenta cada medio segundo hasta que la web esté cargada y conteste true. */
    private void deliver() {
        if (pendingJs == null) return;
        if (tries++ > 60) { pendingJs = null; return; }
        WebView wv = getBridge() != null ? getBridge().getWebView() : null;
        if (wv == null) { handler.postDelayed(this::deliver, 500); return; }
        final String js = pendingJs;
        wv.evaluateJavascript(js, value -> {
            if ("true".equals(value)) { if (js.equals(pendingJs)) pendingJs = null; }
            else handler.postDelayed(this::deliver, 500);
        });
    }

    private byte[] readAll(Uri uri) throws Exception {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) throw new Exception("sin datos");
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n, total = 0;
            while ((n = in.read(buf)) > 0) {
                total += n;
                if (total > MAX_BYTES) throw new Exception("archivo demasiado grande");
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        }
    }

    private String displayName(Uri uri) {
        String name = null;
        if ("content".equals(uri.getScheme())) {
            try (Cursor c = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
                if (c != null && c.moveToFirst()) name = c.getString(0);
            } catch (Exception ignored) { }
        }
        if (name == null) name = uri.getLastPathSegment();
        return name == null ? "archivo" : name;
    }
}
