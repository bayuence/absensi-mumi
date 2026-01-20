"use client";

import { useEffect } from "react";
import supabase from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";



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

      let user;
      try {
        user = JSON.parse(currentUser);
      } catch (e) {
        // Jika data user korup/salah format
        alert("Sesi Anda tidak valid. Silakan login kembali.");
        localStorage.removeItem("user"); // Bersihkan data rusak
        router.push("/login");
        return;
      }

      if (!user || !user.username) {
        // Jika data user tidak lengkap
        alert("Data sesi tidak lengkap. Silakan login kembali.");
        localStorage.removeItem("user");
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
          {/* Menu Grid - Mobile: 3 Columns (App Style), Tablet+: 2-3 Columns (Card Style) */}
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Kontrol Admin */}
            <button
              onClick={() => router.push('/admin/kontroladmin')}
              className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm sm:shadow-xl border border-white/50 p-2 sm:p-6 lg:p-8 hover:shadow-md sm:hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col items-center sm:items-start text-center sm:text-left h-full"
            >
              <div className="mb-1 sm:mb-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl sm:rounded-xl flex items-center justify-center text-xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300 shadow-md sm:shadow-none">
                  👑
                </div>
              </div>
              <h3 className="text-[10px] sm:text-xl lg:text-2xl font-bold text-slate-800 mb-0.5 sm:mb-2 leading-tight">Kontrol Admin</h3>
              <p className="text-slate-500 text-[9px] sm:text-sm lg:text-base leading-tight px-1 sm:px-0">Akses Admin</p>
              <div className="hidden sm:flex mt-auto pt-3 items-center text-purple-600 font-medium text-xs sm:text-sm">
                <span>Buka</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Kelola Jadwal Guru */}
            <button
              onClick={() => router.push('/admin/kelolajadwal')}
              className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm sm:shadow-xl border border-white/50 p-2 sm:p-6 lg:p-8 hover:shadow-md sm:hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col items-center sm:items-start text-center sm:text-left h-full"
            >
              <div className="mb-1 sm:mb-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl sm:rounded-xl flex items-center justify-center text-xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300 shadow-md sm:shadow-none">
                  📅
                </div>
              </div>
              <h3 className="text-[10px] sm:text-xl lg:text-2xl font-bold text-slate-800 mb-0.5 sm:mb-2 leading-tight">Jadwal Guru</h3>
              <p className="text-slate-500 text-[9px] sm:text-sm lg:text-base leading-tight px-1 sm:px-0">Atur Jadwal</p>
              <div className="hidden sm:flex mt-auto pt-3 items-center text-green-600 font-medium text-xs sm:text-sm">
                <span>Buka</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Kelola Presensi */}
            <button
              onClick={() => router.push('/admin/kelolapresensi')}
              className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm sm:shadow-xl border border-white/50 p-2 sm:p-6 lg:p-8 hover:shadow-md sm:hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col items-center sm:items-start text-center sm:text-left h-full"
            >
              <div className="mb-1 sm:mb-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl sm:rounded-xl flex items-center justify-center text-xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300 shadow-md sm:shadow-none">
                  ✅
                </div>
              </div>
              <h3 className="text-[10px] sm:text-xl lg:text-2xl font-bold text-slate-800 mb-0.5 sm:mb-2 leading-tight">Presensi</h3>
              <p className="text-slate-500 text-[9px] sm:text-sm lg:text-base leading-tight px-1 sm:px-0">Data Hadir</p>
              <div className="hidden sm:flex mt-auto pt-3 items-center text-red-600 font-medium text-xs sm:text-sm">
                <span>Buka</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Pengguna Terdaftar */}
            <button
              onClick={() => router.push('/admin/pengguna')}
              className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm sm:shadow-xl border border-white/50 p-2 sm:p-6 lg:p-8 hover:shadow-md sm:hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col items-center sm:items-start text-center sm:text-left h-full"
            >
              <div className="mb-1 sm:mb-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl sm:rounded-xl flex items-center justify-center text-xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300 shadow-md sm:shadow-none">
                  👥
                </div>
              </div>
              <h3 className="text-[10px] sm:text-xl lg:text-2xl font-bold text-slate-800 mb-0.5 sm:mb-2 leading-tight">Pengguna</h3>
              <p className="text-slate-500 text-[9px] sm:text-sm lg:text-base leading-tight px-1 sm:px-0">Data User</p>
              <div className="hidden sm:flex mt-auto pt-3 items-center text-orange-600 font-medium text-xs sm:text-sm">
                <span>Buka</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Kelola Notifikasi */}
            <button
              onClick={() => router.push('/admin/kelolanotifikasi')}
              className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm sm:shadow-xl border border-white/50 p-2 sm:p-6 lg:p-8 hover:shadow-md sm:hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col items-center sm:items-start text-center sm:text-left h-full"
            >
              <div className="mb-1 sm:mb-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl sm:rounded-xl flex items-center justify-center text-xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300 shadow-md sm:shadow-none">
                  🔔
                </div>
              </div>
              <h3 className="text-[10px] sm:text-xl lg:text-2xl font-bold text-slate-800 mb-0.5 sm:mb-2 leading-tight">Notifikasi</h3>
              <p className="text-slate-500 text-[9px] sm:text-sm lg:text-base leading-tight px-1 sm:px-0">Kirim Info</p>
              <div className="hidden sm:flex mt-auto pt-3 items-center text-yellow-600 font-medium text-xs sm:text-sm">
                <span>Buka</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-4 sm:mt-8 bg-blue-50 border-l-2 sm:border-l-4 border-blue-400 p-3 sm:p-4 rounded-lg">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="text-blue-400 text-lg sm:text-xl flex-shrink-0 mt-0.5">💡</div>
              <div>
                <h3 className="text-blue-800 font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base">Informasi</h3>
                <p className="text-blue-700 text-xs sm:text-sm leading-snug">Klik menu di atas untuk mengakses fitur admin. Hubungi admin/ence jika ada kendala.</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
