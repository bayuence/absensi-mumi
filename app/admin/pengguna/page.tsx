"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { User } from "@/lib/database.types";



export default function PenggunaPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nama: "",
    username: "",
    password: "",
    asal: ""
  });
  const [saving, setSaving] = useState(false);

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
    fetchUsers();
  }, [router]);

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

  const handleDelete = async (username: string) => {
    if (!confirm(`Yakin ingin menghapus pengguna ${username}?\nData presensi pengguna ini juga akan terhapus!`)) return;
    
    setDeleting(username);
    
    // Delete presensi first
    await supabase.from("presensi").delete().eq("nama", username);
    
    // Then delete user
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("username", username);

    if (error) {
      alert("Gagal menghapus pengguna: " + error.message);
    } else {
      alert("Pengguna berhasil dihapus!");
      fetchUsers();
    }
    setDeleting(null);
  };

  const togglePasswordVisibility = (username: string) => {
    const newSet = new Set(showPasswords);
    if (newSet.has(username)) {
      newSet.delete(username);
    } else {
      newSet.add(username);
    }
    setShowPasswords(newSet);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user.username);
    setEditForm({
      nama: user.nama || "",
      username: user.username || "",
      password: user.password || "",
      asal: user.asal || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({
      nama: "",
      username: "",
      password: "",
      asal: ""
    });
  };

  const handleSaveEdit = async (oldUsername: string) => {
    if (!editForm.nama.trim() || !editForm.username.trim() || !editForm.password.trim()) {
      alert("Nama, username, dan password tidak boleh kosong!");
      return;
    }

    setSaving(true);

    try {
      // Update user data
      const { error: userError } = await supabase
        .from("users")
        .update({
          nama: editForm.nama,
          username: editForm.username,
          password: editForm.password,
          asal: editForm.asal
        })
        .eq("username", oldUsername);

      if (userError) throw userError;

      // If username changed, update presensi table
      if (oldUsername !== editForm.username) {
        await supabase
          .from("presensi")
          .update({ 
            nama: editForm.nama,
            username: editForm.username 
          })
          .eq("username", oldUsername);
        
        // Update jadwal_guru table
        await supabase
          .from("jadwal_guru")
          .update({ guru: editForm.nama })
          .eq("guru", oldUsername);
      }

      alert("Data pengguna berhasil diperbarui!");
      setEditingUser(null);
      fetchUsers();

      // Update localStorage if editing current user
      const currentUser = localStorage.getItem("user");
      if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.username === oldUsername) {
          localStorage.setItem("user", JSON.stringify({
            ...user,
            nama: editForm.nama,
            username: editForm.username,
            password: editForm.password
          }));
        }
      }
    } catch (error: any) {
      alert("Gagal memperbarui pengguna: " + error.message);
    }

    setSaving(false);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.asal.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
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
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
              👥 Pengguna Terdaftar
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">Kelola data pengguna sistem</p>
          </div>

          {/* Stats Card */}
          <div className="mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">Total Pengguna</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800">{users.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 md:p-8">
            
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari nama, username, atau asal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl bg-white/70 text-slate-900 placeholder-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                />
              </div>
            </div>

            {/* Users List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Memuat data pengguna...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-slate-500 text-lg">Tidak ada pengguna ditemukan</p>
                <p className="text-slate-400 text-sm mt-2">Coba ubah kata kunci pencarian</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.username}
                    className="bg-gradient-to-r from-slate-50 to-white p-4 sm:p-6 rounded-xl border-2 border-slate-200 hover:shadow-lg transition-all duration-200"
                  >
                    {editingUser === user.username ? (
                      /* EDIT MODE */
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xl">✏️</span>
                          <h3 className="text-lg font-bold text-slate-800">Edit Pengguna</h3>
                        </div>

                        {/* Nama */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Nama Lengkap
                          </label>
                          <input
                            type="text"
                            value={editForm.nama}
                            onChange={(e) => setEditForm({...editForm, nama: e.target.value})}
                            className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                            placeholder="Masukkan nama lengkap"
                          />
                        </div>

                        {/* Username */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                            className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                            placeholder="Masukkan username"
                          />
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Password
                          </label>
                          <input
                            type="text"
                            value={editForm.password}
                            onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                            className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                            placeholder="Masukkan password"
                          />
                        </div>

                        {/* Asal */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Asal
                          </label>
                          <input
                            type="text"
                            value={editForm.asal}
                            onChange={(e) => setEditForm({...editForm, asal: e.target.value})}
                            className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                            placeholder="Masukkan asal (contoh: Kulon, Grend, dsb)"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => handleSaveEdit(user.username)}
                            disabled={saving}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Menyimpan...</span>
                              </>
                            ) : (
                              <>
                                <span>💾</span>
                                <span>Simpan</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="flex-1 px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl disabled:opacity-50"
                          >
                            <span>❌</span>
                            <span>Batal</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* VIEW MODE */
                      <div className="flex flex-col gap-4">
                        {/* User Header */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
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
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                                {user.nama.toUpperCase()}
                              </h3>
                              {user.is_admin && (
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                  👑 Admin
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 truncate mb-2">@{user.username}</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                📍 {user.asal}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Password Display */}
                        <div className="bg-slate-100 p-3 rounded-lg">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-600 mb-1">Password:</p>
                              <p className="font-mono text-sm font-semibold text-slate-800 truncate">
                                {showPasswords.has(user.username) ? user.password : "••••••••"}
                              </p>
                            </div>
                            <button
                              onClick={() => togglePasswordVisibility(user.username)}
                              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-medium transition-all flex-shrink-0"
                            >
                              {showPasswords.has(user.username) ? "🙈 Sembunyikan" : "👁️ Lihat"}
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEdit(user)}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(user.username)}
                            disabled={deleting === user.username}
                            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting === user.username ? (
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
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning Notice */}
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-red-400 text-xl flex-shrink-0">⚠️</div>
              <div>
                <h3 className="text-red-800 font-semibold mb-1">Peringatan Penting</h3>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Penghapusan pengguna bersifat permanen dan tidak dapat dibatalkan</li>
                  <li>• Semua data presensi pengguna juga akan ikut terhapus</li>
                  <li>• Pastikan untuk membackup data penting sebelum menghapus</li>
                  <li>• Password ditampilkan untuk memudahkan admin membantu pengguna yang lupa password</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
