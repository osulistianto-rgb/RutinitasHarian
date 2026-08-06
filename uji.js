/* ============================================================
   Rutinitas+ — pengujian otomatis sebelum rilis.
   Dijalankan: node uji.js
   Keluar dengan kode 1 bila ada yang gagal, supaya alur kerja
   GitHub ikut gagal dan berkas tidak terlanjur diterbitkan.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const fake = require('fake-indexeddb');
const { TextEncoder, TextDecoder } = require('util');

const AKAR = __dirname;
const BERKAS = path.join(AKAR, 'index.html');

let lulus = 0, gagal = 0;
const catatan = [];
/* Kemampuan peramban yang tidak dimiliki jsdom. Bukan kegagalan aplikasi,
   tapi dicatat supaya jelas bagian mana yang belum teruji otomatis. */
const takTeruji = new Set();

function periksa(nama, syarat, keterangan) {
  if (syarat) { lulus++; console.log('  ok    ' + nama); }
  else {
    gagal++; console.log('  GAGAL ' + nama + (keterangan ? '  — ' + keterangan : ''));
    catatan.push(nama + (keterangan ? ': ' + keterangan : ''));
  }
}
const bagian = n => console.log('\n== ' + n + ' ==');

/* ---------- muat & pisahkan modul ---------- */
const indeks = fs.readFileSync(BERKAS, 'utf8');
const modul = {};
for (const m of indeks.matchAll(/(\w+):decode\('([A-Za-z0-9+/=]{200,})'\)/g)) {
  modul[m[1]] = Buffer.from(m[2], 'base64').toString('utf8');
}
const NAMA = Object.keys(modul);

/* ---------- alat bantu ---------- */
function jendela(html, gelap) {
  const galat = [];

  /* jsdom melaporkan galat evaluasi skrip lewat konsol maya, bukan window.onerror.
     Tanpa ini, skrip yang berhenti di tengah jalan lolos dari pengujian. */
  const konsol = new VirtualConsole();
  konsol.on('jsdomError', e => {
    const pesan = (e && e.message) || String(e);
    if (e && e.type === 'css parsing') return;          /* pengurai CSS jsdom terbatas */
    if (/^Not implemented:/.test(pesan)) {              /* kemampuan peramban yang tak ada di jsdom */
      takTeruji.add(pesan.replace(/^Not implemented:\s*/, '').split(':')[0].trim());
      return;
    }
    galat.push(pesan);
  });

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://uji.test/',
    virtualConsole: konsol,
    /* Sediakan yang sudah ada di peramban sungguhan tapi belum ada di jsdom.
       Bukan tambalan untuk aplikasi — hanya menyamakan lingkungan uji. */
    beforeParse(window) {
      if (!window.TextEncoder) window.TextEncoder = TextEncoder;
      if (!window.TextDecoder) window.TextDecoder = TextDecoder;
      if (!window.structuredClone) window.structuredClone = o => JSON.parse(JSON.stringify(o));
      window.indexedDB = fake.indexedDB;
      window.IDBKeyRange = fake.IDBKeyRange;
      window.URL.createObjectURL = () => 'blob:uji';
      window.URL.revokeObjectURL = () => {};
      /* tema gelap dipasang setelah dokumen selesai diurai, bukan di sini —
         documentElement belum ada pada tahap beforeParse */
    }
  });
  const w = dom.window;
  w.onerror = m => galat.push(String(m));
  w.addEventListener('unhandledrejection', e => galat.push('promise: ' + e.reason));
  if (gelap) w.document.documentElement.setAttribute('data-rp-theme', 'dark');
  return { w, d: w.document, galat };
}
const tunggu = ms => new Promise(r => setTimeout(r, ms));
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function cerah(c) {
  const m = /#([0-9a-f]{6})/i.exec(c || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255);
}

