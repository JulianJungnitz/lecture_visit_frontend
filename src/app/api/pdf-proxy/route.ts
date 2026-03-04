import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_DOMAINS = ['lmu.de', 'uni-muenchen.de'];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  const allowed = ALLOWED_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
  if (!allowed) {
    return new NextResponse('Domain not allowed', { status: 403 });
  }

  const response = await fetch(url);
  if (!response.ok) {
    return new NextResponse('Failed to fetch PDF', { status: response.status });
  }

  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
    },
  });
}
