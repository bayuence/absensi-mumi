import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Selamat Datang di Website Presensi MUMI 👋</h1>
      <p className="mb-6 text-lg text-gray-600">Silakan login untuk melanjutkan</p>
      
      <Link
        href="/login"
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Login Sekarang
      </Link>
    </main>
  );
}
