"use client";

import { useMemo, useState } from "react";
import { COUNTRY_DATA } from "@/lib/countries";
import {
  GENRE_THEMES,
  WHEEL_GENRES,
  genreIntensityColor,
  type Intensity,
  type NonMainstreamGenreName,
} from "@/lib/genres";
import { battleAudioElementPromptBlock } from "@/lib/battle-audio-element-prompts";

type SelectorId = "first" | "second";

type GenreIntensityElement = {
  kind: "genreIntensity";
  genre: string;
  intensity: Intensity;
  colour: string;
};

type CountryElement = {
  kind: "country";
  country: string;
  colour: string;
};

type BattleElement = GenreIntensityElement | CountryElement;
type PromptBlock = {
  title: string;
  lines: [string, string, string, string, string, string];
};

const INTENSITY_BANDS: Array<{ intensity: Intensity; inner: number; outer: number }> = [
  { intensity: "POP", inner: 0, outer: 84 },
  { intensity: "SOFT", inner: 84, outer: 116 },
  { intensity: "EXPERIMENTAL", inner: 116, outer: 148 },
  { intensity: "HARDCORE", inner: 148, outer: 180 },
];

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

function labelForElement(el: BattleElement): string {
  if (el.kind === "country") return `Country:${el.country}`;
  return `GenreIntensity:${el.genre}|${el.intensity}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function stableTokenForElement(el: BattleElement): string {
  if (el.kind === "country") return `country-${slugify(el.country)}`;
  return `genre-${slugify(el.genre)}--intensity-${el.intensity}`;
}

function shortLabel(el: BattleElement): string {
  if (el.kind === "country") return `${el.country} (Country)`;
  return `${el.genre} · ${el.intensity}`;
}

function intensityDescriptor(i: Intensity): string {
  if (i === "POP") return "bright, accessible, hook-forward";
  if (i === "SOFT") return "warm, restrained, low-friction";
  if (i === "EXPERIMENTAL") return "unpredictable, textural, risk-taking";
  return "aggressive, high-energy, driving";
}

function promptBlockForElement(el: BattleElement): PromptBlock {
  const block = battleAudioElementPromptBlock(el);
  return {
    title: block.title,
    lines: [...block.lines] as PromptBlock["lines"],
  };
}

function formatPromptBlock(block: PromptBlock): string {
  return [
    `[${block.title}]`,
    block.lines[0],
    block.lines[1],
    block.lines[2],
    block.lines[3],
    block.lines[4],
    block.lines[5],
  ].join("\n");
}

function buildPrompt(a: BattleElement, b: BattleElement, normalizedKey: string): string {
  const aBlock = promptBlockForElement(a);
  const bBlock = promptBlockForElement(b);
  return [
    "Generate one original battle music track.",
    "Duration: exactly 3:00.",
    `Pair key (deterministic lookup): ${normalizedKey}.`,
    "Element prompts to combine:",
    formatPromptBlock(aBlock),
    formatPromptBlock(bBlock),
    `Blend target summary: ${shortLabel(a)} + ${shortLabel(b)}.`,
    `Intensity profile emphasis: ${a.kind === "genreIntensity" ? intensityDescriptor(a.intensity) : "identity-forward"} + ${
      b.kind === "genreIntensity" ? intensityDescriptor(b.intensity) : "identity-forward"
    }.`,
    "Intensity profile: 0:00-0:40 controlled setup, 0:40-1:50 escalation, 1:50-2:30 peak pressure, 2:30-3:00 controlled release with loop-friendly ending.",
    "Energy arc constraints: no dead section longer than 8 seconds, clear pulse continuity, maintain battle readability under SFX.",
    "Compliance: no plagiarism, no direct melodic quotations, no imitation of celebrity voices, no lyrics.",
    "Output: high-quality stereo master suitable for streaming battle playback.",
  ].join("\n");
}

function normalisePair(
  a: BattleElement,
  b: BattleElement,
): { normalized: [BattleElement, BattleElement]; key: string } {
  const normalized = [a, b].sort((x, y) => labelForElement(x).localeCompare(labelForElement(y))) as [
    BattleElement,
    BattleElement,
  ];
  const key = `${stableTokenForElement(normalized[0])}__${stableTokenForElement(normalized[1])}`;
  return { normalized, key };
}

export default function BattleAudioPromptBuilder() {
  const [firstElement, setFirstElement] = useState<BattleElement>({
    kind: "genreIntensity",
    genre: "Mainstream",
    intensity: "POP",
    colour: GENRE_THEMES.Mainstream.border,
  });
  const [secondElement, setSecondElement] = useState<BattleElement>({
    kind: "genreIntensity",
    genre: "Rock",
    intensity: "SOFT",
    colour: genreIntensityColor("Rock", "SOFT"),
  });
  const [activeCountryTarget, setActiveCountryTarget] = useState<SelectorId>("first");
  const [lastCountrySelected, setLastCountrySelected] = useState<CountryElement | null>(null);

  const countries = useMemo(
    () =>
      Object.entries(COUNTRY_DATA)
        .map(([country, def]) => ({
          country,
          colour: def.theme.border,
        }))
        .sort((a, b) => a.country.localeCompare(b.country)),
    [],
  );

  const duplicateSelection = labelForElement(firstElement) === labelForElement(secondElement);
  const pair = normalisePair(firstElement, secondElement);
  const generatedPrompt = buildPrompt(pair.normalized[0], pair.normalized[1], pair.key);

  const setGenreIntensity = (target: SelectorId, genre: string, intensity: Intensity, colour: string) => {
    const next: GenreIntensityElement = { kind: "genreIntensity", genre, intensity, colour };
    if (target === "first") setFirstElement(next);
    else setSecondElement(next);
  };

  const setCountry = (target: SelectorId, country: string, colour: string) => {
    const next: CountryElement = { kind: "country", country, colour };
    if (target === "first") setFirstElement(next);
    else setSecondElement(next);
    setLastCountrySelected(next);
  };

  return (
    <section className="max-w-[860px]">
      <h2 className="section-title mb-2">4) Generated AI prompt</h2>
      <div className="font-garamond text-muted mb-4">
        Choose exactly two elements, then copy a deterministic battle-music prompt for the generation pipeline.
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <WheelSelector title="Wheel 1" selectorId="first" selected={firstElement} onPick={setGenreIntensity} />
        <WheelSelector title="Wheel 2" selectorId="second" selected={secondElement} onPick={setGenreIntensity} />
      </div>

      <div className="rounded border border-ui-border/70 bg-[#12121a]/45 px-4 py-4 mb-5">
        <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-2">Countries grid (all available)</div>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[11px] tracking-[0.08em] text-muted">Apply country to:</span>
          {([
            { id: "first", label: "Selection 1" },
            { id: "second", label: "Selection 2" },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveCountryTarget(id)}
              className={[
                "font-mono text-[11px] tracking-[0.08em] border rounded px-2.5 py-1.5",
                activeCountryTarget === id ? "border-gold text-gold bg-white/5" : "border-ui-border text-muted hover:text-white",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {countries.map(({ country, colour }) => (
            <button
              key={country}
              type="button"
              onClick={() => setCountry(activeCountryTarget, country, colour)}
              className="rounded border border-ui-border/70 px-2 py-2 text-left hover:bg-white/5"
              style={{ borderColor: colour }}
              title={`Set ${activeCountryTarget === "first" ? "selection 1" : "selection 2"} to ${country}`}
            >
              <div className="font-mono text-[10px] tracking-[0.08em] text-white">{country}</div>
            </button>
          ))}
        </div>
        {lastCountrySelected ? (
          <PromptPreviewCard
            className="mt-4"
            label="Selected country sound prompt"
            block={promptBlockForElement(lastCountrySelected)}
          />
        ) : null}
      </div>

      <div className="rounded border border-ui-border/70 bg-[#12121a]/45 px-4 py-4 mb-4">
        <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-2">Selection summary</div>
        <div className="font-garamond text-muted leading-[1.7]">
          <div>Selection 1: <span className="text-white">{shortLabel(firstElement)}</span></div>
          <div>Selection 2: <span className="text-white">{shortLabel(secondElement)}</span></div>
          <div className="mt-1">
            Normalised pair key: <span className="text-white font-mono text-[12px] break-all">{pair.key}</span>
          </div>
          {duplicateSelection ? (
            <div className="mt-2 text-[#ff9d9d]">Pick two different elements (exactly two unique elements required).</div>
          ) : null}
        </div>
      </div>

      <div className="rounded border border-ui-border/70 bg-[#12121a]/45 px-4 py-4">
        <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-2">Prompt output</div>
        <pre className="whitespace-pre-wrap font-garamond text-[14px] leading-[1.6] text-white/90 m-0 p-3 rounded bg-[#0f0f14] border border-ui-border/80">
          {generatedPrompt}
        </pre>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={duplicateSelection}
            className="font-mono tracking-widest text-gold border border-ui-border rounded px-3 py-1.5 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => navigator.clipboard.writeText(generatedPrompt)}
          >
            Copy prompt
          </button>
        </div>
      </div>
    </section>
  );
}

function WheelSelector({
  title,
  selectorId,
  selected,
  onPick,
}: {
  title: string;
  selectorId: SelectorId;
  selected: BattleElement;
  onPick: (target: SelectorId, genre: string, intensity: Intensity, colour: string) => void;
}) {
  return (
    <div className="rounded border border-ui-border/70 bg-[#12121a]/45 px-4 py-4">
      <div className="font-cinzel text-[12px] tracking-[0.12em] text-gold mb-3">
        {title} (genre-intensity)
      </div>
      <div className="flex justify-center">
        <svg width={340} height={340} viewBox="0 0 440 440">
          {WHEEL_GENRES.flatMap((g, i) => {
            const slice = 360 / WHEEL_GENRES.length;
            const start = i * slice - 90 - slice / 2;
            const end = i * slice - 90 + slice / 2;
            const genre = g.n as NonMainstreamGenreName;
            return INTENSITY_BANDS.map((band) => {
              const colour = genreIntensityColor(genre, band.intensity);
              const active =
                selected.kind === "genreIntensity" &&
                selected.genre === g.n &&
                selected.intensity === band.intensity;
              return (
                <path
                  key={`${title}-${g.n}-${band.intensity}`}
                  d={annularSectorPath(220, 220, band.inner, band.outer, start, end)}
                  fill={colour}
                  stroke={active ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.08)"}
                  strokeWidth={active ? 2 : 1}
                  style={{ cursor: "pointer", transition: "stroke-width 120ms ease" }}
                  onClick={() => onPick(selectorId, g.n, band.intensity, colour)}
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
            const angle = ((i + 0.5) / WHEEL_GENRES.length) * 360 - 90;
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
              selected.kind === "genreIntensity" && selected.genre === "Mainstream"
                ? "rgba(255,255,255,.95)"
                : "rgba(255,255,255,.25)"
            }
            strokeWidth={selected.kind === "genreIntensity" && selected.genre === "Mainstream" ? 2 : 1.5}
            style={{ cursor: "pointer" }}
            onClick={() => onPick(selectorId, "Mainstream", "POP", GENRE_THEMES.Mainstream.border)}
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
        {selected.kind === "genreIntensity" ? `${selected.genre} · ${selected.intensity}` : `${selected.country} (country)`}
      </div>
      <PromptPreviewCard
        className="mt-4"
        label="Selected sound prompt"
        block={promptBlockForElement(selected)}
      />
    </div>
  );
}

function PromptPreviewCard({
  label,
  block,
  className = "",
}: {
  label: string;
  block: PromptBlock;
  className?: string;
}) {
  return (
    <div className={`rounded border border-ui-border/70 bg-[#0f0f14] p-3 ${className}`.trim()}>
      <div className="font-mono text-[10px] tracking-[0.08em] text-gold mb-2">{label}</div>
      <pre className="whitespace-pre-wrap font-garamond text-[13px] leading-normal text-white/90 m-0">
        {formatPromptBlock(block)}
      </pre>
    </div>
  );
}
