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
      { url: '/icon.png?v=3', type: 'image/png' },
      { url: '/favicon.ico?v=3', type: 'image/x-icon' },
      { url: '/images/kingstream-logo.png?v=3', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico?v=3'],
    apple: ['/apple-icon.png?v=3'],
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
        <link rel="icon" href="/icon.png?v=3" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
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
