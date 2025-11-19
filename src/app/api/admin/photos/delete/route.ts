import { NextRequest, NextResponse } from 'next/server';
import { del, list } from '@vercel/blob';
import { requireAuth } from '@/lib/auth';
import { unlink, readdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const isProduction = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function DELETE(req: NextRequest) {
  // Require authentication
  try {
    await requireAuth();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const urlParam = searchParams.get('url');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      let deletedCount = 0;

      if (isProduction) {
        // Production: Delete all photos from Blob storage
        console.log('[Delete] Deleting all from Blob storage (production)');
        const { blobs } = await list();

        for (const blob of blobs) {
          const ext = blob.pathname.split('.').pop()?.toLowerCase();
          if (!ext || !exts.has(`.${ext}`)) continue;

          try {
            await del(blob.url);
            deletedCount++;
          } catch (err) {
            console.error(`Failed to delete ${blob.pathname}:`, err);
          }
        }
      } else {
        // Local: Delete all photos from filesystem
        console.log('[Delete] Deleting all from filesystem (development)');
        const photosDir = path.join(process.cwd(), 'public', 'photos');

        try {
          const files = await readdir(photosDir);
          for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (!exts.has(ext)) continue;

            try {
              await unlink(path.join(photosDir, file));
              deletedCount++;
            } catch (err) {
              console.error(`Failed to delete ${file}:`, err);
            }
          }
        } catch (err) {
          console.error('Failed to read photos directory:', err);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} photo(s)`,
        deletedCount,
      });
    } else if (urlParam) {
      if (isProduction) {
        // Production: Delete from Blob storage
        console.log('[Delete] Deleting from Blob storage (production)');

        // Security check: ensure it's a valid blob URL
        if (!urlParam.includes('blob.vercel-storage.com')) {
          return NextResponse.json(
            { error: 'Invalid blob URL' },
            { status: 400 }
          );
        }

        const filename = urlParam.split('/').pop() || '';
        const ext = filename.split('.').pop()?.toLowerCase();

        if (!ext || !exts.has(`.${ext}`)) {
          return NextResponse.json(
            { error: 'Invalid file type' },
            { status: 400 }
          );
        }

        await del(urlParam);

        return NextResponse.json({
          success: true,
          message: `Deleted ${filename}`,
          filename,
        });
      } else {
        // Local: Delete from filesystem
        console.log('[Delete] Deleting from filesystem (development)');

        // Extract filename from local URL (e.g., /photos/image.jpg)
        const filename = urlParam.split('/').pop() || '';
        const ext = path.extname(filename).toLowerCase();

        if (!ext || !exts.has(ext)) {
          return NextResponse.json(
            { error: 'Invalid file type' },
            { status: 400 }
          );
        }

        const filepath = path.join(process.cwd(), 'public', 'photos', filename);
        await unlink(filepath);

        return NextResponse.json({
          success: true,
          message: `Deleted ${filename}`,
          filename,
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Must specify url or all=true' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
