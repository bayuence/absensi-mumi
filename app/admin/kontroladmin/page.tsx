"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import Navbar from "@/components/Navbar";
import { User } from "@/lib/database.types";



export default function KontrolAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAdmin, setFilterAdmin] = useState<"all" | "admin" | "non-admin">("all");

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*");

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      const sortedUsers = (data || []).sort((a, b) => a.nama.localeCompare(b.nama));
      setUsers(sortedUsers);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check if current user is admin
    const checkAdminStatus = async () => {
      const currentUser = localStorage.getItem("user");
      if (currentUser) {
        let user;
        try {
          user = JSON.parse(currentUser);
        } catch (e) {
          window.location.href = "/login";
          return;
        }

        if (!user || !user.username) {
          window.location.href = "/login";
          return;
        }

        const { data } = await supabase
          .from("users")
          .select("is_admin")
          .eq("username", user.username.trim())
          .single();

        if (!data?.is_admin) {
          alert("Anda tidak memiliki akses ke halaman ini!");
          window.location.href = "/dashboard";
          return;
        }
      } else {
        window.location.href = "/login";
        return;
      }

      fetchUsers();
    };

    checkAdminStatus();
  }, []);

  const toggleAdminStatus = async (username: string, currentStatus: boolean) => {
    // Protect master admin
    if (username === "bayuence") {
      alert("❌ Tidak dapat mengubah status Master Admin!\n\nUser 'bayuence' adalah Master Administrator yang tidak dapat dicabut hak aksesnya.");
      return;
    }

    setUpdatingUser(username);

    const { error } = await supabase
      .from("users")
      .update({ is_admin: !currentStatus })
      .eq("username", username.trim());

    if (error) {
      console.error("Error updating admin status:", error);
      alert("Gagal mengubah status admin: " + error.message);
    } else {
      alert(`Status admin berhasil ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`);
      fetchUsers();
    }

    setUpdatingUser(null);
  };

  // Filter users based on search and admin filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterAdmin === "all" ||
      (filterAdmin === "admin" && user.is_admin) ||
      (filterAdmin === "non-admin" && !user.is_admin);

    return matchesSearch && matchesFilter;
  });

  const adminCount = users.filter(u => u.is_admin).length;
  const nonAdminCount = users.filter(u => !u.is_admin).length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => window.location.href = '/admin'}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Kembali ke Admin</span>
            </button>

            <div className="text-center py-4 sm:py-8 mb-4 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 sm:mb-4">
                👑 Kontrol Admin
              </h1>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg">Kelola hak akses administrator untuk pengguna</p>
            </div>
          </div>

          {/* Stats Cards - Mobile: 3 Columns, Desktop: 3 Columns (but different style) */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm sm:shadow-lg border border-white/50 p-2 sm:p-6 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <span className="text-sm sm:text-2xl">👥</span>
              </div>
              <div>
                <p className="text-[9px] sm:text-sm text-slate-600 font-medium leading-tight">Total</p>
                <p className="text-sm sm:text-2xl font-bold text-slate-800">{users.length}</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm sm:shadow-lg border border-white/50 p-2 sm:p-6 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <span className="text-sm sm:text-2xl">👑</span>
              </div>
              <div>
                <p className="text-[9px] sm:text-sm text-slate-600 font-medium leading-tight">Admin</p>
                <p className="text-sm sm:text-2xl font-bold text-purple-600">{adminCount}</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm sm:shadow-lg border border-white/50 p-2 sm:p-6 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <span className="text-sm sm:text-2xl">👤</span>
              </div>
              <div>
                <p className="text-[9px] sm:text-sm text-slate-600 font-medium leading-tight">User</p>
                <p className="text-sm sm:text-2xl font-bold text-green-600">{nonAdminCount}</p>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 md:p-8">

            {/* Search and Filter Bar */}
            <div className="mb-6 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Cari nama atau username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl bg-white/70 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterAdmin("all")}
                    className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm ${filterAdmin === "all"
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                      }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setFilterAdmin("admin")}
                    className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm ${filterAdmin === "admin"
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                      }`}
                  >
                    👑 Admin
                  </button>
                  <button
                    onClick={() => setFilterAdmin("non-admin")}
                    className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm ${filterAdmin === "non-admin"
                      ? "bg-green-500 text-white shadow-lg"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                      }`}
                  >
                    👤 User
                  </button>
                </div>
              </div>
            </div>

            {/* Users List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Memuat data pengguna...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-slate-500 text-lg">Tidak ada pengguna ditemukan</p>
                <p className="text-slate-400 text-sm mt-2">Coba ubah pencarian atau filter Anda</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.username}
                    className={`bg-gradient-to-r ${user.is_admin
                      ? "from-purple-50 to-pink-50 border-purple-200"
                      : "from-slate-50 to-white border-slate-200"
                      } p-4 sm:p-6 rounded-xl border-2 hover:shadow-lg transition-all duration-200`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
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

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                              {user.nama.toUpperCase()}
                            </h3>
                            {user.is_admin && (
                              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0">
                                {user.username === "bayuence" ? "🔒 Master Admin" : "👑 Admin"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 truncate">@{user.username}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              📍 {user.asal}
                            </span>
                            <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              🎓 {user.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <button
                        onClick={() => toggleAdminStatus(user.username, user.is_admin || false)}
                        disabled={updatingUser === user.username || user.username === "bayuence"}
                        className={`w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm ${user.username === "bayuence"
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg cursor-not-allowed opacity-90"
                          : user.is_admin
                            ? "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl"
                            : "bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {user.username === "bayuence" ? (
                          <>
                            <span>🔒</span>
                            <span>Master Admin</span>
                          </>
                        ) : updatingUser === user.username ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Memproses...</span>
                          </>
                        ) : user.is_admin ? (
                          <>
                            <span>❌</span>
                            <span>Cabut Admin</span>
                          </>
                        ) : (
                          <>
                            <span>👑</span>
                            <span>Jadikan Admin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning Notice */}
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-yellow-400 text-xl flex-shrink-0">⚠️</div>
              <div>
                <h3 className="text-yellow-800 font-semibold mb-1">Peringatan Penting</h3>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Admin memiliki akses penuh ke semua fitur sistem</li>
                  <li>• Hanya berikan hak admin kepada pengguna yang dipercaya</li>
                  <li>• <strong>Master Admin (bayuence)</strong> tidak dapat dicabut hak aksesnya</li>
                  <li>• Pastikan minimal ada 1 admin aktif dalam sistem</li>
                  <li>• Perubahan status admin berlaku segera setelah user login ulang</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
