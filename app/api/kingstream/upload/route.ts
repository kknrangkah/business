import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang diunggah' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create safe filename
    const ext =
      path.extname(file.name) ||
      (file.type.startsWith('video/')
        ? '.mp4'
        : file.type === 'image/png'
        ? '.png'
        : file.type === 'image/webp'
        ? '.webp'
        : '.jpg');
    const baseName = path
      .basename(file.name, path.extname(file.name))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    const fileName = `${Date.now()}-${baseName || 'media'}${ext}`;

    try {
      // Ensure public/uploads directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${fileName}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName,
      });
    } catch (diskError) {
      console.warn('Disk write failed in /api/kingstream/upload, using fallback:', diskError);
      // If it's an image, fallback to base64 Data URL so banner/thumbnail images always work
      if (file.type.startsWith('image/')) {
        const mimeType = file.type || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
        return NextResponse.json({
          success: true,
          url: dataUrl,
          fileName,
        });
      }
      throw diskError;
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengunggah file ke server' },
      { status: 500 }
    );
  }
}
