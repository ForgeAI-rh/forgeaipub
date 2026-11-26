import { NextResponse } from "next/server";
import { getMission } from "@/lib/catalog";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const m = getMission((await params).slug);
  if (!m) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { tasks, ...spec } = m;
  return NextResponse.json({
    ...spec,
    tasks: tasks.map((t) => ({ id: t.id, prompt: t.prompt, category: t.category, options: [t.answer, ...t.distractors].sort() })),
  });
}
