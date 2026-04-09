import { NextRequest, NextResponse } from 'next/server';

// Allowlist of hostnames we're willing to proxy. Prevents using our server
// as an open proxy.
const ALLOWED_HOSTS = new Set<string>([
  'replicate.delivery',
  'pbxt.replicate.delivery',
  'tjzk.replicate.delivery',
  'replicate.com',
]);

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (target.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only https is allowed' }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json(
      { error: `Host not allowed: ${target.hostname}` },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(target.toString(), {
      // Don't forward cookies or auth; treat this as an anonymous public fetch.
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/png';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Upstream did not return an image' },
        { status: 502 }
      );
    }

    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        // Permissive CORS so the canvas can tainted-safely read pixels.
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[proxy-image] Fetch failed:', err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
  }
}
