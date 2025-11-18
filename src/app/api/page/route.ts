import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const EXTERNAL_IMAGES: string[] = [
  'https://images.pexels.com/photos/33511055/pexels-photo-33511055.jpeg',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200&auto=format&fit=crop',
];

function listLocalPhotosAbs(origin: string): string[] {
  try {
    const publicDir = path.join(process.cwd(), 'public', 'photos');
    if (!fs.existsSync(publicDir)) return [];
    const files = fs.readdirSync(publicDir);
    return files
      .filter((f) => exts.has(path.extname(f).toLowerCase()))
      // ABSOLUTE urls to avoid any base-URL confusion
      .map((f) => `${origin}/photos/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

function choose<T>(arr: T[], index?: number): T | undefined {
  if (!arr.length) return undefined;
  if (typeof index === 'number' && Number.isFinite(index)) {
    const i = ((index % arr.length) + arr.length) % arr.length;
    return arr[i];
  }
  const i = Math.floor(Math.random() * arr.length);
  return arr[i];
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const pool = (searchParams.get('pool') || 'any').toLowerCase() as
    | 'local'
    | 'external'
    | 'any';
  const index = searchParams.get('index') != null ? Number(searchParams.get('index')) : undefined;

  const local = listLocalPhotosAbs(origin);
  const external = EXTERNAL_IMAGES.map(
    (u) => `${origin}/api/proxy?url=${encodeURIComponent(u)}`
  );

  let poolArr: string[] = [];
  if (pool === 'local') poolArr = local;
  else if (pool === 'external') poolArr = external;
  else poolArr = [...local, ...external];

  const picked = choose(poolArr, index);

  return NextResponse.json({
    images: poolArr,
    slot: picked ? ({ kind: 'image', src: picked, fit: 'cover' } as const) : null,
    meta: {
      pool,
      counts: { local: local.length, external: external.length, total: poolArr.length },
      picked,
    },
  });
}
