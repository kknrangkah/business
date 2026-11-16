import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { validateSafeExternalUrl, extractYouTubeId } from '@/lib/kingstream-url-guard';

export const dynamic = 'force-dynamic';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

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

function resolveRelativeUrl(candidate: string | null | undefined, baseOrigin: string): string | null {
  if (!candidate) return null;
  const trimmed = candidate.replace(/&amp;/g, '&').trim();
  if (!trimmed || trimmed.startsWith('data:')) return null;
  if (trimmed.startsWith('//')) return 'https:' + trimmed;
  if (trimmed.startsWith('/')) return `${baseOrigin}${trimmed}`;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return null;
}

function extractRedirectTarget(html: string, baseOrigin: string): string | null {
  // 1. <meta http-equiv="refresh" content="1;url=https://...">
  const metaRefresh =
    html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'\s>]+)["']/i) ||
    html.match(/<meta[^>]+content=["'][^"']*url=([^"'\s>]+)["'][^>]+http-equiv=["']refresh["']/i);
  if (metaRefresh?.[1]) {
    const target = resolveRelativeUrl(metaRefresh[1], baseOrigin);
    if (target) return target;
  }

  // 2. JS location.replace("...") / window.location.href = "..."
  const jsRedirect =
    html.match(/location\.replace\(\s*["']([^"']+)["']\s*\)/i) ||
    html.match(/(?:window\.)?location(?:\.href)?\s*=\s*["'](https?:\/\/[^"']+)["']/i);
  if (jsRedirect?.[1]) {
    const target = resolveRelativeUrl(jsRedirect[1], baseOrigin);
    if (target) return target;
  }

  return null;
}

