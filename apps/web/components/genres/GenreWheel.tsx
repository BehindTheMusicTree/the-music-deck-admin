"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import {
  R_EXPERIMENTAL_HARDCORE_LINE,
  R_POP_SOFT_LINE,
  R_SOFT_EXPERIMENTAL_LINE,
  WHEEL_CX,
  WHEEL_CY,
  WHEEL_MAIN_TILE_W,
  WHEEL_RADIAL_DIVIDER_EXTRA,
  WHEEL_SMALL_TILE_H,
  WHEEL_SMALL_TILE_W,
  WHEEL_VIEWBOX_HEIGHT,
  WHEEL_VIEWBOX_Y_TRIM,
  WHEEL_VIEW_SIZE,
  wheelSubgenreRadius,
} from "@/lib/genres/wheel-geometry";
import {
  GENRE_THEMES,
  WHEEL_GENRES,
  SUBGENRES,
  SUBGENRE_COLOR,
  WORLD_THEMES,
  genreIntensityColor,
} from "@/lib/genres";
import type {
  GenreName,
  Intensity,
  NonMainstreamGenreName,
} from "@/lib/genres";
import { computeWheelSubgenrePlacements } from "@/lib/genres/wheel-layout";

type WheelTileFocus =
  | {
      kind: "genre";
      label: string;
      hex: string;
      genre: GenreName;
    }
  | {
      kind: "subgenre";
      label: string;
      hex: string;
      sectionGenre: GenreName;
      parentB?: GenreName;
      intensity: Intensity;
      influence?: {
        genre: GenreName;
        intensity: Intensity;
      };
    };

function formatIntensity(i: Intensity): string {
  return i.charAt(0).toUpperCase() + i.slice(1);
}

const WHEEL_TILE_SINGLE_CLICK_MS = 300;

/** Extra scale on hover: 8× the original +14% / +10% bump (2× the previous 4× preset). */
const HOVER_RECT_RELATIVE_BUMP = { main: 0.14 * 8, small: 0.1 * 8 } as const;

function repeat(str: string, times: number) {
  return Array(times).fill(str).join(" · ") + " ·";
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const x = cx + Math.cos(rad) * r;
  const y = cy + Math.sin(rad) * r;
  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
  };
}

function annularSectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
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

function Rect({
  tileId,
  x,
  y,
  label,
  hex,
  small,
  hovered,
  onPointerEnter,
  onPointerLeave,
  onActivate,
}: {
  tileId: string;
  x: number;
  y: number;
  label: string;
  hex: string;
  small?: boolean;
  hovered: boolean;
  onPointerEnter: () => void;
  onPointerLeave: (e: PointerEvent<SVGGElement>) => void;
  onActivate: () => void;
}) {
  const w = small ? WHEEL_SMALL_TILE_W : WHEEL_MAIN_TILE_W;
  const h = small ? WHEEL_SMALL_TILE_H : Math.round(92 * 0.7);
  const fs = 14.25;
  const rectBump = small
    ? HOVER_RECT_RELATIVE_BUMP.small
    : HOVER_RECT_RELATIVE_BUMP.main;
  const rectScale = hovered ? 1 + rectBump : 1;
  /** Text grows 3× less than the rectangle: share one-third of the extra gain above 1. */
  const fontScale = hovered ? 1 + rectBump / 3 : 1;
  const isDark = isLight(hex);
  const tc = isDark ? "rgba(10,10,10,.9)" : "rgba(255,255,255,.95)";
  const activateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (activateTimer.current != null) clearTimeout(activateTimer.current);
    },
    [],
  );

  return (
    <g
      data-wheel-tile
      data-tile-id={tileId}
      transform={`translate(${x},${y})`}
      style={{ cursor: "pointer" }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={(e) => {
        if (e.detail !== 1) {
          if (activateTimer.current != null) {
            clearTimeout(activateTimer.current);
            activateTimer.current = null;
          }
          return;
        }
        if (activateTimer.current != null) clearTimeout(activateTimer.current);
        activateTimer.current = setTimeout(() => {
          activateTimer.current = null;
          onActivate();
        }, WHEEL_TILE_SINGLE_CLICK_MS);
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        if (activateTimer.current != null) {
          clearTimeout(activateTimer.current);
          activateTimer.current = null;
        }
        void navigator.clipboard.writeText(hex);
      }}
    >
      <title>Click for details. Double-click to copy the hex colour.</title>
      <g
        style={{
          transformBox: "fill-box" as const,
          /* Centre of the rect, not (0,0) of the viewport, so hover scale stays centred */
          transformOrigin: "50% 50%",
          transition: "transform 0.16s ease-out",
          transform: `scale(${rectScale})`,
        }}
      >
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={4}
          fill={hex}
          filter={`drop-shadow(0 2px 8px ${hex}88)`}
        />
      </g>
      <text
        x={0}
        y={0}
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="Cinzel, serif"
        fontWeight={700}
        letterSpacing={small ? 0.6 : 1}
        fill={tc}
        style={{
          fontSize: fs * fontScale,
          transition: "font-size 0.16s ease-out",
        }}
      >
        {label}
      </text>
    </g>
  );
}

