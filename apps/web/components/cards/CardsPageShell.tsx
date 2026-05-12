"use client";

import { useState, type ReactNode } from "react";

import CardSubTabs from "./CardSubTabs";
import RemixesSubTabs from "../remixes/RemixesSubTabs";

type TopTab = "songs" | "remixes";

const primaryLink =
  "tab-font-13 whitespace-nowrap font-mono tracking-[0.14em] px-3 sm:px-3.5 py-2.5 no-underline border-b-2 -mb-px transition-colors";

type Props = { songs: ReactNode; remixes: ReactNode };

export default function CardsPageShell({ songs, remixes }: Props) {
  const [top, setTop] = useState<TopTab>("songs");

  return (
    <>
      <div
        id="cards-sticky-nav-cluster"
        className="sticky top-[56px] z-40 border-b border-ui-border bg-bg/90 backdrop-blur-sm"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 -mx-1 overflow-x-auto [&::-webkit-scrollbar]:h-0 border-b border-ui-border/40">
            <button
              type="button"
              onClick={() => setTop("songs")}
              className={[
                primaryLink,
                top === "songs"
                  ? "text-gold border-gold"
                  : "text-muted border-transparent hover:text-white hover:border-ui-border",
              ].join(" ")}
            >
              Songs
            </button>
            <button
              type="button"
              onClick={() => setTop("remixes")}
              className={[
                primaryLink,
                top === "remixes"
                  ? "text-gold border-gold"
                  : "text-muted border-transparent hover:text-white hover:border-ui-border",
              ].join(" ")}
            >
              Remixes
            </button>
          </div>
        </div>
        {top === "songs" && <CardSubTabs stickToTop={false} />}
        {top === "remixes" && <RemixesSubTabs stickToTop={false} />}
      </div>
      {top === "songs" && songs}
      {top === "remixes" && remixes}
    </>
  );
}
