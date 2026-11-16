import { NextRequest, NextResponse } from 'next/server';
import { validateSafeExternalUrl, extractYouTubeId } from '@/lib/kingstream-url-guard';

export const dynamic = 'force-dynamic';

function extractMetaTag(html: string, attrName: string, attrValue: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+${attrName}=["']${attrValue}["'][^>]+content=["']([^"']+)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+${attrName}=["']${attrValue}["']`,
      'i'
    ),
  ];
  for (const regex of patterns) {
    const match = html.match(regex);
    if (match?.[1]) {
      return match[1].replace(/&amp;/g, '&').trim();
    }
  }
  return null;
}

/**
 * Resolves external video URLs (Videy, MP4, YouTube, Google Drive, or webpages with og:video/og:image)
 * to extract either a direct playable video URL (for frame capture) or an automatic thumbnail image URL.
 */
export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return NextResponse.json({ success: false, error: 'URL wajib diisi' }, { status: 400 });
  }

  let normalizedUrl = rawUrl.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  const parsedUrl = validateSafeExternalUrl(normalizedUrl);
  if (!parsedUrl) {
    return NextResponse.json(
      { success: false, error: 'URL tidak valid atau tidak diizinkan' },
      { status: 400 }
    );
  }

  const urlStr = parsedUrl.toString();

  // 1. YouTube direct thumbnail
  const ytId = extractYouTubeId(urlStr);
  if (ytId) {
    return NextResponse.json({
      success: true,
      kind: 'embed',
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      directVideoUrl: null,
    });
  }

  // 2. Google Drive thumbnail
  if (urlStr.includes('drive.google.com/file/d/')) {
    const match = urlStr.match(/\/file\/d\/([^/]+)/);
    if (match?.[1]) {
      return NextResponse.json({
        success: true,
        kind: 'embed',
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`,
        directVideoUrl: null,
      });
    }
  }

  // 3. Videy share URL -> direct CDN MP4
  if (urlStr.includes('videy.co/v')) {
    const videyId = parsedUrl.searchParams.get('id');
    if (videyId) {
      return NextResponse.json({
        success: true,
        kind: 'native',
        directVideoUrl: `https://cdn.videy.co/${videyId}.mp4`,
        thumbnailUrl: null,
      });
    }
  }

  // 4. Direct video file extension
  const pathLower = parsedUrl.pathname.toLowerCase();
  if (
    pathLower.endsWith('.mp4') ||
    pathLower.endsWith('.webm') ||
    pathLower.endsWith('.mov') ||
    pathLower.endsWith('.ogg') ||
    urlStr.includes('cdn.videy.co/')
  ) {
    return NextResponse.json({
      success: true,
      kind: 'native',
      directVideoUrl: urlStr,
      thumbnailUrl: null,
    });
  }

  // 5. Inspect remote URL (HEAD/range GET) to see if it's a video stream or HTML page with og:video / og:image
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(urlStr, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,video/*,*/*;q=0.8',
        Range: 'bytes=0-131071',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.url && !validateSafeExternalUrl(res.url)) {
      return NextResponse.json({ success: false, error: 'Redirect tidak diizinkan' }, { status: 403 });
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    if (contentType.startsWith('video/')) {
      return NextResponse.json({
        success: true,
        kind: 'native',
        directVideoUrl: res.url || urlStr,
        thumbnailUrl: null,
      });
    }

    if (contentType.includes('text/html')) {
      const html = await res.text();
      const ogImage =
        extractMetaTag(html, 'property', 'og:image') ||
        extractMetaTag(html, 'property', 'og:image:secure_url') ||
        extractMetaTag(html, 'name', 'twitter:image');

      const ogVideo =
        extractMetaTag(html, 'property', 'og:video:secure_url') ||
        extractMetaTag(html, 'property', 'og:video:url') ||
        extractMetaTag(html, 'property', 'og:video');

      const videoSrcMatch = html.match(
        /<(?:video|source)[^>]+src=["'](https?:\/\/[^"']+\.(?:mp4|webm|mov)[^"']*)["']/i
      );

      const titleMatch =
        extractMetaTag(html, 'property', 'og:title') ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
        null;

      const resolvedDirectVideo =
        (ogVideo && (ogVideo.includes('.mp4') || ogVideo.includes('.webm') || ogVideo.includes('cdn.videy.co'))
          ? ogVideo
          : null) ||
        videoSrcMatch?.[1] ||
        null;

      let resolvedThumb = ogImage || null;
      if (resolvedThumb && resolvedThumb.startsWith('//')) {
        resolvedThumb = 'https:' + resolvedThumb;
      } else if (resolvedThumb && resolvedThumb.startsWith('/')) {
        resolvedThumb = `${parsedUrl.origin}${resolvedThumb}`;
      }

      return NextResponse.json({
        success: true,
        kind: resolvedDirectVideo ? 'native' : 'embed',
        directVideoUrl: resolvedDirectVideo,
        thumbnailUrl: resolvedThumb,
        title: titleMatch,
      });
    }
  } catch (err) {
    console.warn('video-meta inspect failed:', (err as Error).message);
  }

  return NextResponse.json({
    success: true,
    kind: 'embed',
    directVideoUrl: null,
    thumbnailUrl: null,
  });
}

