import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAllPages, createPage } from '@/lib/db';
import type { Slot } from '@/state/useLightTableStore';

/**
 * GET /api/admin/pages
 * Get all pages (admin only)
 */
export async function GET() {
  try {
    await requireAuth();
    const pages = await getAllPages();
    return NextResponse.json({ pages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

/**
 * POST /api/admin/pages
 * Create a new page
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { title, slug, slotData } = body;

    if (!title || !slug || !slotData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const page = await createPage(title, slug, slotData as Slot);
    return NextResponse.json({ page }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create page' },
      { status: 500 }
    );
  }
}