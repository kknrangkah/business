import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const backendBase =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://43.129.38.25:30005';
  const target = `${backendBase.replace(/\/+$/, '').replace(/\/api$/, '')}/auth/google`;

  const { search } = new URL(request.url);
  return NextResponse.redirect(`${target}${search}`, 302);
}
