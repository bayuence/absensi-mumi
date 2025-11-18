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
    "LDII BPKULON Gresik",
    "Generus LDII",
  ],
  authors: [{ name: "Bayu Ence", url: "https://www.instagram.com/bayuence_" }],
  creator: "Bayu Ence",
  publisher: "Remaja LDII BPKULON",

  metadataBase: new URL("https://presensimumi.vercel.app"),

  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://presensimumi.vercel.app",
    siteName: "Presensi Generus LDII BPKULON",
    title: "Sistem Presensi Generus LDII BPKULON",
    description:
      "Platform presensi digital untuk generus LDII BPKULON Gresik – hadir lebih mudah, data tersimpan aman, rekap otomatis.",
    images: [
      {
        url: "/og-image.jpg",  // Pastikan file ini ada di /public
        width: 1200,
        height: 630,
        alt: "Presensi Generus LDII BPKULON",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    creator: "@bayuence_",
    title: "Sistem Presensi Generus LDII BPKULON",
    description:
      "Absensi generus berbasis web — mempermudah rekap kehadiran kegiatan mengaji & pembinaan.",
    images: ["/og-image.jpg"],
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  robots: {
    index: true,
    follow: true,
  },

  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    title: "Presensi Generus LDII BPKULON",
    statusBarStyle: "default",
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
