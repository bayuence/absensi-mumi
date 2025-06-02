    "use client";

    import { useEffect, useState } from "react";
    import Navbar from "@/components/Navbar";

    interface JadwalGuru {
    tanggal: string;
    guru: string[];
    kode: string;
    }

    interface MateriItem {
    tanggal: string;
    guru: string[];
    materi: string;
    }

    interface PengumumanItem {
    isi: string;
    tanggal: string;
    }

    interface UserItem {
    username: string;
    namaLengkap: string;
    asal: string;
    status: string;
    }

    export default function Dashboard() {
    const [jadwalHariIni, setJadwalHariIni] = useState<JadwalGuru | null>(null);
    const [jadwalSelanjutnya, setJadwalSelanjutnya] = useState<JadwalGuru | null>(null);
    const [materiTerakhir, setMateriTerakhir] = useState<MateriItem | null>(null);
    const [pengumumanList, setPengumumanList] = useState<PengumumanItem[]>([]);
    const [userList, setUserList] = useState<UserItem[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const jadwal: JadwalGuru[] = JSON.parse(localStorage.getItem("jadwal_guru") || "[]");
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

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

        const jadwalFormatted = jadwal.map((j) => ({ ...j, tanggalISO: format(j.tanggal) }));
        const hariIni = jadwalFormatted.find((j) => j.tanggalISO === todayStr);
        const setelahHariIni = jadwalFormatted.filter((j) => j.tanggalISO > todayStr);
        const selanjutnya = setelahHariIni.sort((a, b) => (a.tanggalISO > b.tanggalISO ? 1 : -1))[0];

        setJadwalHariIni(hariIni || null);
        setJadwalSelanjutnya(selanjutnya || null);

        const materi: MateriItem[] = JSON.parse(localStorage.getItem("materi") || "[]");
        if (materi.length > 0) setMateriTerakhir(materi[0]);

        const pengumuman: PengumumanItem[] = JSON.parse(localStorage.getItem("pengumuman") || "[]");
        setPengumumanList(pengumuman);

        const users: UserItem[] = JSON.parse(localStorage.getItem("users") || "[]");
        const sorted = users.sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));
        setUserList(sorted);
    }, []);

    const filteredUsers = userList.filter((u) =>
        u.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
        u.asal.toLowerCase().includes(search.toLowerCase()) ||
        u.status.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
        <Navbar />
        <main className="min-h-screen bg-blue-50 py-10 px-4 space-y-10">
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <h1 className="text-2xl font-bold text-blue-800 mb-2">Selamat Datang di MUMI BP Kulon</h1>
            <p className="text-gray-700">
                Website absensi untuk pengajian MUMI BP Kulon. Kami pengurus akan lebih mudah mengontrol kehadiran.
                Semoga ngajinya tertib dan selalu bersemangat, tidak bolos! 💪
            </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">📚 Materi Terakhir</h2>
                {materiTerakhir ? (
                <>
                    <p className="text-sm text-gray-700 mb-1">{materiTerakhir.materi}</p>
                    <p className="text-sm text-gray-600">{materiTerakhir.guru.join(", ")} • {materiTerakhir.tanggal}</p>
                </>
                ) : (
                <p className="text-sm text-gray-500">Belum ada materi terakhir.</p>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">📅 Jadwal Hari Ini</h2>
                {jadwalHariIni ? (
                <>
                    <p className="text-sm text-gray-600 mb-1">{jadwalHariIni.tanggal}</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                    {jadwalHariIni.guru.map((g, i) => (
                        <li key={i}>👤 {g}</li>
                    ))}
                    </ul>
                </>
                ) : (
                <p className="text-sm text-gray-500">Belum ada jadwal untuk hari ini.</p>
                )}
            </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">⏭ Jadwal Selanjutnya</h2>
            {jadwalSelanjutnya ? (
                <>
                <p className="text-sm text-gray-600 mb-1">{jadwalSelanjutnya.tanggal}</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                    {jadwalSelanjutnya.guru.map((g, i) => (
                    <li key={i}>👤 {g}</li>
                    ))}
                </ul>
                </>
            ) : (
                <p className="text-sm text-gray-500">Belum ada jadwal berikutnya.</p>
            )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">📢 Pengumuman</h2>
            {pengumumanList.length > 0 ? (
                <ul className="space-y-3">
                {pengumumanList.map((p, i) => (
                    <li key={i} className="text-sm text-gray-700 border-b pb-2">
                    <p className="font-semibold text-gray-800">📅 {p.tanggal}</p>
                    <p>{p.isi}</p>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">Belum ada pengumuman terbaru.</p>
            )}
            <p className="text-xs text-gray-400 mt-2">Pantau halaman ini untuk update penting.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">👥 Daftar Anggota</h2>
            <input
                type="text"
                placeholder="Cari nama, asal, atau status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full mb-4 p-3 border border-gray-300 rounded-md bg-white text-gray-800"
            />
            <ul className="space-y-3">
                {filteredUsers.map((user, index) => (
                <li key={index} className="border-b pb-2 text-sm text-gray-700">
                    <p className="font-semibold text-blue-800">{user.namaLengkap}</p>
                    <p className="text-sm text-gray-600">Asal: {user.asal}</p>
                    <p className="text-sm text-gray-600">Status: {user.status}</p>
                </li>
                ))}
                {filteredUsers.length === 0 && (
                <p className="text-sm text-gray-500">Tidak ditemukan hasil pencarian.</p>
                )}
            </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <h2 className="text-sm text-gray-600">✨ Website ini dibuat dengan semangat oleh</h2>
            <p className="text-base font-semibold text-blue-700">Bayuence</p>
            <p className="text-xs text-gray-500 italic mt-1">Semoga membawa manfaat untuk jamaah MUMI BP Kulon dan menjadi amal jariyah. 🤲</p>
            </div>
        </main>
        </>
    );
    }

