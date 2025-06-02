    "use client";

    import { useState, useEffect } from "react";
    import Navbar from "@/components/Navbar";

    interface MateriItem {
    tanggal: string;
    guru: string[];
    materi: string;
    }

    interface PengumumanItem {
    isi: string;
    tanggal: string;
    }

    export default function LaporanPage() {
    const [guruList, setGuruList] = useState<string[]>([""]);
    const [materi, setMateri] = useState("");
    const [materiList, setMateriList] = useState<MateriItem[]>([]);
    const [pengumuman, setPengumuman] = useState("");
    const [pengumumanList, setPengumumanList] = useState<PengumumanItem[]>([]);

    useEffect(() => {
        const storedMateri = JSON.parse(localStorage.getItem("materi") || "[]");
        setMateriList(storedMateri);
        const storedPengumuman = JSON.parse(localStorage.getItem("pengumuman") || "[]");
        setPengumumanList(storedPengumuman);
    }, []);

    const handleAddGuru = () => {
        setGuruList([...guruList, ""]);
    };

    const handleChangeGuru = (i: number, val: string) => {
        const updated = [...guruList];
        updated[i] = val;
        setGuruList(updated);
    };

    const handleSubmitMateri = () => {
        const today = new Date();
        const tanggal = today.toLocaleDateString("id-ID", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
        });
        const newData = { tanggal, guru: guruList, materi };
        const updated = [newData, ...materiList];
        localStorage.setItem("materi", JSON.stringify(updated));
        setMateriList(updated);
        setGuruList([""]);
        setMateri("");
    };

    const handleSubmitPengumuman = () => {
        const today = new Date();
        const tanggal = today.toLocaleDateString("id-ID", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
        });
        const newItem = { isi: pengumuman, tanggal };
        const updated = [newItem, ...pengumumanList];
        localStorage.setItem("pengumuman", JSON.stringify(updated));
        setPengumumanList(updated);
        setPengumuman("");
    };

    const handleDeletePengumuman = (index: number) => {
        const updated = pengumumanList.filter((_, i) => i !== index);
        setPengumumanList(updated);
        localStorage.setItem("pengumuman", JSON.stringify(updated));
    };

    return (
        <>
        <Navbar />
        <main className="min-h-screen bg-white p-6 text-gray-800 space-y-10">
            <section className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">📚 Laporan Materi Terakhir</h2>
            <div className="space-y-4">
                {guruList.map((guru, i) => (
                <input
                    key={i}
                    type="text"
                    placeholder={`Nama Guru ${i + 1}`}
                    value={guru}
                    onChange={(e) => handleChangeGuru(i, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded bg-white text-gray-900"
                />
                ))}
                <button onClick={handleAddGuru} className="text-sm text-blue-700 hover:underline">
                + Tambah Guru
                </button>
                <textarea
                rows={3}
                placeholder="Ringkasan materi yang disampaikan..."
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded bg-white text-gray-900"
                ></textarea>
                <button
                onClick={handleSubmitMateri}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                Simpan Materi
                </button>
            </div>
            </section>

            <section className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">📢 Buat Pengumuman</h2>
            <textarea
                rows={3}
                placeholder="Tulis pengumuman di sini..."
                value={pengumuman}
                onChange={(e) => setPengumuman(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded bg-white text-gray-900"
            ></textarea>
            <button
                onClick={handleSubmitPengumuman}
                className="mt-3 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
                Simpan Pengumuman
            </button>

            {pengumumanList.length > 0 && (
                <div className="mt-6 space-y-4">
                {pengumumanList.map((p, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded shadow flex justify-between">
                    <div>
                        <p className="font-semibold text-gray-800">📅 {p.tanggal}</p>
                        <p className="text-sm text-gray-700 mt-1">{p.isi}</p>
                    </div>
                    <button
                        onClick={() => handleDeletePengumuman(i)}
                        className="text-sm text-red-600 hover:underline"
                    >
                        Hapus
                    </button>
                    </div>
                ))}
                </div>
            )}
            </section>
        </main>
        </>
    );
    }
