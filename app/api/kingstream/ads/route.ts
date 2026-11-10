import { NextResponse } from 'next/server';
import { getSettingsFromDb, updateSettingsInDb } from '@/lib/kingstream-db';

export const dynamic = 'force-dynamic';

// GET /api/kingstream/ads
export async function GET() {
  const { adConfig, telegramConfig } = await getSettingsFromDb();
  return NextResponse.json(
    {
      success: true,
      adConfig,
      telegramConfig,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

// POST /api/kingstream/ads (Update ad and telegram config)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adConfig, telegramConfig } = await updateSettingsInDb({
      adConfig: body.adConfig,
      telegramConfig: body.telegramConfig,
    });

    return NextResponse.json({
      success: true,
      adConfig,
      telegramConfig,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui konfigurasi iklan di database' },
      { status: 500 }
    );
  }
}
