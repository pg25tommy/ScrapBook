import { NextRequest, NextResponse } from 'next/server';
import { getPublishedPageBySlug } from '@/lib/db';

/**
 * GET /api/public/pages/[slug]
 * Get a published page by slug (public access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = await getPublishedPageBySlug(slug);

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ page });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}