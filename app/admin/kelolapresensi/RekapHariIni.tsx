"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import moment from "moment";
import "moment/locale/id";
import { exportRekapHariIniToPDF } from "./exportPDFRekapHariIni";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserRecap {
  username: string;
  nama: string;
  asal?: string;
  status?: string;
  keterangan_status?: string;
  foto_profil?: string;
  status_presensi: "HADIR" | "IZIN" | "TIDAK_HADIR";
  waktu_presensi?: string;
  keterangan_izin?: string;
}

export default function RekapHariIni() {
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [rekapData, setRekapData] = useState<UserRecap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    hadir: 0,
    izin: 0,
    tidakHadir: 0
  });

  // Fetch data setiap kali selectedDate berubah
  useEffect(() => {
    fetchRekapHariIni();
  }, [selectedDate]);

  const fetchRekapHariIni = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get semua users (non-admin)
      const { data: allUsers, error: usersError } = await supabase
        .from("users")
        .select("username, nama, asal, status, keterangan, foto_profil")
        .eq("is_admin", false);

      if (usersError) {
        console.error("Error fetching users - Details:", usersError);
        setError(`Gagal mengambil data karyawan: ${usersError.message}`);
        setRekapData([]);
        setLoading(false);
        return;
      }

      if (!allUsers || allUsers.length === 0) {
        console.warn("Tidak ada data karyawan ditemukan");
        setRekapData([]);
        setStats({ total: 0, hadir: 0, izin: 0, tidakHadir: 0 });
        setLoading(false);
        return;
      }

      console.log(`✅ Berhasil fetch ${allUsers.length} karyawan`);

      // 2. Get semua presensi untuk tanggal terpilih
      const { data: absensiData, error: absensiError } = await supabase
        .from("absensi")
        .select("username, status, created_at")
        .eq("tanggal", selectedDate);

      if (absensiError) {
        console.error("Error fetching absensi:", absensiError);
      }

      console.log(`✅ Berhasil fetch ${absensiData?.length || 0} presensi untuk ${selectedDate}`);

      // 3. Get semua izin (status IZIN) untuk tanggal terpilih dari tabel absensi
      const { data: izinData, error: izinError } = await supabase
        .from("absensi")
        .select("username, keterangan")
        .eq("tanggal", selectedDate)
        .eq("status", "IZIN");

      if (izinError) {
        console.error("Error fetching izin:", izinError.message || izinError);
      }

      console.log(`✅ Berhasil fetch ${izinData?.length || 0} izin untuk ${selectedDate}`);

      // 4. Map semua data karyawan dengan status mereka
      const rekapArray: UserRecap[] = allUsers.map((user: any) => {
        // Cek apakah presensi hari ini (HADIR)
        const presensi = absensiData?.find(
          (abs: any) => abs.username === user.username && abs.status === "HADIR"
        );

        // Cek apakah ada izin untuk hari ini
        const izin = izinData?.find(
          (i: any) => i.username === user.username
        );

        let status_presensi: "HADIR" | "IZIN" | "TIDAK_HADIR" = "TIDAK_HADIR";
        let waktu_presensi = "";
        let keterangan_izin = "";

        if (presensi && presensi.status === "HADIR") {
          status_presensi = "HADIR";
          waktu_presensi = moment(presensi.created_at).format("HH:mm:ss");
        } else if (izin) {
          status_presensi = "IZIN";
          keterangan_izin = izin.keterangan || "-";
        }

        return {
          username: user.username,
          nama: user.nama,
          asal: user.asal || "-",
          status: user.status || "-",
          keterangan_status: user.keterangan || "-",
          foto_profil: user.foto_profil,
          status_presensi,
          waktu_presensi,
          keterangan_izin
        };
      });

      // 5. Update stats
      const hitung = {
        total: rekapArray.length,
        hadir: rekapArray.filter((r) => r.status_presensi === "HADIR").length,
        izin: rekapArray.filter((r) => r.status_presensi === "IZIN").length,
        tidakHadir: rekapArray.filter((r) => r.status_presensi === "TIDAK_HADIR").length
      };

      // Sort berdasarkan nama A-Z
      rekapArray.sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));

      console.log("📊 Stats:", hitung);
      setStats(hitung);
      setRekapData(rekapArray);
    } catch (err: any) {
      console.error("Unexpected error fetching recap:", err);
      setError(`Error: ${err.message || "Terjadi kesalahan yang tidak diketahui"}`);
      setRekapData([]);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HADIR":
        return "bg-green-100 text-green-700 border-green-300";
      case "IZIN":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "TIDAK_HADIR":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "HADIR":
        return "✅";
      case "IZIN":
        return "⏸️";
      case "TIDAK_HADIR":
        return "";
      default:
        return "❓";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "HADIR":
        return "HADIR";
      case "IZIN":
        return "IZIN";
      case "TIDAK_HADIR":
        return "TIDAK HADIR";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 md:p-8 mt-6">
      <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span>📋</span> Rekap Presensi Hari Ini (Real-time)
      </h2>

      {/* Date Selector */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            📅 Pilih Tanggal
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              console.log("📅 Tanggal berubah ke:", e.target.value);
              setSelectedDate(e.target.value);
            }}
            className="w-full sm:w-auto p-3 border-2 border-slate-200 rounded-xl bg-white/70 text-slate-900 text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 cursor-pointer"
          />
        </div>
        <div className="text-sm text-slate-600 font-medium mt-2 sm:mt-0">
          📆 {moment(selectedDate).format("dddd, DD MMMM YYYY")}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3">
          <div className="text-xl">⚠️</div>
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-blue-700">{stats.total}</div>
          <div className="text-xs sm:text-sm text-blue-600 font-medium mt-1">Total Karyawan</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-green-700">{stats.hadir}</div>
          <div className="text-xs sm:text-sm text-green-600 font-medium mt-1">Hadir</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-yellow-700">{stats.izin}</div>
          <div className="text-xs sm:text-sm text-yellow-600 font-medium mt-1">Izin</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-red-700">{stats.tidakHadir}</div>
          <div className="text-xs sm:text-sm text-red-600 font-medium mt-1">Tidak Hadir</div>
        </div>
      </div>

      {/* Export Button */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => exportRekapHariIniToPDF(rekapData, selectedDate, stats)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <span>📄</span> Export ke PDF
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat rekap untuk {moment(selectedDate).format("DD MMMM YYYY")}...</p>
        </div>
      ) : rekapData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-slate-500 text-lg">Belum ada data karyawan</p>
          <p className="text-slate-400 text-sm mt-2">untuk tanggal {moment(selectedDate).format("DD MMMM YYYY")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-300">
                <th className="px-4 py-3 text-left font-bold text-slate-700">No</th>
                <th className="px-4 py-3 text-left font-bold text-slate-700">Nama</th>
                <th className="px-4 py-3 text-left font-bold text-slate-700">Asal / Status</th>
                <th className="px-4 py-3 text-center font-bold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-bold text-slate-700">Waktu / Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {rekapData.map((user, index) => (
                <tr
                  key={user.username}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-600 font-medium">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                        {user.foto_profil ? (
                          <img
                            src={user.foto_profil}
                            alt={user.nama}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{user.nama.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 uppercase">{user.nama}</div>
                        <div className="text-xs text-slate-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="text-slate-700">{user.asal}</div>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div>
                          <span className="font-semibold text-slate-700">{user.status}</span>
                          {user.keterangan_status && user.keterangan_status !== "-" && (
                            <span className="text-slate-600"> • {user.keterangan_status}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full font-bold border-2 ${getStatusColor(user.status_presensi)}`}>
                      {getStatusIcon(user.status_presensi)} {getStatusLabel(user.status_presensi)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.status_presensi === "HADIR" ? (
                      <div className="text-green-700 font-medium">🕐 {user.waktu_presensi}</div>
                    ) : user.status_presensi === "IZIN" ? (
                      <div className="text-yellow-700 text-sm">
                        <div className="font-medium">{user.keterangan_izin}</div>
                      </div>
                    ) : (
                      <div className="text-red-700 font-medium">-</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 text-xl flex-shrink-0">ℹ️</div>
          <div>
            <h3 className="text-blue-800 font-semibold mb-1">Cara Membaca Rekap</h3>
            <ul className="text-blue-700 text-xs sm:text-sm space-y-1">
              <li>• <span className="font-bold">✅ Hadir</span>: Karyawan sudah melakukan presensi</li>
              <li>• <span className="font-bold">⏸️ Izin</span>: Karyawan memiliki surat izin yang sudah diapprove</li>
              <li>• <span className="font-bold">❌ Tidak Hadir</span>: Karyawan belum presensi dan tidak ada izin</li>
              <li>• <span className="font-bold">🔄 Real-time</span>: Data di-update otomatis saat ada perubahan</li>
              <li>• <span className="font-bold">📅 Fleksibel</span>: Pilih tanggal apa pun untuk melihat rekap hari tersebut</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
