import React from "react";

export const metadata = {
  title: "Tentang Sistem Presensi Generus LDII BPKULON",
  description:
    "Sistem Presensi Generus LDII BPKULON adalah platform presensi berbasis website untuk mencatat kehadiran generus dalam kegiatan pembinaan dan mengaji di lingkungan LDII BPKULON Gresik.",
};

export default function TentangPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-600">
        Sistem Presensi Generus LDII BPKULON
      </h1>

      <p>
        Sistem Presensi Generus LDII BPKULON adalah sebuah platform presensi
        berbasis website yang digunakan untuk mencatat kehadiran generus dalam
        kegiatan pembinaan, mengaji, dan kegiatan lainnya di lingkungan Remaja
        LDII BPKULON, Kecamatan Gresik, Kabupaten Gresik, Jawa Timur.
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
        Sistem ini dibangun dengan Next.js, Supabase, TailwindCSS, dan di-deploy
        menggunakan Vercel.
      </p>

      {/* Credit Developer */}
      <p className="mt-3 text-xs sm:text-sm text-gray-400 opacity-60 font-light">
        Developed by{" "}
        <a
          href="https://www.instagram.com/bayuence_?igsh=c2NxZ2swM3Q3aTUy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-pink-400 transition-colors duration-300 font-medium underline decoration-dotted underline-offset-2 hover:decoration-solid"
        >
          Ence
        </a>
      </p>

      {/* Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Sistem Presensi Generus LDII BPKULON",
            url: "https://presensimumi.vercel.app/tentang",
            applicationCategory: "Attendance Tracking System",
            operatingSystem: "Web",
            inLanguage: "id-ID",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "IDR",
            },
            author: {
              "@type": "Person",
              name: "Bayu ence",
              url: "https://www.instagram.com/bayuence_?igsh=c2NxZ2swM3Q3aTUy",
            },
            creator: {
              "@type": "Person",
              name: "Bayu ence",
            },
            publisher: {
              "@type": "Organization",
              name: "Generus LDII BPKULON",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Gresik",
                addressRegion: "Jawa Timur",
                addressCountry: "ID",
              },
            },
            description:
              "Sistem presensi berbasis web untuk mencatat kehadiran generus dalam kegiatan pembinaan dan mengaji di LDII BPKULON Gresik.",
          }),
        }}
      />
    </main>
  );
}
