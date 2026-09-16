import { NextRequest, NextResponse } from 'next/server';
import {
  getAllHashRecords,
  registerNewHash,
  getAuthorizedTokens,
  addAuthorizedToken,
} from '@/lib/hash-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const records = getAllHashRecords();
  const tokens = getAuthorizedTokens();
  return NextResponse.json({
    activeCount: records.filter((r) => !r.used && Date.now() <= r.expiresAt).length,
    tokens,
    records,
    serverTime: Date.now(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'generate';

    if (action === 'generate') {
      const targetUrl = body.targetUrl || 'https://example.com/download-file.zip';
      const token = body.token || getAuthorizedTokens()[0];
      const record = registerNewHash(targetUrl, token);
      return NextResponse.json({ success: true, record });
    }

    if (action === 'addToken') {
      const token = body.token;
      const ok = addAuthorizedToken(token);
      return NextResponse.json({ success: ok, token });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
