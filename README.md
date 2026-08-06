# Rutinitas+

Pencatat rutinitas harian, pekerjaan kantor, urusan pribadi, laporan rehab, dan
dokumentasi — dalam satu berkas yang berjalan tanpa jaringan.

Seluruh data tersimpan di perangkat pemakai. Tidak ada peladen, tidak ada akun,
tidak ada yang dikirim ke mana pun.

---

## Isi

| Berkas | Kegunaan |
|---|---|
| `index.html` | Seluruh aplikasi, enam modul tertanam di dalamnya |
| `manifest.webmanifest` | Keterangan aplikasi agar bisa dipasang ke layar utama |
| `sw.js` | Pekerja layanan, membuat aplikasi tetap terbuka tanpa jaringan |
| `ikon/` | Ikon aplikasi 192 px, 512 px, dan maskable |
| `uji/uji.js` | Pengujian otomatis |
| `.github/workflows/` | Alur kerja: menguji lalu menerbitkan |
| `.nojekyll` | Mencegah GitHub Pages mengabaikan berkas tertentu |

## Modul

**Beranda** — fokus hari ini, hal yang perlu perhatian, kalender bulanan,
statistik, pencarian ke seluruh modul, pengingat, rekap bulanan, cadangan data.

**Rutinitas** — daftar pagi, tugas harian, catatan perintah lisan, daftar sore,
tinjauan mingguan, tugas rutin yang muncul sendiri.

**Laporan** — penyusun laporan rehab beserta dokumentasi foto, riwayat per
tanggal, ekspor teks WhatsApp, JPG, dan PDF.

**Kantor** dan **Pribadi** — entri berkategori dan sub-kategori, tenggat,
nominal dengan perhitungan saldo, lampiran foto dan berkas, ekspor PDF, kirim ke
kalender ponsel.

**Catatan** — catatan bebas per tanggal, arsip yang bisa dicari, lampiran foto
dan berkas, ekspor PDF.

---

## Menyiapkan di GitHub

1. Buat repositori baru, lalu unggah seluruh isi map ini.
2. Buka **Settings → Pages**.
3. Pada **Source**, pilih **GitHub Actions**.
4. Dorong perubahan ke cabang `main`. Alur kerja akan menguji lebih dulu, dan
   hanya menerbitkan bila seluruh pengujian lulus.
5. Alamatnya muncul di ringkasan alur kerja, berbentuk
   `https://<nama-pengguna>.github.io/<nama-repositori>/`

### Memasang di ponsel

Buka alamat itu di Chrome, lalu pilih **Pasang aplikasi** atau **Tambahkan ke
Layar Utama**. Aplikasi akan muncul dengan ikonnya sendiri, terbuka layar penuh
tanpa bilah alamat, dan tetap bisa dibuka tanpa sinyal.

Berbeda dengan berkas yang dibuka langsung dari penyimpanan, cara ini membuat
Android memperlakukannya sebagai aplikasi sungguhan.

---

## Menjalankan pengujian sendiri

```bash
npm install
npm run uji
```

Pengujian memeriksa 110 butir: sintaks tiap modul, pemuatan tanpa galat,
kontras mode gelap, kalender, statistik, pencarian, penyimpanan per tanggal,
serta keutuhan cadangan — termasuk mencoba merusak berkas cadangan satu bita
untuk memastikan kerusakannya benar-benar terdeteksi.

Alur kerja GitHub menjalankan pengujian yang sama pada setiap perubahan.
Bila ada yang gagal, penerbitan dibatalkan.

---

## Yang tidak bisa diuji otomatis

Pengujian ini berjalan di lingkungan tanpa layar sentuh dan tanpa perangkat
keras ponsel. Butir berikut tetap harus dicoba langsung sebelum dijadikan APK:

- [ ] Kamera — foto dapat diambil dari dalam aplikasi
- [ ] Galeri — foto dapat dipilih dari penyimpanan
- [ ] Lampiran — PDF, Word, dan Excel dapat dipilih
- [ ] Papan ketik tidak menutupi kolom isian
- [ ] Tombol kembali menutup panel dulu sebelum keluar
- [ ] Ekspor PDF dan JSON tersimpan ke lokasi pilihan
- [ ] Cadangan `.rtns` dapat dibuat lalu dipulihkan di perangkat sungguhan
- [ ] Data tetap ada setelah aplikasi ditutup dan dibuka kembali
- [ ] Layar kecil — tidak ada elemen yang melewati batas
- [ ] Perpindahan halaman tidak tersendat
- [ ] APK dapat dipasang dan memperbarui versi sebelumnya

---

## Cadangan data

Data pemakai **tidak** ikut tersimpan di repositori ini. Aplikasi menyimpannya di
`localStorage` dan `IndexedDB` pada perangkat masing-masing.

Cadangkan lewat **Beranda → Alat & pengelolaan → Cadangkan semua sekarang**.
Hasilnya satu berkas `.rtns` berisi seluruh catatan, entri, laporan, foto, dan
lampiran, lengkap dengan checksum per berkas.

Simpan salinannya di luar ponsel. Cadangan yang tersimpan di perangkat yang sama
tidak menolong bila perangkatnya hilang.
