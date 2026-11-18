import type { Metadata } from 'next';
import KingStreamLanding from '@/components/kingstream/KingStreamLanding';

export const metadata: Metadata = {
  title: 'Stream18+ - Nonton Video Terbaru 2026',
  description: 'Stream18+ adalah situs streaming video viral, koleksi terbaru, dan video terupdate setiap hari',
  icons: {
    icon: '/icon.png?v=3',
    shortcut: '/favicon.ico?v=3',
  },
};

export default function HomePage() {
  return <KingStreamLanding />;
}
