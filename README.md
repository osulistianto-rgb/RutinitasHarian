# Rutinitas Harian + Laporan Rehab

Paket ini berisi:

- `index.html` — aplikasi utama.
- `manifest.json`, `sw.js`, dan ikon — instalasi PWA/offline.
- `.github/workflows/pages.yml` — publikasi otomatis ke GitHub Pages.
- `.github/workflows/build-apk.yml` — pembuatan APK otomatis.
- `android/` — proyek Android WebView.

## Cara unggah

1. Ekstrak ZIP.
2. Buka repository GitHub.
3. Pilih **Add file → Upload files**.
4. Unggah **seluruh isi folder hasil ekstrak**, bukan folder induknya.
5. Klik **Commit changes**.

## Mengaktifkan GitHub Pages

1. Buka **Settings → Pages**.
2. Pada **Source**, pilih **GitHub Actions**.
3. Buka tab **Actions** dan jalankan `Deploy GitHub Pages` bila belum berjalan otomatis.

## Membuat APK

1. Buka tab **Actions**.
2. Pilih workflow **Build APK**.
3. Tekan **Run workflow**.
4. Setelah selesai, buka hasil workflow.
5. Unduh artifact **Rutinitas-Harian-Plus-APK**.
6. Ekstrak ZIP artifact, lalu instal `app-debug.apk`.

APK yang dihasilkan adalah versi debug untuk penggunaan pribadi.
