package at.onur.gartenbuch;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.view.Window;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.File;
import java.util.List;

public class MainActivity extends Activity {
    private static final int REQ_FILE = 1;

    private WebView web;
    private ValueCallback<Uri[]> filePathCallback;
    private Uri cameraUri;
    private File cameraFile;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
                == Configuration.UI_MODE_NIGHT_YES;
        int bg = night ? 0xFF0D1611 : 0xFFEBF0E7;

        Window w = getWindow();
        w.setStatusBarColor(bg);
        w.setNavigationBarColor(night ? 0xFF152019 : 0xFFFAFCF8);
        if (!night) {
            // helle Statusleiste (0x2000) und helle Navigationsleiste (0x10): dunkle Symbole
            w.getDecorView().setSystemUiVisibility(w.getDecorView().getSystemUiVisibility() | 0x2000 | 0x10);
        }

        cleanPhotoCache();

        web = new WebView(this);
        web.setBackgroundColor(bg);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowContentAccess(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setGeolocationEnabled(false);

        web.addJavascriptInterface(new Bridge(this, this, null), "Android");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && (url.startsWith("http://") || url.startsWith("https://")
                        || url.startsWith("mailto:") || url.startsWith("tel:"))) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    } catch (ActivityNotFoundException ignored) {
                    }
                    return true;
                }
                return false;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;

                Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType("image/*");

                Intent chooser = new Intent(Intent.ACTION_CHOOSER);
                chooser.putExtra(Intent.EXTRA_INTENT, pick);
                chooser.putExtra(Intent.EXTRA_TITLE, "Foto aufnehmen oder wählen");

                cameraFile = null;
                cameraUri = null;
                try {
                    File dir = new File(getCacheDir(), "photos");
                    dir.mkdirs();
                    File f = new File(dir, "cam_" + System.currentTimeMillis() + ".jpg");
                    Uri uri = Uri.parse("content://" + getPackageName() + ".photos/" + f.getName());

                    Intent cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    cam.putExtra(MediaStore.EXTRA_OUTPUT, uri);
                    cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    cam.setClipData(ClipData.newRawUri("photo", uri));

                    List<ResolveInfo> apps = getPackageManager().queryIntentActivities(cam, 0);
                    for (ResolveInfo ri : apps) {
                        grantUriPermission(ri.activityInfo.packageName, uri,
                                Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    }

                    chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
                    cameraFile = f;
                    cameraUri = uri;
                } catch (Exception e) {
                    cameraFile = null;
                    cameraUri = null;
                }

                try {
                    startActivityForResult(chooser, REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    filePathCallback.onReceiveValue(null);
                    filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        web.loadUrl("file:///android_asset/index.html?theme=" + (night ? "dark" : "light"));
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQ_FILE) {
            super.onActivityResult(requestCode, resultCode, data);
            return;
        }
        Uri[] result = null;
        if (resultCode == RESULT_OK) {
            if (data != null && data.getData() != null) {
                result = new Uri[]{data.getData()};
            } else if (data != null && data.getClipData() != null && data.getClipData().getItemCount() > 0) {
                ClipData cd = data.getClipData();
                result = new Uri[cd.getItemCount()];
                for (int i = 0; i < cd.getItemCount(); i++) {
                    result[i] = cd.getItemAt(i).getUri();
                }
            } else if (cameraFile != null && cameraFile.length() > 0) {
                result = new Uri[]{cameraUri};
            }
        }
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(result);
            filePathCallback = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == Bridge.REQ_NOTIFICATIONS && web != null) {
            web.evaluateJavascript("window.__remChanged&&window.__remChanged()", null);
        }
    }

    @Override
    public void onBackPressed() {
        final Activity self = this;
        web.evaluateJavascript(
                "(function(){var s=document.getElementById('sheet');"
                        + "if(s&&!s.hidden){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));return 1;}"
                        + "return 0;})()",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (!"1".equals(value)) {
                            self.finish();
                        }
                    }
                });
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        Reminder.schedule(this);
    }

    @Override
    protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    private void cleanPhotoCache() {
        File[] files = new File(getCacheDir(), "photos").listFiles();
        if (files == null) return;
        for (File f : files) {
            f.delete();
        }
    }
}
