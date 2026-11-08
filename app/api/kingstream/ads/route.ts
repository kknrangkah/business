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

// GET /api/kingstream/ads
export async function GET() {
  const db = readDb();
  return NextResponse.json({
    success: true,
    adConfig: db.adConfig || {},
    telegramConfig: db.telegramConfig || {},
  });
}

// POST or PUT /api/kingstream/ads (Update ad and telegram config)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = readDb();

    if (body.adConfig) {
      db.adConfig = { ...db.adConfig, ...body.adConfig };
    }
    if (body.telegramConfig) {
      db.telegramConfig = { ...db.telegramConfig, ...body.telegramConfig };
    }

    writeDb(db);

    return NextResponse.json({
      success: true,
      adConfig: db.adConfig,
      telegramConfig: db.telegramConfig,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui konfigurasi iklan' },
      { status: 500 }
    );
  }
}

