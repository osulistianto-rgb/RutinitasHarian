# Prosedur Rilis Rutinitas+

Mesin build sudah terbukti berhasil dan **dikunci sebagai baseline**. Jangan ubah
`bangun-apk.yml` hanya untuk merapikan hal yang bisa diselesaikan lewat prosedur.

> Cadangan yang belum pernah dipulihkan sekali pun bukan cadangan,
> cuma berkas yang kita harapkan berfungsi.

---

## Catatan versi

Diisi setiap kali merilis. Kolom `KODE_VERSI` harus **selalu naik** — Android
menolak memasang APK dengan angka yang sama atau lebih kecil, dan pesan
galatnya tidak menjelaskan sebabnya.

| Tanggal | NAMA_VERSI | KODE_VERSI | Tanda tangan | Catatan |
|---|---|---|---|---|
| 8 Agu 2026 | 5.11 | 511 | debug | Isi aplikasi sebenarnya v5.12 — nama tidak sinkron |
|  |  |  |  |  |

---

## Daftar periksa rilis

### Menyiapkan versi

- [ ] **1.** Ubah `<title>` di `index.html` agar sesuai versi baru
- [ ] **2.** Isi `NAMA_VERSI` saat menjalankan alur kerja, mis. `5.12`
- [ ] **3.** Isi `KODE_VERSI` yang **lebih besar** dari baris terakhir tabel di atas, mis. `512`
- [ ] **4.** Setelah build, pastikan nama berkas APK menunjukkan versi yang sama

### Membangun

- [ ] **5.** Build memakai keystore permanen yang sama seperti rilis sebelumnya
- [ ] **5b.** Buka ringkasan alur kerja dan pastikan tertulis **`Ditandatangani tetap : ya`**
- [ ] **5c.** Tambahkan satu baris ke tabel catatan versi di atas

### Menguji cadangan — sebelum menyentuh pemasangan lama

- [ ] **6.** Buat `.rtns` lewat Beranda → Alat & pengelolaan, simpan ke Unduhan atau Drive
- [ ] **7.** Buka aplikasi Files dan **lihat sendiri berkasnya ada di sana**
- [ ] **7b.** Pulihkan cadangan itu ke aplikasi yang sedang berjalan
      Isinya sama dengan data sekarang, jadi tidak ada yang berubah — ini
      membuktikan berkasnya terbaca, checksum-nya cocok, dan fotonya utuh
- [ ] **8.** Setelah pulih, periksa satu per satu: foto, lampiran, keuangan,
      Kantor, Pribadi, catatan, dan laporan

### Migrasi

- [ ] **9.** Baru lakukan migrasi debug → release bila memang diperlukan
      Hapus pasang menghapus seluruh data internal. Pastikan `.rtns` ada di
      **luar** penyimpanan aplikasi sebelum melangkah.

---

## Tempat versi disimpan

Empat tempat, tidak ada yang otomatis mengikuti yang lain:

| Tempat | Diubah di |
|---|---|
| Judul dalam aplikasi | `<title>` pada `index.html` |
| `versionName` | `NAMA_VERSI` saat menjalankan alur kerja |
| `versionCode` | `KODE_VERSI` saat menjalankan alur kerja |
| Nama berkas APK | mengikuti `NAMA_VERSI` |

Bila alur kerja dijalankan tanpa mengisi kedua nilai itu, dipakai nilai cadangan
di dalam YAML — dan `versionCode` tidak akan naik.

---

## Keystore

Dicatat di sini **hanya keterangannya**. Berkas `.jks`, sandi, dan kunci privat
**tidak pernah** masuk ke repositori.

| Keterangan | Isi |
|---|---|
| Tanggal dibuat | _(isi saat keystore dibuat)_ |
| Alias | `rutinitas` |
| Masa berlaku | 10000 hari (± 27 tahun) |
| Lokasi salinan utama | _(mis. Drive pribadi, map tertentu)_ |
| Lokasi salinan cadangan | _(mis. flashdisk yang disimpan sendiri)_ |

Rahasia repositori yang harus terisi agar APK ditandatangani tetap:
`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

Kalau berkas keystore hilang, **tidak ada cara memulihkannya**. Setiap pengguna
harus hapus pasang, dan datanya hilang bila belum dicadangkan. Ini satu-satunya
bagian dari proyek ini yang tidak bisa dibangun ulang dari repositori.
