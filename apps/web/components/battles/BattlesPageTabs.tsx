"use client";

import { useState } from "react";
import Link from "next/link";
import BattlesSubTabs from "./BattlesSubTabs";
import BattleAudioPromptBuilder from "./BattleAudioPromptBuilder";
import BattleAudioLibrary from "./BattleAudioLibrary";
import { BattleAudioUploadForm } from "./BattleAudioUploadForm";

type BattlesTab = "overview" | "audio";

export default function BattlesPageTabs() {
  const [tab, setTab] = useState<BattlesTab>("overview");

  return (
    <>
      <nav className="sticky top-[56px] z-40 bg-bg/90 backdrop-blur-sm border-b border-ui-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 -mx-1 overflow-x-auto [&::-webkit-scrollbar]:h-0">
            {[
              { id: "overview", label: "Overview" },
              { id: "audio", label: "Audio" },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id as BattlesTab)}
                className={[
                  "tab-font-13 whitespace-nowrap font-mono tracking-[0.12em] px-2.5 sm:px-3 py-2 no-underline border-b-2 -mb-px transition-colors",
                  tab === id
                    ? "text-gold border-gold"
                    : "text-muted border-transparent hover:text-white hover:border-ui-border",
                ].join(" ")}
                aria-pressed={tab === id}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {tab === "overview" ? <BattlesOverview /> : <BattlesAudio />}
    </>
  );
}

