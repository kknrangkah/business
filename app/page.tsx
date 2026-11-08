import type { Metadata } from 'next';
import KingStreamLanding from '@/components/kingstream/KingStreamLanding';

export const metadata: Metadata = {
  title: 'KingStream - Nonton Video Terbaru 2026',
  description: 'KingStream adalah situs streaming video viral, koleksi terbaru, dan video terupdate setiap hari',
  icons: {
    icon: '/images/crown-icon.svg',
  },
};

export default function HomePage() {
  return <KingStreamLanding />;
}
