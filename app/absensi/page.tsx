    "use client";

    import { useEffect, useState } from "react";
    import { useRouter } from "next/navigation";
    import Navbar from "@/components/Navbar";

    interface JadwalGuru {
    tanggal: string;
    hari: string;
    guru: string[];
    kode: string;
    }

    interface Kehadiran {
    nama: string;
    tanggal: string;
    }

    interface Rekap {
    nama: string;
    hadir: number;
    tidakHadir: number;
    }

    export default function AbsensiPage() {
    const router = useRouter();
    const [kodeInput, setKodeInput] = useState("");
    const [message, setMessage] = useState("");
    const [nama, setNama] = useState("");
    const [hadirHariIni, setHadirHariIni] = useState<string[]>([]);
    const [rekap, setRekap] = useState<Rekap[]>([]);
    const [bulanOffset, setBulanOffset] = useState(0);

    useEffect(() => {
        const user = localStorage.getItem("loggedUser");
        const namaLengkap = localStorage.getItem("namaLengkap");
        if (!user || !namaLengkap) {
        router.push("/login");
        } else {
        setNama(namaLengkap);
        }
        tampilkanHadirHariIni();
    }, [router]);

    useEffect(() => {
        hitungRekap(bulanOffset);
    }, [bulanOffset]);

    const format = (tgl: string) => {
        if (!tgl) return "";
        const [d, bulanNama, y] = tgl.split(" ");
        const bulanList = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const m = (bulanList.indexOf(bulanNama) + 1).toString().padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const tampilkanHadirHariIni = () => {
        const all = localStorage.getItem("kehadiran") || "[]";
        const list: Kehadiran[] = JSON.parse(all);
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const filtered = list.filter((k) => k.tanggal === todayStr);
        setHadirHariIni(filtered.map((k) => k.nama));
    };

    const hitungRekap = (offset = 0) => {
        const jadwal: JadwalGuru[] = JSON.parse(localStorage.getItem("jadwal_guru") || "[]");
        const now = new Date();
        const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const targetMonth = target.getMonth();
        const targetYear = target.getFullYear();

        const semuaTanggal = jadwal
        .map((j) => ({ tanggal: format(j.tanggal), asli: j.tanggal }))
        .filter((j) => {
            const d = new Date(j.tanggal);
            return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
        });

        const kehadiran: Kehadiran[] = JSON.parse(localStorage.getItem("kehadiran") || "[]");
        const anggotaUnik = Array.from(new Set(kehadiran.map((k) => k.nama)));
        const semuaAnggota = [...anggotaUnik, nama];

        const data: Rekap[] = semuaAnggota.sort().map((n) => {
        const hadir = semuaTanggal.filter((tgl) => kehadiran.find((k) => k.nama === n && k.tanggal === tgl.tanggal)).length;
        return {
            nama: n,
            hadir,
            tidakHadir: semuaTanggal.length - hadir,
        };
        });

        setRekap(data);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const jadwal = localStorage.getItem("jadwal_guru") || "[]";
        const all: JadwalGuru[] = JSON.parse(jadwal);

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        const jadwalHariIni = all.find((j) => format(j.tanggal) === todayStr);
        if (!jadwalHariIni) {
        setMessage("❌ Tidak ada jadwal untuk hari ini.");
        return;
        }

        if (jadwalHariIni.kode !== kodeInput.trim().toUpperCase()) {
        setMessage("❌ Kode tidak cocok.");
        return;
        }

        const presensiList = JSON.parse(localStorage.getItem("kehadiran") || "[]");
        const sudahPresensi = presensiList.find((p: Kehadiran) => p.nama === nama && p.tanggal === todayStr);
        if (sudahPresensi) {
        setMessage("✅ Kamu sudah melakukan presensi hari ini.");
        return;
        }

        const updated = [...presensiList, { nama, tanggal: todayStr }];
        localStorage.setItem("kehadiran", JSON.stringify(updated));
        setMessage("✅ Berhasil presensi, terima kasih!");
        setKodeInput("");
        tampilkanHadirHariIni();
        hitungRekap(bulanOffset);
    };

    const labelBulan = new Date(new Date().getFullYear(), new Date().getMonth() + bulanOffset, 1)
        .toLocaleDateString("id-ID", { month: "long", year: "numeric" });

    return (
        <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-start px-4 py-10 space-y-10">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
            <h1 className="text-2xl font-bold text-center text-blue-800 mb-4">
                Presensi Kehadiran
            </h1>
            <p className="text-center text-sm text-gray-600 mb-6">
                Halo <span className="font-semibold text-blue-700">{nama}</span>, masukkan kode yang diberikan oleh guru pengajar.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                type="text"
                placeholder="Masukkan kode absensi"
                value={kodeInput}
                onChange={(e) => setKodeInput(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                Kirim
                </button>
            </form>

            {message && (
                <div className="mt-4 text-center text-sm text-gray-700">
                {message}
                </div>
            )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold text-blue-800 mb-2 text-center">Daftar Hadir Hari Ini</h2>
            {hadirHariIni.length > 0 ? (
                <ul className="text-sm text-gray-700 list-disc list-inside">
                {hadirHariIni.map((nama, i) => (
                    <li key={i}>{nama}</li>
                ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 text-center">Belum ada yang hadir.</p>
            )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-3xl">
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => setBulanOffset(bulanOffset - 1)} className="text-sm text-blue-600 hover:underline">
                ← Bulan Sebelumnya
                </button>
                <h2 className="text-lg font-semibold text-blue-800 text-center">
                📊 Rekap Kehadiran - {labelBulan}
                </h2>
                <button onClick={() => setBulanOffset(bulanOffset + 1)} className="text-sm text-blue-600 hover:underline">
                Bulan Berikutnya →
                </button>
            </div>
            <p className="text-center text-sm text-gray-500 mb-4">
                Menampilkan rekap berdasarkan jadwal bulan yang dipilih.
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-600 uppercase bg-gray-100">
                    <tr>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Hadir</th>
                    <th className="px-4 py-2">Tidak Hadir</th>
                    </tr>
                </thead>
                <tbody>
                    {rekap.map((r, i) => (
                    <tr key={i} className="border-b border-gray-200">
                        <td className="px-4 py-2 font-medium text-blue-800">{r.nama}</td>
                        <td className="px-4 py-2">{r.hadir}</td>
                        <td className="px-4 py-2">{r.tidakHadir}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        </main>
        </>
    );
    }
