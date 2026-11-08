import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const backendBase =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://43.129.38.25:30005';
    const target = `${backendBase.replace(/\/+$/, '').replace(/\/api$/, '')}/v1/patients`;

    const body = await request.json();
    const { tenant_id, ...cleanBody } = body || {};
    const authHeader = request.headers.get('authorization');
    const tenantHeader = request.headers.get('x-tenant-id') || tenant_id;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      accept: '*/*',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    if (tenantHeader) {
      headers['X-Tenant-Id'] = tenantHeader;
    }

    const res = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(cleanBody),
    });

    const data = await res.json().catch(() => null);
    return NextResponse.json(data || {}, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { response_code: 500, response_message: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
