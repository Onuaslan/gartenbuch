package at.onur.gartenbuch;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Plant den Morgen-Wecker nach Neustart, App-Update und Zeitänderung neu. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Reminder.schedule(context);
    }
}
