import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'kingstream-db.json');

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { videos: [], adConfig: {}, telegramConfig: {} };
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading kingstream-db.json:', error);
    return { videos: [], adConfig: {}, telegramConfig: {} };
  }
}

function writeDb(data: any) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing kingstream-db.json:', error);
    return false;
  }
}

// GET /api/kingstream/videos
export async function GET() {
  const db = readDb();
  return NextResponse.json({
    success: true,
    videos: db.videos || [],
  });
}

// POST /api/kingstream/videos (Add new video or upsert)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = readDb();
    const currentVideos = db.videos || [];

    const videoId = body.id || `ks-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newVideo = {
      ...body,
      id: videoId,
      createdAt: body.createdAt || new Date().toISOString(),
      views: Number(body.views) || 0,
    };

    // Deduplicate / Upsert by ID
    const existingIndex = currentVideos.findIndex((v: any) => v.id === videoId);
    let updatedVideos = [];
    if (existingIndex !== -1) {
      currentVideos[existingIndex] = { ...currentVideos[existingIndex], ...newVideo };
      updatedVideos = currentVideos;
    } else {
      updatedVideos = [newVideo, ...currentVideos];
    }

    db.videos = updatedVideos;
    writeDb(db);

    return NextResponse.json({
      success: true,
      video: newVideo,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan video' },
      { status: 500 }
    );
  }
}

// PUT /api/kingstream/videos (Update video)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID video diperlukan' },
        { status: 400 }
      );
    }

    const db = readDb();
    const videos = db.videos || [];
    const index = videos.findIndex((v: any) => v.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Video tidak ditemukan' },
        { status: 404 }
      );
    }

    videos[index] = { ...videos[index], ...updates };
    db.videos = videos;
    writeDb(db);

    return NextResponse.json({
      success: true,
      video: videos[index],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui video' },
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

    const db = readDb();
    const videos = (db.videos || []).filter((v: any) => v.id !== id);
    db.videos = videos;
    writeDb(db);

    return NextResponse.json({
      success: true,
      message: 'Video berhasil dihapus',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus video' },
      { status: 500 }
    );
  }
}

