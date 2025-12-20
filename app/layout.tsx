import type { Metadata } from "next";
import Script from "next/script";
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
    "Sistem presensi digital resmi Generus LDII BPKULON Gresik. Rekap data otomatis. Developed by bayuence",
  
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
    siteName: "Presensi Generus LDII BP Kulon",
    title: "Sistem Presensi Generus LDII BP Kulon",
    description:
      "Sistem presensi digital resmi Generus LDII BPKULON Gresik. Mudah, Cepat, Aman. Developed by ence",
    images: [
      {
        url: "/logo-ldii.png",
        width: 512,
        height: 512,
        alt: "Logo LDII BPKULON",
      },
    ],
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
    "name": "Presensi Generus",
    "alternateName": ["Presensi MUMI", "Sistem Presensi Generus LDII", "MUMI BPKULON"],
    "url": baseUrl,
    "publisher": {
      "@type": "Organization",
      "name": "Generus LDII BPKULON",
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="id">
      <head>
        {/* Google Site Verification */}
        <meta name="google-site-verification" content="6kO-dYQCtOZ7n1n2a3sCSmpHGQrCvmyNughcX793fYk" />
        {/* Manifest untuk PWA */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#22c55e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LDII BPKULON" />
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9VRC4Z4SB0"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9VRC4Z4SB0');
          `}
        </Script>
      </head>
      <body className="bg-gray-900 text-gray-100 antialiased">
        {/* Script JSON-LD disisipkan di sini */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
