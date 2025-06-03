    "use client";

    import { useState, useEffect } from "react";
    import { useRouter } from "next/navigation";
    import { createClient } from "@supabase/supabase-js";

    // Inisialisasi Supabase client
    const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    function LoginForm() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isRegister, setIsRegister] = useState(false);
    const [namaLengkap, setNamaLengkap] = useState("");
    const [asal, setAsal] = useState("");
    const [status, setStatus] = useState("");
    const [keterangan, setKeterangan] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const uname = username.trim().toLowerCase();

        if (!uname || !password || (isRegister && (!namaLengkap || !asal || !status || !keterangan))) {
        setError("❌ Harap isi semua kolom.");
        return;
        }

        if (isRegister) {
        const { data: existingUser } = await supabase
            .from("users")
            .select("username")
            .eq("username", uname)
            .single();

        if (existingUser) {
            setError("❌ Username sudah terdaftar.");
            return;
        }

        const { error: insertError } = await supabase.from("users").insert([
            {
            username: uname,
            password,
            nama: namaLengkap,
            asal,
            status,
            keterangan,
            },
        ]);

        if (insertError) {
            console.error("Insert Error:", insertError);
            setError("❌ Gagal mendaftar. Coba lagi.");
            return;
        }

        localStorage.setItem("loggedUser", uname);
        router.push("/dashboard");
        } else {
        const { data: foundUser, error: loginError } = await supabase
            .from("users")
            .select("*")
            .eq("username", uname)
            .eq("password", password)
            .single();

        if (!foundUser || loginError) {
            setError("❌ Username atau password salah.");
            return;
        }

        localStorage.setItem("loggedUser", foundUser.username);
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
                suppressHydrationWarning
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
                <input
                    type="text"
                    placeholder={
                    status === "Kuliah"
                        ? "Kuliah di mana?"
                        : status === "Pekerja"
                        ? "Kerja di mana?"
                        : "Keterangan (contoh: sekolah / kuliah / kerja)"
                    }
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full p-2 border rounded-md text-gray-900"
                />
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

    export default LoginForm;
