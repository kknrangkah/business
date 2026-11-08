import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  let url = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://43.129.38.25:30005';
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // Strip trailing /api because NestJS backend routes are mounted at root level (/auth/register)
  url = url.replace(/\/api$/, '');
  return url || 'http://43.129.38.25:30005';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;
    const backendBase = getBackendUrl();

    const res = await fetch(`${backendBase}/auth/register`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email?.trim(),
        password: password,
        name: name?.trim(),
      }),
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        response_code: res.status,
        response_message: text.slice(0, 200) || 'Respon tidak terduga dari server backend',
        responseResult: false,
      };
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[API Proxy] Error forwarding register to backend:', error);
    return NextResponse.json(
      {
        response_code: 500,
        response_message: 'Gagal terhubung ke server backend untuk registrasi',
        responseResult: false,
        error: [error?.message || 'Server connection timeout'],
      },
      { status: 500 }
    );
  }
}
