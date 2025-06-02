    "use client";

    import Link from "next/link";
    import { useRouter } from "next/navigation";
    import { useEffect, useState } from "react";

    export default function Navbar() {
    const router = useRouter();
    const [username, setUsername] = useState("");

    useEffect(() => {
        const user = localStorage.getItem("loggedUser");
        if (!user) {
        router.push("/login");
        } else {
        setUsername(user);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    return (
        <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center shadow">
        <div className="flex gap-6 items-center">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/absensi" className="hover:underline">Presensi</Link>
            <Link href="/laporan" className="hover:underline">Laporan</Link>
            {username === "admin" && (
            <Link href="/admin" className="hover:underline">Admin</Link>
            )}
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm">👋 {username}</span>
            <button
            onClick={handleLogout}
            className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-200 text-sm"
            >
            Logout
            </button>
        </div>
        </nav>
    );
    }
    //     <div className="flex justify-between items-center">