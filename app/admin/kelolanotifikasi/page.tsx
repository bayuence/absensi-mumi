"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function KelolaNotifikasiPage() {
  const [newJadwal, setNewJadwal] = useState<any>(null);
  const [notifLog, setNotifLog] = useState<any[]>([]);

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
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-2xl font-bold mb-4 text-slate-800">Kelola Notifikasi</h1>
      <p className="text-lg text-slate-600 mb-6">
        {newJadwal
          ? <span className="text-green-600 font-semibold">Jadwal baru ditambahkan: <br />Tanggal <b>{newJadwal.tanggal}</b>, Guru <b>{newJadwal.guru}</b>, Kode <b>{newJadwal.kode_absensi}</b></span>
          : "Pantau notifikasi jadwal baru secara real-time di sini."
        }
      </p>
      {notifLog.length > 0 && (
        <div className="w-full max-w-md mx-auto mb-6">
          <h2 className="font-semibold mb-2 text-slate-700">Log Jadwal Baru:</h2>
          <ul className="text-left text-sm space-y-1">
            {notifLog.map((j, i) => (
              <li key={i} className="border-b border-slate-100 py-1">
                <span className="text-blue-700 font-bold">{j.tanggal}</span> - <span>{j.guru}</span> (<span className="text-xs text-slate-500">Kode: {j.kode_absensi}</span>)
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link href="/admin" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all">
        Kembali
      </Link>
    </div>
  );
}
