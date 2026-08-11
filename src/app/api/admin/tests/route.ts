import { NextResponse } from "next/server";
import { listTests, createTestDefinition, runBatchTests } from "@/lib/retell-api";
import { createTestDefSchema, runBatchTestSchema } from "@/lib/validations/retell";

export async function GET(request: Request) {
  try {
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const tests = await listTests({ correlationId });
    return NextResponse.json(tests);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list tests" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const correlationId = request.headers.get("x-correlation-id") || undefined;

    if (body.test_ids && Array.isArray(body.test_ids)) {
      const runValidation = runBatchTestSchema.safeParse(body);
      if (!runValidation.success) {
        return NextResponse.json({ error: runValidation.error.format() }, { status: 400 });
      }
      const result = await runBatchTests(runValidation.data, { correlationId });
      return NextResponse.json(result);
    }

    const createValidation = createTestDefSchema.safeParse(body);
    if (!createValidation.success) {
      return NextResponse.json({ error: createValidation.error.format() }, { status: 400 });
    }
    const result = await createTestDefinition(createValidation.data, { correlationId });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process test request" },
      { status: error.status || 500 }
    );
  }
}
