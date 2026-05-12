"use client";

import { useMemo, useState } from "react";
import {
  GENRE_THEMES,
  SUBGENRES,
  WHEEL_GENRES,
  genreIntensityColor,
  transitionIn,
  transitionOut,
  type GenreName,
  type Intensity,
  type NonMainstreamGenreName,
  type TransitionNode,
  type TransitionSubgenreNode,
} from "@/lib/genres";
import {
  R_EXPERIMENTAL_HARDCORE_LINE,
  R_POP_SOFT_LINE,
  R_SOFT_EXPERIMENTAL_LINE,
  WHEEL_CX,
  WHEEL_CY,
  WHEEL_RADIAL_DIVIDER_EXTRA,
  WHEEL_VIEWBOX_HEIGHT,
  WHEEL_VIEWBOX_Y_TRIM,
  WHEEL_VIEW_SIZE,
  wheelSubgenreRadius,
} from "@/lib/genres/wheel-geometry";
import { computeWheelSubgenrePlacements } from "@/lib/genres/wheel-layout";

type Node = {
  genre: GenreName;
  intensity: Intensity;
  colour: string;
  x: number;
  y: number;
  r?: number;
};

type HoverState = {
  node: TransitionNode;
  anchor: Node;
  subgenreLabel?: string;
};

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const x = cx + Math.cos(rad) * r;
  const y = cy + Math.sin(rad) * r;
  return { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) };
}

function normalizeDeltaDeg(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

function parentGenreAngleDeg(genre: GenreName): number {
  if (genre === "Mainstream") return -90;
  const idx = WHEEL_GENRES.findIndex((g) => g.n === genre);
  if (idx < 0) return -90;
  return (idx / WHEEL_GENRES.length) * 360 - 90;
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
  const span = ((endAngleDeg - startAngleDeg) % 360 + 360) % 360;
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

function isSameTransitionNode(a: TransitionNode, b: TransitionNode): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "genreIntensity" && b.kind === "genreIntensity") {
    return a.genre === b.genre && a.intensity === b.intensity;
  }
  return (
    a.kind === "subgenre" &&
    b.kind === "subgenre" &&
    a.subgenre === b.subgenre
  );
}

function circleRadiusForNode(n: { genre: GenreName }) {
  if ("r" in n && typeof n.r === "number") return n.r;
  return n.genre === "Mainstream" ? 24 : 16;
}

function lineToCircleEdge(
  from: { genre: GenreName; x: number; y: number },
  to: { genre: GenreName; x: number; y: number },
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const rFrom = circleRadiusForNode(from);
  const rTo = circleRadiusForNode(to);
  return {
    x1: from.x + ux * rFrom,
    y1: from.y + uy * rFrom,
    x2: to.x - ux * rTo,
    y2: to.y - uy * rTo,
  };
}

function labelNode(n: TransitionNode) {
  if (n.kind === "subgenre") return `${n.subgenre}`;
  return `${n.genre} (${n.intensity})`;
}

function colourForNode(
  n: TransitionNode,
  byKey: Record<string, Node>,
  subgenreNodes: Array<{ label: string; colour: string }>,
) {
  if (n.kind === "subgenre") {
    const dot = subgenreNodes.find((s) => s.label === n.subgenre);
    if (dot) return dot.colour;
    return genreIntensityColor(n.genre as NonMainstreamGenreName, n.intensity);
  }
  const node = byKey[`${n.genre}|${n.intensity}`];
  return node?.colour ?? genreIntensityColor(n.genre as NonMainstreamGenreName, n.intensity);
}

