"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import moment from "moment";
import "moment/locale/id";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface IzinData {
  id: string;
  nama: string;
  username: string;
  tanggal: string;
  keterangan: string;
  foto_izin: string;
  foto_profil: string | null;
  created_at: string;
}

export default function KelolaIzin() {
  const [izinList, setIzinList] = useState<IzinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    moment().format("YYYY-MM-DD")
  );
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchIzinData();
  }, [selectedDate]);

  const fetchIzinData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("absensi")
        .select("*")
        .eq("status", "IZIN")
        .eq("tanggal", selectedDate)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIzinList(data || []);
    } catch (error) {
      console.error("Error fetching izin data:", error);
      setIzinList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus data izin dari ${nama}?`)) return;

    try {
      const { error } = await supabase.from("absensi").delete().eq("id", id);

      if (error) throw error;
      alert("Data izin berhasil dihapus!");
      fetchIzinData();
    } catch (error: any) {
      alert("Gagal menghapus data: " + error.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📋</span>
            </div>
            <h2 className="text-xl font-bold text-white">Daftar Izin</h2>
          </div>
          <button
            onClick={fetchIzinData}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <label className="text-sm font-semibold text-gray-700">
            Pilih Tanggal:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-gray-900"
          />
          <span className="text-sm text-gray-600">
            {moment(selectedDate).format("dddd, DD MMMM YYYY")}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        ) : izinList.length > 0 ? (
          <div className="space-y-4">
            {/* Stats */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-orange-700">
                  Total Izin:
                </span>
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  {izinList.length} orang
                </div>
              </div>
            </div>

            {/* Izin List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {izinList.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md transition-all"
                  style={{
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  {/* User Info */}
                  <div className="flex items-start space-x-4 mb-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg overflow-hidden flex-shrink-0">
                      {item.foto_profil ? (
                        <img
                          src={item.foto_profil}
                          alt={item.nama}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">
                          {(item.nama || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 text-lg">
                        {item.nama.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{item.username}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ⏰{" "}
                        {item.created_at
                          ? moment(item.created_at).format("HH:mm")
                          : "-"}
                      </div>
                    </div>
                  </div>

                  {/* Alasan */}
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-lg mb-3">
                    <div className="text-xs font-semibold text-orange-700 mb-1">
                      Alasan Izin:
                    </div>
                    <div className="text-sm text-gray-700">
                      {item.keterangan || "Tidak ada keterangan"}
                    </div>
                  </div>

                  {/* Foto Izin */}
                  {item.foto_izin && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2">
                        Foto Bukti:
                      </div>
                      <img
                        src={item.foto_izin}
                        alt="Foto Izin"
                        className="w-full h-48 object-cover rounded-lg border-2 border-orange-200 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setViewingPhoto(item.foto_izin)}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      {moment(item.tanggal).format("DD MMM YYYY")}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id, item.nama)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all flex items-center space-x-1"
                    >
                      <span>🗑️</span>
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <p className="text-xl font-bold text-gray-600 mb-2">
              Tidak ada data izin
            </p>
            <p className="text-gray-500">
              Belum ada yang mengajukan izin pada tanggal ini
            </p>
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="max-w-4xl w-full">
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Foto Bukti Izin
                </h3>
                <button
                  onClick={() => setViewingPhoto(null)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
                >
                  ❌ Tutup
                </button>
              </div>
              <img
                src={viewingPhoto}
                alt="Foto Izin Besar"
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
