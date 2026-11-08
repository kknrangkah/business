import { NextResponse } from 'next/server';

const FALLBACK_RESPONSE = {
  responseResult: true,
  response_code: 200,
  success: true,
  response_message: 'OK (Local Standalone Mode)',
  data: [],
};

export async function GET() {
  return NextResponse.json(FALLBACK_RESPONSE);
}

export async function POST() {
  return NextResponse.json(FALLBACK_RESPONSE);
}

export async function PUT() {
  return NextResponse.json(FALLBACK_RESPONSE);
}

export async function PATCH() {
  return NextResponse.json(FALLBACK_RESPONSE);
}

export async function DELETE() {
  return NextResponse.json(FALLBACK_RESPONSE);
}

