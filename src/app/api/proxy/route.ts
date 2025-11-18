// src/app/api/proxy/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_HOSTS = new Set<string>([
  'images.unsplash.com',
  'images.pexels.com',
  'picsum.photos',
]);

function notAllowed(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function HEAD(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('url');
  if (!raw) return notAllowed('Missing ?url=', 400);
  try {
    const target = new URL(raw);
    if (!ALLOWED_HOSTS.has(target.hostname)) {
      return notAllowed(`Host not allowed: ${target.hostname}`, 400);
    }
    return new NextResponse(null, { status: 200 });
  } catch {
    return notAllowed('Invalid URL', 400);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('url');
  if (!raw) return notAllowed('Missing ?url=');

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return notAllowed('Invalid URL');
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return notAllowed(`Host not allowed: ${target.hostname}`);
  }

  // Pass through Range (useful for large images/CDNs)
  const range = req.headers.get('range') ?? undefined;

  const upstream = await fetch(target.toString(), {
    cache: 'no-store',
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      ...(range ? { Range: range } : {}),
    },
  });

  if (!upstream.ok && upstream.status !== 206) {
    return notAllowed(`Upstream ${upstream.status}`, upstream.status);
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  if (!/^image\//i.test(contentType)) {
    return notAllowed('Upstream is not an image', 415);
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Cache-Control', 'public, max-age=3600');
  headers.set('Access-Control-Allow-Origin', '*');

  // Propagate partial content headers if present
  for (const k of ['Content-Range', 'Accept-Ranges']) {
    const v = upstream.headers.get(k);
    if (v) headers.set(k, v);
  }

  const status = upstream.status === 206 ? 206 : 200;
  return new NextResponse(buf, { status, headers });
}
