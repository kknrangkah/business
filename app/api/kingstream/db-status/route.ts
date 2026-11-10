import { NextResponse } from 'next/server';
import { getDatabaseStatus } from '@/lib/kingstream-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await getDatabaseStatus();
  return NextResponse.json(
    {
      success: true,
      database: status,
      timestamp: Date.now(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}
