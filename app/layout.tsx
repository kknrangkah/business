import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { RMEProvider } from '@/context/rme-context';
import { Toaster } from 'sonner';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0D061A',
};

export const metadata: Metadata = {
  title: 'Stream18+ - Nonton Video Terbaru 2026',
  description: 'Stream18+ adalah situs streaming video viral, koleksi terbaru, dan video terupdate setiap hari.',
  icons: {
    icon: [
      { url: '/images/kingstream-logo.png', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: ['/images/kingstream-logo.png'],
    apple: ['/apple-icon.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} font-sans h-full antialiased dark`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/kingstream-logo.png" type="image/png" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0D061A] text-slate-100 selection:bg-purple-600 selection:text-white" suppressHydrationWarning>
        <RMEProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </RMEProvider>
      </body>
    </html>
  );
}
