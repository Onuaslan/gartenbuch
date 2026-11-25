package at.onur.gartenbuch;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Erzeugt die Morgen-Nachricht mit derselben Logik wie die App: lädt die Oberfläche unsichtbar,
 * lässt sie das Wetter kurz aktualisieren und den Text berechnen. Klappt das nicht in 9 Sekunden,
 * kommt der zuletzt gespeicherte Text von heute oder ein allgemeiner Hinweis.
 */
final class MorningTask {
    private static final long TIMEOUT_MS = 9000;

    private final Context ctx;
    private final BroadcastReceiver.PendingResult pending;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private WebView web;
    private PowerManager.WakeLock wakeLock;
    private boolean done;
    private boolean started;

    MorningTask(Context ctx, BroadcastReceiver.PendingResult pending) {
        this.ctx = ctx;
        this.pending = pending;
    }

    void run() {
        try {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "gartenbuch:morgen");
            wakeLock.acquire(TIMEOUT_MS + 4000);
        } catch (Throwable ignored) {
        }
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                finish(null);
            }
        }, TIMEOUT_MS);
        try {
            web = new WebView(ctx);
            WebSettings s = web.getSettings();
            s.setJavaScriptEnabled(true);
            s.setDomStorageEnabled(true);
            web.addJavascriptInterface(new Bridge(ctx, null, new Bridge.Result() {
                @Override
                public void onResult(final String json) {
                    handler.post(new Runnable() {
                        @Override
                        public void run() {
                            finish(json == null ? "" : json);
                        }
                    });
                }
            }), "Android");
            web.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    if (started) return;
                    started = true;
                    view.evaluateJavascript(
                            "(function(){try{window.__morning().then(function(r){Android.morningResult(r);});}"
                                    + "catch(e){Android.morningResult('');}})()", null);
                }
            });
            web.loadUrl("file:///android_asset/index.html?mode=morning");
        } catch (Throwable t) {
            finish(null);
        }
    }

    private void finish(String json) {
        if (done) return;
        done = true;
        try {
            String title = null, text = null;
            boolean noPlants = false;
            if (json != null && json.length() > 0) {
                try {
                    JSONObject o = new JSONObject(json);
                    if (o.length() == 0) {
                        noPlants = true;
                    } else {
                        title = o.optString("title", null);
                        text = o.optString("text", null);
                    }
                } catch (Exception ignored) {
                }
            }
            if (!noPlants) {
                if (title == null || title.length() == 0 || text == null || text.length() == 0) {
                    SharedPreferences p = Reminder.prefs(ctx);
                    String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
                    if (today.equals(p.getString("sumDate", "")) && p.getString("sumText", "").length() > 0) {
                        title = p.getString("sumTitle", "Gartenbuch");
                        text = p.getString("sumText", "");
                    } else {
                        title = "Gartenbuch";
                        text = "Schau nach, was heute im Garten zu tun ist.";
                    }
                }
                Notifier.show(ctx, title, text);
            }
        } catch (Throwable ignored) {
        }
        try {
            if (web != null) {
                web.destroy();
                web = null;
            }
        } catch (Throwable ignored) {
        }
        try {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        } catch (Throwable ignored) {
        }
        try {
            if (pending != null) pending.finish();
        } catch (Throwable ignored) {
        }
    }
}
