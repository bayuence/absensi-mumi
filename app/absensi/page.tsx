    "use client";

    import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
    import moment from "moment-timezone";
    import "moment/locale/id";
    import Navbar from "@/components/Navbar";
    import IzinHadir from "./izinhadir";
    import { exportRekapToPDF } from "./exportPDF";
    
    // Set timezone to Jakarta
    moment.tz.setDefault("Asia/Jakarta");
    moment.locale("id");



    export default function PresensiPage() {
    const [kodeGuru, setKodeGuru] = useState("");
    const [user, setUser] = useState<any>(null);
    const [absenStatus, setAbsenStatus] = useState("");
    const [rekap, setRekap] = useState<any[]>([]);
    const [hadirHariIni, setHadirHariIni] = useState<any[]>([]);
    const [izinHariIni, setIzinHariIni] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showIzinModal, setShowIzinModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Fix hydration mismatch - initialize with null and set in useEffect
    const [bulan, setBulan] = useState<number | null>(null);
    const [tahun, setTahun] = useState<number | null>(null);
    const [today, setToday] = useState<string>("");

    const bulanNama = bulan !== null ? moment().month(bulan).format("MMMM") : "";

    // Fungsi Export PDF
    const handleExportPDF = () => {
        exportRekapToPDF(rekap, bulanNama, tahun!);
    };

    // Initialize date values on client side only
    useEffect(() => {
        const now = new Date();
        setBulan(now.getMonth());
        setTahun(now.getFullYear());
        setToday(moment().format("YYYY-MM-DD"));
    }, []);

    useEffect(() => {
        const logged = localStorage.getItem("loggedUser");
        if (!logged) return;
        supabase
        .from("users")
        .select("*")
        .eq("username", logged && logged.trim())
        .single()
        .then(({ data }) => {
            setUser(data);
            // Set admin status
            if (data) {
                setIsAdmin(data.is_admin || false);
            }
        });
    }, []);

    // Fetch today's attendance when today is set
    useEffect(() => {
        if (!today) return;
        fetchHadirHariIni();
    }, [today, absenStatus]);

    const fetchHadirHariIni = async () => {
        if (!today) {
        console.log("Today is not set yet");
        return;
        }

        setIsRefreshing(true);
        console.log("=== Starting fetchHadirHariIni ===");
        console.log("Today value:", today);

        try {
        // Query untuk yang hadir
        const { data: hadirData, error } = await supabase
            .from("absensi")
            .select("*")
            .eq("tanggal", today)
            .eq("status", "HADIR");

        // Query untuk yang izin
        const { data: izinData, error: izinError } = await supabase
            .from("absensi")
            .select("*")
            .eq("tanggal", today)
            .eq("status", "IZIN");

        console.log("Hadir data:", hadirData);
        console.log("Izin data:", izinData);
        console.log("Error:", error, izinError);

        if (error) {
            console.error("Error fetching attendance:", error);
            setHadirHariIni([]);
        } else {
            setHadirHariIni(hadirData || []);
        }

        if (izinError) {
            console.error("Error fetching izin:", izinError);
            setIzinHariIni([]);
        } else {
            setIzinHariIni(izinData || []);
        }
        } catch (err) {
        console.error("Catch error:", err);
        setHadirHariIni([]);
        setIzinHariIni([]);
        } finally {
        setIsRefreshing(false);
        }
    };

    // Fungsi untuk mencatat ketidakhadiran otomatis
    const recordAbsences = async (tanggal: string) => {
        try {
        // Ambil semua jadwal untuk tanggal tersebut
        const { data: jadwalHariIni } = await supabase
            .from("jadwal_guru")
            .select("*")
            .eq("tanggal", tanggal);

        if (!jadwalHariIni || jadwalHariIni.length === 0) {
            return;
        }

        // Ambil semua user
        const { data: semuaUser } = await supabase.from("users").select("*");

        if (!semuaUser) return;

        // Ambil semua yang sudah absen hari ini
        const { data: sudahAbsen } = await supabase
            .from("absensi")
            .select("*")
            .eq("tanggal", tanggal);

        const userSudahAbsen = new Set(sudahAbsen?.map((a) => a.username) || []);

        // Buat record ketidakhadiran untuk user yang belum absen
        const ketidakhadiranRecords = semuaUser
            .filter((user) => !userSudahAbsen.has(user.username))
            .map((user) => ({
            username: user.username,
            nama: user.nama,
            tanggal: tanggal,
            status: "TIDAK_HADIR",
            foto_profil: user.foto_profil || null,
            }));

        if (ketidakhadiranRecords.length > 0) {
            await supabase.from("absensi").insert(ketidakhadiranRecords);
            console.log(`Recorded ${ketidakhadiranRecords.length} absences for ${tanggal}`);
        }
        } catch (error) {
        console.error("Error recording absences:", error);
        }
    };

    useEffect(() => {
        // Don't fetch if date values are not initialized yet
        if (bulan === null || tahun === null) return;

        async function fetchRekap() {
        const awal = moment([tahun!, bulan!, 1]).startOf("month").format("YYYY-MM-DD");
        const akhir = moment([tahun!, bulan!, 1]).endOf("month").format("YYYY-MM-DD");

        const { data: semuaUser } = await supabase.from("users").select("*");

        // Ambil semua record absensi untuk bulan ini
        const { data: semuaAbsen } = await supabase
            .from("absensi")
            .select("*")
            .gte("tanggal", awal)
            .lte("tanggal", akhir);

        // Ambil semua tanggal jadwal
        const { data: semuaTanggal } = await supabase
            .from("jadwal_guru")
            .select("tanggal")
            .gte("tanggal", awal)
            .lte("tanggal", akhir);

        // Pastikan ketidakhadiran tercatat untuk setiap jadwal yang sudah lewat
        const today = moment().format("YYYY-MM-DD");
        const jadwalLewat = semuaTanggal?.filter((j) => j.tanggal < today) || [];

        for (const jadwal of jadwalLewat) {
            await recordAbsences(jadwal.tanggal);
        }

        // Refresh data absensi setelah recording absences
        const { data: updatedAbsen } = await supabase
            .from("absensi")
            .select("*")
            .gte("tanggal", awal)
            .lte("tanggal", akhir);

        // PERHITUNGAN BERDASARKAN RECORD AKTUAL DI DATABASE
        const hasil = semuaUser?.map((u) => {
            const userAbsen = updatedAbsen?.filter((a) => a.username === u.username) || [];

            // Hitung berdasarkan kolom status
            const jumlahHadir = userAbsen.filter((a) => a.status === "HADIR").length;
            const jumlahTidakHadir = userAbsen.filter((a) => a.status === "TIDAK_HADIR").length;
            const jumlahIzin = userAbsen.filter((a) => a.status === "IZIN").length;

            // Hitung persentase berdasarkan total absensi yang tercatat (termasuk izin)
            const totalAbsensi = jumlahHadir + jumlahTidakHadir + jumlahIzin;
            const persentaseHadir = totalAbsensi > 0 ? Math.round((jumlahHadir / totalAbsensi) * 100) : 0;

            return {
            nama: u.nama,
            jumlahHadir,
            jumlahTidakHadir,
            jumlahIzin,
            persentaseHadir,
            };
        });

        // Sort by nama A-Z dan uppercase semua nama
        const sortedHasil = (hasil || [])
            .map(item => ({
            ...item,
            nama: item.nama.toUpperCase()
            }))
            .sort((a, b) => a.nama.localeCompare(b.nama));

        setRekap(sortedHasil);
        }

        fetchRekap();
    }, [bulan, tahun]);

    const handlePresensi = async () => {
        if (!user || !today) return;
        setIsLoading(true);

        const { data: jadwalHariIni } = await supabase
        .from("jadwal_guru")
        .select("*")
        .eq("tanggal", today);

        if (!jadwalHariIni || jadwalHariIni.length === 0) {
        setAbsenStatus("❌ Belum ada jadwal hari ini.");
        setIsLoading(false);
        return;
        }

        const cocok = jadwalHariIni.find((j) => j.kode_absensi === kodeGuru.trim());
        if (!cocok) {
        setAbsenStatus("❌ Kode salah.");
        setIsLoading(false);
        return;
        }

        const { data: sudahAbsen } = await supabase
        .from("absensi")
        .select("*")
        .eq("username", user.username && user.username.trim())
        .eq("tanggal", today)
        .maybeSingle();

        if (sudahAbsen) {
        setAbsenStatus("✅ Kamu sudah presensi hari ini.");
        setIsLoading(false);
        return;
        }

        // Insert record dengan format yang benar
        const { error } = await supabase.from("absensi").insert([
        {
            username: user.username,
            nama: user.nama,
            tanggal: today,
            status: "HADIR",
            foto_profil: user.foto_profil || null,
            created_at: moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss"),
        },
        ]);

        if (!error) {
        setAbsenStatus("✅ Presensi berhasil.");
        setKodeGuru("");
        fetchHadirHariIni();
        } else {
        setAbsenStatus("❌ Gagal presensi.");
        console.error("Insert error:", error);
        }
        setIsLoading(false);
    };

    // Don't render until date values are initialized
    if (bulan === null || tahun === null) {
        return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600 font-medium">Memuat halaman...</span>
                </div>
                </div>
            </div>
            </main>
        </>
        );
    }

    return (
        <>
        <Navbar />
        {showIzinModal && (
            <IzinHadir 
            onClose={() => setShowIzinModal(false)}
            onSuccess={() => {
                setAbsenStatus("✅ Izin berhasil dicatat.");
                fetchHadirHariIni();
            }}
            />
        )}
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-5"></div>
                <div className="relative flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white text-xl sm:text-2xl">✅</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Presensi Kehadiran
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
                    {moment(today).format("dddd, DD MMMM YYYY")}
                    </p>
                </div>
                </div>
            </div>

            {/* Presensi Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg sm:text-xl">🔑</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Form Presensi</h2>
                </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">
                    Kode Presensi dari Guru
                    </label>
                    <div className="relative">
                    <input
                        type="text"
                        placeholder="Masukkan kode presensi..."
                        value={kodeGuru}
                        onChange={(e) => setKodeGuru(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                        disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        🔐
                    </div>
                    </div>
                </div>

                <button
                    onClick={handlePresensi}
                    disabled={isLoading || !kodeGuru.trim()}
                    className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 transform ${
                    isLoading || !kodeGuru.trim()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 hover:scale-105 shadow-lg hover:shadow-xl"
                    }`}
                >
                    {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Memproses...</span>
                    </div>
                    ) : (
                    <div className="flex items-center justify-center space-x-2">
                        <span>📝</span>
                        <span>Kirim Presensi</span>
                    </div>
                    )}
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">atau</span>
                    </div>
                </div>

                <button
                    onClick={() => setShowIzinModal(true)}
                    disabled={isLoading}
                    className="w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 transform bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center justify-center space-x-2">
                    <span>📝</span>
                    <span>Ajukan Izin Tidak Hadir</span>
                    </div>
                </button>

                {absenStatus && (
                    <div
                    className={`p-4 rounded-xl border-l-4 ${
                        absenStatus.includes("✅")
                        ? "bg-green-50 border-green-400 text-green-800"
                        : "bg-red-50 border-red-400 text-red-800"
                    }`}
                    >
                    <p className="font-semibold flex items-center space-x-2">
                        <span>{absenStatus}</span>
                    </p>
                    </div>
                )}
                </div>
            </div>

            {/* Today's Attendance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">👥</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Hadir Hari Ini</h2>
                    </div>
                    <button
                    onClick={fetchHadirHariIni}
                    disabled={isRefreshing}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2"
                    >
                    {isRefreshing ? (
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
                <div className="p-6">
                {hadirHariIni.length > 0 ? (
                    <div className="space-y-4">
                    {/* Stats */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 sm:p-4 border border-indigo-200">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                        <span className="font-semibold text-indigo-700 text-sm sm:text-base">Total Kehadiran:</span>
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold shadow-lg text-sm sm:text-base">
                            {hadirHariIni.length} orang
                        </div>
                        </div>
                    </div>

                    {/* Attendance List */}
                    <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                        {hadirHariIni.map((item, idx) => {
                        const waktuPresensi = item.created_at ? moment(item.created_at).format("HH:mm") : moment().format("HH:mm");
                        const isRecentlyAdded = item.created_at && moment().diff(moment(item.created_at), 'minutes') < 2;

                        return (
                            <div
                            key={idx}
                            className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 hover:scale-102 ${
                                isRecentlyAdded 
                                ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-300 shadow-lg' 
                                : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:shadow-md'
                            }`}
                            style={{
                                animationDelay: `${idx * 100}ms`
                            }}
                            >
                            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg overflow-hidden flex-shrink-0">
                                {item.foto_profil ? (
                                    <img 
                                    src={item.foto_profil} 
                                    alt={item.nama}
                                    className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm sm:text-base">{(item.nama || "?").charAt(0).toUpperCase()}</span>
                                )}
                                </div>
                                <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-800 text-sm sm:text-base md:text-lg truncate">
                                    {item.nama || "Unknown"}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 truncate">
                                    @{item.username}
                                </div>
                                </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <div className={`text-sm sm:text-base md:text-lg font-bold ${isRecentlyAdded ? 'text-green-600' : 'text-gray-600'}`}>
                                ⏰ {waktuPresensi}
                                </div>
                                {isRecentlyAdded && (
                                <div className="text-xs sm:text-sm text-green-500 font-medium flex items-center justify-end space-x-1">
                                    <span>✨</span>
                                    <span className="hidden sm:inline">Baru hadir!</span>
                                </div>
                                )}
                            </div>
                            </div>
                        );
                        })}
                    </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">😴</span>
                    </div>
                    <p className="text-xl font-bold text-gray-600 mb-2">Belum ada yang hadir hari ini</p>
                    <p className="text-gray-500">Jadilah yang pertama untuk presensi!</p>
                    </div>
                )}
                </div>
            </div>

            {/* Izin Hari Ini */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">📝</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Izin Hari Ini</h2>
                    </div>
                    <button
                    onClick={fetchHadirHariIni}
                    disabled={isRefreshing}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2"
                    >
                    {isRefreshing ? (
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
                <div className="p-6">
                {izinHariIni.length > 0 ? (
                    <div className="space-y-4">
                    {/* Stats */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-3 sm:p-4 border border-yellow-200">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                        <span className="font-semibold text-orange-700 text-sm sm:text-base">Total Izin:</span>
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg text-sm sm:text-base">
                            {izinHariIni.length} orang
                        </div>
                        </div>
                    </div>

                    {/* Izin List */}
                    <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
                        {izinHariIni.map((item, idx) => {
                        const waktuIzin = item.created_at ? moment(item.created_at).format("HH:mm") : moment().format("HH:mm");
                        const isRecentlyAdded = item.created_at && moment().diff(moment(item.created_at), 'minutes') < 2;

                        return (
                            <div
                            key={idx}
                            className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${
                                isRecentlyAdded 
                                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-lg' 
                                : 'bg-gray-50 border-gray-200 hover:border-orange-300 hover:shadow-md'
                            }`}
                            style={{
                                animationDelay: `${idx * 100}ms`
                            }}
                            >
                            <div className="flex items-start space-x-2 sm:space-x-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg overflow-hidden flex-shrink-0">
                                {item.foto_profil ? (
                                    <img 
                                    src={item.foto_profil} 
                                    alt={item.nama}
                                    className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm sm:text-base">{(item.nama || "?").charAt(0).toUpperCase()}</span>
                                )}
                                </div>
                                <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2 gap-2">
                                    <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-800 text-sm sm:text-base md:text-lg truncate">
                                        {item.nama || "Unknown"}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-500 truncate">
                                        @{item.username}
                                    </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                    <div className={`text-xs sm:text-sm font-bold ${isRecentlyAdded ? 'text-orange-600' : 'text-gray-600'}`}>
                                        ⏰ {waktuIzin}
                                    </div>
                                    {isRecentlyAdded && (
                                        <div className="text-xs text-orange-500 font-medium flex items-center justify-end space-x-1">
                                        <span>✨</span>
                                        <span className="hidden sm:inline">Baru!</span>
                                        </div>
                                    )}
                                    </div>
                                </div>
                                <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-lg">
                                    <div className="text-xs font-semibold text-orange-700 mb-1">Alasan:</div>
                                    <div className="text-sm text-gray-700">{item.keterangan || "Tidak ada keterangan"}</div>
                                </div>
                                {/* Foto Izin - Hanya untuk Admin */}
                                {isAdmin ? (
                                    item.foto_izin && (
                                    <div className="mt-2">
                                        <div className="text-xs font-semibold text-gray-700 mb-1">Foto Bukti:</div>
                                        <img 
                                        src={item.foto_izin} 
                                        alt="Foto Izin" 
                                        className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border-2 border-orange-200 cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => window.open(item.foto_izin, '_blank')}
                                        />
                                    </div>
                                    )
                                ) : (
                                    <div className="mt-2 bg-gray-100 border-2 border-gray-300 rounded-lg p-3 flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">📷</span>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-gray-700 mb-0.5">Foto Bukti Izin</div>
                                        <div className="flex items-center space-x-1 text-purple-600">
                                        <span className="text-sm">👑</span>
                                        <span className="text-xs font-medium">Admin Only</span>
                                        </div>
                                    </div>
                                    </div>
                                )}
                                </div>
                            </div>
                            </div>
                        );
                        })}
                    </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">✅</span>
                    </div>
                    <p className="text-xl font-bold text-gray-600 mb-2">Tidak ada izin hari ini</p>
                    <p className="text-gray-500">Semua hadir atau belum ada yang mengajukan izin</p>
                    </div>
                )}
                </div>
            </div>

            {/* Monthly Recap */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg sm:text-xl">📊</span>
                    </div>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-white leading-tight">
                        Rekap Kehadiran Bulan {bulanNama} {tahun}
                    </h2>
                    </div>
                    <button
                    onClick={handleExportPDF}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white hover:bg-gray-100 text-rose-600 px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg text-sm flex-shrink-0"
                    >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export PDF</span>
                    </button>
                </div>
                </div>
                <div className="p-6 space-y-6">
                {/* Navigation */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <button
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg text-sm sm:text-base"
                    onClick={() => {
                        if (bulan === 0) {
                        setBulan(11);
                        setTahun((t) => t! - 1);
                        } else setBulan((b) => b! - 1);
                    }}
                    >
                    <span>←</span>
                    <span>Sebelumnya</span>
                    </button>

                    <div className="bg-gray-100 px-4 sm:px-6 py-2 sm:py-3 rounded-xl">
                    <span className="font-bold text-gray-700 text-sm sm:text-base">{bulanNama} {tahun}</span>
                    </div>

                    <button
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg text-sm sm:text-base"
                    onClick={() => {
                        if (bulan === 11) {
                        setBulan(0);
                        setTahun((t) => t! + 1);
                        } else setBulan((b) => b! + 1);
                    }}
                    >
                    <span>Berikutnya</span>
                    <span>→</span>
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                    <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <th className="p-2 sm:p-3 md:p-4 text-left font-bold text-gray-700 border-b-2 border-gray-200 text-xs sm:text-sm whitespace-nowrap">
                            👤 Nama
                        </th>
                        <th className="p-2 sm:p-3 md:p-4 text-center font-bold text-green-700 border-b-2 border-gray-200 text-xs sm:text-sm whitespace-nowrap">
                            ✅ Hadir
                        </th>
                        <th className="p-2 sm:p-3 md:p-4 text-center font-bold text-orange-700 border-b-2 border-gray-200 text-xs sm:text-sm whitespace-nowrap">
                            📝 Izin
                        </th>
                        <th className="p-2 sm:p-3 md:p-4 text-center font-bold text-red-700 border-b-2 border-gray-200 text-xs sm:text-sm whitespace-nowrap">
                            ❌ Tidak
                        </th>
                        <th className="p-2 sm:p-3 md:p-4 text-center font-bold text-blue-700 border-b-2 border-gray-200 text-xs sm:text-sm whitespace-nowrap">
                            📈 %
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rekap.map((item, idx) => (
                        <tr 
                            key={idx} 
                            className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100"
                            style={{
                            animationDelay: `${idx * 50}ms`
                            }}
                        >
                            <td className="p-2 sm:p-3 md:p-4 font-semibold text-gray-800 text-xs sm:text-sm">{item.nama}</td>
                            <td className="p-2 sm:p-3 md:p-4 text-center">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold text-xs sm:text-sm">
                                {item.jumlahHadir}
                            </span>
                            </td>
                            <td className="p-2 sm:p-3 md:p-4 text-center">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-bold text-xs sm:text-sm">
                                {item.jumlahIzin}
                            </span>
                            </td>
                            <td className="p-2 sm:p-3 md:p-4 text-center">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full font-bold text-xs sm:text-sm">
                                {item.jumlahTidakHadir}
                            </span>
                            </td>
                            <td className="p-2 sm:p-3 md:p-4 text-center">
                            <span className={`px-2 py-1 rounded-full font-bold text-xs sm:text-sm ${
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
                </div>
                </div>
            </div>
            </div>
        </main>
        </>
    );
    }