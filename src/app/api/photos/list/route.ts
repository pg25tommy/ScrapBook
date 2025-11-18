import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

type PhotoInfo = {
  filename: string;
  url: string;
  uploadDate: string;
  size: number;
};

export async function GET(req: NextRequest) {
  try {
    const { origin } = new URL(req.url);
    const photosDir = path.join(process.cwd(), 'public', 'photos');

    if (!fs.existsSync(photosDir)) {
      return NextResponse.json({ photos: [] });
    }

    const files = fs.readdirSync(photosDir);
    const photos: PhotoInfo[] = [];

    for (const file of files) {
      if (!exts.has(path.extname(file).toLowerCase())) continue;

      const filepath = path.join(photosDir, file);
      const stats = fs.statSync(filepath);

      photos.push({
        filename: file,
        url: `${origin}/photos/${encodeURIComponent(file)}`,
        uploadDate: stats.mtime.toISOString(),
        size: stats.size,
      });
    }

    // Sort by upload date, newest first
    photos.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    return NextResponse.json({ photos });
  } catch (error: any) {
    console.error('Error listing photos:', error);
    return NextResponse.json({ error: 'Failed to list photos' }, { status: 500 });
  }
}