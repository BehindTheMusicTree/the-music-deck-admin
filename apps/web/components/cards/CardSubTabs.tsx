"use client";

import { useEffect, useState } from "react";

import { scrollToCardsSection } from "@/lib/cards-nav-scroll";

const SECTIONS = [
  { id: "anatomy", label: "Anatomy" },
  { id: "theme", label: "Theme" },
  { id: "track-transitions", label: "Song Transitions" },
  { id: "genre-transitions", label: "Genre Transitions" },
  { id: "advantage-weakness", label: "Advantage & Weakness" },
  { id: "popularity", label: "Popularity" },
  { id: "intensity", label: "Intensity" },
  { id: "rarities", label: "Rarities" },
] as const;

type Props = { stickToTop?: boolean };

export default function CardSubTabs({ stickToTop = true }: Props) {
  const [active, setActive] = useState("anatomy");

  useEffect(() => {
    const observers = SECTIONS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-20% 0px -70% 0px" },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  return (
    <nav
      className={[
        stickToTop
          ? "sticky top-[56px] z-40 border-b border-ui-border"
          : "border-0",
        "bg-bg/90 backdrop-blur-sm",
      ].join(" ")}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-0 -mx-1 overflow-x-auto [&::-webkit-scrollbar]:h-0">
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(id);
                const nav = (e.currentTarget as HTMLElement).closest("nav");
                if (!el) return;
                scrollToCardsSection(el, nav);
              }}
              className={[
                "tab-font-13 whitespace-nowrap font-mono tracking-[0.12em] px-2.5 sm:px-3 py-2 no-underline border-b-2 -mb-px transition-colors",
                active === id
                  ? "text-gold border-gold"
                  : "text-muted border-transparent hover:text-white hover:border-ui-border",
              ].join(" ")}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
