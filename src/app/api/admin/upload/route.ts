import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

// Check if we're in production (Vercel) or local dev
const isProduction = !!process.env.BLOB_READ_WRITE_TOKEN;

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
    const ext = file.name.split('.').pop() || 'jpg';
    const safeName = file.name
      .replace(`.${ext}`, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    const filename = `${safeName}-${timestamp}.${ext}`;

    let url: string;

    if (isProduction) {
      // Production: Upload to Vercel Blob
      console.log('[Upload] Using Vercel Blob storage (production)');
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: false,
      });
      url = blob.url;
    } else {
      // Local development: Save to filesystem
      console.log('[Upload] Using local filesystem (development)');
      const photosDir = path.join(process.cwd(), 'public', 'photos');
      await mkdir(photosDir, { recursive: true });

      const filepath = path.join(photosDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      url = `/photos/${filename}`;
    }

    // Return the URL
    return NextResponse.json({
      success: true,
      url,
      filename,
      slot: {
        kind: 'image',
        src: url,
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