"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateKode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function BuatJadwalPage() {
  const router = useRouter();
  const [tanggal, setTanggal] = useState("");
  const [guruList, setGuruList] = useState<string[]>([""]);
  const [kodeAbsensi, setKodeAbsensi] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!tanggal || guruList.some((g) => g.trim() === "")) {
      setError("Semua field wajib diisi.");
      setLoading(false);
      return;
    }

    const kode = kodeAbsensi || generateKode();

    const entries = guruList.map((guru) => ({
      tanggal,
      guru,
      kode_absensi: kode,
    }));

    const { error } = await supabase.from("jadwal_guru").insert(entries);
    if (error) {
      setError("Gagal menyimpan jadwal: " + error.message);
    } else {
      setSuccess(`Jadwal berhasil dibuat dengan kode: ${kode}`);
      setTanggal("");
      setGuruList([""]);
      setKodeAbsensi("");
    }
    setLoading(false);
  };

  const handleRemoveGuru = (index: number) => {
    if (guruList.length > 1) {
      const newGuruList = guruList.filter((_, i) => i !== index);
      setGuruList(newGuruList);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          
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
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              📝 Buat Jadwal Guru
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">Buat jadwal baru dan generate kode absensi</p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Date Input */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  📅 Tanggal
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full p-3 sm:p-4 border-2 border-slate-200 rounded-lg sm:rounded-xl bg-white/70 text-slate-900 text-sm sm:text-base focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 hover:border-slate-300"
                  required
                />
              </div>

              {/* Guru List */}
              <div className="space-y-3 sm:space-y-4">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  👨‍🏫 Daftar Guru
                </label>
                {guruList.map((guru, i) => (
                  <div key={i} className="flex gap-2 sm:gap-3 group">
                    <input
                      type="text"
                      placeholder={`Nama Guru ${i + 1}`}
                      value={guru}
                      onChange={(e) => {
                        const newList = [...guruList];
                        newList[i] = e.target.value;
                        setGuruList(newList);
                      }}
                      className="flex-1 p-3 sm:p-4 border-2 border-slate-200 rounded-lg sm:rounded-xl bg-white/70 text-slate-900 text-sm sm:text-base placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 hover:border-slate-300"
                      required
                    />
                    {guruList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGuru(i)}
                        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 rounded-lg sm:rounded-xl border-2 border-red-200 hover:border-red-500 transition-all duration-200 group-hover:scale-105 flex-shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => setGuruList([...guruList, ""])}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm sm:text-base"
                >
                  <span className="text-base sm:text-lg">➕</span> Tambah Guru
                </button>
              </div>

              {/* Kode Absensi */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  🎟️ Kode Absensi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Kosongkan untuk otomatis"
                  value={kodeAbsensi}
                  onChange={(e) => setKodeAbsensi(e.target.value.toUpperCase())}
                  className="w-full p-3 sm:p-4 border-2 border-slate-200 rounded-lg sm:rounded-xl bg-white/70 text-slate-900 text-sm sm:text-base placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 hover:border-slate-300 font-mono"
                />
                <p className="text-xs text-slate-500">Jika kosong, sistem akan generate kode otomatis</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl text-sm sm:text-base hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menyimpan...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    💾 Simpan Jadwal
                  </span>
                )}
              </button>

              {/* Messages */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-red-400 mr-2 sm:mr-3 text-base sm:text-lg">⚠️</div>
                    <div className="text-red-800 font-medium text-xs sm:text-sm">{error}</div>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-400 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-green-400 mr-2 sm:mr-3 text-base sm:text-lg">✅</div>
                    <div className="text-green-800 font-medium text-xs sm:text-sm">{success}</div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
