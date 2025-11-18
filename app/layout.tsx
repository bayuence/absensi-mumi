import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sistem Presensi Generus LDII BPKULON",
    template: "%s | Presensi Generus LDII BPKULON",
  },
  description:
    "Sistem Presensi Generus LDII BPKULON berbasis website untuk mempermudah pengurus dalam pencatatan absensi kegiatan mengaji, pembinaan, dan aktivitas generus lainnya.",
  keywords: [
    "Presensi Generus",
    "Presensi LDII",
    "Absensi Remaja LDII",
    "Remaja LDII BPKULON",
    "Presensi Online LDII",
    "Absensi Mengaji LDII",
  ],
  authors: [{ name: "Bayu Ence", url: "https://www.instagram.com/bayuence_" }],
  creator: "Bayu Ence",
  publisher: "Remaja LDII BPKULON",
  metadataBase: new URL("https://presensimumi.vercel.app"),
  openGraph: {
    type: "website",
    title: "Sistem Presensi Generus LDII BPKULON",
    description:
      "Platform presensi digital untuk generus LDII BPKULON Gresik – hadir lebih mudah, data tersimpan aman, rekap otomatis.",
    url: "https://presensimumi.vercel.app",
    siteName: "Presensi Generus LDII BPKULON",
    images: [
      {
        url: "/og-image.jpg", // bikin nanti kalau belum ada
        width: 1200,
        height: 630,
        alt: "Presensi Generus LDII BPKULON",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistem Presensi Generus LDII BPKULON",
    description:
      "Absensi generus berbasis web — mempermudah rekap kehadiran kegiatan mengaji & pembinaan.",
    images: ["/og-image.jpg"],
    creator: "@bayuence_",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-gray-900 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
