import { createAgent } from "@/app/actions";
import { ForgeForm } from "@/components/forge-form";
import { PageHead } from "@/components/ui";
import { MAX_AGENTS_PER_ACCOUNT } from "@/lib/catalog";

export const metadata = { title: "Forge Agent" };

export default function ForgePage() {
  return (
    <div className="space-y-8">
      <PageHead kicker="Agent Forge" title="Forge a new agent">
        Set an identity, pick a role and style, then equip modules. New agents start at level 1 and some modules unlock as they level up. Up to{" "}
        {MAX_AGENTS_PER_ACCOUNT} active agents per account.
      </PageHead>
      <ForgeForm action={createAgent} level={1} submitLabel="Create agent" />
    </div>
  );
}
