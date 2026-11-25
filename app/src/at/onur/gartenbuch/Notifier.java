package at.onur.gartenbuch;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

/** Zeigt die Morgen-Nachricht. Neuere Android-Klassen laufen per Reflection, weil gegen API 23 gebaut wird. */
final class Notifier {
    static final String CHANNEL = "morgen";
    static final String POST_NOTIFICATIONS = "android.permission.POST_NOTIFICATIONS";

    private Notifier() {
    }

    static boolean canNotify(Context c) {
        if (Build.VERSION.SDK_INT >= 33
                && c.checkSelfPermission(POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        try {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            Object r = nm.getClass().getMethod("areNotificationsEnabled").invoke(nm);
            return !(r instanceof Boolean) || ((Boolean) r).booleanValue();
        } catch (Throwable t) {
            return true;
        }
    }

    private static void ensureChannel(NotificationManager nm) {
        if (Build.VERSION.SDK_INT < 26) return;
        try {
            Class<?> cc = Class.forName("android.app.NotificationChannel");
            Object ch = cc.getConstructor(String.class, CharSequence.class, int.class)
                    .newInstance(CHANNEL, "Morgen-Nachricht", 3);
            cc.getMethod("setDescription", String.class).invoke(ch, "Was heute im Garten zu tun ist");
            nm.getClass().getMethod("createNotificationChannel", cc).invoke(nm, ch);
        } catch (Throwable ignored) {
        }
    }

    static void show(Context c, String title, String text) {
        if (!canNotify(c)) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        ensureChannel(nm);

        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 2, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        int icon = c.getResources().getIdentifier("ic_stat_leaf", "drawable", c.getPackageName());
        if (icon == 0) icon = c.getApplicationInfo().icon;

        String first = text;
        int nl = text.indexOf('\n');
        if (nl > 0) first = text.substring(0, nl);

        Notification.Builder b = new Notification.Builder(c);
        if (Build.VERSION.SDK_INT >= 26) {
            try {
                b.getClass().getMethod("setChannelId", String.class).invoke(b, CHANNEL);
            } catch (Throwable ignored) {
            }
        }
        b.setSmallIcon(icon)
                .setContentTitle(title)
                .setContentText(first)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(pi)
                .setAutoCancel(true)
                .setColor(0xFF2D7A48)
                .setPriority(Notification.PRIORITY_DEFAULT);
        nm.notify(1001, b.build());
    }
}
