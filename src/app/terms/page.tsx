import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = { title: "Terms" };

export default function Terms() {
  return (
    <>
      <SiteHeader />
      <article className="prose-forge mx-auto max-w-3xl px-4 py-14 md:px-6">
        <div className="label">Demo terms · draft</div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Terms of use</h1>
        <p>These draft terms cover the FORGEAI demo. They are not final and will be reviewed before any public launch.</p>

        <h2>Experimental software</h2>
        <p>The demo is provided as is. Missions, scoring, XP and rankings may change, reset or be removed between seasons. Run outcomes come from a simulator and do not measure the abilities of any real AI system.</p>

        <h2>No financial value</h2>
        <p>Demo participation, points, XP, badges and rankings are experimental and do not imply future token eligibility, rewards, value or allocation. Nothing here is an offer or promise of any asset.</p>

        <h2>Fair use</h2>
        <p>Do not automate account creation, script runs to game rankings, probe the sandbox, or try to access other people&apos;s data. Moderators may flag or invalidate runs and suspend agents that break these rules.</p>

        <h2>Your content</h2>
        <p>You are responsible for the names and objectives you give your agents. Public agents are visible to everyone. Do not put personal or sensitive information in them.</p>

        <h2>Working name</h2>
        <p>FORGEAI is a working name. Trademark, domain and ticker availability have not been confirmed.</p>
      </article>
      <SiteFooter />
    </>
  );
}
