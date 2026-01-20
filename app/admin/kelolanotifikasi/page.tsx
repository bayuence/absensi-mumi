"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

interface DeviceSubscription {
  username: string;
  device: string;
  created_at: string;
}

export default function KelolaNotifikasiPage() {
  const router = useRouter();
  const [newJadwal, setNewJadwal] = useState<any>(null);
  const [notifLog, setNotifLog] = useState<any[]>([]);
  const [devices, setDevices] = useState<DeviceSubscription[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  // Default icon for notification (same as login logo)
  const defaultIcon = "/logo-ldii.png";

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const res = await fetch('/api/push-subscriptions');
      const data = await res.json();
      if (data.success) {
        setDevices(data.subscriptions);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    const checkAdminAccess = async () => {
      const currentUser = localStorage.getItem("user");
      if (!currentUser) {
        router.push("/login");
        return;
      }

      let user;
      try {
        user = JSON.parse(currentUser);
      } catch (e) {
        router.push("/login");
        return;
      }

      if (!user || !user.username) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("is_admin")
        .eq("username", user.username.trim())
        .single();

      if (!data?.is_admin) {
        alert("Anda tidak memiliki akses ke halaman ini!");
        router.push("/dashboard");
        return;
      }
    };

    checkAdminAccess();
    fetchDevices();
  }, [router]);

  useEffect(() => {
    // Subscribe ke event INSERT pada tabel jadwal_guru
    const channel = supabase
      .channel('jadwal_guru-insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jadwal_guru' },
        (payload) => {
          setNewJadwal(payload.new);
          setNotifLog((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-72">
      {/* Sticky header for mobile */}
      <header className="sticky top-0 z-10 bg-white shadow-sm py-3 px-4 flex items-center justify-between border-b">
        <h1 className="text-lg font-bold text-slate-800">Kelola Notifikasi</h1>
        <Link href="/admin" className="text-blue-500 text-base font-medium px-3 py-1 rounded-lg border border-blue-100 bg-blue-50 active:bg-blue-100">Kembali</Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-2 py-4 w-full max-w-md mx-auto">
        {/* Device Stats */}
        <div className="w-full mb-4">
          <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Device Terdaftar</p>
                <p className="text-3xl font-bold">{devices.length}</p>
              </div>
              <div className="text-4xl">📱</div>
            </div>
            <button
              onClick={fetchDevices}
              className="mt-2 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Device List */}
        <div className="w-full mb-4">
          <h2 className="font-semibold mb-2 text-slate-700 text-base flex items-center gap-2">
            📋 Daftar Device Terdaftar
          </h2>
          {loadingDevices ? (
            <div className="text-center py-4 text-slate-500">Loading...</div>
          ) : devices.length === 0 ? (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-yellow-800 text-sm">
              <p className="font-semibold mb-1">⚠️ Belum ada device terdaftar</p>
              <p className="text-xs">User perlu login dan mengaktifkan notifikasi di browser/HP mereka untuk menerima notifikasi push.</p>
            </div>
          ) : (
            <ul className="text-left text-sm space-y-2 max-h-48 overflow-y-auto bg-white rounded-lg border border-slate-100 shadow-sm p-2">
              {devices.map((d, i) => (
                <li key={i} className="border-b border-slate-50 py-2 flex flex-col">
                  <span className="text-blue-700 font-bold">{d.username || 'Unknown'}</span>
                  <span className="text-xs text-slate-500 truncate">{d.device}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(d.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {newJadwal && (
          <div className="w-full mb-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-green-700 text-sm shadow-sm">
              <span className="font-semibold">Jadwal baru ditambahkan:</span><br />
              <span>Tanggal <b>{newJadwal.tanggal}</b>, Guru <b>{newJadwal.guru}</b>, Kode <b>{newJadwal.kode_absensi}</b></span>
            </div>
          </div>
        )}

        {notifLog.length > 0 && (
          <div className="w-full mb-4">
            <h2 className="font-semibold mb-2 text-slate-700 text-base">Log Jadwal Baru</h2>
            <ul className="text-left text-sm space-y-1 max-h-56 overflow-y-auto bg-white rounded-lg border border-slate-100 shadow-sm p-2">
              {notifLog.map((j, i) => (
                <li key={i} className="border-b border-slate-50 py-2 flex flex-col">
                  <span className="text-blue-700 font-bold">{j.tanggal}</span>
                  <span className="text-slate-700">{j.guru}</span>
                  <span className="text-xs text-slate-500">Kode: {j.kode_absensi}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Admin notification form - mobile bottom sheet style */}
      <form
        className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white border-t border-slate-200 shadow-lg p-4 flex flex-col gap-2 md:rounded-t-2xl z-20"
        style={{ boxShadow: '0 -2px 16px rgba(0,0,0,0.08)' }}
        onSubmit={async e => {
          e.preventDefault();
          const form = e.currentTarget;
          const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          const title = (form.elements.namedItem('title') as HTMLInputElement).value;
          const body = (form.elements.namedItem('body') as HTMLTextAreaElement).value;
          const icon = defaultIcon;

          // Disable button while sending
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Mengirim...';
          }

          try {
            const res = await fetch('/api/push-broadcast', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, body, icon, url: '/dashboard' })
            });
            const data = await res.json();

            if (res.ok && data.success) {
              if (data.sent === 0 && data.total === 0) {
                alert('⚠️ Tidak ada device yang terdaftar untuk menerima notifikasi.\n\nUser perlu login dan mengaktifkan notifikasi di browser/HP mereka.');
              } else {
                alert(`✅ Notifikasi berhasil dikirim!\n\n📱 Total device: ${data.total}\n✅ Berhasil: ${data.sent}\n❌ Gagal: ${data.failed}\n🗑️ Expired (dihapus): ${data.expired}`);
                form.reset();
                // Refresh device list after sending
                fetchDevices();
              }
            } else {
              alert('❌ Gagal mengirim notifikasi.\n\n' + (data.error || data.message || 'Unknown error'));
            }
          } catch (err) {
            console.error('Error sending notification:', err);
            alert('❌ Gagal mengirim notifikasi. Periksa koneksi internet.');
          } finally {
            // Re-enable button
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Kirim Notifikasi';
            }
          }
        }}
      >
        <div className="w-full flex flex-col gap-1">
          <label htmlFor="notif-title" className="text-xs text-slate-600 font-medium">Judul Notifikasi</label>
          <input id="notif-title" name="title" type="text" required maxLength={60} placeholder="Contoh: Jadwal Baru!" className="rounded-lg border px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div className="w-full flex flex-col gap-1">
          <label htmlFor="notif-body" className="text-xs text-slate-600 font-medium">Isi Pesan</label>
          <textarea id="notif-body" name="body" required maxLength={200} placeholder="Isi pesan notifikasi..." className="rounded-lg border px-3 py-2 text-sm min-h-[48px] text-black focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        {/* Icon notification is set automatically */}
        <input type="hidden" name="icon" value={defaultIcon} />
        <div className="flex items-center gap-2 mt-1 mb-2">
          <img src={defaultIcon} alt="Logo" className="w-8 h-8 rounded-lg border bg-white" />
          <span className="text-xs text-slate-500">Icon notifikasi otomatis</span>
        </div>
        <button type="submit" className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg text-base active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Kirim Notifikasi</button>
      </form>
    </div>
  );
}

