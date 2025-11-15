import { sql } from '@vercel/postgres';
import type { Slot } from '../state/useLightTableStore';

export type ScrapbookPage = {
  id: number;
  title: string;
  slug: string;
  slot_data: Slot;
  published: boolean;
  created_at: string;
  updated_at: string;
};

// In-memory storage for development (fallback when Postgres not configured)
// Use globalThis to persist across hot reloads in development
const globalForPages = globalThis as unknown as {
  inMemoryPages: Map<number, ScrapbookPage> | undefined;
  nextId: number | undefined;
};

const inMemoryPages = globalForPages.inMemoryPages ?? new Map<number, ScrapbookPage>();
globalForPages.inMemoryPages = inMemoryPages;

let nextId = globalForPages.nextId ?? 1;
globalForPages.nextId = nextId;

const isPostgresConfigured = () => {
  return !!process.env.POSTGRES_URL;
};

/**
 * Get all pages (admin only)
 */
export async function getAllPages(): Promise<ScrapbookPage[]> {
  if (!isPostgresConfigured()) {
    // Use in-memory storage
    return Array.from(inMemoryPages.values()).sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  try {
    const { rows } = await sql<ScrapbookPage>`
      SELECT * FROM pages
      ORDER BY updated_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch pages');
  }
}

/**
 * Get all published pages (public)
 */
export async function getPublishedPages(): Promise<ScrapbookPage[]> {
  if (!isPostgresConfigured()) {
    return Array.from(inMemoryPages.values())
      .filter(p => p.published)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  try {
    const { rows } = await sql<ScrapbookPage>`
      SELECT * FROM pages
      WHERE published = true
      ORDER BY updated_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch published pages');
  }
}

/**
 * Get a page by slug
 */
export async function getPageBySlug(slug: string): Promise<ScrapbookPage | null> {
  if (!isPostgresConfigured()) {
    const page = Array.from(inMemoryPages.values()).find(p => p.slug === slug);
    return page || null;
  }

  try {
    const { rows } = await sql<ScrapbookPage>`
      SELECT * FROM pages
      WHERE slug = ${slug}
      LIMIT 1
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch page');
  }
}

/**
 * Get a published page by slug (public)
 */
export async function getPublishedPageBySlug(slug: string): Promise<ScrapbookPage | null> {
  if (!isPostgresConfigured()) {
    const page = Array.from(inMemoryPages.values()).find(
      p => p.slug === slug && p.published
    );
    return page || null;
  }

  try {
    const { rows } = await sql<ScrapbookPage>`
      SELECT * FROM pages
      WHERE slug = ${slug} AND published = true
      LIMIT 1
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch page');
  }
}

/**
 * Create a new page
 */
export async function createPage(
  title: string,
  slug: string,
  slotData: Slot
): Promise<ScrapbookPage> {
  if (!isPostgresConfigured()) {
    const now = new Date().toISOString();
    const page: ScrapbookPage = {
      id: nextId,
      title,
      slug,
      slot_data: slotData,
      published: true,
      created_at: now,
      updated_at: now,
    };
    nextId++;
    globalForPages.nextId = nextId; // Sync to globalThis
    inMemoryPages.set(page.id, page);
    return page;
  }

  try {
    const { rows } = await sql<ScrapbookPage>`
      INSERT INTO pages (title, slug, slot_data, published)
      VALUES (${title}, ${slug}, ${JSON.stringify(slotData)}, true)
      RETURNING *
    `;
    return rows[0];
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to create page');
  }
}

/**
 * Update a page
 */
export async function updatePage(
  id: number,
  title: string,
  slug: string,
  slotData: Slot
): Promise<ScrapbookPage> {
  if (!isPostgresConfigured()) {
    const existing = inMemoryPages.get(id);
    if (!existing) throw new Error('Page not found');

    const updated: ScrapbookPage = {
      ...existing,
      title,
      slug,
      slot_data: slotData,
      updated_at: new Date().toISOString(),
    };
    inMemoryPages.set(id, updated);
    return updated;
  }

  try {
    const { rows } = await sql<ScrapbookPage>`
      UPDATE pages
      SET title = ${title}, slug = ${slug}, slot_data = ${JSON.stringify(slotData)}
      WHERE id = ${id}
      RETURNING *
    `;
    if (!rows[0]) throw new Error('Page not found');
    return rows[0];
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to update page');
  }
}

/**
 * Toggle page published status
 */
export async function togglePublished(id: number): Promise<ScrapbookPage> {
  if (!isPostgresConfigured()) {
    const existing = inMemoryPages.get(id);
    if (!existing) throw new Error('Page not found');

    const updated: ScrapbookPage = {
      ...existing,
      published: !existing.published,
      updated_at: new Date().toISOString(),
    };
    inMemoryPages.set(id, updated);
    return updated;
  }

  try {
    const { rows } = await sql<ScrapbookPage>`
      UPDATE pages
      SET published = NOT published
      WHERE id = ${id}
      RETURNING *
    `;
    if (!rows[0]) throw new Error('Page not found');
    return rows[0];
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to toggle published status');
  }
}

/**
 * Delete a page
 */
export async function deletePage(id: number): Promise<void> {
  if (!isPostgresConfigured()) {
    inMemoryPages.delete(id);
    return;
  }

  try {
    await sql`DELETE FROM pages WHERE id = ${id}`;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to delete page');
  }
}