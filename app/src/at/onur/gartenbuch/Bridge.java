package at.onur.gartenbuch;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.webkit.JavascriptInterface;

import org.json.JSONObject;

/** Schnittstelle zwischen der Web-Oberfläche (window.Android) und Android. */
final class Bridge {
    interface Result {
        void onResult(String json);
    }

    static final int REQ_NOTIFICATIONS = 2;

    private final Context ctx;
    private final Activity activity;
    private final Result result;

    Bridge(Context ctx, Activity activity, Result result) {
        this.ctx = ctx.getApplicationContext();
        this.activity = activity;
        this.result = result;
    }

    @JavascriptInterface
    public String getReminder() {
        try {
            JSONObject o = new JSONObject();
            o.put("enabled", Reminder.enabled(ctx));
            o.put("hour", Reminder.hour(ctx));
            o.put("minute", Reminder.minute(ctx));
            o.put("canNotify", Notifier.canNotify(ctx));
            return o.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    @JavascriptInterface
    public void setReminder(boolean on, int hour, int minute) {
        Reminder.save(ctx, on, hour, minute);
        Reminder.schedule(ctx);
    }

    @JavascriptInterface
    public boolean needsPermission() {
        return Build.VERSION.SDK_INT >= 33
                && ctx.checkSelfPermission(Notifier.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED;
    }

    @JavascriptInterface
    public void requestNotificationPermission() {
        if (activity == null || Build.VERSION.SDK_INT < 33) return;
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                activity.requestPermissions(new String[]{Notifier.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
            }
        });
    }

    /** Löst den echten Ablauf der Morgen-Nachricht sofort aus (zum Testen). */
    @JavascriptInterface
    public void testNow() {
        ctx.sendBroadcast(new Intent(ctx, ReminderReceiver.class).setAction(Reminder.ACTION_TEST));
    }

    /** Die App legt den Text für heute ab; er dient als Ersatz, falls die Erzeugung im Hintergrund scheitert. */
    @JavascriptInterface
    public void saveSummary(String date, String title, String text) {
        Reminder.prefs(ctx).edit().putString("sumDate", date).putString("sumTitle", title).putString("sumText", text).apply();
    }

    /** Bildschirmlage für die Vollbild-Karte: "landscape", "portrait" oder "auto" (folgt dem System). */
    @JavascriptInterface
    public void setOrientation(final String mode) {
        if (!(activity instanceof MainActivity)) return;
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                ((MainActivity) activity).applyOrientation(mode);
            }
        });
    }

    /** Blendet Status- und Navigationsleiste aus (true) oder wieder ein (false). */
    @JavascriptInterface
    public void setFullscreen(final boolean on) {
        if (!(activity instanceof MainActivity)) return;
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                ((MainActivity) activity).applyFullscreen(on);
            }
        });
    }

    @JavascriptInterface
    public void morningResult(String json) {
        if (result != null) result.onResult(json);
    }
}
