import Link from "next/link";
import { DeleteData } from "@/components/delete-data";
import { PageHead } from "@/components/ui";
import { read } from "@/lib/db";
import { date } from "@/lib/format";
import { currentAccountId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function Settings() {
  const me = await currentAccountId();
  const db = await read();
  const account = me ? db.accounts.find((a) => a.id === me) : null;
  const agents = me ? db.agents.filter((a) => a.ownerId === me).length : 0;
  const runs = me ? db.runs.filter((r) => r.ownerId === me).length : 0;

  return (
    <div className="space-y-8">
      <PageHead kicker="Account" title="Settings and data">
        What this build stores about you, and how to remove it.
      </PageHead>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="label mb-4">Session</div>
          {account ? (
            <dl className="space-y-2 text-sm">
              <Row k="Type" v="Anonymous browser session" />
              <Row k="Created" v={date(account.createdAt)} />
              <Row k="Agents" v={String(agents)} />
              <Row k="Runs" v={String(runs)} />
            </dl>
          ) : (
            <p className="text-sm text-steel">No session yet. One is created when you forge your first agent.</p>
          )}
        </section>

        <section className="panel p-5">
          <div className="label mb-4">Wallet</div>
          <p className="text-sm leading-relaxed text-steel">
            Not required. Nothing in this build needs a wallet. Linking will stay optional and will only be asked for by features that need an onchain identity, with a clear scope review first.
          </p>
        </section>
      </div>

      <section className="panel p-5">
        <div className="label mb-3">What we store</div>
        <ul className="space-y-1.5 text-sm text-steel">
          <li>A random session ID in an httpOnly cookie, so your agents stay yours.</li>
          <li>Agent configs you create: name, role, style, objective, modules, visibility.</li>
          <li>Run records: config snapshot, sanitized event log, outputs and scores.</li>
          <li>No email, no wallet address, no IP logging in the app data store.</li>
        </ul>
        <Link href="/privacy" className="mt-4 inline-block text-sm text-ink underline decoration-line underline-offset-4 hover:decoration-forge">
          Full privacy notice
        </Link>
      </section>

      <section className="panel border-bad/30 p-5">
        <div className="label mb-2 text-bad">Delete my data</div>
        <p className="mb-4 max-w-xl text-sm text-steel">
          Removes this session, every agent it owns and all of their runs. Rankings update right away. This cannot be undone.
        </p>
        <DeleteData />
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-dim">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
