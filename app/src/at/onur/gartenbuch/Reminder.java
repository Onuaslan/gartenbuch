package at.onur.gartenbuch;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import java.util.Calendar;

/** Einstellungen und Wecker für die tägliche Morgen-Nachricht. */
final class Reminder {
    static final String ACTION_ALARM = "at.onur.gartenbuch.ALARM";
    static final String ACTION_TEST = "at.onur.gartenbuch.TEST";

    private Reminder() {
    }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("reminder", Context.MODE_PRIVATE);
    }

    static boolean enabled(Context c) {
        return prefs(c).getBoolean("enabled", false);
    }

    static int hour(Context c) {
        return prefs(c).getInt("hour", 7);
    }

    static int minute(Context c) {
        return prefs(c).getInt("minute", 0);
    }

    static void save(Context c, boolean on, int hour, int minute) {
        if (hour < 0 || hour > 23) hour = 7;
        if (minute < 0 || minute > 59) minute = 0;
        prefs(c).edit().putBoolean("enabled", on).putInt("hour", hour).putInt("minute", minute).apply();
    }

    private static PendingIntent alarmIntent(Context c) {
        Intent i = new Intent(c, ReminderReceiver.class).setAction(ACTION_ALARM);
        return PendingIntent.getBroadcast(c, 1, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Plant den nächsten Morgen-Wecker (oder löscht ihn, wenn die Nachricht aus ist). */
    static void schedule(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = alarmIntent(c);
        am.cancel(pi);
        if (!enabled(c)) return;
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, hour(c));
        cal.set(Calendar.MINUTE, minute(c));
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (cal.getTimeInMillis() <= System.currentTimeMillis() + 5000) {
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
    }
}
