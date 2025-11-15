import { NextResponse } from 'next/server';
import { getPublishedPages } from '@/lib/db';

/**
 * GET /api/public/pages
 * Get all published pages (public access)
 */
export async function GET() {
  try {
    const pages = await getPublishedPages();
    return NextResponse.json({ pages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}