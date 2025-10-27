
    "use client";

    import { useEffect, useState } from "react";
    import { createClient } from "@supabase/supabase-js";
    import moment from "moment";
    import "moment/locale/id";
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

    export default function AdminPage() {
    const [tanggal, setTanggal] = useState("");
    const [guruList, setGuruList] = useState<string[]>([""]);
    const [kodeAbsensi, setKodeAbsensi] = useState("");
    const [jadwal, setJadwal] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [absensiList, setAbsensiList] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingReject, setLoadingReject] = useState<string | null>(null);

    const fetchJadwal = async () => {
        const { data } = await supabase
        .from("jadwal_guru")
        .select("*")
        .order("tanggal", { ascending: true });
        setJadwal(data || []);
    };

    const fetchUsers = async () => {
        const { data } = await supabase.from("users").select("*");
        setUsers(data || []);
    };

    const fetchAbsensiByDate = async (date: string) => {
        console.log("Fetching absensi for date:", date);
        
        // Mencoba berbagai format tanggal untuk mencocokkan dengan database
        const formatDate = moment(date).format("YYYY-MM-DD");
        
        const { data, error } = await supabase
        .from("absensi")
        .select("*")
        .eq("tanggal", formatDate)
        .order("id", { ascending: false });
        
        if (error) {
        console.error("Error fetching absensi:", error);
        // Jika gagal dengan format YYYY-MM-DD, coba format lain
        const altFormatDate = moment(date).format("DD/MM/YYYY");
        const { data: altData, error: altError } = await supabase
            .from("absensi")
            .select("*")
            .eq("tanggal", altFormatDate)
            .order("id", { ascending: false });
        
        if (altError) {
            console.error("Error with alternative format:", altError);
            setAbsensiList([]);
        } else {
            console.log("Fetched absensi data (alternative format):", altData);
            setAbsensiList(altData || []);
        }
        } else {
        console.log("Fetched absensi data:", data);
        setAbsensiList(data || []);
        }
    };

    useEffect(() => {
        fetchJadwal();
        fetchUsers();
        fetchAbsensiByDate(selectedDate);
    }, [selectedDate]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError("");
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
        setError("Gagal menyimpan jadwal.");
        } else {
        setTanggal("");
        setGuruList([""]);
        setKodeAbsensi("");
        fetchJadwal();
        }
        setLoading(false);
    };

    const hapusJadwal = async (tanggal: string, kode: string) => {
        setLoadingDelete(true);
        await supabase
        .from("jadwal_guru")
        .delete()
        .eq("tanggal", tanggal)
        .eq("kode_absensi", kode);
        fetchJadwal();
        setLoadingDelete(false);
    };

    const hapusUser = async (username: string) => {
        setLoadingDelete(true);
        await supabase.from("users").delete().eq("username", username);
        fetchUsers();
        setLoadingDelete(false);
    };

    const tolakPresensi = async (id: number, username: string, nama: string) => {
        setLoadingReject(`${id}`);
        
        try {
        const { error } = await supabase
            .from("absensi")
            .delete()
            .eq("id", id);
        
        if (error) {
            console.error("Error menolak presensi:", error);
            alert("Gagal menolak presensi: " + error.message);
        } else {
            // Refresh data absensi setelah penolakan berhasil
            await fetchAbsensiByDate(selectedDate);
            console.log(`Presensi ${nama} (${username}) berhasil ditolak dan dihapus`);
            alert(`Presensi ${nama} berhasil ditolak dan dihapus dari sistem`);
        }
        } catch (error) {
        console.error("Error unexpected:", error);
        alert("Terjadi kesalahan tidak terduga");
        } finally {
        setLoadingReject(null);
        }
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
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="text-center py-8 mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                🛡️ Admin Dashboard
                </h1>
                <p className="text-slate-600 text-lg">Kelola jadwal guru dan pengguna dengan mudah</p>
            </div>

            <div className="grid xl:grid-cols-3 gap-8">
                
                {/* Form Section */}
                <div className="xl:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-xl font-bold mr-4">
                        📝
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Buat Jadwal</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                        📅 Tanggal
                        </label>
                        <input
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full p-4 border-2 border-slate-200 rounded-xl bg-white/70 text-slate-900 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 hover:border-slate-300"
                        />
                    </div>

                    {/* Guru List */}
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-slate-700">
                        👨‍🏫 Daftar Guru
                        </label>
                        {guruList.map((guru, i) => (
                        <div key={i} className="flex gap-3 group">
                            <input
                            type="text"
                            placeholder={`Nama Guru ${i + 1}`}
                            value={guru}
                            onChange={(e) => {
                                const newList = [...guruList];
                                newList[i] = e.target.value;
                                setGuruList(newList);
                            }}
                            className="flex-1 p-4 border-2 border-slate-200 rounded-xl bg-white/70 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 hover:border-slate-300"
                            />
                            {guruList.length > 1 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveGuru(i)}
                                className="w-12 h-12 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 rounded-xl border-2 border-red-200 hover:border-red-500 transition-all duration-200 group-hover:scale-105"
                            >
                                ✕
                            </button>
                            )}
                        </div>
                        ))}
                        
                        <button
                        type="button"
                        onClick={() => setGuruList([...guruList, ""])}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-4 py-2 rounded-lg transition-all duration-200"
                        >
                        <span className="text-lg">➕</span> Tambah Guru
                        </button>
                    </div>

                    {/* Kode Absensi */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                        🎟️ Kode Absensi
                        </label>
                        <input
                        type="text"
                        placeholder="Kosongkan untuk otomatis"
                        value={kodeAbsensi}
                        onChange={(e) => setKodeAbsensi(e.target.value)}
                        className="w-full p-4 border-2 border-slate-200 rounded-xl bg-white/70 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 hover:border-slate-300 font-mono"
                        />
                        <p className="text-xs text-slate-500">Jika kosong, sistem akan generate kode otomatis</p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Menyimpan...
                        </span>
                        ) : (
                        <span className="flex items-center justify-center gap-2">
                            💾 Simpan Jadwal
                        </span>
                        )}
                    </button>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                        <div className="flex items-center">
                            <div className="text-red-400 mr-3">⚠️</div>
                            <div className="text-red-800 font-medium">{error}</div>
                        </div>
                        </div>
                    )}
                    </form>
                </div>
                </div>

                {/* Content Section */}
                <div className="xl:col-span-2 space-y-8">
                
                {/* Kelola Presensi Section - UPDATED */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl font-bold mr-4">
                        ✅
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Kelola Kehadiran</h2>
                    </div>
                    <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                        {absensiList.length} Hadir
                    </div>
                    </div>

                    {/* Date Selector for Attendance Management */}
                    <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        📅 Pilih Tanggal untuk Melihat Kehadiran
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                        setSelectedDate(e.target.value);
                        console.log("Selected date changed to:", e.target.value);
                        }}
                        className="px-4 py-2 border-2 border-slate-200 rounded-xl bg-white/70 text-slate-900 focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all duration-200"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Menampilkan daftar siswa yang hadir pada tanggal: {moment(selectedDate).format("DD/MM/YYYY")}
                    </p>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                    {absensiList.length === 0 ? (
                        <div className="text-center py-12">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-slate-500 text-lg">Tidak ada siswa yang hadir pada tanggal {moment(selectedDate).format("DD/MM/YYYY")}</p>
                        <p className="text-slate-400 text-sm mt-2">Pilih tanggal lain untuk melihat daftar kehadiran</p>
                        </div>
                    ) : (
                        absensiList.map((absen, idx) => {
                        const waktuPresensi = absen.waktu || (absen.created_at ? moment(absen.created_at).format("HH:mm:ss") : "N/A");
                        
                        return (
                            <div key={absen.id || idx} className="bg-gradient-to-r from-green-50 to-white p-6 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                                    {absen.foto_profil ? (
                                        <img 
                                        src={absen.foto_profil} 
                                        alt={absen.nama}
                                        className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>{absen.nama ? absen.nama.charAt(0).toUpperCase() : '?'}</span>
                                    )}
                                    </div>
                                    <div>
                                    <h3 className="text-lg font-bold text-slate-800">{absen.nama || 'Nama tidak tersedia'}</h3>
                                    <p className="text-slate-600 text-sm">@{absen.username || 'Username tidak tersedia'}</p>
                                    </div>
                                    <div className="ml-4">
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                                        ✅ HADIR
                                    </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-600">📅</span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                        {moment(absen.tanggal).format("DD/MM/YYYY")}
                                    </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-600">⏰</span>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                        {waktuPresensi}
                                    </span>
                                    </div>
                                    {absen.status_presensi && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-600">📋</span>
                                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                        {absen.status_presensi}
                                        </span>
                                    </div>
                                    )}
                                </div>
                                
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-yellow-800 text-sm">
                                    <span className="font-semibold">⚠️ Peringatan:</span>
                                    Klik "Tolak & Hapus" jika siswa ini tidak benar-benar hadir namun berhasil mengisi presensi
                                    </p>
                                </div>
                                </div>
                                
                                <button
                                onClick={() => tolakPresensi(absen.id, absen.username, absen.nama)}
                                disabled={loadingReject === `${absen.id}`}
                                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                                >
                                {loadingReject === `${absen.id}` ? (
                                    <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Menolak...
                                    </>
                                ) : (
                                    <>
                                    🗑️ Tolak & Hapus
                                    </>
                                )}
                                </button>
                            </div>
                            </div>
                        );
                        })
                    )}
                    </div>
                </div>

                {/* Jadwal Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xl font-bold mr-4">
                        📅
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Jadwal Guru</h2>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                        {jadwal.length} Jadwal
                    </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                    {jadwal.length === 0 ? (
                        <div className="text-center py-12">
                        <div className="text-6xl mb-4">📅</div>
                        <p className="text-slate-500 text-lg">Belum ada jadwal yang dibuat</p>
                        </div>
                    ) : (
                        Array.from(
                        Object.entries(
                            jadwal.reduce((acc: any, cur) => {
                            const key = `${cur.tanggal}_${cur.kode_absensi}`;
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(cur);
                            return acc;
                            }, {})
                        )
                        ).map(([key, group]: any, idx) => {
                        const tanggal = group[0].tanggal;
                        const kode = group[0].kode_absensi;
                        const namaHari = moment(tanggal).locale("id").format("dddd, DD MMMM YYYY");
                        const semuaGuru = group.map((g: any) => g.guru).join(", ");
                        
                        return (
                            <div key={idx} className="bg-gradient-to-r from-slate-50 to-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                                    📅 {namaHari}
                                </h3>
                                <div className="space-y-2 mb-4">
                                    <p className="text-slate-700 flex items-center gap-2">
                                    <span className="font-semibold">👨‍🏫 Guru:</span>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                                        {semuaGuru}
                                    </span>
                                    </p>
                                    <p className="text-slate-700 flex items-center gap-2">
                                    <span className="font-semibold">🎟️ Kode:</span>
                                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-mono text-sm font-bold">
                                        {kode}
                                    </span>
                                    </p>
                                </div>
                                </div>
                                <button
                                onClick={() => hapusJadwal(tanggal, kode)}
                                disabled={loadingDelete}
                                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                                >
                                {loadingDelete ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "🗑️"
                                )}
                                Hapus
                                </button>
                            </div>
                            </div>
                        );
                        })
                    )}
                    </div>
                </div>

                {/* Users Section */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white text-xl font-bold mr-4">
                        👥
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Pengguna Terdaftar</h2>
                    </div>
                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                        {users.length} Users
                    </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                    {users.length === 0 ? (
                        <div className="text-center py-12">
                        <div className="text-6xl mb-4">👥</div>
                        <p className="text-slate-500 text-lg">Belum ada pengguna terdaftar</p>
                        </div>
                    ) : (
                        users.map((u, i) => (
                        <div key={i} className="bg-gradient-to-r from-slate-50 to-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]">
                            <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                                    {u.foto_profil ? (
                                    <img 
                                        src={u.foto_profil} 
                                        alt={u.nama}
                                        className="w-full h-full object-cover"
                                    />
                                    ) : (
                                    <span>{u.nama.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{u.nama}</h3>
                                    <p className="text-slate-600 text-sm">@{u.username}</p>
                                </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-600">📍</span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    {u.asal}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-600">🎓</span>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                    {u.status} {u.keterangan && `- ${u.keterangan}`}
                                    </span>
                                </div>
                                </div>
                                
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-800 text-sm flex items-center gap-2">
                                    <span className="font-semibold">🔑 Password:</span>
                                    <span className="bg-red-100 text-red-900 px-2 py-1 rounded font-mono text-xs">
                                    {u.password}
                                    </span>
                                </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => hapusUser(u.username)}
                                disabled={loadingDelete}
                                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loadingDelete ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                "🗑️"
                                )}
                                Hapus
                            </button>
                            </div>
                        </div>
                        ))
                    )}
                    </div>
                </div>
                </div>
            </div>
            </div>
        </main>
        </>
    );
    }