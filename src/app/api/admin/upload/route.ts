import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Require authentication
  try {
    await requireAuth();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WEBP, GIF, AVIF' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const safeName = file.name
      .replace(ext, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    const filename = `${safeName}-${timestamp}${ext}`;

    // Ensure photos directory exists
    const photosDir = path.join(process.cwd(), 'public', 'photos');
    try {
      await mkdir(photosDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore error
    }

    // Save file
    const filepath = path.join(photosDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the URL (relative to public directory)
    const { origin } = new URL(req.url);
    const imageUrl = `${origin}/photos/${encodeURIComponent(filename)}`;

    return NextResponse.json({
      success: true,
      url: imageUrl,
      filename,
      slot: {
        kind: 'image',
        src: imageUrl,
        fit: 'cover',
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}