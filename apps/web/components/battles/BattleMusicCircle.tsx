"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { GENRE_THEMES, genreIntensityColor } from "@/lib/genres";
import type { NonMainstreamGenreName, Intensity } from "@/lib/genres";

type CircleSingle = {
  key: string;
  kind: "genreIntensity" | "country";
  label: string;
  genre: string;
  intensity: string;
  fileSizeMb: number | null;
  durationMin: number | null;
  version: number | null;
};

// ── geometry ─────────────────────────────────────────────────────────────────

const CX = 250;
const CY = 250;

const R_MAINSTREAM = 38;   // Mainstream center disc
const R_POP_IN     = 44;   // POP ring inner
const R_POP_OUT    = 84;   // POP ring outer / SOFT inner
const R_SOFT_OUT   = 124;  // SOFT outer / EXPERIMENTAL inner
const R_EXP_OUT    = 165;  // EXPERIMENTAL outer / HARDCORE inner
const R_HC_OUT     = 208;  // HARDCORE outer

const GENRE_SLICE_GAP = 1.5; // degrees between genre slices

// Derived at render time from the singles prop — see wheelGenreNames below.

const INTENSITIES = ["POP", "SOFT", "EXPERIMENTAL", "HARDCORE"] as const;

const INTENSITY_BANDS: Array<{ intensity: Intensity; inner: number; outer: number }> = [
  { intensity: "POP",          inner: R_POP_IN,  outer: R_POP_OUT  },
  { intensity: "SOFT",         inner: R_POP_OUT,  outer: R_SOFT_OUT },
  { intensity: "EXPERIMENTAL", inner: R_SOFT_OUT, outer: R_EXP_OUT  },
  { intensity: "HARDCORE",     inner: R_EXP_OUT,  outer: R_HC_OUT   },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
}

function sectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
): string {
  if (innerR <= 0) {
    // full disc slice
    const os = polarToXY(cx, cy, outerR, startDeg);
    const oe = polarToXY(cx, cy, outerR, endDeg);
    const span = (((endDeg - startDeg) % 360) + 360) % 360;
    const large = span > 180 ? 1 : 0;
    return [
      `M ${cx} ${cy}`,
      `L ${os.x.toFixed(3)} ${os.y.toFixed(3)}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x.toFixed(3)} ${oe.y.toFixed(3)}`,
      "Z",
    ].join(" ");
  }
  const os  = polarToXY(cx, cy, outerR, startDeg);
  const oe  = polarToXY(cx, cy, outerR, endDeg);
  const ie  = polarToXY(cx, cy, innerR, endDeg);
  const is_ = polarToXY(cx, cy, innerR, startDeg);
  const span = (((endDeg - startDeg) % 360) + 360) % 360;
  const large = span > 180 ? 1 : 0;
  return [
    `M ${os.x.toFixed(3)} ${os.y.toFixed(3)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x.toFixed(3)} ${oe.y.toFixed(3)}`,
    `L ${ie.x.toFixed(3)} ${ie.y.toFixed(3)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${is_.x.toFixed(3)} ${is_.y.toFixed(3)}`,
    "Z",
  ].join(" ");
}

/** Angle at which genre slice i starts (degrees, –90 = top). */
function genreSliceStart(i: number, span: number): number {
  return -90 + i * (span + GENRE_SLICE_GAP);
}

function singleColor(kind: string, genre: string, intensity: string): string {
  if (kind === "country") return "#8890b8";
  if (genre === "Mainstream") return GENRE_THEMES.Mainstream.border;
  return genreIntensityColor(genre as NonMainstreamGenreName, intensity as Intensity);
}

// ── component ─────────────────────────────────────────────────────────────────

