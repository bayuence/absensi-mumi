"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import moment from "moment";
import "moment/locale/id";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface JadwalGuru {
  id: number;
  tanggal: string;
  guru: string;
  kode_absensi: string;
}

interface GroupedJadwal {
  [key: string]: {
    [kode: string]: JadwalGuru[];
  };
}

export default function JadwalGuruPage() {
  const router = useRouter();
  const [jadwalList, setJadwalList] = useState<JadwalGuru[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

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
    fetchJadwal();
  }, [router]);

  const fetchJadwal = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jadwal_guru")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) {
      console.error("Error fetching jadwal:", error);
    } else {
      setJadwalList(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus jadwal ini?")) return;
    
    setDeleting(id);
    const { error } = await supabase
      .from("jadwal_guru")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal menghapus jadwal: " + error.message);
    } else {
      alert("Jadwal berhasil dihapus!");
      fetchJadwal();
    }
    setDeleting(null);
  };

  const handleDeleteByCode = async (kode: string, tanggal: string) => {
    if (!confirm(`Yakin ingin menghapus semua jadwal dengan kode ${kode} pada tanggal ${moment(tanggal).format("DD MMMM YYYY")}?`)) return;
    
    const { error } = await supabase
      .from("jadwal_guru")
      .delete()
      .eq("kode_absensi", kode)
      .eq("tanggal", tanggal);

    if (error) {
      alert("Gagal menghapus jadwal: " + error.message);
    } else {
      alert("Semua jadwal berhasil dihapus!");
      fetchJadwal();
    }
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // Group jadwal by date and code
  const groupedJadwal: GroupedJadwal = jadwalList.reduce((acc, jadwal) => {
    if (!acc[jadwal.tanggal]) {
      acc[jadwal.tanggal] = {};
    }
    if (!acc[jadwal.tanggal][jadwal.kode_absensi]) {
      acc[jadwal.tanggal][jadwal.kode_absensi] = [];
    }
    acc[jadwal.tanggal][jadwal.kode_absensi].push(jadwal);
    return acc;
  }, {} as GroupedJadwal);

  // Sort guru names alphabetically within each code
  Object.keys(groupedJadwal).forEach(tanggal => {
    Object.keys(groupedJadwal[tanggal]).forEach(kode => {
      groupedJadwal[tanggal][kode].sort((a, b) => a.guru.localeCompare(b.guru));
    });
  });

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
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              📅 Jadwal Guru
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">Lihat dan kelola jadwal guru yang telah dibuat</p>
          </div>

          {/* Stats Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 sm:p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Jadwal Aktif</p>
                <p className="text-2xl font-bold text-slate-800">{jadwalList.length}</p>
              </div>
            </div>
          </div>

          {/* Jadwal List Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📋</span> Daftar Jadwal
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Memuat jadwal...</p>
              </div>
            ) : jadwalList.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-slate-500 text-lg">Belum ada jadwal dibuat</p>
                <p className="text-slate-400 text-sm mt-2">Buat jadwal baru melalui menu Buat Jadwal</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(groupedJadwal).map((tanggal) => (
                  <div key={tanggal} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                    {/* Date Header */}
                    <button
                      onClick={() => toggleDate(tanggal)}
                      className="w-full bg-gradient-to-r from-green-50 to-emerald-50 p-4 flex items-center justify-between hover:from-green-100 hover:to-emerald-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                          📅
                        </div>
                        <div className="text-left">
                          <h3 className="text-base sm:text-lg font-bold text-slate-800">
                            {moment(tanggal).format("dddd, DD MMMM YYYY")}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600">
                            {Object.keys(groupedJadwal[tanggal]).length} kode absensi
                          </p>
                        </div>
                      </div>
                      <svg
                        className={`w-6 h-6 text-slate-600 transition-transform ${expandedDates.has(tanggal) ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded Content */}
                    {expandedDates.has(tanggal) && (
                      <div className="p-4 space-y-4 bg-white">
                        {Object.keys(groupedJadwal[tanggal]).map((kode) => (
                          <div key={kode} className="border border-slate-200 rounded-lg p-4">
                            {/* Code Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-200">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🎟️</span>
                                <span className="font-mono font-bold text-lg text-green-600">{kode}</span>
                                <span className="text-xs text-slate-500">
                                  ({groupedJadwal[tanggal][kode].length} guru)
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteByCode(kode, tanggal)}
                                className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2"
                              >
                                <span>🗑️</span>
                                <span>Hapus Semua</span>
                              </button>
                            </div>

                            {/* Guru List */}
                            <div className="space-y-2">
                              {groupedJadwal[tanggal][kode].map((jadwal) => (
                                <div
                                  key={jadwal.id}
                                  className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">👨‍🏫</span>
                                    <span className="font-medium text-slate-800">{jadwal.guru.toUpperCase()}</span>
                                  </div>
                                  <button
                                    onClick={() => handleDelete(jadwal.id)}
                                    disabled={deleting === jadwal.id}
                                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                                  >
                                    {deleting === jadwal.id ? "..." : "Hapus"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Notice */}
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-yellow-400 text-xl flex-shrink-0">⚠️</div>
              <div>
                <h3 className="text-yellow-800 font-semibold mb-1">Perhatian</h3>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Penghapusan jadwal bersifat permanen</li>
                  <li>• Menghapus jadwal dengan "Hapus Semua" akan menghapus semua guru dalam kode tersebut</li>
                  <li>• Pastikan untuk memverifikasi sebelum menghapus</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
