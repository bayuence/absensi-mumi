"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BuatJadwal from "./buatjadwal";
import LihatJadwal from "./lihatjadwal";



interface JadwalGuru {
  id: number;
  tanggal: string;
  guru: string;
  kode_absensi: string;
}

export default function KelolaJadwalGuruPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"buat" | "lihat">("buat");
  
  // Lihat Jadwal States
  const [jadwalList, setJadwalList] = useState<JadwalGuru[]>([]);
  const [loadingJadwal, setLoadingJadwal] = useState(false);

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
        .eq("username", user.username.trim())
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
    setLoadingJadwal(true);
    const { data, error } = await supabase
      .from("jadwal_guru")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) {
      console.error("Error fetching jadwal:", error);
    } else {
      setJadwalList(data || []);
    }
    setLoadingJadwal(false);
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
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
              📅 Kelola Jadwal Guru
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">Buat jadwal baru dan kelola jadwal yang sudah ada</p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-2 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("buat")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "buat"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>📝</span>
                <span>Buat Jadwal</span>
              </button>
              <button
                onClick={() => setActiveTab("lihat")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "lihat"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>📋</span>
                <span>Lihat Jadwal</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "buat" ? (
            <BuatJadwal onSuccess={fetchJadwal} />
          ) : loadingJadwal ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 p-8">
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Memuat jadwal...</p>
              </div>
            </div>
          ) : (
            <LihatJadwal jadwalList={jadwalList} onRefresh={fetchJadwal} />
          )}

        </div>
      </main>
    </>
  );
}