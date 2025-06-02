    "use client";

    import { useState } from "react";
    import { useRouter } from "next/navigation";

    interface UserData {
    username: string;
    password: string;
    nama: string;
    asal: string;
    status: string;
    keterangan: string;
    }

    export default function LoginPage() {
    const router = useRouter();

    const [users, setUsers] = useState<UserData[]>([
        {
        username: "admin",
        password: "admin123",
        nama: "Administrator",
        asal: "BP Kulon",
        status: "Pekerja",
        keterangan: "Panitia",
        },
        {
        username: "walimumi",
        password: "walimumi",
        nama: "wali murid MUMI",
        asal: "BP Kulon",
        status: "Pribumi",
        keterangan: "wali murid MUMI",
        },
        {
        username: "fajar",
        password: "abcde",
        nama: "Fajar Hidayat",
        asal: "BP Selatan",
        status: "Kuliah",
        keterangan: "UGM",
        },
    ]);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isRegister, setIsRegister] = useState(false);
    const [namaLengkap, setNamaLengkap] = useState("");
    const [asal, setAsal] = useState("");
    const [status, setStatus] = useState("");
    const [keterangan, setKeterangan] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const uname = username.trim().toLowerCase();

        if (
        !uname ||
        !password ||
        (isRegister && (!namaLengkap || !asal || !status || !keterangan))
        ) {
        setError("❌ Harap isi semua kolom.");
        return;
        }

        if (isRegister) {
        const exists = users.find((u) => u.username === uname);
        if (exists) {
            setError("❌ Username sudah terdaftar.");
            return;
        }

        const newUser: UserData = {
            username: uname,
            password,
            nama: namaLengkap.trim(),
            asal: asal.trim(),
            status,
            keterangan: keterangan.trim(),
        };

        setUsers([...users, newUser]);
        localStorage.setItem("loggedUser", uname);
        localStorage.setItem("namaLengkap", newUser.nama);
        localStorage.setItem("asal", newUser.asal);
        localStorage.setItem("status", newUser.status);
        localStorage.setItem("keterangan", newUser.keterangan);

        router.push("/dashboard");
        } else {
        const found = users.find(
            (u) => u.username === uname && u.password === password
        );

        if (!found) {
            setError("❌ Username atau password salah.");
            return;
        }

        localStorage.setItem("loggedUser", found.username);
        localStorage.setItem("namaLengkap", found.nama);
        localStorage.setItem("asal", found.asal);
        localStorage.setItem("status", found.status);
        localStorage.setItem("keterangan", found.keterangan);

        router.push("/dashboard");
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            {isRegister ? "Buat Akun Baru" : "Login Absensi MUMI"}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => {
                setUsername(e.target.value);
                setError("");
                }}
                className="w-full p-2 border rounded-md text-gray-900"
            />

            <div className="relative">
                <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                }}
                className="w-full p-2 border rounded-md text-gray-900 pr-10"
                />
                <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-sm text-gray-600"
                >
                {showPassword ? "🙈" : "👁️"}
                </button>
            </div>

            {isRegister && (
                <>
                <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={namaLengkap}
                    onChange={(e) => {
                    setNamaLengkap(e.target.value);
                    setError("");
                    }}
                    className="w-full p-2 border rounded-md text-gray-900"
                />

                <input
                    type="text"
                    placeholder="Asal (contoh: BP Kulon)"
                    value={asal}
                    onChange={(e) => {
                    setAsal(e.target.value);
                    setError("");
                    }}
                    className="w-full p-2 border rounded-md text-gray-900"
                />

                <select
                    value={status}
                    onChange={(e) => {
                    setStatus(e.target.value);
                    setKeterangan("");
                    setError("");
                    }}
                    className="w-full p-2 border rounded-md text-gray-900"
                >
                    <option value="">Pilih Status</option>
                    <option value="Pribumi">Pribumi</option>
                    <option value="Kuliah">Kuliah</option>
                    <option value="Pekerja">Pekerja</option>
                </select>

                {status === "Pribumi" && (
                    <input
                    type="text"
                    placeholder="Keterangan (contoh: sekolah / kuliah / kerja)"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full p-2 border rounded-md text-gray-900"
                    />
                )}

                {status === "Kuliah" && (
                    <input
                    type="text"
                    placeholder="Kuliah di mana?"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full p-2 border rounded-md text-gray-900"
                    />
                )}

                {status === "Pekerja" && (
                    <input
                    type="text"
                    placeholder="Kerja di mana?"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full p-2 border rounded-md text-gray-900"
                    />
                )}
                </>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
            >
                {isRegister ? "Daftar" : "Login"}
            </button>

            <button
                type="button"
                onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                }}
                className="w-full text-blue-600 underline text-sm mt-2"
            >
                {isRegister ? "Sudah punya akun? Login" : "Belum punya akun? Daftar"}
            </button>
            </form>
        </div>
        </main>
    );
    }