function BattlesOverview() {
  return (
    <>
      <BattlesSubTabs />
      <div className="min-h-[calc(100vh-56px)] bg-bg px-6 py-12 sm:py-[60px] max-w-4xl mx-auto">
        <div className="page-kicker mb-4">Game</div>
        <h1 className="font-cinzel text-3xl font-bold tracking-[4px] text-white mb-3">
          Battles
        </h1>
        <p className="font-garamond italic text-muted mb-8 max-w-[560px]">
          Battle rules, formats, and scoring concepts — how players face off
          using their music decks.
        </p>

        <div id="card-attributes" className="mb-8 max-w-[560px]">
          <div className="section-title mb-2">Card attributes</div>
          <p className="font-garamond text-muted leading-normal m-0 mb-3">
            Every playable card surfaces four values on the frame. Battle rules
            and card text refer to them when applying modifiers, checks, and
            resolution.
          </p>
          <ul className="font-garamond text-muted leading-normal m-0 pl-5 space-y-3">
            <li>
              <span className="text-white">Popularity</span> — Shown as 1-9
              award symbols on the stat row (gold, platinum, then diamond
              tiers). It measures how broadly the track lands with an audience
              and is independent of intensity.
              <div className="mt-2 h-9 max-w-[280px] rounded-[4px] border border-ui-border/60 bg-bg px-3 flex items-center gap-2">
                <span className="text-[16px] leading-none">🏆</span>
                <span className="text-[16px] leading-none">🏆</span>
                <span className="text-[16px] leading-none">🏆</span>
                <span className="font-mono text-[10px] text-muted ml-auto">
                  NOTE 9
                </span>
              </div>
            </li>
            <li>
              <span className="text-white">Intensity</span> — The triangle gauge
              encodes one of four levels: pop, soft, experimental, or hardcore.
              With a subgenre, intensity follows that subgenre; on a genre-only
              card it follows the parent genre mapping.
              <div className="mt-2 h-9 max-w-[280px] rounded-[4px] border border-ui-border/60 bg-bg px-3 flex items-center">
                <div
                  className="relative w-full h-4 overflow-hidden"
                  style={{
                    clipPath: "polygon(0% 100%, 100% 100%, 100% 0%)",
                    background: "rgba(255,255,255,0.12)",
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 w-3/4"
                    style={{
                      background:
                        "linear-gradient(90deg, #58b85a 0%, #c9b03f 55%, #c55a44 100%)",
                    }}
                  />
                </div>
                <span className="font-mono text-[10px] text-white ml-2">
                  75%
                </span>
              </div>
            </li>
            <li>
              <span className="text-white">Advantage</span> — The matchup strip
              (green side) names genres this card is strong against, each with a
              colour diamond taken from the genre palette.
              <div className="mt-2 h-9 max-w-[280px] rounded-[4px] border border-ui-border/60 bg-bg px-3 flex items-center gap-2">
                <span className="w-2 h-2 rotate-45 bg-[#c8960a] block" />
                <span className="font-mono text-[10px] text-muted">
                  Hip-Hop
                </span>
                <span className="w-2 h-2 rotate-45 bg-[#7a0810] block ml-2" />
                <span className="font-mono text-[10px] text-muted">Metal</span>
              </div>
            </li>
            <li>
              <span className="text-white">Weakness</span> — The same strip (red
              side) names genres this card is weak against, again with matching
              diamonds.
              <div className="mt-2 h-9 max-w-[280px] rounded-[4px] border border-ui-border/60 bg-bg px-3 flex items-center gap-2">
                <span className="w-2 h-2 rotate-45 bg-[#c0387a] block" />
                <span className="font-mono text-[10px] text-muted">
                  Disco/Funk
                </span>
                <span className="w-2 h-2 rotate-45 bg-[#787878] block ml-2" />
                <span className="font-mono text-[10px] text-muted">
                  Vintage
                </span>
              </div>
            </li>
          </ul>
          <p className="font-garamond text-muted text-sm leading-normal mt-3 mb-0">
            Full advantage and weakness columns per genre:{" "}
            <Link
              href="/genres#associations"
              className="text-gold underline-offset-2 hover:underline"
            >
              Genres — Associations
            </Link>
            .
          </p>
        </div>

        <div id="vibe" className="mb-8 max-w-[560px]">
          <div className="section-title mb-2">Vibe</div>
          <ul className="font-garamond text-muted leading-normal m-0 pl-5 space-y-1.5">
            <li>
              The score is a single <span className="text-white">Vibe</span>{" "}
              gauge, not a detached number on its own.
            </li>
            <li>
              The gauge runs from{" "}
              <span className="text-white">100% on player 1&apos;s side</span>{" "}
              to{" "}
              <span className="text-white">100% on player 2&apos;s side</span>,
              with a{" "}
              <span className="text-white">smooth progressive gradient</span>{" "}
              between the two.
            </li>
            <li>
              At the start of the match it reads{" "}
              <span className="text-white">0</span> - neutral (no lead). The
              indicator then shifts along the bar as Vibe changes.
            </li>
          </ul>
        </div>

        <div className="mb-8 max-w-[560px]">
          <div className="section-title mb-3">Vibe gauge (reference)</div>
          <div className="flex items-center justify-between font-mono text-[10px] text-muted tracking-wide mb-1.5">
            <span>P1 100%</span>
            <span>P2 100%</span>
          </div>
          <div
            className="relative h-4 w-full max-w-full rounded-full overflow-hidden border border-ui-border"
            style={{
              background:
                "linear-gradient(90deg, var(--gold-hi) 0%, var(--color-surface) 50%, #4058a0 100%)",
            }}
            role="img"
            aria-label="Vibe gradient from player 1 to player 2; start at centre (0)"
          >
            <div
              className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.6)]"
              aria-hidden
            />
          </div>
          <p className="font-garamond text-xs text-muted mt-2.5 m-0 leading-normal">
            Centre mark = 0 at battle start. The fill or needle moves from there
            toward one player or the other.
          </p>
        </div>

        <div id="initialisation-phase" className="mb-8 max-w-[560px]">
          <div className="section-title mb-2">Initialisation phase</div>
          <ul className="font-garamond text-muted leading-normal m-0 pl-5 space-y-1.5">
            <li>Both players load one saved track list (exactly 60 cards).</li>
            <li>
              The game validates the list, then sets the Vibe gauge at 0
              (neutral centre).
            </li>
            <li>
              Opening hand, first player, and any pre-battle effects are
              resolved before turn 1 starts.
            </li>
          </ul>
        </div>

        <div id="turns" className="mb-8 max-w-[560px]">
          <div className="section-title mb-2">Game turns</div>
          <ul className="font-garamond text-muted leading-normal m-0 pl-5 space-y-1.5">
            <li>
              Each turn follows a fixed order: draw, play, resolve effects, then
              end phase.
            </li>
            <li>
              Stacks, synergies, and matchup modifiers are applied during effect
              resolution.
            </li>
            <li>
              Vibe shifts after each resolution window based on the turn
              outcome.
            </li>
          </ul>
        </div>

        <div
          id="formats"
          className="text-muted font-garamond italic text-lg text-center max-w-[560px]"
        >
          Further battle rules and formats coming soon.
        </div>
      </div>
    </>
  );
}

