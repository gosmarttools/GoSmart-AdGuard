import { NextRequest, NextResponse } from 'next/server';
import { verifyAntiBypass } from '@/lib/hash-store';

export const dynamic = 'force-dynamic';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  let token: string | null = null;
  let hash: string | null = null;

  // 1. Try URL Query parameters (standard Linkvertise pattern)
  const { searchParams } = new URL(req.url);
  token = searchParams.get('token');
  hash = searchParams.get('hash');

  // 2. Fallback to JSON body or Form data if not in query parameters
  if (!token || !hash) {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        token = token || body.token || null;
        hash = hash || body.hash || null;
      } catch {
        // invalid json ignored
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const formData = await req.formData();
        token = token || (formData.get('token') as string) || null;
        hash = hash || (formData.get('hash') as string) || null;
      } catch {
        // invalid form ignored
      }
    }
  }

  const result = verifyAntiBypass(token, hash);

  return NextResponse.json(result.body, {
    status: result.statusCode,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

// Support GET for direct browser or curl testing convenience
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const hash = searchParams.get('hash');

  const result = verifyAntiBypass(token, hash);

  return NextResponse.json(result.body, {
    status: result.statusCode,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}
