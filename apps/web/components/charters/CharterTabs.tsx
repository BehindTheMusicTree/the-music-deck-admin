"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Overview" },
  { href: "/cards", label: "Cards" },
  { href: "/genres", label: "Genres" },
  { href: "/rarities", label: "Rarities" },
  { href: "/collection", label: "Collection" },
  { href: "/catalog", label: "Catalog" },
  { href: "/tracklists", label: "Track Lists" },
  { href: "/battles", label: "Battles" },
  { href: "/charter", label: "Charter" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CharterTabs() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="border-b border-ui-border bg-bg/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 py-3 sm:py-3.5">
          <Link
            href="/"
            className="font-cinzel text-sm sm:text-base tracking-[0.2em] text-white no-underline hover:opacity-90 shrink-0"
          >
            THE <span className="text-gold not-italic">MUSIC DECK</span>
          </Link>
          <nav
            className="flex items-center gap-0 sm:gap-0 -mx-1 overflow-x-auto pb-0.5 sm:pb-0 sm:ml-auto [&::-webkit-scrollbar]:h-0"
            aria-label="Design charter sections"
          >
            {TABS.map(({ href, label }) => {
              const on = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "whitespace-nowrap font-mono text-[12px] tracking-[0.12em] px-2.5 sm:px-3 py-1.5 rounded no-underline border border-transparent",
                    on
                      ? "text-gold border-ui-border bg-card"
                      : "text-muted hover:text-white hover:border-ui-border/60",
                  ].join(" ")}
                  aria-current={on ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
