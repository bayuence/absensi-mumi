"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import RekapPresensi from "./RekapPresensi";
import KelolaIzin from "./KelolaIzin";
import moment from "moment";
import "moment/locale/id";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AbsensiData {
  id: number;
  nama: string;
  username: string;
  tanggal: string;
  created_at: string;
  foto_profil?: string;
  asal?: string;
  jabatan?: string;
  status: string;
}

export default function KelolaPresensiPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [absensiList, setAbsensiList] = useState<AbsensiData[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const currentUser = localStorage.getItem("user");
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const user = JSON.parse(currentUser);
      const { data } = await supabase
        .from("users")
        .select("is_admin")
        .eq("username", user.username)
        .single();
      
      if (!data?.is_admin) {
        alert("Anda tidak memiliki akses ke halaman ini!");
        router.push("/dashboard");
        return;
      }
    };

    checkAdminAccess();
  }, [router]);

  useEffect(() => {
    fetchAbsensi();
  }, [selectedDate]);

  const fetchAbsensi = async () => {
    setLoading(true);
    try {
      // Get absensi data (only HADIR status for this page)
      const { data: absensiData, error: absensiError } = await supabase
        .from("absensi")
        .select("*")
        .eq("tanggal", selectedDate)
        .eq("status", "HADIR")
        .order("created_at", { ascending: false });

      if (absensiError) {
        console.error("Error fetching absensi:", absensiError);
        setAbsensiList([]);
        setLoading(false);
        return;
      }

      // If no data, just set empty list
      if (!absensiData || absensiData.length === 0) {
        setAbsensiList([]);
        setLoading(false);
        return;
      }

      // Then, fetch user data for each absensi
      const transformedData = await Promise.all(
        absensiData.map(async (item: any) => {
          try {
            const { data: userData } = await supabase
              .from("users")
              .select("asal, jabatan, foto_profil")
              .eq("username", item.username)
              .single();

            return {
              id: item.id,
              nama: item.nama,
              username: item.username,
              tanggal: item.tanggal,
              created_at: item.created_at,
              foto_profil: userData?.foto_profil || item.foto_profil,
              asal: userData?.asal || "-",
              jabatan: userData?.jabatan || "-",
              status: item.status
            };
          } catch (userErr) {
            // If user data fetch fails, still return absensi data
            return {
              id: item.id,
              nama: item.nama,
              username: item.username,
              tanggal: item.tanggal,
              created_at: item.created_at,
              foto_profil: item.foto_profil,
              asal: "-",
              jabatan: "-",
              status: item.status
            };
          }
        })
      );

      setAbsensiList(transformedData);
    } catch (err) {
      console.error("Error fetching absensi:", err);
      setAbsensiList([]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data kehadiran ini?")) return;
    
    setDeleting(id);
    const { error } = await supabase
      .from("absensi")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal menghapus kehadiran: " + error.message);
    } else {
      alert("Data kehadiran berhasil dihapus!");
      fetchAbsensi();
    }
    setDeleting(null);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Kembali ke Admin</span>
            </button>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
              ✅ Kelola Kehadiran
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">Kelola dan hapus data kehadiran</p>
          </div>

          {/* Stats & Date Selector Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Kehadiran Hari Ini</p>
                  <p className="text-2xl font-bold text-slate-800">{absensiList.length}</p>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  📅 Pilih Tanggal
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-auto p-3 border-2 border-slate-200 rounded-xl bg-white/70 text-slate-900 text-sm focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Presensi List Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>👥</span> Daftar Kehadiran
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Memuat data kehadiran...</p>
              </div>
            ) : absensiList.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-slate-500 text-lg">Belum ada data kehadiran</p>
                <p className="text-slate-400 text-sm mt-2">untuk tanggal {moment(selectedDate).format("DD MMMM YYYY")}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {absensiList.map((absensi) => (
                  <div
                    key={absensi.id}
                    className="bg-gradient-to-r from-slate-50 to-white p-4 sm:p-6 rounded-xl border-2 border-slate-200 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
                          {absensi.foto_profil ? (
                            <img
                              src={absensi.foto_profil}
                              alt={absensi.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{absensi.nama.charAt(0).toUpperCase()}</span>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                            {absensi.nama.toUpperCase()}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 truncate">@{absensi.username}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {absensi.asal && absensi.asal !== "-" && (
                              <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                📍 {absensi.asal}
                              </span>
                            )}
                            {absensi.jabatan && absensi.jabatan !== "-" && (
                              <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                🎓 {absensi.jabatan}
                              </span>
                            )}
                            <span className="text-[10px] sm:text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              🕐 {moment(absensi.created_at).format("HH:mm")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(absensi.id)}
                        disabled={deleting === absensi.id}
                        className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting === absensi.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Menghapus...</span>
                          </>
                        ) : (
                          <>
                            <span>🗑️</span>
                            <span>Hapus</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Notice */}
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-blue-400 text-xl flex-shrink-0">ℹ️</div>
              <div>
                <h3 className="text-blue-800 font-semibold mb-1">Informasi</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Data kehadiran ditampilkan berdasarkan tanggal yang dipilih</li>
                  <li>• Penghapusan data bersifat permanen dan tidak dapat dibatalkan</li>
                  <li>• Pastikan untuk memverifikasi data sebelum menghapus</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Daftar Izin */}
          <KelolaIzin />

          {/* Rekap Kehadiran Bulanan */}
          <RekapPresensi />

        </div>
      </main>
    </>
  );
}
