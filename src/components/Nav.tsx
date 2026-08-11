"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/practice", label: "Practice" },
  { href: "/challenges", label: "Challenges" },
  { href: "/learn", label: "Learn" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="relative z-20 border-b border-[var(--ink)]/8 bg-[var(--paper)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] transition-colors group-hover:text-[var(--teal)]">
            Practice<span className="text-[var(--teal)]">DAX</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--teal)]/10 text-[var(--teal)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--ink)]/5 hover:text-[var(--ink)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
