import { NextResponse } from 'next/server';
import {
  getAllVideosFromDb,
  upsertVideoInDb,
  updateVideoInDb,
  deleteVideoFromDb,
} from '@/lib/kingstream-db';

export const dynamic = 'force-dynamic';

// GET /api/kingstream/videos
export async function GET() {
  const videos = await getAllVideosFromDb();
  return NextResponse.json(
    {
      success: true,
      videos,
      timestamp: Date.now(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

// POST /api/kingstream/videos (Add new video or upsert)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { video, videos } = await upsertVideoInDb(body);

    return NextResponse.json({
      success: true,
      video,
      videos,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan video ke database' },
      { status: 500 }
    );
  }
}

// PUT /api/kingstream/videos (Update video or atomically increment views/playClicks)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, incrementViews, incrementPlayClicks, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID video diperlukan' },
        { status: 400 }
      );
    }

    const { video, videos } = await updateVideoInDb(
      id,
      updates,
      typeof incrementViews === 'number' ? incrementViews : undefined,
      typeof incrementPlayClicks === 'number' ? incrementPlayClicks : undefined
    );

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      video,
      videos,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui video di database' },
      { status: 500 }
    );
  }
}

// DELETE /api/kingstream/videos?id=... (Delete video)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID video diperlukan' },
        { status: 400 }
      );
    }

    const videos = await deleteVideoFromDb(id);

    return NextResponse.json({
      success: true,
      message: 'Video berhasil dihapus dari database',
      videos,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus video dari database' },
      { status: 500 }
    );
  }
}
