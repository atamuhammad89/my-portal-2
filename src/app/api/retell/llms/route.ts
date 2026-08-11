import { NextRequest, NextResponse } from 'next/server';
import { listRetellLlms, createRetellLlm } from '@/lib/retell-api';

export async function GET(req: NextRequest) {
  try {
    const llms = await listRetellLlms();
    return NextResponse.json(llms);
  } catch (error: any) {
    console.error('[API /retell/llms GET Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch LLMs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, general_prompt, begin_message } = body;

    const createdLlm = await createRetellLlm({
      model: model || 'gpt-4o',
      general_prompt,
      begin_message,
    });

    return NextResponse.json(createdLlm);
  } catch (error: any) {
    console.error('[API /retell/llms POST Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create LLM' },
      { status: 500 }
    );
  }
}
