"use client";

import { useMemo, useState } from "react";
import {
  GENRE_NAMES,
  GENRE_THEMES,
  WHEEL_GENRES,
  genreIntensityColor,
  type Intensity,
  type NonMainstreamGenreName,
} from "@/lib/genres";

type ArtworksTabId = "format" | "dominant-colour" | "style" | "mix" | "prompt";

const ARTWORK_TABS: { id: ArtworksTabId; label: string }[] = [
  { id: "format", label: "1. Format" },
  { id: "dominant-colour", label: "2. Dominant colour" },
  { id: "style", label: "3. Style" },
  { id: "mix", label: "4. Mixed influences" },
  { id: "prompt", label: "5. Prompt generator" },
];

const INTENSITIES: Intensity[] = ["POP", "SOFT", "EXPERIMENTAL", "HARDCORE"];

const GENRE_STYLE_GUIDE: {
  genre: string;
  style: string;
  notes: string;
}[] = [
  {
    genre: "Mainstream (Pop)",
    style: "Heroic fantasy illustration",
    notes:
      "High-polish digital painting, clean heroic-fantasy finish, smooth gradients, soft bloom, luminous white-gold highlights, minimal visible brush grain.",
  },
  {
    genre: "Rock",
    style: "Gritty stage realism with painterly grain",
    notes:
      "Analog-leaning painterly rendering, visible dry-brush strokes, matte/grainy surface, warm red-amber grading, imperfect edges, tactile material noise; prioritise organic brushwork over geometric cleanliness.",
  },
  {
    genre: "Hip-Hop",
    style: "Early-2000s cel-shaded street mural aesthetic",
    notes:
      "General art direction: realistic comic-book look with thick black outlines, clean silhouettes, and believable human proportions. Cell-shading approach: flat shadow blocks, minimal gradients, and sharply cut shadow areas. Saturated but slightly dusty palette with warm early-2000s California energy. Characters: stylized faces with simplified features and expressive reads (without caricature); heavy contour lines around face, nose, lips, and glasses; stylized streetwear, never photoreal. Simple perspective, straight lines, sharp angles, limited micro-detail, clean smooth surface treatment. Light and mood: hard Los Angeles-style daylight, crisp cast shadows, warm dominance (gold, beige, yellow, sand, sky blue), high contrast with bright highlights and deep shadows. Cars and props: slightly exaggerated forms, heavy body silhouettes, wide wheels, stylized light-band reflections, vivid paint with pronounced chrome accents.",
  },
  {
    genre: "Disco/Funk",
    style: "Neon beachfront nightlife poster aesthetic",
    notes:
      "Retro poster-driven illustration, neon magenta/cyan/gold treatment, glossy highlights, chrome-like accents, clean vector-like readability with light print-grain overlay.",
  },
  {
    genre: "Reggae/Dub",
    style: "Caribbean vintage poster style",
    notes:
      "Vintage poster print look, warm faded inks, softened contrast, retro paper texture, subtle offset-print imperfections, slightly desaturated sun-aged colour handling.",
  },
  {
    genre: "Vintage",
    style: "Old photographs",
    notes:
      "Archival photo emulation, low-contrast tonal curve, analog grain, dust/scratch artifacts, mild halation, faded chemical colour cast, reduced modern digital sharpness.",
  },
  {
    genre: "Electronic",
    style: "Futurist techno-ritual concept art",
    notes:
      "Synthetic digital render language, hard-surface geometric clarity, cool cyan/blue-violet grading, emissive light accents, smooth gradients, controlled bloom, and near-clinical edge precision; prioritise engineered cleanliness over painterly texture.",
  },
  {
    genre: "Classical",
    style: "Epic paintings",
    notes:
      "Grand oil-painting language, chiaroscuro value structure, painterly brush massing, canvas-like depth, classical glazing feel, rich but restrained pigment rendering.",
  },
];

