import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GENERUS LDII BPKULON",
  description: "Sistem Presensi Generus LDII BPKULON",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo-ldii.png", sizes: "any" },
      { url: "/logo-ldii.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-ldii.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/logo-ldii.png", sizes: "180x180", type: "image/png" }],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GENERUS LDII BPKULON",
  },

  // 🟢 Tambahkan ini untuk Google Search Console
  verification: {
    google: "6kO-dYQCtOZ7n1n2a3sCSmpHGQrCvmyNughcX793fYk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/logo-ldii.png" sizes="any" />
        <link rel="apple-touch-icon" href="/logo-ldii.png" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LDII BPKULON" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
