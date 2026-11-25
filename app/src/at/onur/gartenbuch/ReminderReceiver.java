package at.onur.gartenbuch;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Wird vom Wecker (und vom Test-Knopf) ausgelöst. Nicht von außen erreichbar. */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        boolean test = Reminder.ACTION_TEST.equals(action);
        if (!test && !Reminder.ACTION_ALARM.equals(action)) return;
        if (!test) {
            Reminder.schedule(context); // nächsten Morgen sofort wieder planen
            if (!Reminder.enabled(context)) return;
        }
        BroadcastReceiver.PendingResult pending = goAsync();
        new MorningTask(context.getApplicationContext(), pending).run();
    }
}
