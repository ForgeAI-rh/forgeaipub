import { notFound } from "next/navigation";
import { updateAgent } from "@/app/actions";
import { ForgeForm } from "@/components/forge-form";
import { PageHead } from "@/components/ui";
import { read } from "@/lib/db";
import { agentProgress } from "@/lib/forge";
import { agentCode } from "@/lib/format";
import { currentAccountId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit agent" };

export default async function EditAgent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await currentAccountId();
  const db = await read();
  const agent = db.agents.find((a) => a.id === id);
  if (!agent || agent.ownerId !== me) notFound();
  const p = agentProgress(db, agent.id);

  return (
    <div className="space-y-8">
      <PageHead kicker={`${agentCode(agent.id)} · config v${agent.configVersion}`} title={`Edit ${agent.name}`}>
        Changing role, style or modules creates config v{agent.configVersion + 1}. Earlier runs keep the config they ran with.
      </PageHead>
      <ForgeForm
        action={updateAgent.bind(null, agent.id)}
        level={p.level}
        submitLabel="Save changes"
        idPreview={agentCode(agent.id)}
        defaults={{
          name: agent.name,
          role: agent.role,
          style: agent.style,
          objective: agent.objective,
          skills: agent.skills,
          visibility: agent.visibility,
        }}
      />
    </div>
  );
}
