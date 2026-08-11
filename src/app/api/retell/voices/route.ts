import { NextRequest, NextResponse } from 'next/server';
import { listRetellVoices } from '@/lib/retell-api';

export async function GET(req: NextRequest) {
  try {
    const voices = await listRetellVoices();
    return NextResponse.json(voices);
  } catch (error: any) {
    console.error('[API /retell/voices Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
