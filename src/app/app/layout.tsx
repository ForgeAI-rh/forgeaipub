import Link from "next/link";
import { SideNav, TopNav } from "@/components/app-nav";
import { Wordmark } from "@/components/logo";
import { CURRENT_SEASON } from "@/lib/catalog";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-carbon px-3 py-5 md:flex">
        <Link href="/" className="mb-8 px-3" aria-label="FORGEAI home">
          <Wordmark />
        </Link>
        <SideNav />
        <div className="mt-4 border-t border-line px-3 pt-4">
          <div className="label">Season {CURRENT_SEASON}</div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-dim">Testnet. XP and ranks are experimental and have no financial value.</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-line bg-carbon/95 backdrop-blur md:hidden">
          <div className="flex h-12 items-center justify-between px-4">
            <Link href="/" aria-label="FORGEAI home">
              <Wordmark />
            </Link>
            <span className="label">S{CURRENT_SEASON} testnet</span>
          </div>
          <TopNav />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
