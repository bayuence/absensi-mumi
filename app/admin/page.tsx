"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
  const router = useRouter();

  // Check admin access on mount
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center py-4 sm:py-8 mb-4 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 sm:mb-4">
              🛡️ Admin Dashboard
            </h1>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg">Kelola jadwal guru dan pengguna dengan mudah</p>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            
            {/* Kontrol Admin */}
            <button
              onClick={() => router.push('/admin/kontroladmin')}
              className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-5 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left"
            >
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300">
                  👑
                </div>
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-1 sm:mb-2">Kontrol Admin</h3>
              <p className="text-slate-600 text-xs sm:text-sm lg:text-base">Kelola hak akses administrator untuk pengguna</p>
              <div className="mt-3 sm:mt-4 flex items-center text-purple-600 font-medium text-xs sm:text-sm">
                <span>Buka</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Buat Jadwal */}
            <button
              onClick={() => router.push('/admin/buatjadwal')}
              className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-5 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left"
            >
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300">
                  📝
                </div>
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-1 sm:mb-2">Buat Jadwal</h3>
              <p className="text-slate-600 text-xs sm:text-sm lg:text-base">Buat jadwal guru dan generate kode absensi</p>
              <div className="mt-3 sm:mt-4 flex items-center text-blue-600 font-medium text-xs sm:text-sm">
                <span>Buka</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Kelola Presensi */}
            <button
              onClick={() => router.push('/admin/kelolapresensi')}
              className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-5 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left"
            >
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300">
                  ✅
                </div>
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-1 sm:mb-2">Kelola Presensi</h3>
              <p className="text-slate-600 text-xs sm:text-sm lg:text-base">Kelola dan hapus data presensi harian</p>
              <div className="mt-3 sm:mt-4 flex items-center text-red-600 font-medium text-xs sm:text-sm">
                <span>Buka</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Jadwal Guru */}
            <button
              onClick={() => router.push('/admin/jadwalguru')}
              className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-5 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left"
            >
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300">
                  📅
                </div>
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-1 sm:mb-2">Jadwal Guru</h3>
              <p className="text-slate-600 text-xs sm:text-sm lg:text-base">Lihat dan hapus jadwal guru yang ada</p>
              <div className="mt-3 sm:mt-4 flex items-center text-green-600 font-medium text-xs sm:text-sm">
                <span>Buka</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Pengguna Terdaftar */}
            <button
              onClick={() => router.push('/admin/pengguna')}
              className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-5 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left"
            >
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300">
                  👥
                </div>
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-1 sm:mb-2">Pengguna Terdaftar</h3>
              <p className="text-slate-600 text-xs sm:text-sm lg:text-base">Kelola data pengguna sistem</p>
              <div className="mt-3 sm:mt-4 flex items-center text-orange-600 font-medium text-xs sm:text-sm">
                <span>Buka</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-blue-400 text-xl flex-shrink-0">💡</div>
              <div>
                <h3 className="text-blue-800 font-semibold mb-1">Informasi</h3>
                <p className="text-blue-700 text-sm">Klik salah satu menu di atas untuk mengakses fitur admin yang tersedia.</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
