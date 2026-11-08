import { NextResponse } from 'next/server';

export async function GET() {
  const backendBase =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://43.129.38.25:30005';
  const target =
    process.env.GOOGLE_AUTH_URL ||
    `${backendBase.replace(/\/+$/, '').replace(/\/api$/, '')}/auth/google`;
  return NextResponse.redirect(target, 307);
}