export const PROMPT_EXAMPLES: {
  genre: string;
  intensity: Intensity;
  prompt: string;
}[] = [
  {
    genre: "Mainstream",
    intensity: "POP",
    prompt:
      "Heroic fantasy illustration, vertical 2:3. A radiant central performer rises above a cheering crowd under golden-white light, cinematic symmetry, uplifting emotion, no text or logos.",
  },
  {
    genre: "Rock",
    intensity: "SOFT",
    prompt:
      "Gritty stage realism with painterly grain, vertical 2:3. A lone guitarist under warm amber sidelights, smoky depth, worn textures, emotionally restrained power, no text or logos.",
  },
  {
    genre: "Electronic",
    intensity: "EXPERIMENTAL",
    prompt:
      "Futurist techno-ritual concept art, vertical 2:3. Abstract performer silhouette inside geometric neon architecture, layered fog, synthetic reflections, controlled chaos, no text or logos.",
  },
  {
    genre: "Hip-Hop",
    intensity: "EXPERIMENTAL",
    prompt:
      "Early-2000s cel-shaded street mural aesthetic, vertical 2:3. Anonymous rapper silhouette in a tilted city canyon, bold outlines, vivid shadows, urban tension, no text or logos.",
  },
  {
    genre: "Disco/Funk",
    intensity: "POP",
    prompt:
      "Neon beachfront nightlife poster aesthetic, vertical 2:3. Dance silhouettes under warm magenta-cyan lights, chrome highlights, retro exuberance, no text or logos.",
  },
  {
    genre: "Reggae/Dub",
    intensity: "SOFT",
    prompt:
      "Caribbean vintage poster style, warm faded colours, soft grain, retro paper texture, vertical 2:3. Anonymous singer near coastal architecture and drifting haze, no text or logos.",
  },
  {
    genre: "Vintage",
    intensity: "SOFT",
    prompt:
      "Old-photograph style, vertical 2:3. Anonymous quartet in a dim jazz room, subtle film wear, desaturated palette, nostalgic stillness, no text or logos.",
  },
  {
    genre: "Classical",
    intensity: "HARDCORE",
    prompt:
      "Epic painting style, vertical 2:3. Monumental orchestra silhouettes in storm-lit architecture, deep chiaroscuro, sacred grandeur, no text or logos.",
  },
];

function intensityColourRow(genre: string, intensity: Intensity): string {
  if (genre === "Mainstream") return GENRE_THEMES.Mainstream.border;
  return genreIntensityColor(genre as NonMainstreamGenreName, intensity);
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
}

function annularSectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngleDeg: number,
  endAngleDeg: number,
) {
  const outerStart = polarToXY(cx, cy, outerR, startAngleDeg);
  const outerEnd = polarToXY(cx, cy, outerR, endAngleDeg);
  const innerEnd = polarToXY(cx, cy, innerR, endAngleDeg);
  const innerStart = polarToXY(cx, cy, innerR, startAngleDeg);
  const span = (((endAngleDeg - startAngleDeg) % 360) + 360) % 360;
  const largeArc = span > 180 ? 1 : 0;
  if (innerR <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      "Z",
    ].join(" ");
  }
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function isLightHex(hex: string): boolean {
  const s = hex.replace("#", "");
  const normalized =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

type WheelChoice = {
  genre: string;
  intensity: Intensity;
  colour: string;
};

type PromptMode = "creation" | "modification";

function formatIntensity(i: Intensity): string {
  return i.charAt(0).toUpperCase() + i.slice(1);
}

function styleGuideForGenre(
  genre: string,
): { style: string; notes: string } | null {
  const key = genre === "Mainstream" ? "Mainstream (Pop)" : genre;
  const row = GENRE_STYLE_GUIDE.find((g) => g.genre === key);
  return row ? { style: row.style, notes: row.notes } : null;
}

export default function CardsArtworksSection() {
  const [activeTab, setActiveTab] = useState<ArtworksTabId>("format");
  const [hoveredWheelColour, setHoveredWheelColour] = useState<{
    genre: string;
    intensity: Intensity;
    colour: string;
    x: number;
    y: number;
  } | null>(null);
  const [primaryPromptChoice, setPrimaryPromptChoice] = useState<WheelChoice>({
    genre: "Mainstream",
    intensity: "POP",
    colour: GENRE_THEMES.Mainstream.border,
  });
  const [secondaryPromptChoice, setSecondaryPromptChoice] =
    useState<WheelChoice | null>(null);
  const [promptMode, setPromptMode] = useState<PromptMode>("creation");
  const [promptSubject, setPromptSubject] = useState("");
  const [hoveredPromptSegment, setHoveredPromptSegment] = useState<
    string | null
  >(null);

  const dominantColourByGenre = useMemo(
    () =>
      GENRE_NAMES.map((genre) => {
        const intensities =
          genre === "Mainstream" ? (["POP"] as const) : INTENSITIES;
        return {
          genre,
          entries: intensities.map((intensity) => ({
            intensity,
            colour: intensityColourRow(genre, intensity),
          })),
        };
      }),
    [],
  );

  const dominantColourWheel = useMemo(() => {
    const byGenre = new Map(
      dominantColourByGenre
        .filter((g) => g.genre !== "Mainstream")
        .map((g) => [g.genre, g] as const),
    );
    const ordered = WHEEL_GENRES.map((wg) => {
      const entry = byGenre.get(wg.n);
      if (!entry) {
        throw new Error(
          `Missing dominant-colour entry for wheel genre "${wg.n}"`,
        );
      }
      return entry;
    });
    return ordered.map((g, i, arr) => {
      const angleDeg = -90 + (i * 360) / arr.length;
      const p = polarToXY(220, 220, 204, angleDeg);
      return { ...g, angleDeg, x: p.x, y: p.y };
    });
  }, [dominantColourByGenre]);

  const generatedPrompt = useMemo(() => {
    const base =
      "Vertical 2:3 high-detail illustration. Draw only within the top 40% of the frame where all key visual elements must be concentrated. Keep the bottom 60% mostly empty, soft, and out-of-focus (blurred atmosphere, minimal detail, no important subject matter) to preserve card UI readability. Subjects should have no resemblance to celebrities. No text, no symbols, no logos.";
    const modificationBase =
      "Keep the exact same structure and composition as the input image (same framing, subject placement, meme dispositions, and overall layout). Modify only selected elements while preserving the original scene architecture; style changes are allowed.";
    const primaryGuide = styleGuideForGenre(primaryPromptChoice.genre);
    const primary = `Primary style anchor with dominant colour ${primaryPromptChoice.colour}.${
      primaryGuide
        ? ` Style: ${primaryGuide.style}. Guidance: ${primaryGuide.notes}`
        : ""
    }`;
    const secondaryGuide = secondaryPromptChoice
      ? styleGuideForGenre(secondaryPromptChoice.genre)
      : null;
    const secondary = secondaryPromptChoice
      ? `Secondary influence blended as supporting visual language, not overriding the primary anchor. Secondary dominant colour ${secondaryPromptChoice.colour}. Secondary intensity mood: ${formatIntensity(secondaryPromptChoice.intensity)}.${
          secondaryGuide
            ? ` Style: ${secondaryGuide.style}. Guidance: ${secondaryGuide.notes}`
            : ""
        }`
      : "";
    const details =
      promptMode === "modification"
        ? promptSubject.trim()
          ? `Modification: ${promptSubject.trim()}.`
          : "Modification: [Describe exactly which elements change while keeping the same structure and composition as the input image]."
        : promptSubject.trim()
          ? `Subject: ${promptSubject.trim()}.`
          : "Subject: [Describe the scene, characters, action, and mood].";
    return [
      base,
      promptMode === "modification" ? modificationBase : "",
      primary,
      secondary,
      details,
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [primaryPromptChoice, promptMode, secondaryPromptChoice, promptSubject]);

  return (
    <div className="rounded-[6px] border border-ui-border bg-[#0f0f14]/35 px-5 py-4">
      <nav
        className="flex gap-0 -mx-1 overflow-x-auto [&::-webkit-scrollbar]:h-0 border-b border-ui-border mb-6"
        aria-label="Artwork guidance sections"
      >
        {ARTWORK_TABS.map((tab) => {
          const on = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={[
                "whitespace-nowrap font-mono text-[11px] sm:text-[12px] tracking-[0.12em] px-3 py-2 border-b-2 -mb-px",
                on
                  ? "text-gold border-gold"
                  : "text-muted border-transparent hover:text-white",
              ].join(" ")}
              onClick={() => setActiveTab(tab.id)}
              aria-current={on ? "page" : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "format" ? (
        <section>
          <div className="section-label-accent mb-2">Artwork format</div>
          <ul className="font-garamond text-muted leading-[1.8] pl-5 list-disc">
            <li>Master format: vertical 2:3.</li>
            <li>
              Lower ~60% is usually covered by UI: place key elements in the
              upper third.
            </li>
            <li>No text, logos, or signatures in final artwork.</li>
            <li>
              Keep faces anonymised unless rights are explicitly cleared for
              recognisable likeness.
            </li>
          </ul>
        </section>
      ) : null}

      {activeTab === "dominant-colour" ? (
        <section>
          <div className="section-label-accent mb-2">
            Dominant colour system
          </div>
          <p className="font-garamond text-muted mb-4">
            Dominant colour comes from genre + intensity. Country-native
            subgenre cards follow country/region visual identity instead of this
            wheel.
          </p>
          <div className="flex justify-center">
            <svg
              width={440}
              height={440}
              viewBox="0 0 440 440"
              className="overflow-visible"
            >
              {WHEEL_GENRES.flatMap((g, i) => {
                const slice = 360 / WHEEL_GENRES.length;
                const start = i * slice - 90 - slice / 2;
                const end = i * slice - 90 + slice / 2;
                const genre = g.n as NonMainstreamGenreName;
                return [
                  {
                    intensity: "POP" as const,
                    inner: 0,
                    outer: 84,
                  },
                  {
                    intensity: "SOFT" as const,
                    inner: 84,
                    outer: 116,
                  },
                  {
                    intensity: "EXPERIMENTAL" as const,
                    inner: 116,
                    outer: 148,
                  },
                  {
                    intensity: "HARDCORE" as const,
                    inner: 148,
                    outer: 180,
                  },
                ].map((band) => (
                  <path
                    key={`${g.n}-${band.intensity}`}
                    d={annularSectorPath(
                      220,
                      220,
                      band.inner,
                      band.outer,
                      start,
                      end,
                    )}
                    fill={genreIntensityColor(genre, band.intensity)}
                    onMouseEnter={() =>
                      setHoveredWheelColour({
                        genre: g.n,
                        intensity: band.intensity,
                        colour: genreIntensityColor(genre, band.intensity),
                        x: 0,
                        y: 0,
                      })
                    }
                    onMouseMove={(e) =>
                      setHoveredWheelColour((prev) =>
                        prev
                          ? {
                              ...prev,
                              x: e.clientX,
                              y: e.clientY,
                            }
                          : prev,
                      )
                    }
                    onMouseLeave={() => setHoveredWheelColour(null)}
                  />
                ));
              })}

              <circle
                cx={220}
                cy={220}
                r={84}
                fill="none"
                stroke="rgba(255,255,255,.16)"
                strokeDasharray="4 6"
              />
              <circle
                cx={220}
                cy={220}
                r={116}
                fill="none"
                stroke="rgba(255,255,255,.16)"
                strokeDasharray="4 6"
              />
              <circle
                cx={220}
                cy={220}
                r={148}
                fill="none"
                stroke="rgba(255,255,255,.16)"
                strokeDasharray="4 6"
              />
              <circle
                cx={220}
                cy={220}
                r={180}
                fill="none"
                stroke="rgba(255,255,255,.16)"
                strokeDasharray="4 6"
              />

              {dominantColourWheel.map((g) => {
                const rad = (g.angleDeg * Math.PI) / 180;
                const rayX = 220 + 180 * Math.cos(rad);
                const rayY = 220 + 180 * Math.sin(rad);
                return (
                  <g key={g.genre}>
                    <line
                      x1={220}
                      y1={220}
                      x2={rayX}
                      y2={rayY}
                      stroke="rgba(255,255,255,.22)"
                      strokeWidth={1}
                    />
                    {g.entries.map((entry) => {
                      const radius =
                        entry.intensity === "POP"
                          ? 84
                          : entry.intensity === "SOFT"
                            ? 116
                            : entry.intensity === "EXPERIMENTAL"
                              ? 148
                              : 180;
                      const x = 220 + radius * Math.cos(rad);
                      const y = 220 + radius * Math.sin(rad);
                      return (
                        <circle
                          key={`${g.genre}-${entry.intensity}`}
                          cx={x}
                          cy={y}
                          r={6}
                          fill={entry.colour}
                          stroke="rgba(255,255,255,.25)"
                          strokeWidth={1}
                          onMouseEnter={() =>
                            setHoveredWheelColour({
                              genre: g.genre,
                              intensity: entry.intensity,
                              colour: entry.colour,
                              x: 0,
                              y: 0,
                            })
                          }
                          onMouseMove={(e) =>
                            setHoveredWheelColour((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    x: e.clientX,
                                    y: e.clientY,
                                  }
                                : prev,
                            )
                          }
                          onMouseLeave={() => setHoveredWheelColour(null)}
                        >
                          <title>{`${g.genre} · ${entry.intensity}: ${entry.colour}`}</title>
                        </circle>
                      );
                    })}
                    <text
                      x={g.x}
                      y={g.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-mono text-[10px] tracking-[0.08em] fill-white/65"
                    >
                      {g.genre}
                    </text>
                  </g>
                );
              })}

              {WHEEL_GENRES.map((_, i) => {
                const angle = ((i + 0.5) / WHEEL_GENRES.length) * 360 - 90;
                const outer = polarToXY(220, 220, 180, angle);
                return (
                  <line
                    key={`divider-${i}`}
                    x1={220}
                    y1={220}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="rgba(255,255,255,.24)"
                    strokeWidth={1}
                  />
                );
              })}

              <circle
                cx={220}
                cy={220}
                r={26}
                fill={GENRE_THEMES.Mainstream.border}
                stroke="rgba(255,255,255,.25)"
                strokeWidth={1.5}
                onMouseEnter={() =>
                  setHoveredWheelColour({
                    genre: "Mainstream",
                    intensity: "POP",
                    colour: GENRE_THEMES.Mainstream.border,
                    x: 0,
                    y: 0,
                  })
                }
                onMouseMove={(e) =>
                  setHoveredWheelColour((prev) =>
                    prev
                      ? {
                          ...prev,
                          x: e.clientX,
                          y: e.clientY,
                        }
                      : prev,
                  )
                }
                onMouseLeave={() => setHoveredWheelColour(null)}
              >
                <title>{`Mainstream · pop: ${GENRE_THEMES.Mainstream.border}`}</title>
              </circle>
              <text
                x={220}
                y={220}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-cinzel text-[10px] tracking-[0.08em] fill-black/70"
              >
                Mainstream
              </text>
            </svg>
          </div>
          {hoveredWheelColour && hoveredWheelColour.x > 0 ? (
            <div
              className="fixed z-150 rounded border border-white/20 px-3 py-2 pointer-events-none"
              style={{
                left: hoveredWheelColour.x + 14,
                top: hoveredWheelColour.y + 14,
                background: hoveredWheelColour.colour,
              }}
            >
              <div
                className="font-mono text-[12px] tracking-[0.08em] uppercase whitespace-nowrap"
                style={{
                  color: isLightHex(hoveredWheelColour.colour)
                    ? "rgba(10,10,10,.9)"
                    : "rgba(255,255,255,.96)",
                }}
              >
                {hoveredWheelColour.genre} · {hoveredWheelColour.intensity} ·{" "}
                {hoveredWheelColour.colour}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "style" ? (
        <section>
          <div className="section-label-accent mb-2">Genre style guide</div>
          <div className="flex flex-col gap-3">
            {GENRE_STYLE_GUIDE.map((row) => (
              <div
                key={row.genre}
                className="rounded border border-ui-border/70 bg-[#12121a]/45 px-4 py-3"
              >
                <div className="font-cinzel tracking-widest text-gold">
                  {row.genre}
                </div>
                <div className="font-garamond text-white/90 mt-1">
                  {row.style}
                </div>
                <div className="font-garamond text-muted mt-1">{row.notes}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "mix" ? (
        <section>
          <div className="section-label-accent mb-2">Mixed influences</div>
          <p className="font-garamond text-muted leading-[1.8] mb-3">
            Subgenres with influence metadata should blend both parent
            identities in one coherent visual system.
          </p>
          <p className="font-garamond text-muted leading-[1.8]">
            Example: <span className="text-white/90">Nu Metal</span> keeps Rock
            hardcore as primary anchor (palette, texture, aggression), then adds
            Hip-Hop hardcore cues (rhythmic graphic language, urban forms,
            silhouette attitude).
          </p>
        </section>
      ) : null}

      {activeTab === "prompt" ? (
        <section>
          <div className="section-label-accent mb-2">Prompt generator</div>
          <div className="font-garamond text-muted mb-4">
            1) Choose primary genre/intensity. 2) Optionally choose a secondary
            influence. 3) Write the subject. 4) Copy the generated prompt.
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
            {[
              {
                title: "1. Primary genre/intensity",
                selected: primaryPromptChoice,
                setSelected: setPrimaryPromptChoice,
              },
              {
                title: "2. Secondary genre/intensity (optional)",
                selected: secondaryPromptChoice,
                setSelected: setSecondaryPromptChoice,
              },
            ].map(({ title, selected, setSelected }) => (
              <div
                key={title}
                className="rounded border border-ui-border/70 bg-[#12121a]/45 px-4 py-4"
              >
                <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-3">
                  {title}
                </div>
                <div className="flex justify-center">
                  <svg width={340} height={340} viewBox="0 0 440 440">
                    {WHEEL_GENRES.flatMap((g, i) => {
                      const slice = 360 / WHEEL_GENRES.length;
                      const start = i * slice - 90 - slice / 2;
                      const end = i * slice - 90 + slice / 2;
                      const genre = g.n as NonMainstreamGenreName;
                      return [
                        { intensity: "POP" as const, inner: 0, outer: 84 },
                        { intensity: "SOFT" as const, inner: 84, outer: 116 },
                        {
                          intensity: "EXPERIMENTAL" as const,
                          inner: 116,
                          outer: 148,
                        },
                        {
                          intensity: "HARDCORE" as const,
                          inner: 148,
                          outer: 180,
                        },
                      ].map((band) => {
                        const colour = genreIntensityColor(
                          genre,
                          band.intensity,
                        );
                        const hoverId = `${title}-${g.n}-${band.intensity}`;
                        const active =
                          selected?.genre === g.n &&
                          selected?.intensity === band.intensity;
                        const hovered = hoveredPromptSegment === hoverId;
                        return (
                          <path
                            key={hoverId}
                            d={annularSectorPath(
                              220,
                              220,
                              band.inner,
                              band.outer,
                              start,
                              end,
                            )}
                            fill={colour}
                            stroke={
                              active
                                ? "rgba(255,255,255,.95)"
                                : "rgba(255,255,255,.08)"
                            }
                            strokeWidth={active || hovered ? 2 : 1}
                            style={{
                              cursor: "pointer",
                              filter: hovered
                                ? "brightness(1.14) saturate(1.08)"
                                : "none",
                              transformOrigin: "220px 220px",
                              transition:
                                "filter 120ms ease, stroke-width 120ms ease",
                            }}
                            onMouseEnter={() =>
                              setHoveredPromptSegment(hoverId)
                            }
                            onMouseLeave={() => setHoveredPromptSegment(null)}
                            onClick={() =>
                              setSelected({
                                genre: g.n,
                                intensity: band.intensity,
                                colour,
                              })
                            }
                          />
                        );
                      });
                    })}

                    {[84, 116, 148, 180].map((r) => (
                      <circle
                        key={`${title}-ring-${r}`}
                        cx={220}
                        cy={220}
                        r={r}
                        fill="none"
                        stroke="rgba(255,255,255,.16)"
                        strokeDasharray="4 6"
                      />
                    ))}

                    {WHEEL_GENRES.map((_, i) => {
                      const angle =
                        ((i + 0.5) / WHEEL_GENRES.length) * 360 - 90;
                      const outer = polarToXY(220, 220, 180, angle);
                      return (
                        <line
                          key={`${title}-divider-${i}`}
                          x1={220}
                          y1={220}
                          x2={outer.x}
                          y2={outer.y}
                          stroke="rgba(255,255,255,.24)"
                          strokeWidth={1}
                        />
                      );
                    })}

                    <circle
                      cx={220}
                      cy={220}
                      r={26}
                      fill={GENRE_THEMES.Mainstream.border}
                      stroke={
                        selected?.genre === "Mainstream"
                          ? "rgba(255,255,255,.95)"
                          : "rgba(255,255,255,.25)"
                      }
                      strokeWidth={selected?.genre === "Mainstream" ? 2 : 1.5}
                      onMouseEnter={() =>
                        setHoveredPromptSegment(`${title}-Mainstream-pop`)
                      }
                      onMouseLeave={() => setHoveredPromptSegment(null)}
                      onClick={() =>
                        setSelected({
                          genre: "Mainstream",
                          intensity: "POP",
                          colour: GENRE_THEMES.Mainstream.border,
                        })
                      }
                      style={{
                        cursor: "pointer",
                        filter:
                          hoveredPromptSegment === `${title}-Mainstream-pop`
                            ? "brightness(1.12) saturate(1.06)"
                            : "none",
                        transition:
                          "filter 120ms ease, stroke-width 120ms ease",
                      }}
                    />
                    <text
                      x={220}
                      y={220}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-cinzel text-[10px] tracking-[0.08em] fill-black/70"
                    >
                      Mainstream
                    </text>
                  </svg>
                </div>
                <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted text-center">
                  {selected
                    ? `${selected.genre} · ${selected.intensity} · ${selected.colour}`
                    : "None selected"}
                </div>
                {title.includes("Secondary") ? (
                  <div className="mt-2 flex justify-center">
                    <button
                      type="button"
                      className="font-mono text-[10px] tracking-[0.08em] text-gold border border-ui-border rounded px-2 py-1 hover:bg-white/5"
                      onClick={() => setSecondaryPromptChoice(null)}
                    >
                      Clear secondary
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="rounded border border-ui-border/70 bg-[#12121a]/45 px-4 py-4 mb-4">
            <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-2">
              3. Prompt mode
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPromptMode("creation")}
                className={[
                  "font-mono text-[11px] tracking-[0.08em] border rounded px-3 py-1.5",
                  promptMode === "creation"
                    ? "border-gold text-gold bg-white/5"
                    : "border-ui-border text-muted hover:text-white",
                ].join(" ")}
              >
                Creation prompt
              </button>
              <button
                type="button"
                onClick={() => setPromptMode("modification")}
                className={[
                  "font-mono text-[11px] tracking-[0.08em] border rounded px-3 py-1.5",
                  promptMode === "modification"
                    ? "border-gold text-gold bg-white/5"
                    : "border-ui-border text-muted hover:text-white",
                ].join(" ")}
              >
                Modification prompt
              </button>
            </div>
            <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-2">
              4. {promptMode === "modification" ? "Modification" : "Subject"}
            </div>
            <textarea
              value={promptSubject}
              onChange={(e) => setPromptSubject(e.target.value)}
              placeholder={
                promptMode === "modification"
                  ? "Describe what changes (elements, style, lighting, palette) while keeping the exact same structure and composition..."
                  : "Describe the scene subject, action, mood, setting..."
              }
              className="w-full min-h-[100px] rounded border border-ui-border bg-[#0f0f14] px-3 py-2 text-white/90 placeholder:text-muted/70"
            />
          </div>

          <div className="rounded border border-ui-border/70 bg-[#12121a]/45 px-4 py-4">
            <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-2">
              5. Generated prompt
            </div>
            <pre className="whitespace-pre-wrap font-garamond text-[14px] leading-[1.6] text-white/90 m-0 p-3 rounded bg-[#0f0f14] border border-ui-border/80">
              {generatedPrompt}
            </pre>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="font-mono tracking-widest text-gold border border-ui-border rounded px-3 py-1.5 hover:bg-white/5"
                onClick={() => navigator.clipboard.writeText(generatedPrompt)}
              >
                Copy prompt
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
