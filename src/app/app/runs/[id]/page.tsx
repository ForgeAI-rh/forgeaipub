import { notFound } from "next/navigation";
import { RunLive } from "@/components/run-live";
import { runCode } from "@/lib/format";
import { runPayload } from "@/lib/run-payload";
import { currentAccountId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: runCode((await params).id) };
}

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await runPayload(id, await currentAccountId());
  if (!data) notFound();
  return <RunLive key={data.id} initial={data} />;
}
