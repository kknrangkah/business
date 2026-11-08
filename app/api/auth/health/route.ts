import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  let url = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://43.129.38.25:30005';
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/api$/, '');
  return url || 'http://43.129.38.25:30005';
}

export async function GET() {
  const backendBase = getBackendUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${backendBase}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        online: true,
        status: data.status || 'ok',
        url: backendBase,
      });
    }

    return NextResponse.json(
      {
        online: false,
        status: `HTTP ${res.status}`,
        url: backendBase,
      },
      { status: res.status }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        online: false,
        error: error?.message || 'Offline',
        url: backendBase,
      },
      { status: 503 }
    );
  }
}
