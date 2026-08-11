import { NextResponse } from "next/server";
import { listRetellVoices, cloneRetellVoice, searchRetellVoices } from "@/lib/retell-api";
import { cloneVoiceSchema, searchVoiceSchema } from "@/lib/validations/retell";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const correlationId = request.headers.get("x-correlation-id") || undefined;

    if (query) {
      const searchValidation = searchVoiceSchema.safeParse({ query });
      if (!searchValidation.success) {
        return NextResponse.json({ error: searchValidation.error.format() }, { status: 400 });
      }
      const results = await searchRetellVoices(searchValidation.data, { correlationId });
      return NextResponse.json(results);
    }

    const voices = await listRetellVoices({ correlationId });
    return NextResponse.json(voices);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list/search voices" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = cloneVoiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await cloneRetellVoice(validation.data, { correlationId });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to clone voice" },
      { status: error.status || 500 }
    );
  }
}