export default function BattleMusicCircle({ singles }: { singles: CircleSingle[] }) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Derive wheel genre order from singles (non-Mainstream genreIntensity, unique genres, insertion order)
  const wheelGenreNames = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const s of singles) {
      if (s.kind === "genreIntensity" && s.genre !== "Mainstream" && !seen.has(s.genre)) {
        seen.add(s.genre);
        order.push(s.genre);
      }
    }
    return order as NonMainstreamGenreName[];
  }, [singles]);

  const numGenres = wheelGenreNames.length;
  const sliceSpan = numGenres > 0 ? (360 - numGenres * GENRE_SLICE_GAP) / numGenres : 0;

  // Build lookups
  const byKey = new Map(singles.map((s) => [s.key, s]));
  const byGenreIntensity = new Map(
    singles
      .filter((s) => s.kind === "genreIntensity")
      .map((s) => [`${s.genre}|${s.intensity}`, s]),
  );
  const mainstream = singles.find((s) => s.genre === "Mainstream") ?? null;

  const selected = selectedKey != null ? (byKey.get(selectedKey) ?? null) : null;

  function cellProps(row: CircleSingle) {
    const hasAudio = row.fileSizeMb != null;
    const isHov = hoveredKey === row.key;
    const isSel = selectedKey === row.key;
    const color = singleColor(row.kind, row.genre, row.intensity);
    return {
      fill: color,
      fillOpacity: hasAudio
        ? isSel ? 1 : isHov ? 0.97 : 0.82
        : isHov ? 0.22 : 0.1,
      stroke: isSel ? "rgba(255,255,255,0.6)" : "none",
      strokeWidth: 1.5,
      style: { cursor: "pointer" } as CSSProperties,
      onMouseEnter: () => setHoveredKey(row.key),
      onMouseLeave: () => setHoveredKey(null),
      onClick: () => setSelectedKey(selectedKey === row.key ? null : row.key),
    };
  }

  return (
    <div>
      <svg
        viewBox="0 0 500 500"
        width={460}
        height={460}
        className="block mx-auto overflow-visible"
      >
        {/* ── background intensity rings (faint) ── */}
        {[R_POP_OUT, R_SOFT_OUT, R_EXP_OUT].map((r) => (
          <circle
            key={r}
            cx={CX} cy={CY} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        ))}

        {/* ── radial genre dividers ── */}
        {wheelGenreNames.map((_, i) => {
          const angle = genreSliceStart(i, sliceSpan) - GENRE_SLICE_GAP / 2;
          const inner = polarToXY(CX, CY, R_POP_IN - 2, angle);
          const outer = polarToXY(CX, CY, R_HC_OUT + 2, angle);
          return (
            <line
              key={i}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={1}
            />
          );
        })}

        {/* ── genre × intensity cells ── */}
        {wheelGenreNames.map((genre, gi) => {
          const sliceStart = genreSliceStart(gi, sliceSpan);
          const sliceEnd   = sliceStart + sliceSpan;
          return INTENSITY_BANDS.map(({ intensity, inner, outer }) => {
            const row = byGenreIntensity.get(`${genre}|${intensity}`);
            if (!row) return null;
            return (
              <path
                key={row.key}
                d={sectorPath(CX, CY, inner, outer, sliceStart, sliceEnd)}
                {...cellProps(row)}
              >
                <title>{row.label}{row.fileSizeMb != null ? ` · ${row.fileSizeMb.toFixed(1)} MB` : " · no audio"}</title>
              </path>
            );
          });
        })}

        {/* ── Mainstream center disc ── */}
        {mainstream && (() => {
          const hasAudio = mainstream.fileSizeMb != null;
          const isHov = hoveredKey === mainstream.key;
          const isSel = selectedKey === mainstream.key;
          const color = GENRE_THEMES.Mainstream.border;
          return (
            <circle
              cx={CX} cy={CY} r={R_MAINSTREAM}
              fill={color}
              fillOpacity={hasAudio ? (isSel ? 1 : isHov ? 0.97 : 0.88) : isHov ? 0.22 : 0.12}
              stroke={isSel ? "rgba(255,255,255,0.6)" : "none"}
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredKey(mainstream.key)}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={() => setSelectedKey(selectedKey === mainstream.key ? null : mainstream.key)}
            >
              <title>
                {mainstream.label}
                {mainstream.fileSizeMb != null ? ` · ${mainstream.fileSizeMb.toFixed(1)} MB` : " · no audio"}
              </title>
            </circle>
          );
        })()}

        {/* ── center label ── */}
        <text
          x={CX} y={CY - 5}
          textAnchor="middle" dominantBaseline="middle"
          fontFamily="Cinzel, serif" fontSize={8} letterSpacing={1.5}
          fill="rgba(10,10,10,0.6)" style={{ pointerEvents: "none" }}
        >
          BATTLE
        </text>
        <text
          x={CX} y={CY + 6}
          textAnchor="middle" dominantBaseline="middle"
          fontFamily="Cinzel, serif" fontSize={8} letterSpacing={1.5}
          fill="rgba(10,10,10,0.6)" style={{ pointerEvents: "none" }}
        >
          AUDIO
        </text>
      </svg>

      {/* ── info panel ── */}
      {selected && (
        <div className="mt-2 mx-auto w-[460px] rounded border border-ui-border bg-[#12121a]/80 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div
                className="font-cinzel text-sm tracking-[2px]"
                style={{ color: singleColor(selected.kind, selected.genre, selected.intensity) }}
              >
                {selected.label}
              </div>
              <div className="font-mono text-[11px] text-muted mt-0.5">
                {selected.key}
              </div>
            </div>
            <button
              type="button"
              className="font-mono text-lg text-muted hover:text-white leading-none shrink-0"
              onClick={() => setSelectedKey(null)}
            >
              ×
            </button>
          </div>

          {selected.fileSizeMb != null ? (
            <div className="mt-3">
              <div className="font-mono text-[11px] text-muted/80 mb-2">
                {selected.fileSizeMb.toFixed(1)} MB
                {selected.durationMin != null && ` · ${selected.durationMin.toFixed(1)} min`}
                {` · v${selected.version ?? 1}`}
              </div>
              <audio
                controls
                className="w-full"
                src={`/api/battle-music/${selected.key}/audio?version=${selected.version ?? 1}`}
              />
            </div>
          ) : (
            <div className="font-garamond italic text-muted/60 text-sm mt-2">
              No audio uploaded
            </div>
          )}
        </div>
      )}
    </div>
  );
}
