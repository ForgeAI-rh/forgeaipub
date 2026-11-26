"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: Array<[string, string, string]> = [
  ["Overview", "/app", "00"],
  ["My Agents", "/app/agents", "01"],
  ["Forge Agent", "/app/forge", "02"],
  ["Missions", "/app/missions", "03"],
  ["Lab", "/app/runs", "04"],
  ["Leaderboard", "/app/leaderboard", "05"],
  ["Registry", "/app/registry", "06"],
  ["Documentation", "/docs", "07"],
];

const FOOT: Array<[string, string]> = [
  ["Settings", "/app/settings"],
  ["Moderation", "/app/admin"],
];

function isActive(path: string, href: string) {
  if (href === "/app") return path === "/app";
  return path === href || path.startsWith(`${href}/`);
}

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-1 flex-col justify-between">
      <ul className="space-y-0.5">
        {ITEMS.map(([label, href, code]) => {
          const on = isActive(path, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-[2px] px-3 py-2 text-[13.5px] ${
                  on ? "bg-graphite text-ink" : "text-steel hover:bg-graphite/50 hover:text-ink"
                }`}
              >
                <span className={`font-mono text-[10px] ${on ? "text-forge" : "text-dim"}`}>{code}</span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className="space-y-0.5 border-t border-line pt-3">
        {FOOT.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className={`block rounded-[2px] px-3 py-1.5 text-[13px] ${isActive(path, href) ? "text-ink" : "text-dim hover:text-steel"}`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function TopNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
      {[...ITEMS, ...FOOT.map(([l, h]) => [l, h, ""] as [string, string, string])].map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className={`shrink-0 rounded-[2px] px-2.5 py-1.5 text-[13px] ${
            isActive(path, href) ? "bg-graphite text-ink" : "text-steel"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
