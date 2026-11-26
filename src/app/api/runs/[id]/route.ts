import { NextResponse } from "next/server";
import { runPayload } from "@/lib/run-payload";
import { currentAccountId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await runPayload(id, await currentAccountId());
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
