export default function TentangPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-600">
        Sistem Presensi Generus LDII BPKULON
      </h1>

      <p>
        Sistem Presensi Generus LDII BPKULON adalah sebuah platform presensi
        berbasis website yang digunakan untuk mencatat kehadiran generus dalam
        kegiatan pembinaan, mengaji, dan kegiatan lainnya di lingkungan Remaja LDII
        BPKULON, Kecamatan Gresik, Kabupaten Gresik, Jawa Timur.
      </p>

      <h2 className="text-2xl font-semibold">Tujuan Sistem Presensi</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Monitoring kehadiran generus berjalan dengan baik</li>
        <li>Mempermudah pengurus remaja dalam rekap kehadiran</li>
        <li>Data presensi lengkap dan dapat dievaluasi</li>
        <li>Mengurangi kesalahan pencatatan manual</li>
      </ul>

      <h2 className="text-2xl font-semibold">Fitur Utama</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Presensi menggunakan kode unik setiap pertemuan</li>
        <li>Rekap kehadiran otomatis</li>
        <li>Dashboard admin untuk mengelola jadwal</li>
        <li>Riwayat presensi generus</li>
        <li>Login dan data pengguna tersimpan online</li>
      </ul>

      <h2 className="text-2xl font-semibold">Lokasi</h2>
      <p>
        Kegiatan generus LDII BPKULON berlokasi di BPKULON, Kecamatan Gresik,
        Kabupaten Gresik, Jawa Timur.
      </p>

      <h2 className="text-2xl font-semibold">Teknologi</h2>
      <p>
        Sistem ini dibangun dengan Next.js, Supabase, TailwindCSS dan di-deploy
        menggunakan Vercel.
      </p>
    </main>
  );
}
