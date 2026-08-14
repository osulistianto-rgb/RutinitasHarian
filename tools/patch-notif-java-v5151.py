from pathlib import Path
p=Path('app/src/main/java/com/rutinitasplus/app/NotificationBridge.java')
s=p.read_text(encoding='utf-8')
if 'statusNotifikasi()' in s:
    print('NotificationBridge sudah dipatch')
    raise SystemExit(0)
methods=r'''

    @JavascriptInterface
    public String statusNotifikasi() {
        boolean notif = true;
        if (Build.VERSION.SDK_INT >= 33) {
            notif = aktivitas.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                == android.content.pm.PackageManager.PERMISSION_GRANTED;
        }
        boolean presisi = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) aktivitas.getSystemService(Context.ALARM_SERVICE);
            presisi = am != null && am.canScheduleExactAlarms();
        }
        return "IZIN_NOTIF=" + (notif ? "1" : "0") + ";PRESISI=" + (presisi ? "1" : "0");
    }

    @JavascriptInterface
    public void bukaPengaturanNotifikasi() {
        aktivitas.runOnUiThread(() -> {
            try {
                Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                i.putExtra(Settings.EXTRA_APP_PACKAGE, aktivitas.getPackageName());
                aktivitas.startActivity(i);
            } catch (Exception e) { }
        });
    }

    @JavascriptInterface
    public void ujiSekarang(String judul, String pesan) {
        if (Build.VERSION.SDK_INT >= 33 &&
            aktivitas.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                != android.content.pm.PackageManager.PERMISSION_GRANTED) return;
        aktivitas.runOnUiThread(() -> {
            try {
                android.app.NotificationManager nm = (android.app.NotificationManager)
                    aktivitas.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm == null) return;
                Intent buka = new Intent(aktivitas, MainActivity.class);
                PendingIntent pi = PendingIntent.getActivity(
                    aktivitas, 5151, buka,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                androidx.core.app.NotificationCompat.Builder b =
                    new androidx.core.app.NotificationCompat.Builder(aktivitas, "rutinitas_channel")
                        .setSmallIcon(android.R.drawable.ic_popup_reminder)
                        .setContentTitle(judul == null || judul.isEmpty() ? "Rutinitas+" : judul)
                        .setContentText(pesan == null || pesan.isEmpty() ? "Tes notifikasi native." : pesan)
                        .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
                        .setCategory(androidx.core.app.NotificationCompat.CATEGORY_REMINDER)
                        .setAutoCancel(true)
                        .setContentIntent(pi);
                nm.notify(5151, b.build());
            } catch (Exception e) { }
        });
    }
'''
pos=s.rfind('}')
if pos<0:
    raise SystemExit('Penutup class NotificationBridge tidak ditemukan')
s=s[:pos]+methods+s[pos:]
p.write_text(s,encoding='utf-8')
print('NotificationBridge dipatch dengan tes/status/pengaturan')
