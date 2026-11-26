import Link from "next/link";
import { Wordmark } from "./logo";

const NAV = [
  ["Product", "/#product"],
  ["How it works", "/how"],
  ["Missions", "/#missions"],
  ["Registry", "/app/registry"],
  ["Docs", "/docs"],
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-carbon/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="FORGEAI home">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] text-steel md:flex">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/how" className="text-[13px] text-steel hover:text-ink md:hidden">
            How it works
          </Link>
          <Link href="/app" className="btn btn-primary btn-sm">
            Launch App
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-6">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm text-steel">Intelligence isn&apos;t given. It&apos;s forged.</p>
          <p className="mt-6 text-xs text-dim">FORGEAI is a working name. Testnet build, experimental.</p>
        </div>
        <FooterCol title="Product" links={[["Launch App", "/app"], ["Missions", "/app/missions"], ["Leaderboard", "/app/leaderboard"], ["Registry", "/app/registry"]]} />
        <FooterCol title="Docs" links={[["How it works", "/how"], ["Overview", "/docs"], ["Scoring", "/docs#scoring"], ["Progression", "/docs#progression"], ["Builder API", "/docs#api"]]} />
        <div>
          <div className="label mb-3">Legal and community</div>
          <ul className="space-y-2 text-sm text-steel">
            <li><Link className="hover:text-ink" href="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-ink" href="/terms">Terms</Link></li>
            <li className="text-dim">X and community channels open at public launch</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-[11px] leading-relaxed text-dim md:px-6">
          Testnet participation, points, XP, badges and rankings are experimental and do not imply future token eligibility, rewards, value or allocation.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <div className="label mb-3">{title}</div>
      <ul className="space-y-2 text-sm text-steel">
        {links.map(([l, h]) => (
          <li key={h}>
            <Link href={h} className="hover:text-ink">
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