function BattlesAudio() {
  const [audioTab, setAudioTab] = useState<"overview" | "library" | "upload">("overview");
  return (
    <div className="min-h-[calc(100vh-56px)] bg-bg px-6 py-12 sm:py-[60px] max-w-4xl mx-auto">
      <div className="page-kicker mb-4">Game</div>
      <h1 className="font-cinzel text-3xl font-bold tracking-[4px] text-white mb-3">
        Battles — Audio
      </h1>
      <p className="font-garamond italic text-muted mb-8 max-w-[660px]">
        Battle audio specification for production and runtime only. This section
        is internal tooling for the game designer, not player-facing UX.
      </p>

      <nav className="mb-8 border-b border-ui-border/70">
        <div className="flex items-center gap-1 -mx-1 overflow-x-auto [&::-webkit-scrollbar]:h-0">
          {[
            { id: "overview", label: "Overview" },
            { id: "library", label: "Library" },
            { id: "upload", label: "Upload" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setAudioTab(id as "overview" | "library" | "upload")}
              className={[
                "tab-font-13 whitespace-nowrap font-mono tracking-[0.12em] px-2.5 sm:px-3 py-2 no-underline border-b-2 -mb-px transition-colors",
                audioTab === id
                  ? "text-gold border-gold"
                  : "text-muted border-transparent hover:text-white hover:border-ui-border",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {audioTab === "upload" ? (
        <section className="max-w-[760px]">
          <h2 className="section-title mb-4">Upload battle audio</h2>
          <p className="font-garamond text-muted mb-6">
            Upload an MP3 to S3. The token must match the slug used by the
            game client (e.g. <span className="font-mono text-white/70">genre-rock--intensity-experimental</span>).
            Version 1 is the default; use higher versions for alternate takes.
          </p>
          <BattleAudioUploadForm />
        </section>
      ) : audioTab === "overview" ? (
        <>
          <section className="mb-10 max-w-[760px]">
            <h2 className="section-title mb-2">1) Battle audio strategy</h2>
            <ul className="font-garamond text-muted leading-normal m-0 pl-5 space-y-1.5">
              <li>All battle songs are AI-generated in production.</li>
              <li>All battle songs are streamed at runtime.</li>
              <li>
                Each generated asset is 3:00 and must avoid plagiarism and
                celebrity voice imitation.
              </li>
              <li>
                Non-battle audio (menus, collection, UI, boosters) is out of
                scope in this section.
              </li>
            </ul>
          </section>

          <section className="mb-10 max-w-[760px]">
            <h2 className="section-title mb-2">2) Catalog scope and counts</h2>
            <ul className="font-garamond text-muted leading-normal m-0 pl-5 space-y-1.5">
              <li>
                Genre-intensity nodes: Mainstream (pop-only) = 1, plus 7 genres
                x 4 intensity = 28.
              </li>
              <li>Countries target: 50.</li>
              <li>Total elements: 79.</li>
              <li>Total 2-element combinations: C(79,2) = 3081.</li>
              <li>
                Total generated duration: 3081 x 3 min = 9243 min (~154.1
                hours).
              </li>
            </ul>
          </section>

          <section className="mb-10 max-w-[760px]">
            <h2 className="section-title mb-2">3) Battle playback logic</h2>
            <ul className="font-garamond text-muted leading-normal m-0 pl-5 space-y-1.5">
              <li>
                Active turn decides ownership: your turn plays your active
                context, opponent turn plays theirs.
              </li>
              <li>No active card for the current player means silence.</li>
              <li>
                One active card plays its single track (country or
                genre-intensity).
              </li>
              <li>
                Two active cards play the dedicated 2-element combination track.
              </li>
              <li>
                Three or more active cards use the combination of the two most
                recently activated cards.
              </li>
              <li>First start from silence begins at 0:00 with no fade-in.</li>
              <li>
                Any transition with an already playing track uses overlap
                crossfade: fade-out/fade-in both at 3s, with the incoming track
                starting from a random offset between 10s and 120s.
              </li>
              <li>
                On track ending, self-crossfade at 3s and restart the same track
                at 0:00.
              </li>
              <li>
                If crossfade A -&gt; B is in progress and C arrives, cancel B
                and redirect immediately to A -&gt; C (last-write-wins).
              </li>
            </ul>
          </section>

          <section className="max-w-[760px]">
            <BattleAudioPromptBuilder />
          </section>
        </>
      ) : (
        <BattleAudioLibrary />
      )}
    </div>
  );
}
