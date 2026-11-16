import { NextRequest, NextResponse } from 'next/server';
import { validateSafeExternalUrl } from '@/lib/kingstream-url-guard';

export const dynamic = 'force-dynamic';

/**
 * Same-origin streaming video proxy (supports HTTP Range requests) so the Admin Dashboard
 * can extract frames from external MP4/WebM/Videy CDN URLs via <canvas> without CORS errors.
 */
export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return NextResponse.json({ error: 'Parameter url wajib diisi' }, { status: 400 });
  }

  const parsedUrl = validateSafeExternalUrl(rawUrl);
  if (!parsedUrl) {
    return NextResponse.json({ error: 'URL video tidak valid atau tidak diizinkan' }, { status: 400 });
  }

  try {
    const forwardHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept: '*/*',
    };

    const range = req.headers.get('range');
    if (range) {
      forwardHeaders['Range'] = range;
    }

    const upstreamRes = await fetch(parsedUrl.toString(), {
      method: 'GET',
      headers: forwardHeaders,
      redirect: 'follow',
    });

    // Guard against redirects to internal addresses
    if (upstreamRes.url && !validateSafeExternalUrl(upstreamRes.url)) {
      return NextResponse.json({ error: 'Redirect URL tidak diizinkan' }, { status: 403 });
    }

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return NextResponse.json(
        { error: `Gagal memuat video dari sumber (${upstreamRes.status})` },
        { status: upstreamRes.status }
      );
    }

    const responseHeaders = new Headers();
    const passHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
    ];
    for (const h of passHeaders) {
      const val = upstreamRes.headers.get(h);
      if (val) {
        responseHeaders.set(h, val);
      }
    }

    if (!responseHeaders.get('content-type')) {
      responseHeaders.set('content-type', 'video/mp4');
    }
    if (!responseHeaders.get('accept-ranges')) {
      responseHeaders.set('accept-ranges', 'bytes');
    }
    responseHeaders.set('Cache-Control', 'private, max-age=300');

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Video proxy error:', error);
    return NextResponse.json({ error: 'Gagal menghubungi server video' }, { status: 502 });
  }
}