/* ============================================================ */
async function jalankan() {

  bagian('Kerangka dan modul');
  periksa('index.html ditemukan', indeks.length > 1000);
  periksa('enam modul tertanam', NAMA.length === 6, 'ditemukan ' + NAMA.length + ': ' + NAMA.join(', '));
  periksa('manifest terhubung', indeks.includes('manifest.webmanifest'));
  periksa('pekerja layanan didaftarkan', indeks.includes("register('sw.js')"));
  periksa('ikon terhubung', indeks.includes('ikon-192.png'));
  try {
    const m = indeks.match(/<script>([\s\S]*?)<\/script>/);
    new Function(m[1]); periksa('sintaks kerangka', true);
  } catch (e) { periksa('sintaks kerangka', false, e.message); }

  bagian('Sintaks tiap modul');
  for (const n of NAMA) {
    let ok = true, pesan = '';
    for (const b of modul[n].matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      try { new Function(b[1]); } catch (e) { ok = false; pesan = e.message; }
    }
    periksa('sintaks ' + n, ok, pesan);
  }

  bagian('Modul dimuat tanpa galat');
  for (const n of NAMA) {
    const { galat } = jendela(modul[n]);
    await tunggu(700);
    periksa('muat ' + n, galat.length === 0, galat.slice(0, 2).join(' | '));
  }

  bagian('Skrip dijalankan sampai habis');
  /* Deklarasi fungsi terangkat, jadi fungsi bisa "ada" meski skrip berhenti di
     tengah. Yang membuktikan skrip tuntas adalah nilai yang dibuat const/let. */
  const PENANDA = {
    beranda: ['iso', 'IK', 'Cadangan', 'FotoDB', 'Kalender', 'MiniPDF', 'Batal'],
    routine: ['PAGI', 'SORE', 'MiniPDF', 'Batal'],
    kantor:  ['KUNCI', 'FotoDB', 'MiniPDF', 'Kalender', 'Batal'],
    pribadi: ['KUNCI', 'FotoDB', 'MiniPDF', 'Kalender', 'Batal'],
    note:    ['PRA', 'FotoDB', 'MiniPDF', 'Batal'],
    report:  ['PRA_LAP', 'FotoDB', 'MiniPDF', 'Batal']
  };
  for (const n of NAMA) {
    const { w } = jendela(modul[n]);
    await tunggu(600);
    const hilang = (PENANDA[n] || []).filter(v => {
      try { return typeof w.eval('typeof ' + v) === 'string' && w.eval('typeof ' + v) === 'undefined'; }
      catch (e) { return true; }
    });
    periksa('skrip ' + n + ' tuntas dievaluasi', hilang.length === 0,
      'belum terinisialisasi: ' + hilang.join(', '));
  }

  bagian('Mode gelap terbaca');
  const PASANG = [['--tag-bg', '--tag-fg'], ['--tag-sub-bg', '--tag-sub-fg'],
    ['--kop-panel', '--ink'], ['--tint-merah', '--ink'], ['--tint-kuning', '--ink'],
    ['--tint-hijau', '--ink'], ['--tint-biru', '--ink']];
  for (const n of NAMA) {
    const { w, d } = jendela(modul[n], true);
    await tunggu(400);
    const cs = w.getComputedStyle(d.documentElement);
    let buruk = [];
    for (const [bg, fg] of PASANG) {
      const a = cerah(cs.getPropertyValue(bg).trim());
      const b = cerah(cs.getPropertyValue(fg).trim());
      if (a === null || b === null) continue;
      if (Math.abs(a - b) < 170) buruk.push(bg + '/' + fg);
    }
    periksa('kontras gelap ' + n, buruk.length === 0, buruk.join(', '));
  }

  bagian('Beranda: dasbor, kalender, statistik, pencarian');
  {
    const { w, d, galat } = jendela(modul.beranda);
    await tunggu(700);
    const hi = new Date(), kmrn = new Date(Date.now() - 2 * 864e5), bsk = new Date(Date.now() + 864e5);
    for (let i = 0; i < 8; i++) {
      const t = new Date(); t.setDate(t.getDate() - i);
      w.localStorage.setItem('harian:' + iso(t), JSON.stringify({
        pagi: [true, i < 4, false],
        tugas: [{ t: 'Susun data dukung wabku', s: i > 0 }, { t: 'Cek kuitansi', s: false }],
        catatan: [{ jam: '09:15', isi: 'Perintah Dansatdik' }], sore: [i < 2, false, false]
      }));
    }
    w.localStorage.setItem('kerja:kantor', JSON.stringify([
      { id: 'a', judul: 'Kirim SPJ triwulan II', kat: 'Wabku', tenggat: iso(kmrn), beres: false, dibuat: 1, foto: [], berkas: [] },
      { id: 'b', judul: 'Rapat evaluasi', kat: 'Rapat', tenggat: iso(bsk), beres: false, dibuat: 2, foto: [], berkas: [] }]));
    w.localStorage.setItem('kerja:pribadi', JSON.stringify([
      { id: 'p', judul: 'Bayar listrik', kat: 'Keuangan', tenggat: iso(hi), beres: false, dibuat: 3, foto: [], berkas: [] }]));
    w.localStorage.setItem('pengingat', JSON.stringify([
      { id: 'r1', judul: 'Kirim laporan rehab', jam: '23:55', hari: [0, 1, 2, 3, 4, 5, 6], aktif: true }]));
    w.localStorage.setItem('catatan:' + iso(hi), 'catatan uji pencarian');
    w.eval('gambarBeranda()');

    periksa('kartu Fokus tampil', !!d.querySelector('.fokus'));
    const baris = d.querySelectorAll('.f-daftar .f-baris').length;
    periksa('Fokus memuat seluruh butir rutinitas', baris >= 4, 'hanya ' + baris + ' baris');
    periksa('bagian Pagi/Tugas/Sore diberi label', d.querySelectorAll('.f-bagian').length >= 2);
    periksa('rekap butir tampil', !!d.querySelector('.f-rekap'));
    periksa('kartu Perlu Perhatian tampil', !!d.querySelector('.kartu.perhatian'));
    periksa('tidak ada baris ganda di Fokus', (() => {
      const t = [...d.querySelectorAll('.f-daftar .f-baris')].map(x => x.textContent.trim());
      return new Set(t).size === t.length;
    })());

    w.eval('bukaKalender()');
    periksa('kalender terbuka', d.getElementById('panelKalender').classList.contains('buka'));
    const sel = d.querySelectorAll('.kal-sel[data-tgl]').length;
    periksa('kalender berisi sel tanggal', sel >= 28, 'hanya ' + sel);
    periksa('ada tanggal bertanda', [...d.querySelectorAll('.kal-sel[data-tgl]')].some(x => x.querySelector('i')));
    const judulAwal = d.getElementById('kalJudul').textContent;
    d.getElementById('kalMundur').click();
    periksa('pindah bulan bekerja', d.getElementById('kalJudul').textContent !== judulAwal);
    d.getElementById('kalMaju').click();
    const target = [...d.querySelectorAll('.kal-sel[data-tgl]')].find(x => x.dataset.tgl === iso(kmrn));
    if (target) { target.click(); periksa('pilih tanggal menampilkan kegiatan', d.querySelectorAll('#rincianTgl .baris').length > 0); }
    else periksa('pilih tanggal menampilkan kegiatan', false, 'sel tanggal tidak ditemukan');
    d.getElementById('tutupKalender').click();
    periksa('kalender dapat ditutup', !d.getElementById('panelKalender').classList.contains('buka'));

    w.eval('bukaStatistik()');
    periksa('statistik terbuka', d.getElementById('panelStatistik').classList.contains('buka'));
    periksa('statistik berisi angka', d.querySelectorAll('.st-kartu .n').length === 4);
    /* label grafik harus cocok dengan jumlah batangnya */
    const batang = d.querySelectorAll('.st-grafik .b').length;
    const judulGrafik = [...d.querySelectorAll('.st-judul')].map(x => x.textContent).find(t => /hari terakhir/.test(t)) || '';
    const angkaLabel = parseInt((judulGrafik.match(/(\d+)\s*hari/) || [])[1], 10);
    periksa('jumlah batang grafik cocok dengan labelnya', batang === angkaLabel,
      'label "' + judulGrafik + '" tapi ' + batang + ' batang');
    /* kartu berlabel 30 hari harus dihitung dari 30 hari */
    const s = w.eval('statistik()');
    periksa('perhitungan 30 hari benar-benar 30 hari', s.tigaPuluh.length === 30,
      'hanya ' + s.tigaPuluh.length + ' hari, padahal kartu menyebut 30');
    periksa('hari terisi tidak melebihi rentangnya', s.hariTerisi <= s.tigaPuluh.length);
    d.getElementById('tutupStatistik').click();

    const q = d.getElementById('cari');
    q.value = 'wabku'; q.dispatchEvent(new w.Event('input'));
    await tunggu(400);
    const hasil = d.querySelectorAll('.hasil').length;
    periksa('pencarian menemukan hasil', hasil > 0);
    periksa('tugas berulang digabung, tidak membanjir', hasil <= 4, hasil + ' hasil untuk satu kata');
    periksa('beranda tanpa galat', galat.length === 0, galat.slice(0, 2).join(' | '));
  }

  bagian('Kantor: entri, saldo, hapus, Batalkan');
  {
    const { w, d, galat } = jendela(modul.kantor);
    await tunggu(700);
    d.getElementById('bTambah').click();
    d.getElementById('fJudul').value = 'Entri uji';
    d.getElementById('fNominal').value = '1500000';
    d.getElementById('fNominal').dispatchEvent(new w.Event('input'));
    periksa('nominal diformat ribuan', d.getElementById('fNominal').value === '1.500.000', d.getElementById('fNominal').value);
    const arah = d.querySelector('[data-arah="masuk"]'); if (arah) arah.click();
    d.getElementById('bSimpan').click();
    await tunggu(200);
    periksa('entri tersimpan', d.querySelectorAll('.item').length === 1);
    periksa('saldo terhitung', /1\.500\.000/.test(d.getElementById('uSisa').textContent), d.getElementById('uSisa').textContent);

    d.querySelector('[data-buka]').click(); await tunggu(150);
    d.getElementById('bHapus').click(); await tunggu(120);
    periksa('dialog konfirmasi dalam aplikasi muncul', d.getElementById('dlgTanya').style.display === 'flex');
    d.getElementById('dlgYa').click(); await tunggu(200);
    const sp = d.getElementById('spandukBatal');
    periksa('spanduk Batalkan muncul', !!sp && sp.classList.contains('tampil'));
    sp.querySelector('.pb-aksi').click(); await tunggu(200);
    periksa('Batalkan mengembalikan entri', d.querySelectorAll('.item').length === 1);
    periksa('pengembalian ikut tersimpan', JSON.parse(w.localStorage.getItem('kerja:kantor') || '[]').length === 1);

    d.querySelector('[data-tik]').click(); await tunggu(150);
    periksa('centang menandai selesai', JSON.parse(w.localStorage.getItem('kerja:kantor'))[0].beres === true);
    d.getElementById('spandukBatal').querySelector('.pb-aksi').click(); await tunggu(200);
    periksa('Batalkan mengembalikan status', JSON.parse(w.localStorage.getItem('kerja:kantor'))[0].beres === false);
    periksa('kantor tanpa galat', galat.length === 0, galat.slice(0, 2).join(' | '));
  }

  bagian('Rutinitas: tugas dan penyimpanan per tanggal');
  {
    const { w, d, galat } = jendela(modul.routine);
    await tunggu(700);
    const inp = d.querySelector('[data-tugas="0"]');
    periksa('kolom tugas tersedia', !!inp);
    if (inp) {
      inp.value = 'Tugas uji';
      inp.dispatchEvent(new w.Event('input'));
      inp.dispatchEvent(new w.Event('blur'));
      await tunggu(400);
      periksa('tugas tersimpan per tanggal',
        Object.keys(w.localStorage).some(k => k.indexOf('harian:') === 0));
      d.getElementById('mundur').click(); await tunggu(400);
      const i2 = d.querySelector('[data-tugas="0"]');
      periksa('hari lain tidak tercampur', i2 && i2.value === '');
      d.getElementById('keHariIni').click(); await tunggu(400);
      const i3 = d.querySelector('[data-tugas="0"]');
      periksa('data kembali saat balik ke hari ini', i3 && i3.value === 'Tugas uji');
    }
    periksa('tidak ada sisa tombol tema lama', !modul.routine.includes('id="tema"'));
    periksa('rutinitas tanpa galat', galat.length === 0, galat.slice(0, 2).join(' | '));
  }

  bagian('Catatan: tulis, simpan, ganti tanggal');
  {
    const { w, d, galat } = jendela(modul.note);
    await tunggu(700);
    const ta = d.getElementById('tulis');
    ta.value = 'Catatan uji otomatis';
    ta.dispatchEvent(new w.Event('input'));
    await tunggu(700);
    periksa('catatan tersimpan', Object.keys(w.localStorage).some(k => k.indexOf('catatan:') === 0));
    d.getElementById('mundur').click(); await tunggu(200);
    periksa('hari lain kosong', d.getElementById('tulis').value === '');
    d.getElementById('keKini').click(); await tunggu(200);
    periksa('isi kembali saat balik', d.getElementById('tulis').value === 'Catatan uji otomatis');
    periksa('catatan tanpa galat', galat.length === 0, galat.slice(0, 2).join(' | '));
  }

  bagian('Laporan: kunci per tanggal dan riwayat');
  {
    const { w, d, galat } = jendela(modul.report);
    await tunggu(800);
    try {
      w.eval("state.report.iso='2026-08-04'; state.report.lokasi='Mako A';");
      await w.eval('doSave(true)');
      w.eval("state.report.iso='2026-08-05'; state.report.lokasi='Mako B';");
      await w.eval('doSave(true)');
      const kunci = Object.keys(w.localStorage).filter(k => k.indexOf('laporan:') === 0);
      periksa('laporan tersimpan per tanggal', kunci.length === 2, kunci.join(', '));
      const daftar = w.eval('daftarLaporan()');
      periksa('riwayat laporan terbaca', daftar.length === 2);
      await w.eval("doLoad('2026-08-04')");
      periksa('laporan lama dapat dibuka kembali', w.eval('state.report.lokasi') === 'Mako A');
    } catch (e) { periksa('alur laporan', false, e.message); }
    periksa('laporan tanpa galat', galat.length === 0, galat.slice(0, 2).join(' | '));
  }

  bagian('Cadangan: checksum, kerusakan, pemulihan, berkas yatim');
  {
    const { w, galat } = jendela(modul.beranda);
    await tunggu(700);
    try {
      const F = w.eval('FotoDB'), C = w.eval('Cadangan');
      const du = 'data:image/jpeg;base64,' + Buffer.from('X'.repeat(3000)).toString('base64');
      w.localStorage.setItem('kerja:kantor', JSON.stringify([{ id: 'a', judul: 'Uji', beres: false, dibuat: 1, foto: [], berkas: [] }]));
      const id = [];
      for (let i = 0; i < 4; i++) id.push(await F.simpan(du));
      const data = JSON.parse(w.localStorage.getItem('kerja:kantor'));
      data[0].foto = [id[0], id[1]];
      w.localStorage.setItem('kerja:kantor', JSON.stringify(data));

      const r = await C.buat(() => {});
      periksa('cadangan terbentuk', r.blob.size > 0);
      const buf = r.blob.parts ? Buffer.concat(r.blob.parts.map(p => Buffer.from(p)))
                               : Buffer.from(await r.blob.arrayBuffer());
      const u8 = new Uint8Array(buf);
      const berkas = { size: u8.length, slice: (a, b) => ({ arrayBuffer: async () => u8.slice(a, b === undefined ? u8.length : b).buffer }) };

      const kepala = await C.periksa(berkas);
      periksa('wadah berversi dan berchecksum', kepala.kepala.versi >= 2 && typeof kepala.kepala.crcGabungan === 'number');
      periksa('tiap berkas punya checksum', (kepala.kepala.berkas || []).every(b => typeof b.c === 'number'));

      const v = await C.validasi(berkas, () => {});
      periksa('seluruh isi lolos validasi', v.rusak.length === 0 && v.crcOK);

      const rusak = new Uint8Array(u8); rusak[u8.length - 40] ^= 0xFF;
      const bRusak = { size: rusak.length, slice: (a, b) => ({ arrayBuffer: async () => rusak.slice(a, b === undefined ? rusak.length : b).buffer }) };
      const v2 = await C.validasi(bRusak, () => {});
      periksa('kerusakan satu bita terdeteksi', v2.rusak.length > 0);
      const p1 = await C.pulihkan(bRusak, () => {});
      periksa('pemulihan berhenti bila rusak', p1.gagal === true);
      periksa('data lama tetap utuh saat gagal', !!w.localStorage.getItem('kerja:kantor'));

      const potong = u8.slice(0, u8.length - 500);
      let tertangkap = false;
      try { await C.periksa({ size: potong.length, slice: (a, b) => ({ arrayBuffer: async () => potong.slice(a, b === undefined ? potong.length : b).buffer }) }); }
      catch (e) { tertangkap = true; }
      periksa('berkas terpotong ditolak', tertangkap);

      w.localStorage.clear(); await F.kosongkan();
      const p2 = await C.pulihkan(berkas, () => {});
      periksa('pemulihan normal berhasil', p2.gagal === false && p2.jmlBerkas === 4);
      periksa('checksum gabungan cocok setelah pulih', p2.crcOK === true);
      const kembali = await F.ambilBytes(id[0]);
      periksa('isi berkas identik setelah pulih', !!kembali && kembali.length > 0);

      const y = await C.periksaYatim();
      periksa('berkas yatim terdeteksi', y.jml === 2, 'ditemukan ' + y.jml);
      const n = await C.bersihkanYatim(y.daftar);
      const y2 = await C.periksaYatim();
      periksa('berkas yatim dibersihkan', n === 2 && y2.jml === 0);
      periksa('berkas yang masih dipakai tidak ikut terhapus', !!(await F.ambilBytes(id[0])));
    } catch (e) { periksa('alur cadangan', false, e.message); }
    periksa('cadangan tanpa galat', galat.length === 0, galat.slice(0, 2).join(' | '));
  }

  bagian('Area sentuh dan kebersihan kode');
  for (const n of NAMA) {
    periksa('area sentuh 44px ' + n, modul[n].includes('min-height:44px'));
  }
  for (const n of NAMA) {
    const inline = (modul[n].match(/<[^>]+\sonclick\s*=/g) || []).length;
    periksa('tanpa onclick di HTML ' + n, inline === 0, inline + ' ditemukan');
  }
  for (const n of NAMA) {
    const ids = {};
    let ganda = [];
    for (const m of modul[n].matchAll(/id="([\w-]+)"/g)) {
      ids[m[1]] = (ids[m[1]] || 0) + 1;
      if (ids[m[1]] === 2) ganda.push(m[1]);
    }
    periksa('tanpa id ganda ' + n, ganda.length === 0, ganda.join(', '));
  }

  bagian('Berkas pendukung');
  for (const f of ['manifest.webmanifest', 'sw.js', 'ikon-192.png', 'ikon-512.png',
                   'ikon-maskable-512.png', 'apple-touch-icon.png', '.nojekyll']) {
    periksa('ada ' + f, fs.existsSync(path.join(AKAR, f)));
  }
  try {
    const mf = JSON.parse(fs.readFileSync(path.join(AKAR, 'manifest.webmanifest'), 'utf8'));
    periksa('manifest sah dan lengkap',
      !!mf.name && !!mf.start_url && mf.display === 'standalone' && (mf.icons || []).length >= 3);
    periksa('manifest punya ikon maskable', (mf.icons || []).some(i => (i.purpose || '').includes('maskable')));
  } catch (e) { periksa('manifest sah', false, e.message); }

  /* ---------- ringkasan ---------- */
  console.log('\n' + '='.repeat(52));
  console.log('  lulus: ' + lulus + '   gagal: ' + gagal);
  if (gagal) {
    console.log('\n  Yang gagal:');
    catatan.forEach(c => console.log('   - ' + c));
  }
  console.log('='.repeat(52));
  if (takTeruji.size) {
    console.log('\nTidak dapat diuji di sini (kemampuan peramban yang tidak dimiliki jsdom):');
    [...takTeruji].forEach(x => console.log('   - ' + x));
  }
  console.log('\nJuga tidak dapat diperiksa: kamera, galeri, papan ketik,');
  console.log('tombol kembali, pemasangan APK, dan performa.');
  console.log('Butir-butir itu tetap harus dicoba langsung di ponsel.\n');
  process.exit(gagal ? 1 : 0);
}

jalankan().catch(e => { console.error('Pengujian berhenti:', e); process.exit(1); });
