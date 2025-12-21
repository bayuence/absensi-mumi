"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import moment from "moment";
import "moment/locale/id";



export default function RekapPresensi() {
  const [bulan, setBulan] = useState(new Date().getMonth());
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [rekap, setRekap] = useState<any[]>([]);
  const [loadingRekap, setLoadingRekap] = useState(false);

  const bulanNama = moment().month(bulan).format("MMMM");

  useEffect(() => {
    fetchRekap();
  }, [bulan, tahun]);

  const fetchRekap = async () => {
    setLoadingRekap(true);
    try {
      // Ambil semua user
      const { data: users } = await supabase
        .from("users")
        .select("*")
        .order("nama", { ascending: true });

      if (!users) {
        setRekap([]);
        setLoadingRekap(false);
        return;
      }

      // Ambil semua absensi untuk bulan dan tahun terpilih
      const startDate = moment().year(tahun).month(bulan).startOf("month").format("YYYY-MM-DD");
      const endDate = moment().year(tahun).month(bulan).endOf("month").format("YYYY-MM-DD");

      const { data: absensiData } = await supabase
        .from("absensi")
        .select("*")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate);

      // Hitung rekap per user
      const rekapData = users.map((user: any) => {
        const userAbsensi = (absensiData || []).filter(
          (a: any) => a.username === user.username
        );
        
        // Hitung berdasarkan status
        const jumlahHadir = userAbsensi.filter((a: any) => a.status === "HADIR").length;
        const jumlahTidakHadir = userAbsensi.filter((a: any) => a.status === "TIDAK_HADIR").length;
        const jumlahIzin = userAbsensi.filter((a: any) => a.status === "IZIN").length;
        
        // Hitung persentase berdasarkan total absensi yang tercatat (termasuk izin)
        const totalAbsensi = jumlahHadir + jumlahTidakHadir + jumlahIzin;
        const persentaseHadir = totalAbsensi > 0 
          ? Math.round((jumlahHadir / totalAbsensi) * 100) 
          : 0;

        return {
          nama: user.nama.toUpperCase(),
          username: user.username,
          jumlahHadir,
          jumlahTidakHadir,
          jumlahIzin,
          persentaseHadir
        };
      });

      // Sort alphabetically A-Z
      rekapData.sort((a, b) => a.nama.localeCompare(b.nama));

      setRekap(rekapData);
    } catch (err) {
      console.error("Error fetching rekap:", err);
      setRekap([]);
    }
    setLoadingRekap(false);
  };

  return (
    <div id="rekap" className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 overflow-hidden scroll-mt-20">
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Rekap Kehadiran Bulan {bulanNama} {tahun}
            </h2>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          <button
            className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white w-10 h-10 sm:w-auto sm:h-auto sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg text-sm"
            onClick={() => {
              if (bulan === 0) {
                setBulan(11);
                setTahun((t) => t - 1);
              } else setBulan((b) => b - 1);
            }}
          >
            <span className="sm:mr-2">←</span>
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="bg-gray-100 px-3 sm:px-6 py-2 sm:py-3 rounded-xl flex-1 sm:flex-initial max-w-[180px] sm:max-w-none">
            <span className="font-bold text-gray-700 text-xs sm:text-base text-center block">{bulanNama} {tahun}</span>
          </div>

          <button
            className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white w-10 h-10 sm:w-auto sm:h-auto sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg text-sm"
            onClick={() => {
              if (bulan === 11) {
                setBulan(0);
                setTahun((t) => t + 1);
              } else setBulan((b) => b + 1);
            }}
          >
            <span className="hidden sm:inline">Berikutnya</span>
            <span className="sm:ml-2">→</span>
          </button>
        </div>

        {/* Table */}
        {loadingRekap ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat rekap kehadiran...</p>
          </div>
        ) : rekap.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-slate-500 text-lg">Belum ada data rekap</p>
            <p className="text-slate-400 text-sm mt-2">untuk bulan {bulanNama} {tahun}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="p-2 sm:p-4 text-left font-bold text-gray-700 border-b-2 border-gray-200 text-xs sm:text-sm whitespace-nowrap">
                      <span className="hidden sm:inline">👤 </span>Nama
                    </th>
                    <th className="p-2 sm:p-4 text-center font-bold text-green-700 border-b-2 border-gray-200 text-xs sm:text-sm whitespace-nowrap">
                      <span className="hidden sm:inline">✅ </span>Hadir
                    </th>
                    <th className="p-2 sm:p-4 text-center font-bold text-orange-700 border-b-2 border-gray-200 text-xs sm:text-sm whitespace-nowrap">
                      <span className="hidden sm:inline">📝 </span>Izin
                    </th>
                    <th className="p-2 sm:p-4 text-center font-bold text-red-700 border-b-2 border-gray-200 text-xs sm:text-sm whitespace-nowrap">
                      <span className="hidden sm:inline">❌ </span>Absen
                    </th>
                    <th className="p-2 sm:p-4 text-center font-bold text-blue-700 border-b-2 border-gray-200 text-xs sm:text-sm whitespace-nowrap">
                      <span className="hidden sm:inline">📈 </span>%
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <td className="p-2 sm:p-4 font-semibold text-gray-800 text-xs sm:text-sm">{item.nama}</td>
                      <td className="p-2 sm:p-4 text-center">
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 sm:py-1 rounded-full font-bold text-xs">
                          {item.jumlahHadir}
                        </span>
                      </td>
                      <td className="p-2 sm:p-4 text-center">
                        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 sm:py-1 rounded-full font-bold text-xs">
                          {item.jumlahIzin}
                        </span>
                      </td>
                      <td className="p-2 sm:p-4 text-center">
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 sm:py-1 rounded-full font-bold text-xs">
                          {item.jumlahTidakHadir}
                        </span>
                      </td>
                      <td className="p-2 sm:p-4 text-center">
                        <span className={`px-2 py-0.5 sm:py-1 rounded-full font-bold text-xs ${
                          item.persentaseHadir >= 80 
                            ? 'bg-green-100 text-green-800'
                            : item.persentaseHadir >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.persentaseHadir}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
