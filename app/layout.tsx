import type { Metadata } from "next";
import "./globals.css";

// URL website kamu (Penting untuk SEO)
const baseUrl = "https://presensimumi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  
  // Pengaturan Judul: Tidak kapital semua agar terlihat profesional di Google
  title: {
    default: "Sistem Presensi Generus LDII BPKulon",
    template: "%s | Presensi Generus LDII BPKulon",
  },
  
  // Deskripsi yang akan muncul di bawah judul di Google
  description:
    "Sistem presensi digital resmi Generus LDII BPKULON Gresik. Login untuk absensi kegiatan, rekap data otomatis, dan monitoring kehadiran yang aman. Developed by bayuence",
  
  keywords: [
    "Presensi MUMI",
    "Presensi MUMI BPkulon",
    "Presensi MUMI Gresik",
    "Presensi Generus LDII Gresik",
    "Presensi Generus Gresik",
    "LDII GRESIK",
    "LDII gresik",
    "LDII BPkulon",
    "Presensi Generus LDII",
    "LDII",
    "LDII BPKULON",
    "Absensi Digital LDII",
    "Generus Gresik",
    "Sistem Informasi LDII",
  ],
  
  authors: [{ name: "Bayu Ence", url: "https://www.instagram.com/bayuence_" }],
  creator: "Bayu Ence",
  publisher: "Generus LDII BPKULON",

  icons: {
    icon: "/favicon.ico",
    // Jika punya logo khusus format PNG, pastikan ada di folder public dan uncomment baris bawah:
    // icon: [{ url: "/favicon.ico" }, { url: "/logo.png", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    type: "website",
    url: baseUrl,
    siteName: "Presensi Generus LDII BP Kulon", // Memberitahu Google nama situs ini Presensi MUMI
    title: "Sistem Presensi Generus LDII BP Kulon",
    description:
      "Sistem presensi digital resmi Generus LDII BPKULON Gresik. Mudah, Cepat, Aman. Developed by ence",
    // Catatan: Next.js akan otomatis mencari file 'opengraph-image.png' di folder app
    // Jadi kita tidak perlu menulis url gambar manual di sini.
  },

  twitter: {
    card: "summary_large_image",
    site: "@bayuence_",
    title: "Sistem Presensi MUMI - Generus LDII BP Kulon",
    description:
      "Sistem presensi digital resmi Generus LDII BPKULON Gresik. Mudah, Cepat, Aman. Developed by ence",
  },

  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Script JSON-LD: Ini "Rahasia" agar tulisan Vercel hilang diganti nama Web
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Presensi MUMI",
    "alternateName": ["Sistem Presensi Generus LDII", "MUMI BPKULON"],
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="id">
      <body className="bg-gray-900 text-gray-100 antialiased">
        {/* Script disisipkan di sini */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
