    "use client";

    import { useState, useEffect } from "react";
    import Navbar from "@/components/Navbar";

    import supabase from "@/lib/supabaseClient";

    export default function LaporanPage() {
    const [guruList, setGuruList] = useState<string[]>([""]);
    const [materi, setMateri] = useState("");
    const [pengumuman, setPengumuman] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);
    
    // State untuk menampilkan data yang sudah ada
    const [existingMateri, setExistingMateri] = useState<any[]>([]);
    const [existingPengumuman, setExistingPengumuman] = useState<any[]>([]);

    // Fix hydration error
    useEffect(() => {
        setIsClient(true);
        fetchExistingData();
    }, []);

    // Fetch data yang sudah ada
    const fetchExistingData = async () => {
        try {
        // Ambil materi terbaru (5 terakhir)
        const { data: materiData } = await supabase
            .from("materi")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);
        
        setExistingMateri(materiData || []);

        // Ambil pengumuman terbaru (5 terakhir)
        const { data: pengumumanData } = await supabase
            .from("pengumuman")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);
        
        setExistingPengumuman(pengumumanData || []);
        } catch (err) {
        console.error("Error fetching existing data:", err);
        }
    };

    // Function to get formatted date consistently
    const getFormattedDate = () => {
        const today = new Date();
        return today.toLocaleDateString("id-ID", {
        weekday: "long", 
        day: "2-digit", 
        month: "long", 
        year: "numeric"
        });
    };

    const handleAddGuru = () => {
        setGuruList([...guruList, ""]);
    };

    const handleChangeGuru = (i: number, val: string) => {
        const updated = [...guruList];
        updated[i] = val;
        setGuruList(updated);
    };

    const handleRemoveGuru = (i: number) => {
        if (guruList.length > 1) {
        const updated = guruList.filter((_, index) => index !== i);
        setGuruList(updated);
        }
    };

    const handleSubmitMateri = async () => {
        if (!materi.trim() || guruList.every(g => !g.trim())) {
        setError("Harap isi nama guru dan materi");
        return;
        }

        setLoading(true);
        try {
        const tanggal = getFormattedDate();
        const filteredGuru = guruList.filter(g => g.trim() !== "");
        
        const { error: insertError } = await supabase
            .from("materi")
            .insert([
            {
                tanggal,
                guru: filteredGuru,
                isi: materi
            }
            ]);

        if (insertError) throw insertError;

        // Reset form
        setGuruList([""]);
        setMateri("");
        setError("");
        
        // Refresh data
        await fetchExistingData();
        
        alert("Materi berhasil disimpan!");
        } catch (err) {
        console.error("Error saving materi:", err);
        setError("Gagal menyimpan materi");
        } finally {
        setLoading(false);
        }
    };

    const handleSubmitPengumuman = async () => {
        if (!pengumuman.trim()) {
        setError("Harap isi pengumuman");
        return;
        }

        setLoading(true);
        try {
        const tanggal = getFormattedDate();

        const { error: insertError } = await supabase
            .from("pengumuman")
            .insert([
            {
                isi: pengumuman,
                tanggal
            }
            ]);

        if (insertError) throw insertError;

        // Reset form
        setPengumuman("");
        setError("");
        
        // Refresh data
        await fetchExistingData();
        
        alert("Pengumuman berhasil disimpan!");
        } catch (err) {
        console.error("Error saving pengumuman:", err);
        setError("Gagal menyimpan pengumuman");
        } finally {
        setLoading(false);
        }
    };

    // Delete materi
    const handleDeleteMateri = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) return;

        setLoading(true);
        try {
        const { error: deleteError } = await supabase
            .from("materi")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        // Refresh data
        await fetchExistingData();
        
        alert("Materi berhasil dihapus!");
        } catch (err) {
        console.error("Error deleting materi:", err);
        setError("Gagal menghapus materi");
        } finally {
        setLoading(false);
        }
    };

    // Delete pengumuman
    const handleDeletePengumuman = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) return;

        setLoading(true);
        try {
        const { error: deleteError } = await supabase
            .from("pengumuman")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        // Refresh data
        await fetchExistingData();
        
        alert("Pengumuman berhasil dihapus!");
        } catch (err) {
        console.error("Error deleting pengumuman:", err);
        setError("Gagal menghapus pengumuman");
        } finally {
        setLoading(false);
        }
    };

    // Prevent hydration issues by not rendering until client-side
    if (!isClient) {
        return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="flex justify-center items-center h-64">
                <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="mt-4 text-slate-600 font-medium">Loading...</div>
                </div>
            </div>
            </main>
        </>
        );
    }

    return (
        <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="text-center py-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                📋 Dashboard Laporan
                </h1>
                <p className="text-slate-600 text-lg">Kelola materi pembelajaran dan pengumuman dengan mudah</p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm animate-pulse">
                <div className="flex items-center">
                    <div className="text-red-400 mr-3">⚠️</div>
                    <div className="text-red-800 font-medium">{error}</div>
                </div>
                </div>
            )}

            {/* Grid Layout */}
            <div className="grid lg:grid-cols-2 gap-8">
                
                {/* Materi Section */}
                <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xl font-bold mr-4">
                    📚
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Laporan Materi</h2>
                </div>

                <div className="space-y-6">
                    {/* Guru Input Section */}
                    <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        👤 Nama Guru
                    </label>
                    {guruList.map((guru, i) => (
                        <div key={i} className="flex gap-3 group">
                        <div className="flex-1 relative">
                            <input
                            type="text"
                            placeholder={`Masukkan nama guru ${i + 1}`}
                            value={guru}
                            onChange={(e) => handleChangeGuru(i, e.target.value)}
                            className="w-full p-4 border-2 border-slate-200 rounded-xl bg-white/70 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 hover:border-slate-300"
                            />
                        </div>
                        {guruList.length > 1 && (
                            <button
                            onClick={() => handleRemoveGuru(i)}
                            className="w-12 h-12 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 rounded-xl border-2 border-red-200 hover:border-red-500 transition-all duration-200 group-hover:scale-105"
                            type="button"
                            >
                            ✕
                            </button>
                        )}
                        </div>
                    ))}
                    
                    <button 
                        onClick={handleAddGuru} 
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-4 py-2 rounded-lg transition-all duration-200"
                        type="button"
                    >
                        <span className="text-lg">➕</span> Tambah Guru
                    </button>
                    </div>

                    {/* Materi Input */}
                    <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                        📝 Ringkasan Materi
                    </label>
                    <textarea
                        rows={4}
                        placeholder="Jelaskan materi yang telah disampaikan..."
                        value={materi}
                        onChange={(e) => setMateri(e.target.value)}
                        className="w-full p-4 border-2 border-slate-200 rounded-xl bg-white/70 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none hover:border-slate-300"
                    />
                    </div>

                    {/* Submit Button */}
                    <button
                    onClick={handleSubmitMateri}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                    type="button"
                    >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menyimpan...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                        💾 Simpan Materi
                        </span>
                    )}
                    </button>
                </div>

                {/* Existing Materi List */}
                {existingMateri.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-200">
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        📋 Materi Terbaru
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {existingMateri.map((item, index) => (
                        <div key={item.id} className="bg-gradient-to-r from-slate-50 to-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]">
                            <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                    📅 {item.tanggal}
                                </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-3 flex items-center gap-2">
                                <span className="font-medium">👤 Guru:</span>
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                                    {Array.isArray(item.guru) ? item.guru.join(", ") : item.guru}
                                </span>
                                </p>
                                <p className="text-slate-800 leading-relaxed">{item.isi}</p>
                            </div>
                            <button
                                onClick={() => handleDeleteMateri(item.id)}
                                className="ml-4 w-10 h-10 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 rounded-lg border border-red-200 hover:border-red-500 transition-all duration-200 hover:scale-110"
                                disabled={loading}
                            >
                                🗑️
                            </button>
                            </div>
                        </div>
                        ))}
                    </div>
                    </div>
                )}
                </section>

                {/* Pengumuman Section */}
                <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-xl font-bold mr-4">
                    📢
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Buat Pengumuman</h2>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                        📝 Isi Pengumuman
                    </label>
                    <textarea
                        rows={5}
                        placeholder="Tulis pengumuman penting di sini..."
                        value={pengumuman}
                        onChange={(e) => setPengumuman(e.target.value)}
                        className="w-full p-4 border-2 border-slate-200 rounded-xl bg-white/70 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none hover:border-slate-300"
                    />
                    </div>

                    <button
                    onClick={handleSubmitPengumuman}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                    type="button"
                    >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menyimpan...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                        📢 Publikasikan Pengumuman
                        </span>
                    )}
                    </button>
                </div>

                {/* Existing Pengumuman List */}
                {existingPengumuman.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-200">
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        📋 Pengumuman Terbaru
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {existingPengumuman.map((item) => (
                        <div key={item.id} className="bg-gradient-to-r from-slate-50 to-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]">
                            <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                    📅 {item.tanggal}
                                </span>
                                </div>
                                <p className="text-slate-800 leading-relaxed">{item.isi}</p>
                            </div>
                            <button
                                onClick={() => handleDeletePengumuman(item.id)}
                                className="ml-4 w-10 h-10 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 rounded-lg border border-red-200 hover:border-red-500 transition-all duration-200 hover:scale-110"
                                disabled={loading}
                            >
                                🗑️
                            </button>
                            </div>
                        </div>
                        ))}
                    </div>
                    </div>
                )}
                </section>
            </div>
            </div>
        </main>
        </>
    );
    }