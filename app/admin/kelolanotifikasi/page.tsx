import Link from "next/link";

export default function KelolaNotifikasiPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-2xl font-bold mb-4 text-slate-800">Kelola Notifikasi</h1>
      <p className="text-lg text-slate-600 mb-6">Sedang dikembangkan oleh Ence.</p>
      <Link href="/admin" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all">
        Kembali
      </Link>
    </div>
  );
}