function extractThumbnailFromHtml(html: string, baseOrigin: string): string | null {
  const candidates: Array<string | null> = [
    extractMetaTag(html, 'property', 'og:image:secure_url'),
    extractMetaTag(html, 'property', 'og:image'),
    extractMetaTag(html, 'name', 'twitter:image'),
    // <video poster="...">
    html.match(/<video[^>]+poster=["']([^"']+)["']/i)?.[1] || null,
    // <img class="...thumbnail..." src="...">
    html.match(/<img[^>]+class=["'][^"']*(?:thumb|thumbnail|poster|cover|preview)[^"']*["'][^>]+src=["']([^"']+)["']/i)?.[1] || null,
    html.match(/<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*(?:thumb|thumbnail|poster|cover|preview)[^"']*["']/i)?.[1] || null,
    // <img alt="Thumbnail" src="...">
    html.match(/<img[^>]+alt=["'][^"']*(?:thumbnail|poster|cover)[^"']*["'][^>]+src=["']([^"']+)["']/i)?.[1] || null,
    html.match(/<img[^>]+src=["']([^"']+)["'][^>]+alt=["'][^"']*(?:thumbnail|poster|cover)[^"']*["']/i)?.[1] || null,
    // JS player config: poster / image / thumb / thumbnail
    html.match(/(?:poster|image|thumb|thumbnail)\s*[:=]\s*["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)?.[1] || null,
  ];

  for (const raw of candidates) {
    const resolved = resolveRelativeUrl(raw, baseOrigin);
    if (resolved) return resolved;
  }
  return null;
}

async function cacheExternalThumbnailImage(imageUrl: string, refererUrl?: string): Promise<string> {
  const safeImgUrl = validateSafeExternalUrl(imageUrl);
  if (!safeImgUrl) return imageUrl;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const imgRes = await fetch(safeImgUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'image/*,*/*;q=0.8',
        ...(refererUrl ? { Referer: refererUrl } : {}),
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!imgRes.ok) return imageUrl;
    const ct = (imgRes.headers.get('content-type') || '').toLowerCase();
    if (!ct.startsWith('image/')) return imageUrl;

    const arrayBuf = await imgRes.arrayBuffer();
    if (!arrayBuf || arrayBuf.byteLength < 256 || arrayBuf.byteLength > 8 * 1024 * 1024) {
      return imageUrl;
    }

    const buffer = Buffer.from(arrayBuf);
    const ext = ct.includes('png')
      ? '.png'
      : ct.includes('webp')
      ? '.webp'
      : ct.includes('gif')
      ? '.gif'
      : '.jpg';
    const fileName = `thumb-url-${Date.now()}-${Math.random().toString(36).substring(2, 6)}${ext}`;

    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      return `/uploads/${fileName}`;
    } catch {
      return `data:${ct};base64,${buffer.toString('base64')}`;
    }
  } catch {
    return imageUrl;
  }
}

/**
 * Resolves external video URLs (Videy, vski.cc/filecoster, MP4, YouTube, Google Drive,
 * or webpages with og:video/og:image/thumbnail) including meta-refresh & JS redirects,
 * and caches extracted thumbnail images locally to avoid hotlinking issues.
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

  // 5. Inspect remote URL, following HTTP & HTML/JS meta-refresh redirects up to 3 hops
  try {
    let currentUrl = urlStr;
    let referer: string | undefined;

    for (let hop = 0; hop < 3; hop++) {
      const safeCurrent = validateSafeExternalUrl(currentUrl);
      if (!safeCurrent) break;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(safeCurrent.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': BROWSER_UA,
          Accept: 'text/html,video/*,*/*;q=0.8',
          Range: 'bytes=0-131071',
          ...(referer ? { Referer: referer } : {}),
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const finalUrlStr = res.url || safeCurrent.toString();
      const safeFinal = validateSafeExternalUrl(finalUrlStr);
      if (!safeFinal) {
        return NextResponse.json({ success: false, error: 'Redirect tidak diizinkan' }, { status: 403 });
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase();

      if (contentType.startsWith('video/')) {
        return NextResponse.json({
          success: true,
          kind: 'native',
          directVideoUrl: finalUrlStr,
          thumbnailUrl: null,
        });
      }

      if (contentType.includes('text/html')) {
        const html = await res.text();

        // Check if this page is just a meta-refresh or JS redirect wrapper (like vski.cc -> filecoster.com)
        const redirectTarget = extractRedirectTarget(html, safeFinal.origin);
        const extractedThumb = extractThumbnailFromHtml(html, safeFinal.origin);

        const ogVideo =
          extractMetaTag(html, 'property', 'og:video:secure_url') ||
          extractMetaTag(html, 'property', 'og:video:url') ||
          extractMetaTag(html, 'property', 'og:video');

        const videoSrcMatch =
          html.match(/<(?:video|source)[^>]+src=["'](https?:\/\/[^"']+\.(?:mp4|webm|mov)[^"']*)["']/i) ||
          html.match(/(?:file|src|source|url)\s*[:=]\s*["'](https?:\/\/[^"']+\.(?:mp4|webm|mov)[^"']*)["']/i);

        const resolvedDirectVideo =
          (ogVideo && (ogVideo.includes('.mp4') || ogVideo.includes('.webm') || ogVideo.includes('cdn.videy.co'))
            ? ogVideo
            : null) ||
          videoSrcMatch?.[1] ||
          null;

        const rawTitle =
          extractMetaTag(html, 'property', 'og:title') ||
          html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
          null;
        const cleanTitle =
          rawTitle && !/validating|just a moment|loading/i.test(rawTitle) ? rawTitle : null;

        // If no thumbnail/video found yet and a redirect wrapper exists, follow it!
        if (!extractedThumb && !resolvedDirectVideo && redirectTarget && redirectTarget !== finalUrlStr) {
          referer = safeFinal.origin + '/';
          currentUrl = redirectTarget;
          continue;
        }

        const cachedThumbnail = extractedThumb
          ? await cacheExternalThumbnailImage(extractedThumb, finalUrlStr)
          : null;

        return NextResponse.json({
          success: true,
          kind: resolvedDirectVideo ? 'native' : 'embed',
          directVideoUrl: resolvedDirectVideo,
          thumbnailUrl: cachedThumbnail,
          title: cleanTitle,
          resolvedPageUrl: finalUrlStr,
        });
      }

      break;
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
