import { NextRequest, NextResponse } from 'next/server';
import { del, list } from '@vercel/blob';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

export async function DELETE(req: NextRequest) {
  // Require authentication
  try {
    await requireAuth();
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const blobUrl = searchParams.get('url'); // Now expecting full blob URL
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      // Delete all photos from blob storage
      const { blobs } = await list();
      let deletedCount = 0;

      for (const blob of blobs) {
        // Check if it's an image file
        const ext = blob.pathname.split('.').pop()?.toLowerCase();
        if (!ext || !exts.has(`.${ext}`)) continue;

        try {
          await del(blob.url);
          deletedCount++;
        } catch (err) {
          console.error(`Failed to delete ${blob.pathname}:`, err);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} photo(s)`,
        deletedCount,
      });
    } else if (blobUrl) {
      // Delete specific blob
      // Security check: ensure it's a valid blob URL
      if (!blobUrl.includes('blob.vercel-storage.com')) {
        return NextResponse.json(
          { error: 'Invalid blob URL' },
          { status: 400 }
        );
      }

      // Extract filename from URL for validation
      const filename = blobUrl.split('/').pop() || '';
      const ext = filename.split('.').pop()?.toLowerCase();

      // Verify file has valid image extension
      if (!ext || !exts.has(`.${ext}`)) {
        return NextResponse.json(
          { error: 'Invalid file type' },
          { status: 400 }
        );
      }

      await del(blobUrl);

      return NextResponse.json({
        success: true,
        message: `Deleted ${filename}`,
        filename,
      });
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
