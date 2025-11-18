import { NextRequest, NextResponse } from 'next/server';
import { unlink, readdir } from 'fs/promises';
import path from 'path';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs' as const;

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
    const filename = searchParams.get('filename');
    const deleteAll = searchParams.get('all') === 'true';

    const photosDir = path.join(process.cwd(), 'public', 'photos');

    if (deleteAll) {
      // Delete all photos
      const files = await readdir(photosDir);
      let deletedCount = 0;

      for (const file of files) {
        if (!exts.has(path.extname(file).toLowerCase())) continue;

        const filepath = path.join(photosDir, file);
        try {
          await unlink(filepath);
          deletedCount++;
        } catch (err) {
          console.error(`Failed to delete ${file}:`, err);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} photo(s)`,
        deletedCount,
      });
    } else if (filename) {
      // Delete specific file
      const filepath = path.join(photosDir, filename);

      // Security check: ensure filename doesn't contain path traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return NextResponse.json(
          { error: 'Invalid filename' },
          { status: 400 }
        );
      }

      // Verify file has valid image extension
      if (!exts.has(path.extname(filename).toLowerCase())) {
        return NextResponse.json(
          { error: 'Invalid file type' },
          { status: 400 }
        );
      }

      await unlink(filepath);

      return NextResponse.json({
        success: true,
        message: `Deleted ${filename}`,
        filename,
      });
    } else {
      return NextResponse.json(
        { error: 'Must specify filename or all=true' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.code === 'ENOENT' ? 'File not found' : 'Failed to delete file' },
      { status: error.code === 'ENOENT' ? 404 : 500 }
    );
  }
}
