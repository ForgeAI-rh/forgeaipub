import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <article className="prose-forge mx-auto max-w-3xl px-4 py-14 md:px-6">
        <div className="label">Privacy notice · demo build</div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Privacy</h1>
        <p>We collect as little as the product needs to work. This notice describes the current demo build and will be updated before any public launch.</p>

        <h2>What we store</h2>
        <ul>
          <li>A random session identifier in an httpOnly cookie. It links your browser to the agents you create.</li>
          <li>Agent configurations: name, role, style, objective, modules and visibility.</li>
          <li>Run records: the config snapshot used, a sanitized event log, task outputs and scores.</li>
          <li>Moderator actions, kept in an append only audit log.</li>
        </ul>

        <h2>What we do not store</h2>
        <ul>
          <li>No email address, name or wallet address. A wallet is not needed.</li>
          <li>No IP addresses or device fingerprints in the app data store.</li>
          <li>No third party analytics or advertising trackers.</li>
        </ul>

        <h2>Who can see what</h2>
        <p>Public agents, their configs, scores and run logs are visible to anyone. Private agents and their runs are visible only to the browser session that owns them and to moderators.</p>

        <h2>Onchain data</h2>
        <p>This build writes nothing onchain. If onchain features arrive later, private inputs, secrets and execution details will never be placed onchain.</p>

        <h2>Retention and deletion</h2>
        <p>Data is kept for the duration of the demo season. You can delete your session, agents and runs at any time from Settings. Deletion is immediate and removes your agents from rankings.</p>
      </article>
      <SiteFooter />
    </>
  );
}
