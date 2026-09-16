import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'GoSmart AdGuard - Self-Hosted FullScript & Anti-Bypass System',
  description: 'Sistem modular mandiri (Self-Hosted) penampil iklan, skrip injeksi otomatis tautan keluar, dan verifikasi Anti-Bypass dengan token & single-use hash 10 detik.',
  openGraph: {
    title: 'GoSmart AdGuard - Self-Hosted FullScript & Anti-Bypass System',
    description: 'Sistem modular mandiri (Self-Hosted) penampil iklan, skrip injeksi otomatis tautan keluar, dan verifikasi Anti-Bypass dengan token & single-use hash 10 detik.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoSmart AdGuard - Self-Hosted FullScript & Anti-Bypass System',
    description: 'Sistem modular mandiri (Self-Hosted) penampil iklan, skrip injeksi otomatis tautan keluar, dan verifikasi Anti-Bypass dengan token & single-use hash 10 detik.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
