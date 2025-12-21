"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";

export default function KelolaNotifikasiPage() {
  const [newJadwal, setNewJadwal] = useState<any>(null);
  const [notifLog, setNotifLog] = useState<any[]>([]);
  // Default icon for notification (same as login logo)
  const defaultIcon = "/logo-ldii.png";

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky header for mobile */}
      <header className="sticky top-0 z-10 bg-white shadow-sm py-3 px-4 flex items-center justify-between border-b">
        <h1 className="text-lg font-bold text-slate-800">Kelola Notifikasi</h1>
        <Link href="/admin" className="text-blue-500 text-base font-medium px-3 py-1 rounded-lg border border-blue-100 bg-blue-50 active:bg-blue-100">Kembali</Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-2 py-4 w-full max-w-md mx-auto">
        <div className="w-full mb-4">
          {newJadwal ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-2 text-green-700 text-sm shadow-sm">
              <span className="font-semibold">Jadwal baru ditambahkan:</span><br />
              <span>Tanggal <b>{newJadwal.tanggal}</b>, Guru <b>{newJadwal.guru}</b>, Kode <b>{newJadwal.kode_absensi}</b></span>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-100 p-3 text-slate-600 text-sm">Pantau notifikasi jadwal baru secara real-time di sini.</div>
          )}
        </div>

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

        {/* Admin notification form - mobile bottom sheet style */}
        <form
          className="fixed bottom-0 left-0 w-full max-w-md mx-auto bg-white border-t border-slate-200 shadow-lg p-4 flex flex-col gap-2 md:rounded-t-2xl z-20"
          style={{ boxShadow: '0 -2px 16px rgba(0,0,0,0.04)' }}
          onSubmit={async e => {
            e.preventDefault();
            const form = e.currentTarget;
            const title = (form.elements.namedItem('title') as HTMLInputElement).value;
            const body = (form.elements.namedItem('body') as HTMLTextAreaElement).value;
            const icon = defaultIcon;
              try {
              const res = await fetch('/api/push-broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body, icon })
              });
              if (res.ok) {
                alert('Notifikasi berhasil dikirim ke semua user!');
                form.reset();
              } else {
                alert('Gagal mengirim notifikasi.');
              }
            } catch (err) {
              alert('Gagal mengirim notifikasi.');
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
          <button type="submit" className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg text-base active:scale-95 transition-all">Kirim Notifikasi</button>
        </form>
      </main>
    </div>
  );
}