export default function GenreTransitionsWheel() {
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const subgenrePlacement = useMemo(
    () => computeWheelSubgenrePlacements(SUBGENRES),
    [],
  );

  const data = useMemo(() => {
    const intensityLevels: Intensity[] = [
      "POP",
      "SOFT",
      "EXPERIMENTAL",
      "HARDCORE",
    ];
    const pointFor = (genre: GenreName, intensity: Intensity) => {
      if (genre === "Mainstream") return { x: WHEEL_CX, y: WHEEL_CY };
      const idx = WHEEL_GENRES.findIndex((g) => g.n === genre);
      const angle = (idx / WHEEL_GENRES.length) * 360 - 90;
      return polarToXY(WHEEL_CX, WHEEL_CY, wheelSubgenreRadius(intensity), angle);
    };

    const nodes: Node[] = [
      {
        genre: "Mainstream",
        intensity: "POP",
        colour: GENRE_THEMES.Mainstream.border,
        x: WHEEL_CX,
        y: WHEEL_CY,
      },
      ...WHEEL_GENRES.flatMap((g) =>
        intensityLevels.map((intensity) => ({
          genre: g.n,
          intensity,
          colour: genreIntensityColor(g.n as NonMainstreamGenreName, intensity),
          ...pointFor(g.n, intensity),
        })),
      ),
    ];

    const byKey: Record<string, Node> = Object.fromEntries(
      nodes.map((n) => [`${n.genre}|${n.intensity}`, n]),
    );

    const influencedSubs = SUBGENRES.filter(
      (s) => s.kind === "genre" && Boolean(s.influence),
    );
    const influencedBucketCounts = new Map<string, number>();
    for (const s of influencedSubs) {
      const k = `${s.parentA}|${s.intensity}`;
      influencedBucketCounts.set(k, (influencedBucketCounts.get(k) ?? 0) + 1);
    }
    const influencedBucketSeen = new Map<string, number>();
    const subgenreNodes = influencedSubs
      .map((s) => {
        const placement = subgenrePlacement.get(s.n);
        if (!placement) return null;
        const bucketKey = `${s.parentA}|${s.intensity}`;
        const bucketCount = influencedBucketCounts.get(bucketKey) ?? 1;
        const bucketIndex = influencedBucketSeen.get(bucketKey) ?? 0;
        influencedBucketSeen.set(bucketKey, bucketIndex + 1);
        const spreadCenter = (bucketCount - 1) / 2;
        const spreadIndex = bucketIndex - spreadCenter;
        const spreadAngle = spreadIndex * 3.2;
        const parentAngle = parentGenreAngleDeg(s.parentA as GenreName);
        let angle = placement.angleDeg + spreadAngle;
        const hubDelta = normalizeDeltaDeg(angle, parentAngle);
        if (Math.abs(hubDelta) < 7) {
          angle += hubDelta >= 0 ? 7 - hubDelta : -7 - hubDelta;
        }
        const r =
          wheelSubgenreRadius(s.intensity) + placement.rOffset + Math.abs(spreadIndex) * 3;
        const pos = polarToXY(WHEEL_CX, WHEEL_CY, r, angle);
        const node = byKey[`${s.parentA}|${s.intensity}`];
        if (!node) return null;
        return {
          label: s.n,
          x: pos.x,
          y: pos.y,
          node,
          colour: node.colour,
          radius: 8,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    return { byKey, subgenreNodes };
  }, [subgenrePlacement]);

  const hoveredNode = hovered?.node ?? null;
  const hoveredOut = hoveredNode ? transitionOut(hoveredNode) : [];
  const hoveredIn = hoveredNode ? transitionIn(hoveredNode) : [];

  const resolveTransitionNodePoint = (node: TransitionNode): Node | null => {
    if (node.kind === "genreIntensity") {
      return data.byKey[`${node.genre}|${node.intensity}`] ?? null;
    }
    const dot = data.subgenreNodes.find((s) => s.label === node.subgenre);
    if (!dot) return null;
    return { ...dot.node, x: dot.x, y: dot.y, r: dot.radius };
  };

  const hoveredAnchor = hovered?.anchor ?? (hoveredNode ? resolveTransitionNodePoint(hoveredNode) : null);

  const outLinks = hoveredNode
    ? hoveredOut
        .map((to) => {
          const toPoint = resolveTransitionNodePoint(to);
          if (!hoveredAnchor || !toPoint || isSameTransitionNode(hoveredNode, to)) {
            return null;
          }
          return { from: hoveredAnchor, to: toPoint };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null)
    : [];

  const inLinks = hoveredNode
    ? hoveredIn
        .map((from) => {
          const fromPoint = resolveTransitionNodePoint(from);
          if (!hoveredAnchor || !fromPoint || isSameTransitionNode(hoveredNode, from)) {
            return null;
          }
          return { from: fromPoint, to: hoveredAnchor };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null)
    : [];

  const wheelSlice = 360 / WHEEL_GENRES.length;
  const intensityBands: Array<{
    intensity: Intensity;
    inner: number;
    outer: number;
    opacity: number;
  }> = [
    { intensity: "POP", inner: 0, outer: R_POP_SOFT_LINE, opacity: 0.2 },
    {
      intensity: "SOFT",
      inner: R_POP_SOFT_LINE,
      outer: R_SOFT_EXPERIMENTAL_LINE,
      opacity: 0.2,
    },
    {
      intensity: "EXPERIMENTAL",
      inner: R_SOFT_EXPERIMENTAL_LINE,
      outer: R_EXPERIMENTAL_HARDCORE_LINE,
      opacity: 0.18,
    },
    {
      intensity: "HARDCORE",
      inner: R_EXPERIMENTAL_HARDCORE_LINE,
      outer: R_EXPERIMENTAL_HARDCORE_LINE + WHEEL_RADIAL_DIVIDER_EXTRA,
      opacity: 0.16,
    },
  ];

  return (
    <div className="flex flex-col xl:flex-row items-start justify-center gap-6 w-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 ${WHEEL_VIEWBOX_Y_TRIM} ${WHEEL_VIEW_SIZE} ${WHEEL_VIEWBOX_HEIGHT}`}
        className="w-full h-auto max-w-[1200px] shrink-0 overflow-visible"
      >
        <defs>
          <marker
            id="genre-transition-arrow-out"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill="rgba(34,197,94,.95)" />
          </marker>
          <marker
            id="genre-transition-arrow-in"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill="rgba(59,130,246,.95)" />
          </marker>
        </defs>

        {WHEEL_GENRES.flatMap((g, i) => {
          const start = i * wheelSlice - 90 - wheelSlice / 2;
          const end = i * wheelSlice - 90 + wheelSlice / 2;
          return intensityBands.map((band) => {
            const isHovered =
              hoveredNode != null &&
              hoveredNode.kind === "genreIntensity" &&
              hoveredNode.genre === g.n &&
              hoveredNode.intensity === band.intensity;
            return (
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
                fillOpacity={isHovered ? 0.42 : band.opacity}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => {
                  const node = data.byKey[`${g.n}|${band.intensity}`];
                  if (node) {
                    setHovered({
                      node: {
                        kind: "genreIntensity",
                        genre: g.n,
                        intensity: band.intensity,
                      },
                      anchor: node,
                    });
                  }
                }}
                onMouseLeave={() => setHovered(null)}
              />
            );
          });
        })}

        <circle
          cx={WHEEL_CX}
          cy={WHEEL_CY}
          r={Math.round(R_POP_SOFT_LINE * 0.35)}
          fill={GENRE_THEMES.Mainstream.border}
          fillOpacity={hoveredNode?.genre === "Mainstream" ? 1 : 0.9}
          style={{ cursor: "pointer" }}
          onMouseEnter={() => {
            const node = data.byKey["Mainstream|pop"];
            if (node) {
              setHovered({
                node: { kind: "genreIntensity", genre: "Mainstream", intensity: "POP" },
                anchor: node,
              });
            }
          }}
          onMouseLeave={() => setHovered(null)}
        />

        {[R_POP_SOFT_LINE, R_SOFT_EXPERIMENTAL_LINE, R_EXPERIMENTAL_HARDCORE_LINE].map(
          (r) => (
            <circle
              key={`genre-transition-ring-${r}`}
              cx={WHEEL_CX}
              cy={WHEEL_CY}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,.12)"
              strokeDasharray="4 6"
            />
          ),
        )}
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
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth={1}
            />
          );
        })}

        {outLinks.map((l, i) => {
          const edge = lineToCircleEdge(l.from, l.to);
          return (
            <line
              key={`out-link-${i}`}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke="rgba(255,255,255,.52)"
              strokeWidth={2.4}
              markerEnd="url(#genre-transition-arrow-out)"
            />
          );
        })}
        {inLinks.map((l, i) => {
          const edge = lineToCircleEdge(l.from, l.to);
          return (
            <line
              key={`in-link-${i}`}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke="rgba(255,255,255,.42)"
              strokeWidth={2.2}
              markerEnd="url(#genre-transition-arrow-in)"
            />
          );
        })}

        {Object.values(data.byKey).map((n) => (
          <circle
            key={`node-${n.genre}-${n.intensity}`}
            cx={n.x}
            cy={n.y}
            r={circleRadiusForNode(n)}
            fill={n.colour}
            stroke="rgba(255,255,255,.45)"
            strokeWidth={
              hoveredNode &&
              hoveredNode.kind === "genreIntensity" &&
              hoveredNode.genre === n.genre &&
              hoveredNode.intensity === n.intensity
                ? 2.6
                : 1.6
            }
            style={{ cursor: "pointer" }}
            onMouseEnter={() =>
              setHovered({
                node: { kind: "genreIntensity", genre: n.genre, intensity: n.intensity },
                anchor: n,
              })
            }
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {data.subgenreNodes.map((s) => (
          <circle
            key={`subgenre-${s.label}`}
            cx={s.x}
            cy={s.y}
            r={s.radius}
            fill={s.colour}
            stroke="rgba(255,255,255,.55)"
            strokeWidth={1.2}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => {
              const anchor: Node = {
                ...s.node,
                x: s.x,
                y: s.y,
                r: s.radius,
              };
              setHovered({
                node: {
                  kind: "subgenre",
                  subgenre: s.label,
                  genre: s.node.genre as NonMainstreamGenreName,
                  intensity: s.node.intensity,
                } as TransitionSubgenreNode,
                anchor,
                subgenreLabel: s.label,
              });
            }}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>

      <aside className="xl:sticky xl:top-24 w-full xl:w-[560px] h-[720px] rounded border border-[#d7cdb8] px-4 py-3 bg-[#f3eddf]/95 text-[#1f1b14] overflow-y-auto">
        {hoveredNode ? (
          <>
            {hovered?.subgenreLabel ? (
              <div className="font-mono text-[15px] text-[#625947] uppercase tracking-[0.08em] mb-1">
                Subgenre: {hovered.subgenreLabel}
              </div>
            ) : null}
            <div
              className="font-mono text-[20px] uppercase tracking-[0.08em]"
              style={{
                color: colourForNode(hoveredNode, data.byKey, data.subgenreNodes),
              }}
            >
              {labelNode(hoveredNode)}
            </div>
            <div className="font-mono text-[18px] mt-2">Out:</div>
            <ul className="m-0 mt-1 pl-6 list-disc">
              {hoveredOut.map((n) => (
                <li
                  key={`out-${n.kind === "subgenre" ? n.subgenre : `${n.genre}-${n.intensity}`}`}
                  className="font-mono text-[18px]"
                  style={{
                    color: colourForNode(n, data.byKey, data.subgenreNodes),
                  }}
                >
                  {labelNode(n)}
                </li>
              ))}
            </ul>
            <div className="font-mono text-[18px] mt-2">In:</div>
            <ul className="m-0 mt-1 pl-6 list-disc">
              {hoveredIn.map((n) => (
                <li
                  key={`in-${n.kind === "subgenre" ? n.subgenre : `${n.genre}-${n.intensity}`}`}
                  className="font-mono text-[18px]"
                  style={{
                    color: colourForNode(n, data.byKey, data.subgenreNodes),
                  }}
                >
                  {labelNode(n)}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="font-mono text-[18px] text-[#625947]">
            Hover a genre/intensity sector or a subgenre dot to display transition
            arrows.
          </div>
        )}
      </aside>
    </div>
  );
}
