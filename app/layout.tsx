import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sistem Presensi Generus LDII BPKULON",
    template: "%s | Presensi Generus LDII BPKULON",
  },
  description:
    "Platform presensi digital untuk generus LDII BPKULON Gresik – hadir lebih mudah, data tersimpan aman, rekap otomatis.",
  keywords: [
    "Presensi Generus",
    "Presensi LDII",
    "Absensi Remaja LDII",
    "Remaja LDII BPKULON",
    "Presensi Online LDII",
    "Absensi Mengaji LDII",
    "Kegiatan Pembinaan Generus",
    "LDII BPKULON Gresik",
  ],
  authors: [{ name: "Bayu Ence", url: "https://www.instagram.com/bayuence_" }],
  creator: "Bayu Ence",
  publisher: "Remaja LDII BPKULON",
  metadataBase: new URL("https://presensimumi.vercel.app"),

  openGraph: {
    type: "website",
    url: "https://presensimumi.vercel.app",
    siteName: "Presensi Generus LDII BPKULON",
    title: "Sistem Presensi Generus LDII BPKULON",
    description:
      "Platform presensi digital untuk generus LDII BPKULON Gresik – hadir lebih mudah, data tersimpan aman, rekap otomatis.",
    images: [
      {
        url: "https://opengraph.b-cdn.net/production/images/d9ac13e3-5af8-4e03-b301-ea82eb3e5e7e.png?token=nO6JTADnTfHs8PEp0ap1wYef73k-gOul6PSEQJ_kBGQ&height=927&width=952&expires=33299476635",
        width: 1200,
        height: 630,
        alt: "Presensi Generus LDII BPKULON",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@bayuence_",
    title: "Sistem Presensi Generus LDII BPKULON",
    description:
      "Platform presensi digital untuk generus LDII BPKULON Gresik – hadir lebih mudah, data tersimpan aman, rekap otomatis.",
    images: [
      "https://opengraph.b-cdn.net/production/images/d9ac13e3-5af8-4e03-b301-ea82eb3e5e7e.png?token=nO6JTADnTfHs8PEp0ap1wYef73k-gOul6PSEQJ_kBGQ&height=927&width=952&expires=33299476635",
    ],
  },

  robots: { index: true, follow: true },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