function isLight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export default function GenreWheel() {
  const [wheelFocus, setWheelFocus] = useState<WheelTileFocus | null>(null);
  const [topTileId, setTopTileId] = useState<string | null>(null);
  const subgenrePlacement = useMemo(
    () => computeWheelSubgenrePlacements(SUBGENRES),
    [],
  );

  const onTilePointerEnter = useCallback((id: string) => {
    setTopTileId(id);
  }, []);

  const onTilePointerLeave = useCallback((e: PointerEvent<SVGGElement>) => {
    const to = e.relatedTarget as Element | null;
    const next = to?.closest?.("[data-wheel-tile]") as Element | null;
    if (next) {
      const nid = next.getAttribute("data-tile-id");
      if (nid) setTopTileId(nid);
    } else {
      setTopTileId(null);
    }
  }, []);

  useEffect(() => {
    if (!wheelFocus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWheelFocus(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wheelFocus]);

  const popText = repeat("POP", 23);
  const softText1 = repeat("SOFT", 23);
  const softText2 = repeat("SOFT", 40);
  const expText = repeat("EXPERIMENTAL", 23);
  const exp2Text = repeat("EXPERIMENTAL", 30);
  const hardText = repeat("HARDCORE", 40);
  const wheelSlice = 360 / WHEEL_GENRES.length;
  const intensityBands: Array<{
    intensity: Intensity;
    inner: number;
    outer: number;
    opacity: number;
  }> = [
    { intensity: "POP", inner: 0, outer: R_POP_SOFT_LINE, opacity: 0.22 },
    {
      intensity: "SOFT",
      inner: R_POP_SOFT_LINE,
      outer: R_SOFT_EXPERIMENTAL_LINE,
      opacity: 0.24,
    },
    {
      intensity: "EXPERIMENTAL",
      inner: R_SOFT_EXPERIMENTAL_LINE,
      outer: R_EXPERIMENTAL_HARDCORE_LINE,
      opacity: 0.22,
    },
    {
      intensity: "HARDCORE",
      inner: R_EXPERIMENTAL_HARDCORE_LINE,
      outer: R_EXPERIMENTAL_HARDCORE_LINE + WHEEL_RADIAL_DIVIDER_EXTRA,
      opacity: 0.2,
    },
  ];

  const wheelRectStack = useMemo((): ReactNode[] => {
    const tiles: { id: string; el: ReactNode }[] = [];

    WHEEL_GENRES.forEach((g, i) => {
      const angle = (i / WHEEL_GENRES.length) * 360 - 90;
      const { x, y } = polarToXY(
        WHEEL_CX,
        WHEEL_CY,
        R_SOFT_EXPERIMENTAL_LINE,
        angle,
      );
      tiles.push({
        id: g.n,
        el: (
          <Rect
            key={g.n}
            tileId={g.n}
            x={x}
            y={y}
            label={g.n}
            hex={g.color}
            hovered={topTileId === g.n}
            onPointerEnter={() => onTilePointerEnter(g.n)}
            onPointerLeave={onTilePointerLeave}
            onActivate={() =>
              setWheelFocus({
                kind: "genre",
                label: g.n,
                hex: g.color,
                genre: g.n,
              })
            }
          />
        ),
      });
    });

    for (const s of SUBGENRES) {
      if (s.parentA in WORLD_THEMES) continue;
      if (s.parentB && s.parentB in WORLD_THEMES) continue;
      if (!(s.parentA in GENRE_THEMES)) {
        throw new Error(
          `Subgenre "${s.n}" has non-global parentA "${s.parentA}" in GenreWheel`,
        );
      }
      if (s.parentB && !(s.parentB in GENRE_THEMES)) {
        throw new Error(
          `Subgenre "${s.n}" has non-global parentB "${s.parentB}" in GenreWheel`,
        );
      }
      const placement = subgenrePlacement.get(s.n);
      if (!placement) {
        throw new Error(
          `Missing wheel placement for subgenre "${s.n}" — update computeWheelSubgenrePlacements`,
        );
      }
      const rBase = wheelSubgenreRadius(s.intensity);
      const r = rBase + placement.rOffset;
      const { x, y } = polarToXY(WHEEL_CX, WHEEL_CY, r, placement.angleDeg);
      const subgenreHex = SUBGENRE_COLOR[s.n];
      tiles.push({
        id: s.n,
        el: (
          <Rect
            key={s.n}
            tileId={s.n}
            x={x}
            y={y}
            label={s.n}
            hex={subgenreHex}
            small
            hovered={topTileId === s.n}
            onPointerEnter={() => onTilePointerEnter(s.n)}
            onPointerLeave={onTilePointerLeave}
            onActivate={() =>
              setWheelFocus({
                kind: "subgenre",
                label: s.n,
                hex: subgenreHex,
                sectionGenre: s.parentA as GenreName,
                parentB: s.parentB,
                intensity: s.intensity,
                influence:
                  s.kind === "genre" && s.influence
                    ? {
                        genre: s.influence.genre,
                        intensity: s.influence.intensity,
                      }
                    : undefined,
              })
            }
          />
        ),
      });
    }

    if (topTileId == null) {
      return tiles.map((t) => t.el);
    }
    const top = tiles.find((t) => t.id === topTileId);
    if (!top) {
      return tiles.map((t) => t.el);
    }
    return [
      ...tiles.filter((t) => t.id !== topTileId).map((t) => t.el),
      top.el,
    ];
  }, [subgenrePlacement, topTileId, onTilePointerEnter, onTilePointerLeave]);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={WHEEL_VIEW_SIZE}
        height={WHEEL_VIEWBOX_HEIGHT}
        viewBox={`0 ${WHEEL_VIEWBOX_Y_TRIM} ${WHEEL_VIEW_SIZE} ${WHEEL_VIEWBOX_HEIGHT}`}
        className="shrink-0 overflow-visible"
      >
        <defs>
          <path
            id="arc-pop-soft-inner"
            d={`M ${WHEEL_CX},${WHEEL_CY - (R_POP_SOFT_LINE - 30)} A ${R_POP_SOFT_LINE - 30},${R_POP_SOFT_LINE - 30} 0 1,1 ${WHEEL_CX - 0.1},${WHEEL_CY - (R_POP_SOFT_LINE - 30)}`}
          />
          <path
            id="arc-pop-soft-outer"
            d={`M ${WHEEL_CX},${WHEEL_CY - (R_POP_SOFT_LINE + 20)} A ${R_POP_SOFT_LINE + 20},${R_POP_SOFT_LINE + 20} 0 1,1 ${WHEEL_CX - 0.1},${WHEEL_CY - (R_POP_SOFT_LINE + 20)}`}
          />
          <path
            id="arc-soft-experimental-inner"
            d={`M ${WHEEL_CX},${WHEEL_CY - (R_SOFT_EXPERIMENTAL_LINE - 30)} A ${R_SOFT_EXPERIMENTAL_LINE - 30},${R_SOFT_EXPERIMENTAL_LINE - 30} 0 1,1 ${WHEEL_CX - 0.1},${WHEEL_CY - (R_SOFT_EXPERIMENTAL_LINE - 30)}`}
          />
          <path
            id="arc-soft-experimental-outer"
            d={`M ${WHEEL_CX},${WHEEL_CY - (R_SOFT_EXPERIMENTAL_LINE + 20)} A ${R_SOFT_EXPERIMENTAL_LINE + 20},${R_SOFT_EXPERIMENTAL_LINE + 20} 0 1,1 ${WHEEL_CX - 0.1},${WHEEL_CY - (R_SOFT_EXPERIMENTAL_LINE + 20)}`}
          />
          <path
            id="arc-experimental-hardcore-inner"
            d={`M ${WHEEL_CX},${WHEEL_CY - (R_EXPERIMENTAL_HARDCORE_LINE - 30)} A ${R_EXPERIMENTAL_HARDCORE_LINE - 30},${R_EXPERIMENTAL_HARDCORE_LINE - 30} 0 1,1 ${WHEEL_CX - 0.1},${WHEEL_CY - (R_EXPERIMENTAL_HARDCORE_LINE - 30)}`}
          />
          <path
            id="arc-experimental-hardcore-outer"
            d={`M ${WHEEL_CX},${WHEEL_CY - (R_EXPERIMENTAL_HARDCORE_LINE + 30)} A ${R_EXPERIMENTAL_HARDCORE_LINE + 30},${R_EXPERIMENTAL_HARDCORE_LINE + 30} 0 1,1 ${WHEEL_CX - 0.1},${WHEEL_CY - (R_EXPERIMENTAL_HARDCORE_LINE + 30)}`}
          />
        </defs>

        {/* Genre/intensity background sectors */}
        {WHEEL_GENRES.flatMap((g, i) => {
          const start = i * wheelSlice - 90 - wheelSlice / 2;
          const end = i * wheelSlice - 90 + wheelSlice / 2;
          return intensityBands.map((band) => (
            <path
              key={`${g.n}-${band.intensity}`}
              d={annularSectorPath(
                WHEEL_CX,
                WHEEL_CY,
                band.inner,
                band.outer,
                start,
                end,
              )}
              fill={genreIntensityColor(
                g.n as NonMainstreamGenreName,
                band.intensity,
              )}
              fillOpacity={band.opacity}
            />
          ));
        })}
        <circle
          cx={WHEEL_CX}
          cy={WHEEL_CY}
          r={Math.round(R_POP_SOFT_LINE * 0.35)}
          fill={GENRE_THEMES.Mainstream.border}
          fillOpacity={0.9}
        />
        <text
          x={WHEEL_CX}
          y={WHEEL_CY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Cinzel, serif"
          fontSize={14}
          letterSpacing={1.2}
          fill="rgba(20,16,10,.72)"
        >
          Mainstream
        </text>

        {/* Mainstream text */}
        <circle
          cx={WHEEL_CX}
          cy={WHEEL_CY}
          r={R_SOFT_EXPERIMENTAL_LINE}
          fill="none"
          stroke="rgba(255,255,255,.14)"
          strokeWidth={1.5}
          strokeDasharray="4 6"
        />
        <text
          fontFamily="Cinzel, serif"
          fontSize={11}
          fill="rgba(255,255,255,.85)"
          letterSpacing={8}
        >
          <textPath href="#arc-pop-soft-inner" startOffset="0%" dy={16}>
            {popText}
          </textPath>
        </text>

        {/* Soft text — inner */}
        <circle
          cx={WHEEL_CX}
          cy={WHEEL_CY}
          r={R_POP_SOFT_LINE}
          fill="none"
          stroke="rgba(255,255,255,.14)"
          strokeWidth={1.5}
          strokeDasharray="4 6"
        />
        <text
          fontFamily="Cinzel, serif"
          fontSize={11}
          fill="rgba(255,255,255,.85)"
          letterSpacing={8}
        >
          <textPath href="#arc-pop-soft-outer" startOffset="0%" dy={16}>
            {softText1}
          </textPath>
        </text>

        {/* Soft text — outer */}
        <circle
          cx={WHEEL_CX}
          cy={WHEEL_CY}
          r={R_SOFT_EXPERIMENTAL_LINE}
          fill="none"
          stroke="rgba(255,255,255,.14)"
          strokeWidth={1.5}
          strokeDasharray="4 6"
        />
        <text
          fontFamily="Cinzel, serif"
          fontSize={11}
          fill="rgba(255,255,255,.85)"
          letterSpacing={8}
        >
          <textPath
            href="#arc-soft-experimental-inner"
            startOffset="0%"
            dy={16}
          >
            {softText2}
          </textPath>
        </text>

        {/* Experimental text — just outside inner circle */}
        <text
          fontFamily="Cinzel, serif"
          fontSize={10}
          fill="rgba(255, 255, 255, 0.69)"
          letterSpacing={5}
        >
          <textPath
            href="#arc-soft-experimental-outer"
            startOffset="0%"
            dy={16}
          >
            {expText}
          </textPath>
        </text>
        {/* Experimental text — just inside outer circle */}
        <text
          fontFamily="Cinzel, serif"
          fontSize={10}
          fill="rgba(255, 255, 255, 0.48)"
          letterSpacing={5}
        >
          <textPath
            href="#arc-experimental-hardcore-inner"
            startOffset="0%"
            dy={-8}
          >
            {exp2Text}
          </textPath>
        </text>

        {/* Hardcore circle + text — outside outer circle */}
        <circle
          cx={WHEEL_CX}
          cy={WHEEL_CY}
          r={R_EXPERIMENTAL_HARDCORE_LINE}
          fill="none"
          stroke="rgba(255, 255, 255, 0.37)"
          strokeWidth={1.5}
          strokeDasharray="4 6"
        />
        <text
          fontFamily="Cinzel, serif"
          fontSize={10}
          fill="rgba(255, 255, 255, 0.28)"
          letterSpacing={5}
        >
          <textPath
            href="#arc-experimental-hardcore-outer"
            startOffset="0%"
            dy={16}
          >
            {hardText}
          </textPath>
        </text>

        {/* Radial dividers between genre zones */}
        {WHEEL_GENRES.map((_, i) => {
          const angle = ((i + 0.5) / WHEEL_GENRES.length) * 360 - 90;
          const inner = polarToXY(WHEEL_CX, WHEEL_CY, 0, angle);
          const outer = polarToXY(
            WHEEL_CX,
            WHEEL_CY,
            R_EXPERIMENTAL_HARDCORE_LINE + WHEEL_RADIAL_DIVIDER_EXTRA,
            angle,
          );
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(255, 255, 255, 0.26)"
              strokeWidth={1}
            />
          );
        })}

        {/* Base genres, Mainstream, subgenres (hovered tile is painted last) */}
        {wheelRectStack}
      </svg>

      {wheelFocus && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 p-4"
              role="presentation"
              onClick={() => setWheelFocus(null)}
            >
              {(() => {
                const onSwatch = isLight(wheelFocus.hex);
                const ink = onSwatch
                  ? "rgba(10,10,10,.92)"
                  : "rgba(255,255,255,.95)";
                const inkMuted = onSwatch
                  ? "rgba(10,10,10,.52)"
                  : "rgba(255,255,255,.55)";
                const inkBody = onSwatch
                  ? "rgba(10,10,10,.82)"
                  : "rgba(255,255,255,.88)";
                return (
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="wheel-tile-modal-title"
                    className="relative w-full max-w-md overflow-hidden rounded-lg border border-black/15 shadow-xl"
                    style={{
                      background: wheelFocus.hex,
                      boxShadow: `inset 0 0 100px rgba(0,0,0,${onSwatch ? 0.06 : 0.18})`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="absolute right-3 top-3 z-10 font-mono text-lg leading-none opacity-55 transition-opacity hover:opacity-100"
                      style={{ color: ink }}
                      aria-label="Close"
                      onClick={() => setWheelFocus(null)}
                    >
                      ×
                    </button>
                    <div className="px-6 pb-7 pt-11 pr-14">
                      <h2
                        id="wheel-tile-modal-title"
                        className="font-cinzel text-xl tracking-[3px] m-0 mb-2"
                        style={{ color: ink }}
                      >
                        {wheelFocus.label}
                      </h2>
                      <p
                        className="font-mono text-sm tracking-wide m-0 mb-5"
                        style={{ color: inkMuted }}
                      >
                        {wheelFocus.hex}
                      </p>
                      {wheelFocus.kind === "genre" ? (
                        <p
                          className="font-garamond text-[15px] leading-relaxed m-0"
                          style={{ color: inkBody }}
                        >
                          Centre or ring genre on the wheel. Border colour is
                          the canonical theme key for{" "}
                          <span style={{ color: ink }}>{wheelFocus.genre}</span>
                          .
                        </p>
                      ) : (
                        <dl
                          className="m-0 grid gap-2.5 font-garamond text-[15px] leading-relaxed"
                          style={{ color: inkBody }}
                        >
                          <div className="flex flex-wrap gap-x-2 gap-y-0">
                            <dt
                              className="m-0 shrink-0 font-mono text-[11px] uppercase tracking-wider"
                              style={{ color: inkMuted }}
                            >
                              Wheel section
                            </dt>
                            <dd className="m-0" style={{ color: ink }}>
                              {wheelFocus.sectionGenre}
                            </dd>
                          </div>
                          {wheelFocus.parentB ? (
                            <div className="flex flex-wrap gap-x-2 gap-y-0">
                              <dt
                                className="m-0 shrink-0 font-mono text-[11px] uppercase tracking-wider"
                                style={{ color: inkMuted }}
                              >
                                Blend
                              </dt>
                              <dd className="m-0" style={{ color: ink }}>
                                {wheelFocus.sectionGenre} + {wheelFocus.parentB}
                              </dd>
                            </div>
                          ) : null}
                          {wheelFocus.influence ? (
                            <div className="flex flex-wrap gap-x-2 gap-y-0">
                              <dt
                                className="m-0 shrink-0 font-mono text-[11px] uppercase tracking-wider"
                                style={{ color: inkMuted }}
                              >
                                Influence
                              </dt>
                              <dd className="m-0" style={{ color: ink }}>
                                {wheelFocus.influence.genre} (
                                {formatIntensity(
                                  wheelFocus.influence.intensity,
                                )}
                                , 33% )
                              </dd>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-x-2 gap-y-0">
                            <dt
                              className="m-0 shrink-0 font-mono text-[11px] uppercase tracking-wider"
                              style={{ color: inkMuted }}
                            >
                              Intensity
                            </dt>
                            <dd className="m-0" style={{ color: ink }}>
                              {formatIntensity(wheelFocus.intensity)}
                            </dd>
                          </div>
                        </dl>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
