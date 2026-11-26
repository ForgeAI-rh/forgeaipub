import { NextResponse } from "next/server";
import { MISSIONS } from "@/lib/catalog";
import { read } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const control = (await read()).missions;
  return NextResponse.json(
    MISSIONS.map((m) => ({
      slug: m.slug,
      code: m.code,
      name: m.name,
      version: m.version,
      focus: m.focus,
      summary: m.summary,
      budget: m.budget,
      rubric: m.rubric,
      tasks: m.tasks.length,
      paused: Boolean(control[m.slug]?.paused),
    })),
  );
}
