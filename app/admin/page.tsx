    "use client";

    import { useEffect, useState } from "react";
    import { useRouter } from "next/navigation";
    import Navbar from "@/components/Navbar";

    interface JadwalItem {
    tanggal: string;
    hari: string;
    guru: string[];
    kode: string;
    }

    export default function AdminPage() {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [guruList, setGuruList] = useState<string[]>([""]);
    const [kode, setKode] = useState("");
    const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
    const [anggota, setAnggota] = useState<any[]>([]);
    const [kehadiran, setKehadiran] = useState<any[]>([]);
    const [bulanDipilih, setBulanDipilih] = useState<number>(new Date().getMonth());
    const [tahunDipilih, setTahunDipilih] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        const user = localStorage.getItem("loggedUser");
        if (user !== "admin") router.push("/dashboard");

        const saved = localStorage.getItem("jadwal_guru");
        if (saved) setJadwal(JSON.parse(saved));

        const userList = JSON.parse(localStorage.getItem("users") || "[]");
        setAnggota(userList);
        const kehadiranList = JSON.parse(localStorage.getItem("kehadiran") || "[]");
        setKehadiran(kehadiranList);
    }, [router]);

    const handleAddGuru = () => {
        setGuruList([...guruList, ""]);
    };

    const handleChangeGuru = (index: number, value: string) => {
        const updated = [...guruList];
        updated[index] = value;
        setGuruList(updated);
    };

    const handleGenerateKode = () => {
        const newKode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setKode(newKode);
    };

    const formatTanggalLengkap = (tanggalStr: string): { tanggal: string; hari: string } => {
        const tanggal = new Date(tanggalStr);
        const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const bulanList = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const hari = hariList[tanggal.getDay()];
        const tanggalLengkap = `${tanggal.getDate().toString().padStart(2, "0")} ${bulanList[tanggal.getMonth()]} ${tanggal.getFullYear()}`;
        return { hari, tanggal: tanggalLengkap };
    };

    const handleSubmit = () => {
        if (!selectedDate || guruList.some((g) => g.trim() === "") || !kode) return;
        const { hari, tanggal } = formatTanggalLengkap(selectedDate);
        const newJadwal = [...jadwal, { hari, tanggal, guru: guruList, kode }];
        setJadwal(newJadwal);
        localStorage.setItem("jadwal_guru", JSON.stringify(newJadwal));
        setSelectedDate("");
        setGuruList([""]);
        setKode("");
    };

    const handleDelete = (index: number) => {
        const newList = jadwal.filter((_, i) => i !== index);
        setJadwal(newList);
        localStorage.setItem("jadwal_guru", JSON.stringify(newList));
    };

    const hapusAkun = (username: string) => {
        const filtered = anggota.filter((a: any) => a.username !== username);
        localStorage.setItem("users", JSON.stringify(filtered));
        setAnggota(filtered);
    };

    const exportExcel = () => {
        const data = kehadiran.filter((k) => {
        const date = new Date(k.tanggal);
        return date.getMonth() === bulanDipilih && date.getFullYear() === tahunDipilih;
        });
        let csv = "Nama,Tanggal\n" + data.map((d) => `${d.nama},${d.tanggal}`).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kehadiran_${bulanDipilih + 1}_${tahunDipilih}.csv`;
        a.click();
    };

    return (
        <>
        <Navbar />
        <main className="min-h-screen bg-white p-6 space-y-8 text-gray-800">
            <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">🗓️ Jadwal Guru & Kode Absensi</h2>
            <div className="space-y-6">
                <div>
                <label className="font-semibold text-gray-800">📆 Pilih Tanggal</label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md bg-white text-gray-900"
                />
                </div>
                <div>
                <label className="font-semibold text-gray-800">👨‍🏫 Nama Guru</label>
                {guruList.map((guru, idx) => (
                    <input
                    key={idx}
                    type="text"
                    placeholder={`Guru ${idx + 1}`}
                    value={guru}
                    onChange={(e) => handleChangeGuru(idx, e.target.value)}
                    className="w-full mt-1 mb-2 p-3 border border-gray-300 rounded-md bg-white text-gray-900"
                    />
                ))}
                <button onClick={handleAddGuru} className="text-sm text-blue-700 hover:underline">+ Tambah Guru</button>
                </div>
                <div>
                <label className="font-semibold text-gray-800">🔐 Kode Absensi</label>
                <div className="flex gap-4 mt-1">
                    <input
                    type="text"
                    value={kode}
                    onChange={(e) => setKode(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-md bg-white text-gray-900"
                    />
                    <button
                    onClick={handleGenerateKode}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                    Generate
                    </button>
                </div>
                </div>
                <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                📝 Jadwalkan
                </button>
            </div>

            {jadwal.length > 0 && (
                <div className="mt-10">
                <h3 className="text-lg font-semibold text-blue-700 mb-4">📋 Jadwal Tersimpan</h3>
                <ul className="space-y-4">
                    {jadwal.map((j, i) => (
                    <li key={i} className="bg-blue-50 p-4 rounded shadow flex justify-between items-start">
                        <div>
                        <p className="text-blue-800 font-medium">{j.hari}, {j.tanggal}</p>
                        <p className="text-sm text-gray-600">Kode: {j.kode}</p>
                        <p className="text-sm text-gray-700 mt-1">{j.guru.map((g) => `👤 ${g}`).join(", ")}</p>
                        </div>
                        <button onClick={() => handleDelete(i)} className="text-red-600 hover:text-red-800 text-sm">🗑️ Hapus</button>
                    </li>
                    ))}
                </ul>
                </div>
            )}
            </section>

            <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">📤 Export Kehadiran ke Excel</h2>
            <div className="flex gap-4 mb-4">
                <input
                type="number"
                value={tahunDipilih}
                onChange={(e) => setTahunDipilih(parseInt(e.target.value))}
                placeholder="Tahun"
                className="w-1/2 p-2 border border-gray-300 rounded text-gray-900"
                />
                <select
                value={bulanDipilih}
                onChange={(e) => setBulanDipilih(parseInt(e.target.value))}
                className="w-1/2 p-2 border border-gray-300 rounded text-gray-900"
                >
                {[
                    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                ].map((b, i) => (
                    <option key={i} value={i}>{b}</option>
                ))}
                </select>
            </div>
            <button onClick={exportExcel} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Export Data
            </button>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">👥 Kelola Anggota</h2>
            <ul className="space-y-3">
                {anggota.map((a, i) => (
                <li key={i} className="flex justify-between items-center border-b pb-2">
                    <div>
                    <p className="text-sm font-semibold text-gray-800">{a.namaLengkap} ({a.username})</p>
                    <p className="text-xs text-gray-600">{a.status} - {a.asal}</p>
                    </div>
                    {a.username !== "admin" && (
                    <button onClick={() => hapusAkun(a.username)} className="text-sm text-red-600 hover:underline">Hapus</button>
                    )}
                </li>
                ))}
            </ul>
            </section>
        </main>
        </>
    );
    }
