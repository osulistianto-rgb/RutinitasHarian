from pathlib import Path
import sys,re,base64

PHASE=(sys.argv[1] if len(sys.argv)>1 else 'index').strip().lower()


def patch_index():
    p=Path('index.html')
    src=p.read_text(encoding='utf-8')

    pm=re.search(r"const PUSTAKA_BERSAMA=decode\('([^']+)'\)",src)
    if not pm:
        raise SystemExit('PUSTAKA_BERSAMA tidak ditemukan')
    shared=base64.b64decode(pm.group(1)).decode('utf-8')

    old="""const PengingatNative = (function(){
  function tersedia(){ return typeof window.AndroidNotif !== 'undefined'; }
  function jadwalkan(id, judul, pesan, waktuMs){
    if(!tersedia() || !id || !waktuMs || waktuMs<=Date.now()) return false;
    try{ window.AndroidNotif.jadwalkan(String(id), String(judul||''), String(pesan||''), waktuMs); return true; }
    catch(e){ return false; }
  }
  function batalkan(id){
    if(!tersedia() || !id) return false;
    try{ window.AndroidNotif.batalkan(String(id)); return true; }catch(e){ return false; }
  }
  function bisaPresisi(){
    if(!tersedia()) return true;
    try{ return !!window.AndroidNotif.bisaPresisi(); }catch(e){ return true; }
  }
  function bukaPengaturanAlarm(){
    if(!tersedia()) return;
    try{ window.AndroidNotif.bukaPengaturanAlarm(); }catch(e){}
  }
  return {tersedia, jadwalkan, batalkan, bisaPresisi, bukaPengaturanAlarm};
})();"""
    new="""const PengingatNative = (function(){
  function tersedia(){ return typeof window.AndroidNotif !== 'undefined'; }
  function jadwalkan(id, judul, pesan, waktuMs){
    if(!tersedia() || !id || !waktuMs || waktuMs<=Date.now()) return false;
    try{ window.AndroidNotif.jadwalkan(String(id), String(judul||''), String(pesan||''), Number(waktuMs)); return true; }
    catch(e){ return false; }
  }
  function batalkan(id){
    if(!tersedia() || !id) return false;
    try{ window.AndroidNotif.batalkan(String(id)); return true; }catch(e){ return false; }
  }
  function bisaPresisi(){
    if(!tersedia()) return true;
    try{ return !!window.AndroidNotif.bisaPresisi(); }catch(e){ return true; }
  }
  function bukaPengaturanAlarm(){
    if(!tersedia()) return false;
    try{ window.AndroidNotif.bukaPengaturanAlarm(); return true; }catch(e){ return false; }
  }
  function ujiSekarang(){
    if(!tersedia()) return false;
    try{ window.AndroidNotif.ujiSekarang('Rutinitas+','Notifikasi native bekerja.'); return true; }catch(e){ return false; }
  }
  function status(){
    if(!tersedia()) return 'BROWSER';
    try{ return String(window.AndroidNotif.statusNotifikasi()); }catch(e){ return 'BRIDGE_ERROR'; }
  }
  function bukaPengaturanNotifikasi(){
    if(!tersedia()) return false;
    try{ window.AndroidNotif.bukaPengaturanNotifikasi(); return true; }catch(e){ return false; }
  }
  return {tersedia, jadwalkan, batalkan, bisaPresisi, bukaPengaturanAlarm, ujiSekarang, status, bukaPengaturanNotifikasi};
})();"""
    if old in shared:
        shared=shared.replace(old,new,1)
    elif 'function ujiSekarang()' not in shared:
        raise SystemExit('Wrapper PengingatNative tidak cocok')

    src=src[:pm.start(1)]+base64.b64encode(shared.encode('utf-8')).decode('ascii')+src[pm.end(1):]

    mh=re.search(r"beranda:pasangPustaka\(decode\('([^']+)'\)\)",src)
    if not mh:
        raise SystemExit('Modul Beranda tidak ditemukan')
    home=base64.b64decode(mh.group(1)).decode('utf-8')

    st=home.find('function sinkronPengingatNative(){')
    en=home.find('\nfunction gambarBeranda(){',st)
    if st<0 or en<0:
        raise SystemExit('sinkronPengingatNative tidak ditemukan')

    sync=r"""function sinkronPengingatNative(){
  if(!PengingatNative.tersedia()) return {ok:false,jumlah:0};
  const kini=Date.now();
  const aktifId=new Set();
  let jumlah=0;
  const pasang=(id,judul,pesan,waktu)=>{
    if(!id||!waktu||waktu<=kini)return;
    id=String(id); aktifId.add(id);
    if(PengingatNative.jadwalkan(id,judul,pesan,waktu)) jumlah++;
  };

  (baca('pengingat')||[]).filter(p=>p&&p.aktif&&p.jam).forEach(p=>{
    const jm=String(p.jam).split(':').map(Number);
    if(jm.length<2||isNaN(jm[0])||isNaN(jm[1])) return;
    for(let tambah=0;tambah<8;tambah++){
      const cek=new Date(); cek.setDate(cek.getDate()+tambah); cek.setHours(jm[0],jm[1],0,0);
      const cocokHari=!p.hari||!p.hari.length||p.hari.indexOf(cek.getDay())>-1;
      if(cocokHari&&cek.getTime()>kini){
        pasang('png-'+p.id,p.judul||'Pengingat','Pengingat rutinitas',cek.getTime());
        break;
      }
    }
  });

  ambilKerja().filter(x=>x&&!x.beres&&x.tenggat).forEach(x=>{
    const t=new Date(x.tenggat+'T08:00:00');
    if(!isNaN(t.getTime())) pasang('tenggat-'+x.__asal+'-'+x.id,x.judul||'Tenggat',
      'Tenggat hari ini · '+(x.__label||x.__asal),t.getTime());
  });

  try{
    const dbAnak=JSON.parse(localStorage.getItem('rutinitasPlusAnak_v1')||'null');
    if(dbAnak){
      const jamB=(dbAnak.settings&&dbAnak.settings.jam)||'19:00';
      (dbAnak.tasks||[]).filter(t=>t&&t.status!=='Selesai'&&!t.manualArchived&&t.deadline).forEach(t=>{
        let waktu=null;
        if(t.ingat){ const w=new Date(t.ingat); if(!isNaN(w.getTime())&&w.getTime()>kini) waktu=w; }
        if(!waktu){ const w=new Date(t.deadline+'T'+jamB+':00'); if(!isNaN(w.getTime())) waktu=w; }
        if(waktu) pasang('anak-'+t.id,(t.subjek||'Belajar')+' — '+(t.judul||''),
          'Waktunya mendampingi belajar',waktu.getTime());
      });
    }
  }catch(e){}

  let lama=[];
  try{lama=JSON.parse(localStorage.getItem('native-alarm-ids')||'[]')||[];}catch(e){}
  lama.forEach(id=>{if(!aktifId.has(String(id)))PengingatNative.batalkan(String(id));});
  try{localStorage.setItem('native-alarm-ids',JSON.stringify(Array.from(aktifId)));}catch(e){}
  return {ok:true,jumlah};
}

let __timerSinkronNative=null;
function jadwalkanSinkronNative(){
  clearTimeout(__timerSinkronNative);
  __timerSinkronNative=setTimeout(()=>{try{sinkronPengingatNative();}catch(e){}},120);
}
"""
    home=home[:st]+sync+home[en:]

    guard="""  if(!window.__syncPengingatNatifSudah){
    window.__syncPengingatNatifSudah=true;
    try{ sinkronPengingatNative(); }catch(e){}
  }"""
    if guard in home:
        home=home.replace(guard,'  jadwalkanSinkronNative();',1)
    elif 'jadwalkanSinkronNative();' not in home:
        raise SystemExit('Guard sinkron Beranda tidak cocok')

    ui_old="""  h+='<button class=\"buka\" id=\"tambahPng\">+ Pengingat baru</button>'+\n    (png.length?'<button class=\"buka\" id=\"bIcsPng\" style=\"margin-top:6px\">Salin pengingat ke Kalender HP</button>':'')+\n    '</div>';"""
    ui_new="""  h+='<button class=\"buka\" id=\"tambahPng\">+ Pengingat baru</button>'+\n    (png.length?'<button class=\"buka\" id=\"bIcsPng\" style=\"margin-top:6px\">Salin pengingat ke Kalender HP</button>':'')+\n    (PengingatNative.tersedia()?'<button class=\"buka\" id=\"bTesNotif\" style=\"margin-top:6px\">🔔 Tes Notifikasi Sekarang</button>'+\n      '<button class=\"buka\" id=\"bIzinNotif\" style=\"margin-top:6px\">⚙️ Pengaturan Notifikasi Android</button>'+\n      (!PengingatNative.bisaPresisi()?'<button class=\"buka\" id=\"bAlarmPresisi\" style=\"margin-top:6px\">⏰ Aktifkan Alarm Presisi</button>':'')+\n      '<div class=\"kosong\" id=\"statusNotif\" style=\"padding-top:8px\">Status native: '+esc(PengingatNative.status())+'</div>':'')+\n    '</div>';"""
    if ui_old in home:
        home=home.replace(ui_old,ui_new,1)
    elif 'id="bTesNotif"' not in home:
        raise SystemExit('Blok UI pengingat tidak cocok')

    h_old="""  const bp2=$('bIcsPng'); if(bp2) bp2.onclick=kirimIcsPengingat;"""
    h_new="""  const bp2=$('bIcsPng'); if(bp2) bp2.onclick=kirimIcsPengingat;
  const btnTesNotif=$('bTesNotif'); if(btnTesNotif) btnTesNotif.onclick=()=>{
    const st=PengingatNative.status();
    if(st.indexOf('IZIN_NOTIF=0')>-1){ toast('Izin notifikasi belum aktif. Buka Pengaturan Notifikasi Android.'); return; }
    if(PengingatNative.ujiSekarang()) toast('Tes notifikasi native dikirim sekarang.');
    else toast('Jembatan notifikasi native tidak tersedia.');
  };
  const btnIzinNotif=$('bIzinNotif'); if(btnIzinNotif) btnIzinNotif.onclick=()=>PengingatNative.bukaPengaturanNotifikasi();
  const btnAlarmPresisi=$('bAlarmPresisi'); if(btnAlarmPresisi) btnAlarmPresisi.onclick=()=>PengingatNative.bukaPengaturanAlarm();"""
    if h_old in home:
        home=home.replace(h_old,h_new,1)
    elif 'btnTesNotif' not in home:
        raise SystemExit('Handler pengingat tidak cocok')

    src=src[:mh.start(1)]+base64.b64encode(home.encode('utf-8')).decode('ascii')+src[mh.end(1):]
    src=src.replace('<title>Rutinitas+ v5.14.1</title>','<title>Rutinitas+ v5.15.1</title>',1)
    p.write_text(src,encoding='utf-8')
    print('index.html dipatch untuk notifikasi native v5.15.1')


def patch_java():
    p=Path('app/src/main/java/com/rutinitasplus/app/NotificationBridge.java')
    s=p.read_text(encoding='utf-8')
    if 'statusNotifikasi()' in s:
        print('NotificationBridge sudah dipatch')
        return
    marker='\n              /* true bila alarm presisi diizinkan sistem (selalu true di bawah Android 12) */'
    if marker not in s:
        raise SystemExit('Marker NotificationBridge tidak ditemukan')
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
    s=s.replace(marker,'\n'+methods+marker,1)
    p.write_text(s,encoding='utf-8')
    print('NotificationBridge dipatch: status, pengaturan, tes langsung')


if PHASE=='index': patch_index()
elif PHASE=='java': patch_java()
else: raise SystemExit('phase harus index atau java')
