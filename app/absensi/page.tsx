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

    export default function PresensiPage() {
    const [kodeGuru, setKodeGuru] = useState("");
    const [user, setUser] = useState<any>(null);
    const [absenStatus, setAbsenStatus] = useState("");
    const [rekap, setRekap] = useState<any[]>([]);
    const [hadirHariIni, setHadirHariIni] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Fix hydration mismatch - initialize with null and set in useEffect
    const [bulan, setBulan] = useState<number | null>(null);
    const [tahun, setTahun] = useState<number | null>(null);
    const [today, setToday] = useState<string>("");
    
    const bulanNama = bulan !== null ? moment().month(bulan).format("MMMM") : "";

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
        .eq("username", logged)
        .single()
        .then(({ data }) => setUser(data));
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
        // Coba query paling sederhana dulu
        console.log("Testing basic connection...");
        const { data: basicTest, error: basicError } = await supabase
            .from("absensi")
            .select("*");
        
        console.log("Basic test - Data:", basicTest);
        console.log("Basic test - Error:", basicError);
        
        if (basicError) {
            console.error("Basic connection failed:", basicError);
            setHadirHariIni([]);
            return;
        }
        
        if (!basicTest || basicTest.length === 0) {
            console.log("No data in absensi table");
            setHadirHariIni([]);
            return;
        }
        
        // Tampilkan struktur data
        console.log("Sample data structure:", basicTest[0]);
        
        // Filter manual di JavaScript (bukan di Supabase)
        const todayFormatted = moment().format("YYYY-MM-DD");
        console.log("Filtering for date:", todayFormatted);
        
        const filteredData = basicTest.filter(item => {
            console.log("Checking item:", item.tanggal, "vs", todayFormatted);
            return item.tanggal === todayFormatted;
        });
        
        console.log("Filtered results:", filteredData);
        
        setHadirHariIni(filteredData);
        
        } catch (err) {
        console.error("Catch error:", err);
        setHadirHariIni([]);
        } finally {
        setIsRefreshing(false);
        }
    };

    useEffect(() => {
        // Don't fetch if date values are not initialized yet
        if (bulan === null || tahun === null) return;

        async function fetchRekap() {
        const awal = moment([tahun, bulan, 1]).startOf("month").format("YYYY-MM-DD");
        const akhir = moment([tahun, bulan, 1]).endOf("month").format("YYYY-MM-DD");

        const { data: semuaUser } = await supabase.from("users").select("*");
        const { data: semuaAbsen } = await supabase
            .from("absensi")
            .select("*")
            .gte("tanggal", awal)
            .lte("tanggal", akhir);

        // Fix: Destructure data from supabase response
        const { data: semuaTanggal } = await supabase
            .from("jadwal_guru")
            .select("tanggal")
            .gte("tanggal", awal)
            .lte("tanggal", akhir);

        // Now semuaTanggal is an array
        const pertemuanSet = new Set((semuaTanggal?.map(j => j.tanggal)) || []);
        const totalPertemuan = pertemuanSet.size;

        const hasil = semuaUser?.map((u) => {
            const jumlahHadir = semuaAbsen?.filter((a) => a.username === u.username).length || 0;
            const jumlahTidakHadir = totalPertemuan - jumlahHadir;
            const persentaseHadir = totalPertemuan > 0 ? Math.round((jumlahHadir / totalPertemuan) * 100) : 0;
            return { nama: u.nama, jumlahHadir, jumlahTidakHadir, persentaseHadir };
        });

        setRekap(hasil || []);
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

        const cocok = jadwalHariIni.find(j => j.kode_absensi === kodeGuru.trim());
        if (!cocok) {
        setAbsenStatus("❌ Kode salah.");
        setIsLoading(false);
        return;
        }

        const { data: sudahAbsen } = await supabase
        .from("absensi")
        .select("*")
        .eq("username", user.username)
        .eq("tanggal", today)
        .maybeSingle();

        if (sudahAbsen) {
        setAbsenStatus("✅ Kamu sudah presensi hari ini.");
        setIsLoading(false);
        return;
        }

        const { error } = await supabase.from("absensi").insert([
        {
            username: user.username,
            nama: user.nama,
            tanggal: today,
        },
        ]);

        if (!error) {
        setAbsenStatus("✅ Presensi berhasil.");
        setKodeGuru("");
        fetchHadirHariIni();
        } else {
        setAbsenStatus("❌ Gagal presensi.");
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
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-5"></div>
                <div className="relative flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">✅</span>
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Presensi Kehadiran
                    </h1>
                    <p className="text-gray-600 mt-1">
                    {moment(today).format("dddd, DD MMMM YYYY")}
                    </p>
                </div>
                </div>
            </div>

            {/* Presensi Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 p-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">🔑</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Form Presensi</h2>
                </div>
                </div>
                
                <div className="p-6 space-y-6">
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

                {absenStatus && (
                    <div className={`p-4 rounded-xl border-l-4 ${
                    absenStatus.includes("✅") 
                        ? "bg-green-50 border-green-400 text-green-800" 
                        : "bg-red-50 border-red-400 text-red-800"
                    }`}>
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
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                        <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-700">Total Kehadiran:</span>
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                            {hadirHariIni.length} orang
                        </div>
                        </div>
                    </div>
                    
                    {/* Attendance List */}
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {hadirHariIni.map((item, idx) => {
                        const waktuPresensi = item.created_at ? moment(item.created_at).format("HH:mm") : "N/A";
                        const isRecentlyAdded = item.created_at && moment().diff(moment(item.created_at), 'minutes') < 2;
                        
                        return (
                            <div
                            key={idx}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 hover:scale-102 ${
                                isRecentlyAdded 
                                ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-300 shadow-lg' 
                                : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:shadow-md'
                            }`}
                            style={{
                                animationDelay: `${idx * 100}ms`
                            }}
                            >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                {(item.nama || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                <div className="font-bold text-gray-800 text-lg">
                                    {item.nama || "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                    @{item.username}
                                </div>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <div className={`text-lg font-bold ${isRecentlyAdded ? 'text-green-600' : 'text-gray-600'}`}>
                                ⏰ {waktuPresensi}
                                </div>
                                {isRecentlyAdded && (
                                <div className="text-sm text-green-500 font-medium flex items-center space-x-1">
                                    <span>✨</span>
                                    <span>Baru hadir!</span>
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

            {/* Monthly Recap */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📊</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">
                    Rekap Kehadiran Bulan {bulanNama} {tahun}
                    </h2>
                </div>
                </div>

                <div className="p-6 space-y-6">
                {/* Navigation */}
                <div className="flex items-center justify-center space-x-4">
                    <button
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
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
                    
                    <div className="bg-gray-100 px-6 py-3 rounded-xl">
                    <span className="font-bold text-gray-700">{bulanNama} {tahun}</span>
                    </div>

                    <button
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
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
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <th className="p-4 text-left font-bold text-gray-700 border-b-2 border-gray-200">
                            👤 Nama
                        </th>
                        <th className="p-4 text-center font-bold text-green-700 border-b-2 border-gray-200">
                            ✅ Hadir
                        </th>
                        <th className="p-4 text-center font-bold text-red-700 border-b-2 border-gray-200">
                            ❌ Tidak Hadir
                        </th>
                        <th className="p-4 text-center font-bold text-blue-700 border-b-2 border-gray-200">
                            📈 Persentase
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
                            <td className="p-4 font-semibold text-gray-800">{item.nama}</td>
                            <td className="p-4 text-center">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">
                                {item.jumlahHadir}
                            </span>
                            </td>
                            <td className="p-4 text-center">
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold">
                                {item.jumlahTidakHadir}
                            </span>
                            </td>
                            <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full font-bold ${
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
        </main>
        </>
    );
    }