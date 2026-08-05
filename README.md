# Rutinitas+ v1.3 — Android APK

Proyek Android WebView untuk mengubah `Rutinitas-Plus-v13.html` menjadi APK melalui GitHub Actions.

## Cara memakai lewat HP

1. Buat repository GitHub baru atau buka repository yang sudah ada.
2. Ekstrak ZIP ini.
3. Upload **seluruh isi folder**, termasuk folder `.github`.
4. Commit ke branch `main`.
5. Buka tab **Actions** di repository.
6. Pilih **Build APK Rutinitas+**.
7. Tekan **Run workflow**. Workflow juga berjalan otomatis setelah push ke `main`.
8. Setelah tanda centang hijau muncul, buka hasil proses tersebut.
9. Pada bagian **Artifacts**, unduh `Rutinitas-Plus-v1.3-APK`.
10. Ekstrak file hasil unduhan, lalu instal `Rutinitas-Plus-v1.3.apk`.

## Mengganti isi aplikasi

Ganti file berikut dengan HTML versi terbaru:

`app/src/main/assets/index.html`

Kemudian naikkan `versionCode` dan `versionName` pada `app/build.gradle` sebelum commit.

## Catatan

- APK yang dibuat workflow adalah APK **debug** dan dapat langsung dipasang untuk penggunaan pribadi.
- Data aplikasi disimpan oleh WebView pada perangkat. Menghapus data aplikasi atau uninstall dapat menghapus data lokal; gunakan fitur ekspor/backup di dalam aplikasi.
- Saat instalasi pertama, Android mungkin meminta izin memasang aplikasi dari browser atau file manager.
