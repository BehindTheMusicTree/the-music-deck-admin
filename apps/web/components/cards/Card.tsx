"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Card.module.css";
import IntensityGauge from "../genres/IntensityGauge";
import {
  type RootGenreName,
  appGenreIntensity,
  genreIntensityColor,
  genreIntensityIn,
  genreIntensityOut,
  GENRE_THEMES,
  sortGenreIntensityNodesForStripDisplay,
  matchupGenreDisplayLabel,
  matchupTargetDiamondColor,
  matchupTargetsForRootGenre,
  type ResolvedThemeSelection,
  resolveThemeSelection,
  resolveThemeSelectionLoose,
  subgenreIntensity,
  type Intensity,
  WORLD_THEMES,
} from "@/lib/genres";
import {
  countryFlagForShell,
  countryPreferredCardShell,
} from "@/lib/countries";
import { flatShellFlagBackgroundSize } from "@/lib/flag-background-size";
import {
  deriveSongsInFromSongIndex,
  type CardSongIndex,
} from "@/lib/cards/song-graph";
import type { CardData, CardRarity } from "@repo/cards-domain";
import type { GenreTheme } from "@/lib/card-theme-types";

export type {
  CardTypePip,
  CardTypePipSymbol,
  GenreTheme,
} from "@/lib/card-theme-types";
export type { CardData } from "@repo/cards-domain";

export interface TransitionSong {
  title: string;
  artist?: string;
  /** Genre canonical border colour used as the strip background. */
  themeColor: string;
  /** Genre icon SVG string. */
  icon: string;
}

type GenreTransitionStrip = {
  genre: string;
  intensity: Intensity;
  themeColor: string;
  icon: string;
};

const RARITY_COLOR: Record<CardRarity, string> = {
  LEGENDARY: "#c8a040",
  CLASSIC: "#a060c8",
  BANGER: "#4a7aaa",
  NICHE: "#666",
};

const RARITY_ICON: Record<CardRarity, string> = {
  LEGENDARY: `<svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,0 8,3.5 10,7 5,10 0,7 2,3.5" fill="#c8a040"/></svg>`,
  CLASSIC: `<svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,0 6.2,3.8 10,3.8 7,6.2 8.2,10 5,7.8 1.8,10 3,6.2 0,3.8 3.8,3.8" fill="#a060c8"/></svg>`,
  BANGER: `<svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,0 6,3.5 9.5,3.5 6.8,5.7 7.8,9.2 5,7.2 2.2,9.2 3.2,5.7 0.5,3.5 4,3.5" fill="#4a7aaa"/></svg>`,
  NICHE: `<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="none" stroke="#666" stroke-width="1.5"/></svg>`,
};

const STRIP_NAME_FOR_GENRE: Record<string, string> = {
  Pop: "Pop",
  Rock: "Rock",
  Mainstream: "Pop",
  Electronic: "Electronic",
  "Reggae/Dub": "Reggae/Dub",
  HipHop: "Hip-hop",
  Funk: "Funk",
  "Disco/Funk": "Disco/Funk",
  Classical: "Classical",
  Vintage: "Vintage",
};

/** Always returns two parts for a two-column Genre strip. */
function getTypeStripParts(
  leftLabel: string,
  rightLabel: string,
): { left: string; right: string } {
  const left = STRIP_NAME_FOR_GENRE[leftLabel] ?? leftLabel;
  return { left, right: rightLabel };
}

function scoreGlowColor(popularity: number) {
  const note = clamp(Math.round(popularity), 1, 9);
  const t = Math.max(0, Math.min(1, (note - 1) / 8));
  const r = Math.round(t * 14 + 4);
  const o = (0.25 + t * 0.65).toFixed(2);
  return `0 0 ${r}px rgba(200,160,64,${o})`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function popularityNote(popularity: number): number {
  return clamp(Math.round(popularity), 1, 9);
}

function popularityTier(note: number): "gold" | "platinum" | "diamond" {
  if (note <= 3) return "gold";
  if (note <= 6) return "platinum";
  return "diamond";
}

function popularityCount(note: number): number {
  return ((note - 1) % 3) + 1;
}

const AWARD_SYMBOL_SIZE = 24;

function awardSymbolSvg(tier: "gold" | "platinum" | "diamond"): string {
  if (tier === "gold") {
    return `<svg width="${AWARD_SYMBOL_SIZE}" height="${AWARD_SYMBOL_SIZE}" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="#d4af37" stroke="#f7df84" stroke-width="0.8"/><circle cx="6" cy="6" r="2.5" fill="#b58a1e"/><path d="M6 3.8l.6 1.2 1.3.2-.95.92.22 1.32L6 6.78l-1.17.66.22-1.32-.95-.92 1.3-.2.6-1.2z" fill="#f7df84"/></svg>`;
  }
  if (tier === "platinum") {
    return `<svg width="${AWARD_SYMBOL_SIZE}" height="${AWARD_SYMBOL_SIZE}" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.2l3.6 1.2v3.2c0 2.6-1.7 4.3-3.6 5.2-1.9-.9-3.6-2.6-3.6-5.2V2.4L6 1.2z" fill="#c7d0d9" stroke="#eff4f8" stroke-width="0.8"/><path d="M3.2 3.2l-.8.6.6.9-.9.3.35.98-1 .06.06 1.03 1-.1.14.98.98-.24.34.93.9-.5" fill="none" stroke="#9ca9b6" stroke-width="0.55"/><path d="M8.8 3.2l.8.6-.6.9.9.3-.35.98 1 .06-.06 1.03-1-.1-.14.98-.98-.24-.34.93-.9-.5" fill="none" stroke="#9ca9b6" stroke-width="0.55"/></svg>`;
  }
  return `<svg width="${AWARD_SYMBOL_SIZE}" height="${AWARD_SYMBOL_SIZE}" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.2L4.2 2h3.6L10 4.2 6 10 2 4.2z" fill="#7fe3ff" stroke="#e8fbff" stroke-width="0.8"/><path d="M4.2 2L6 4.2 7.8 2M2 4.2h8M6 4.2v5.8" stroke="#dff8ff" stroke-width="0.6" fill="none"/></svg>`;
}

function isVeryLight(hex: string) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  const isHipHopLikeYellow =
    r >= 170 && g >= 120 && b <= 80 && luminance >= 115;
  if (isHipHopLikeYellow) return true;
  return luminance > 200;
}

function CardArtwork({ card }: { card: CardData }) {
  const src = card.artworkUrl ?? card.artwork;
  if (!src) return null;
  const dy = card.artworkOffsetY;
  const hasOffset = dy != null && dy !== 0;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={styles.artImg}
      style={
        hasOffset
          ? {
              height: `calc(100% + ${Math.abs(dy)}px)`,
              transform: `translateY(${dy}px)`,
            }
          : undefined
      }
    />
  );
}

// Clip-path applied to .card when a transitionIn strip is present.
// The trackIn strip sits over the card's LEFT BORDER — we cut through the border only so the
// notch void shows the page background instead of the colored frame.
// The trackOut strip's notch is INSIDE the card content (dark header) — no cut needed there;
// the header shows naturally behind the strip's own clip-path void.

export default function Card({
  card,
  theme,
  small,
  enableZoom = true,
  hoverLift = true,
  cardSongIndex,
}: {
  card: CardData;
  theme: GenreTheme;
  small?: boolean;
  /** When false, the preview is static (no click-to-zoom). Use when a parent handles interaction. */
  enableZoom?: boolean;
  /**
   * When false, the card does not lift or change shadow on hover (e.g. catalog detail preview).
   */
  hoverLift?: boolean;
  /**
   * Per-id lookup with `songsOut` + display fields for link targets.
   * Built with `buildCardSongIndex` (e.g. catalogue).
   */
  cardSongIndex?: CardSongIndex;
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const rarColor = RARITY_COLOR[card.rarity] ?? "#666";
  const [titleScale, setTitleScale] = useState(1);
  const [genreStripCenterTop, setGenreStripCenterTop] = useState(243);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleScaleRef = useRef(1);
  const cardFrameRef = useRef<HTMLDivElement>(null);
  const genreStripRef = useRef<HTMLDivElement>(null);
  const resolved: ResolvedThemeSelection = resolveThemeSelectionLoose({
    genre: card.genre ?? "",
    country: card.country,
    fallbackTheme: theme,
  });
  const effectiveTheme = resolved.theme;
  const strip = getTypeStripParts(resolved.leftLabel, resolved.rightLabel);
  const matchup = matchupTargetsForRootGenre(
    resolved.resolvedGenre as RootGenreName | undefined,
  );
  const stripLeftBorder =
    resolved.genreStripPrimaryBorder ?? effectiveTheme.border;
  const stripRightBorder =
    resolved.genreStripSubBorder ?? effectiveTheme.border;
  const leftPipNeedsBorder = isVeryLight(stripLeftBorder);
  const rightPipNeedsBorder = isVeryLight(stripRightBorder);
  const countryTypePip = resolved.resolvedCountry
    ? WORLD_THEMES[resolved.resolvedCountry]?.typePip
    : undefined;
  const pipLeftSymbol = countryTypePip?.symbol;
  const pipLeftFlagBg = countryTypePip?.flagBg;
  const hasCountryPipArt = Boolean(pipLeftFlagBg || pipLeftSymbol);
  /** Mirror country flag (diamond {@link styles.pipFlag}) or symbol on the right when enabled. */
  const rightUsesCountryIdentity = Boolean(
    resolved.mirrorCountryTypeStripRight &&
    hasCountryPipArt &&
    resolved.resolvedCountry &&
    (card.country == null || card.country === resolved.resolvedCountry),
  );
  const pipRightSymbol =
    pipLeftSymbol && rightUsesCountryIdentity ? pipLeftSymbol : undefined;
  const pipRightFlagBg =
    pipLeftFlagBg && rightUsesCountryIdentity ? pipLeftFlagBg : undefined;

  const worldFrameCountry = resolved.resolvedCountry;
  const preferredShell = countryPreferredCardShell(worldFrameCountry);
  const preferredFlagVariant = countryFlagForShell(
    worldFrameCountry,
    preferredShell,
  );
  const fallbackFlagLayer = resolved.frameBorder ?? effectiveTheme.frameBorder;
  const fallbackFlagBg = resolved.frameBg ?? effectiveTheme.frameBg;
  const flagLayer = preferredFlagVariant.border ?? fallbackFlagLayer;
  const flagBg = preferredFlagVariant.bg ?? fallbackFlagBg;
  const flatShellFrameBorderSize = flatShellFlagBackgroundSize(flagLayer);
  const flatShellFrameBgSize = flatShellFlagBackgroundSize(flagBg);
  /**
   * R90 border shell (cardFlagUsR90) works for *vertical* bar flags; horizontal bands
   * (e.g. NL / DE / ES) become sideways after -90° and the frame reads as one band.
   * Frame assets can provide explicit flat / r90 variants per country.
   */
  const flagRotateR90 = Boolean(
    flagLayer && worldFrameCountry && preferredShell === "r90",
  );
  const worldFrameFilter = resolved.frameFilter ?? effectiveTheme.frameFilter;
  const worldFrameOpacity =
    resolved.frameOpacity ?? effectiveTheme.frameOpacity;
  const worldFrameBackgroundPosition =
    preferredFlagVariant.backgroundPosition ??
    resolved.frameBackgroundPosition ??
    effectiveTheme.frameBackgroundPosition ??
    "center";
  const flagStyle = resolved.flagStyle;
  const resolvedFadeColor =
    flagStyle === "fade" ? resolved.fadeColor : undefined;
  if (flagStyle === "fade" && !resolvedFadeColor) {
    throw new Error(
      `Missing canonical color for fade border on "${card.title}"`,
    );
  }

  const varStyle = {
    "--gc-border": effectiveTheme.border,
    "--gc-header-bg": effectiveTheme.headerBg,
    "--gc-text-main": effectiveTheme.textMain,
    "--gc-text-body": effectiveTheme.textBody,
    "--gc-parch-strip": effectiveTheme.parchStrip,
    "--gc-parch-ability": effectiveTheme.parchAbility,
  } as React.CSSProperties;

  /** Flat shell when the selected country shell is not r90. */
  const flagFlatShell = Boolean(flagLayer && !flagRotateR90);

  const resolveTransitionSong = (
    id: number | undefined,
  ): TransitionSong | undefined => {
    if (id == null || !cardSongIndex) return undefined;
    const ref = cardSongIndex[id];
    if (!ref) return undefined;
    const resolvedRefTheme = ref.genre
      ? resolveThemeSelection({ genre: ref.genre }).theme
      : theme;
    return {
      title: ref.title,
      artist: ref.artist,
      themeColor: resolvedRefTheme.border,
      icon: resolvedRefTheme.icon,
    };
  };
  const row = cardSongIndex?.[card.id];
  const songsIn = cardSongIndex
    ? deriveSongsInFromSongIndex(cardSongIndex, card.id)
    : [];
  const songsOut = row?.songsOut ?? card.songsOut ?? [];
  const transitionsIn = songsIn
    .map(resolveTransitionSong)
    .filter(Boolean) as NonNullable<ReturnType<typeof resolveTransitionSong>>[];
  const transitionsOut = songsOut
    .map(resolveTransitionSong)
    .filter(Boolean) as NonNullable<ReturnType<typeof resolveTransitionSong>>[];

  const currentGenre = resolved.resolvedGenre;
  const currentIntensity: Intensity | undefined = (() => {
    if (resolved.resolvedSubgenre)
      return subgenreIntensity(resolved.resolvedSubgenre);
    if (currentGenre) return appGenreIntensity(currentGenre as RootGenreName);
    return undefined;
  })();
  const toGenreTransitionStrip = (n: {
    genre: string;
    intensity: Intensity;
  }): GenreTransitionStrip => ({
    genre: n.genre,
    intensity: n.intensity,
    themeColor:
      n.genre === "Mainstream"
        ? GENRE_THEMES.Mainstream.border
        : genreIntensityColor(
            n.genre as Exclude<keyof typeof GENRE_THEMES, "Mainstream">,
            n.intensity,
          ),
    icon: GENRE_THEMES[n.genre as keyof typeof GENRE_THEMES]?.icon ?? "",
  });
  const intensityRank: Record<Intensity, number> = {
    POP: 0,
    SOFT: 1,
    EXPERIMENTAL: 2,
    HARDCORE: 3,
  };
  const sortWeakestIntensityFirstInGenreGroups = (
    nodes: Array<{ genre: string; intensity: Intensity }>,
  ) => {
    const intensityOrder: Record<Intensity, number> = {
      POP: 0,
      SOFT: 1,
      EXPERIMENTAL: 2,
      HARDCORE: 3,
    };
    const out: Array<{ genre: string; intensity: Intensity }> = [];
    let i = 0;
    while (i < nodes.length) {
      const genre = nodes[i]?.genre;
      let j = i + 1;
      while (j < nodes.length && nodes[j]?.genre === genre) j += 1;
      const group = nodes.slice(i, j).sort((a, b) => {
        return intensityOrder[a.intensity] - intensityOrder[b.intensity];
      });
      out.push(...group);
      i = j;
    }
    return out;
  };
  const genreTransitionsIn: GenreTransitionStrip[] =
    currentGenre && currentIntensity
      ? sortWeakestIntensityFirstInGenreGroups(
          sortGenreIntensityNodesForStripDisplay(
            genreIntensityIn({
              genre: currentGenre as keyof typeof GENRE_THEMES,
              intensity: currentIntensity,
            }).filter((n) => n.genre !== currentGenre),
          ),
        ).map(toGenreTransitionStrip)
      : [];
  const genreTransitionsOut: GenreTransitionStrip[] =
    currentGenre && currentIntensity
      ? sortWeakestIntensityFirstInGenreGroups(
          sortGenreIntensityNodesForStripDisplay(
            genreIntensityOut({
              genre: currentGenre as keyof typeof GENRE_THEMES,
              intensity: currentIntensity,
            }).filter((n) => n.genre !== currentGenre),
          ),
        ).map(toGenreTransitionStrip)
      : [];

  const STRIP_H = 19;
  const STRIP_TOP_BASE = 44 + 10 - STRIP_H / 2;
  const GENRE_STRIP_STEP = STRIP_H;
  const genreInCount = Math.max(genreTransitionsIn.length, 1);
  const genreOutCount = Math.max(genreTransitionsOut.length, 1);
  const genreInGroupTop =
    genreStripCenterTop -
    STRIP_H / 2 -
    ((genreInCount - 1) * GENRE_STRIP_STEP) / 2;
  const genreOutGroupTop =
    genreStripCenterTop -
    STRIP_H / 2 -
    ((genreOutCount - 1) * GENRE_STRIP_STEP) / 2;
  const genreInStripTop = (i: number) => genreInGroupTop + i * GENRE_STRIP_STEP;
  const genreOutStripTop = (i: number) =>
    genreOutGroupTop + i * GENRE_STRIP_STEP;

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    const recompute = () => {
      el.style.fontSize = "12px";
      el.style.letterSpacing = "0.8px";
      const available = el.clientWidth;
      if (!available) return;

      // Fit title width as tightly as possible.
      let scale = 1;
      const minScale = 0.5;
      const epsilon = 0.5;
      for (let i = 0; i < 3; i += 1) {
        const needed = el.scrollWidth;
        if (!needed) return;
        if (needed <= available + epsilon) break;
        const ratio = available / needed;
        scale = Math.max(minScale, Math.min(1, scale * ratio));
        el.style.fontSize = `${12 * scale}px`;
        el.style.letterSpacing = `${0.8 * scale}px`;
      }

      if (Math.abs(scale - titleScaleRef.current) > 0.003) {
        titleScaleRef.current = scale;
        setTitleScale(scale);
      }
    };

    recompute();
    const observer = new ResizeObserver(() => recompute());
    observer.observe(el);
    if (typeof document !== "undefined" && "fonts" in document) {
      void (document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(
        () => recompute(),
      );
    }
    return () => observer.disconnect();
  }, [card.title, card.artist, small]);

  useLayoutEffect(() => {
    const frameEl = cardFrameRef.current;
    const stripEl = genreStripRef.current;
    if (!frameEl || !stripEl) return;

    const recompute = () => {
      const frameRect = frameEl.getBoundingClientRect();
      const stripRect = stripEl.getBoundingClientRect();
      const centerFromTop =
        stripRect.top - frameRect.top + stripRect.height / 2;
      // getBoundingClientRect() includes CSS transforms (scale). Convert back to
      // the frame's unscaled CSS pixels because strip positioning uses `bottom`.
      const scaleY =
        frameEl.offsetHeight > 0 ? frameRect.height / frameEl.offsetHeight : 1;
      const centerFromTopCssPx =
        scaleY > 0 ? centerFromTop / scaleY : centerFromTop;
      setGenreStripCenterTop((prev) =>
        Math.abs(prev - centerFromTopCssPx) < 0.01 ? prev : centerFromTopCssPx,
      );
    };

    recompute();
    const observer = new ResizeObserver(() => recompute());
    observer.observe(frameEl);
    observer.observe(stripEl);
    window.addEventListener("resize", recompute);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [small, card.id]);

  const cardContent = (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div
          className={styles.headerLeft}
          style={
            transitionsIn.length > 0
              ? { transform: "translateY(-2px)" }
              : undefined
          }
        >
          <span
            className={`${styles.headerIcon}${resolved.resolvedGenre === "Classical" ? ` ${styles.headerIconClassical}` : ""}`}
            dangerouslySetInnerHTML={{ __html: effectiveTheme.icon }}
          />
          <div
            className={`${styles.titleGroup} ${!card.artist ? styles.titleGroupSolo : ""}`}
          >
            <div
              ref={titleRef}
              className={styles.title}
              style={{
                fontSize: `${12 * titleScale}px`,
                letterSpacing: `${0.8 * titleScale}px`,
              }}
            >
              {card.title}
            </div>
            {card.artist ? (
              <div className={styles.artist}>{card.artist}</div>
            ) : null}
          </div>
        </div>
        <div
          className={styles.score}
          style={
            {
              "--score-glow-c": effectiveTheme.textMain,
              "--score-glow-r": `${4 + Math.round(Math.max(0, Math.min(1, (popularityNote(card.pop) - 1) / 8)) * 14)}px`,
              boxShadow: scoreGlowColor(card.pop),
            } as React.CSSProperties
          }
        >
          {card.pop}
        </div>
      </div>

      {/* Body: artwork fills this zone, panels overlay at the bottom */}
      <div
        className={`${styles.body} ${card.artworkOverBorder ? styles.bodyArtOverBorder : ""}`}
      >
        <div
          className={`${styles.art} ${card.artworkOverBorder ? styles.artOverBorder : ""}`}
        >
          <CardArtwork card={card} />
        </div>

        {/*
          Genre strip: only .pip / .pipFlag (diamond) for country — never a large rectangular
          flag swatch; that pattern is reserved for list/panel views (e.g. CountryFlagSwatch).
        */}
        <div ref={genreStripRef} className={styles.genreStrip}>
          <div className={styles.genreStripSide}>
            <>
              {pipLeftSymbol ? (
                pipLeftSymbol.svg ? (
                  <span
                    className={styles.pipSymbol}
                    style={{
                      color: pipLeftSymbol.color,
                      fontSize: pipLeftSymbol.size,
                    }}
                    dangerouslySetInnerHTML={{ __html: pipLeftSymbol.svg }}
                  />
                ) : (
                  <span
                    className={styles.pipSymbol}
                    style={{
                      color: pipLeftSymbol.color,
                      fontSize: pipLeftSymbol.size,
                    }}
                  >
                    {pipLeftSymbol.sym}
                  </span>
                )
              ) : pipLeftFlagBg ? (
                <div
                  className={styles.pipFlag}
                  style={{
                    backgroundImage: pipLeftFlagBg,
                    backgroundSize: "100% 100%",
                    backgroundPosition: worldFrameBackgroundPosition,
                    border: "1px solid rgba(20, 16, 10, 0.35)",
                  }}
                />
              ) : (
                <div
                  className={styles.pip}
                  style={{
                    background: stripLeftBorder,
                    border: leftPipNeedsBorder
                      ? "1px solid rgba(20, 16, 10, 0.45)"
                      : "none",
                  }}
                />
              )}
              <span className={styles.genreText}>{strip.left}</span>
            </>
          </div>
          <div
            className={`${styles.genreStripSide} ${styles.genreStripSubSide}`}
          >
            <span className={styles.genreText}>{strip.right}</span>
            {pipRightSymbol ? (
              pipRightSymbol.svg ? (
                <span
                  className={styles.pipSymbol}
                  style={{
                    color: pipRightSymbol.color,
                    fontSize: pipRightSymbol.size,
                  }}
                  dangerouslySetInnerHTML={{ __html: pipRightSymbol.svg }}
                />
              ) : (
                <span
                  className={styles.pipSymbol}
                  style={{
                    color: pipRightSymbol.color,
                    fontSize: pipRightSymbol.size,
                  }}
                >
                  {pipRightSymbol.sym}
                </span>
              )
            ) : pipRightFlagBg ? (
              <div
                className={styles.pipFlag}
                style={{
                  backgroundImage: pipRightFlagBg,
                  backgroundSize: "100% 100%",
                  backgroundPosition: worldFrameBackgroundPosition,
                  border: "1px solid rgba(20, 16, 10, 0.35)",
                }}
              />
            ) : (
              <div
                className={styles.pip}
                style={{
                  background: stripRightBorder,
                  border: rightPipNeedsBorder
                    ? "1px solid rgba(20, 16, 10, 0.45)"
                    : "none",
                }}
              />
            )}
          </div>
        </div>

        {/* Matchup strip — weak (left, reddish), advantage (right, greenish) */}
        <div
          className={styles.matchupStrip}
          role="group"
          aria-label="Genre weak matchups and strong matchups"
        >
          <div className={`${styles.matchupHalf} ${styles.matchupWeak}`}>
            {matchup.weakVs.length === 0 ? (
              <span
                className={`${styles.matchupEmpty} ${small ? styles.matchupEmptySm : ""}`}
              >
                —
              </span>
            ) : (
              matchup.weakVs.map((name) => {
                const color = matchupTargetDiamondColor(name);
                const pipLight = isVeryLight(color);
                return (
                  <span
                    key={`weak-${name}`}
                    className={`${styles.matchupCluster} ${styles.matchupClusterWeak}`}
                  >
                    <span
                      className={`${styles.matchupName} ${small ? styles.matchupNameSm : ""}`}
                    >
                      {matchupGenreDisplayLabel(name)}
                    </span>
                    <span
                      className={`${styles.matchupPip} ${small ? styles.matchupPipSm : ""}`}
                      style={{
                        background: color,
                        border: pipLight
                          ? "0.75px solid rgba(20, 16, 10, 0.45)"
                          : "none",
                      }}
                    />
                  </span>
                );
              })
            )}
          </div>
          <div className={`${styles.matchupHalf} ${styles.matchupAdv}`}>
            {matchup.advantageVs.length === 0 ? (
              <span
                className={`${styles.matchupEmpty} ${small ? styles.matchupEmptySm : ""}`}
              >
                —
              </span>
            ) : (
              matchup.advantageVs.map((name) => {
                const color = matchupTargetDiamondColor(name);
                const pipLight = isVeryLight(color);
                return (
                  <span
                    key={`adv-${name}`}
                    className={`${styles.matchupCluster} ${styles.matchupClusterAdv}`}
                  >
                    <span
                      className={`${styles.matchupPip} ${small ? styles.matchupPipSm : ""}`}
                      style={{
                        background: color,
                        border: pipLight
                          ? "0.75px solid rgba(20, 16, 10, 0.45)"
                          : "none",
                      }}
                    />
                    <span
                      className={`${styles.matchupName} ${small ? styles.matchupNameSm : ""}`}
                    >
                      {matchupGenreDisplayLabel(name)}
                    </span>
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Ability */}
        <div className={styles.ability}>
          <div className={styles.abilityName}>{card.ability}</div>
          <div className={styles.abilityDesc}>{card.abilityDesc}</div>
        </div>

        {/* Stats: popularity symbols (left); intensity gradient + note under cursor (right) */}
        <div className={`${styles.stats} ${small ? styles.statsSm : ""}`}>
          <div
            className={styles.statsPop}
            aria-label={`Popularity tier ${popularityNote(card.pop)} of 9`}
          >
            {(() => {
              const note = popularityNote(card.pop);
              const tier = popularityTier(note);
              const count = popularityCount(note);
              const icon = awardSymbolSvg(tier);
              return Array.from({ length: count }).map((_, i) => (
                <span
                  key={`award-${i}`}
                  dangerouslySetInnerHTML={{ __html: icon }}
                />
              ));
            })()}
          </div>
          <div className={styles.statsIntensity}>
            <IntensityGauge
              small={Boolean(small)}
              intensity={(() => {
                if (resolved.resolvedSubgenre) {
                  return subgenreIntensity(resolved.resolvedSubgenre);
                }
                if (resolved.resolvedGenre) {
                  return appGenreIntensity(
                    resolved.resolvedGenre as RootGenreName,
                  );
                }
                return undefined;
              })()}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.brand}>{card.year}</span>
          <div className={styles.rarityRow}>
            <span
              dangerouslySetInnerHTML={{
                __html: RARITY_ICON[card.rarity] ?? "",
              }}
            />
            <span className={styles.rarityText} style={{ color: rarColor }}>
              {card.rarity}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  // Strips rendered as siblings of .card inside .cardFrame — never inside the card itself.
  const cardStrips = (
    <>
      {transitionsIn.map((t, i) => {
        const light = isVeryLight(t.themeColor);
        return (
          <React.Fragment key={`in-${i}`}>
            <div
              className={styles.trackTransitionStripIn}
              style={{
                background: t.themeColor,
                top: STRIP_TOP_BASE + i * STRIP_H,
                color: light ? "#1a0f05" : "rgba(255,255,255,0.92)",
              }}
            >
              <span
                className={`${styles.trackTransitionStripIcon}${t.icon === GENRE_THEMES.Classical.icon ? ` ${styles.trackTransitionStripIconClassical}` : ""}${t.icon === GENRE_THEMES.Electronic.icon ? ` ${styles.trackTransitionStripIconElectronic}` : ""}`}
                dangerouslySetInnerHTML={{ __html: t.icon }}
              />
              <span className={styles.trackTransitionStripText}>{t.title}</span>
            </div>
            <div
              className={styles.trackTransitionStripInNotch}
              style={{ top: STRIP_TOP_BASE + i * STRIP_H }}
            />
          </React.Fragment>
        );
      })}
      {transitionsOut.map((t, i) => {
        const light = isVeryLight(t.themeColor);
        return (
          <div
            key={`out-${i}`}
            className={styles.trackTransitionStripOut}
            style={{
              background: t.themeColor,
              top: STRIP_TOP_BASE + i * STRIP_H,
              color: light ? "#1a0f05" : "rgba(255,255,255,0.92)",
            }}
          >
            <span
              className={`${styles.trackTransitionStripIcon}${t.icon === GENRE_THEMES.Classical.icon ? ` ${styles.trackTransitionStripIconClassical}` : ""}${t.icon === GENRE_THEMES.Electronic.icon ? ` ${styles.trackTransitionStripIconElectronic}` : ""}`}
              dangerouslySetInnerHTML={{ __html: t.icon }}
            />
            <span className={styles.trackTransitionStripText}>{t.title}</span>
          </div>
        );
      })}
      {genreTransitionsIn.map((t, i) => {
        const light = isVeryLight(t.themeColor);
        const iconSize = t.genre === "Rock" ? 16 : undefined;
        return (
          <React.Fragment key={`genre-in-${i}-${t.genre}-${t.intensity}`}>
            <div
              className={styles.genreTransitionStripIn}
              style={{
                background: t.themeColor,
                top: genreInStripTop(i),
                bottom: "auto",
                color: light ? "#1a0f05" : "rgba(255,255,255,0.96)",
              }}
              title={`${t.genre} (${t.intensity})`}
            >
              <span
                className={`${styles.genreTransitionStripIcon}${t.genre === "Rock" ? ` ${styles.genreTransitionStripIconRock}` : ""}${t.genre === "Classical" ? ` ${styles.genreTransitionStripIconClassical}` : ""}${t.genre === "Hip-Hop" ? ` ${styles.genreTransitionStripIconHipHop}` : ""}${t.genre === "Electronic" ? ` ${styles.genreTransitionStripIconElectronic}` : ""}`}
                style={
                  iconSize ? { width: iconSize, height: iconSize } : undefined
                }
                dangerouslySetInnerHTML={{ __html: t.icon }}
              />
            </div>
            <div
              className={styles.trackTransitionStripInNotch}
              style={{ top: genreInStripTop(i), bottom: "auto" }}
            />
          </React.Fragment>
        );
      })}
      {genreTransitionsOut.map((t, i) => {
        const light = isVeryLight(t.themeColor);
        const iconSize = light && t.genre === "Rock" ? 15 : undefined;
        const shiftLeftForLowerIntensity =
          currentIntensity != null &&
          intensityRank[t.intensity] < intensityRank[currentIntensity];
        return (
          <div
            key={`genre-out-${i}-${t.genre}-${t.intensity}`}
            className={styles.genreTransitionStripOut}
            style={{
              background: t.themeColor,
              right: shiftLeftForLowerIntensity ? -7 : -14,
              width: shiftLeftForLowerIntensity ? 25 : 32,
              top: genreOutStripTop(i),
              bottom: "auto",
              color: light ? "#1a0f05" : "rgba(255,255,255,0.96)",
            }}
            title={`${t.genre} (${t.intensity})`}
          >
            <span
              className={`${styles.genreTransitionStripIcon}${t.genre === "Rock" ? ` ${styles.genreTransitionStripIconRock}` : ""}${t.genre === "Classical" ? ` ${styles.genreTransitionStripIconClassical}` : ""}${t.genre === "Hip-Hop" ? ` ${styles.genreTransitionStripIconHipHop}` : ""}${t.genre === "Electronic" ? ` ${styles.genreTransitionStripIconElectronic}` : ""}`}
              style={
                iconSize ? { width: iconSize, height: iconSize } : undefined
              }
              dangerouslySetInnerHTML={{ __html: t.icon }}
            />
          </div>
        );
      })}
    </>
  );

  const staticClass = hoverLift ? "" : ` ${styles.cardStatic}`;
  const frameStaticClass = hoverLift ? "" : ` ${styles.cardFrameStatic}`;
  const renderInnerCard = () =>
    card.artworkOverBorder ? (
      <div
        data-card-ui
        className={`${styles.card} ${styles.cardNoBorder}${staticClass}`}
        style={varStyle}
      >
        {cardContent}
      </div>
    ) : flagRotateR90 ? (
      <div data-card-ui className={`${styles.cardShell}${staticClass}`}>
        <div
          className={styles.cardFlagUsR90}
          aria-hidden
          style={
            {
              backgroundImage:
                flagStyle === "fade"
                  ? `linear-gradient(${"transparent"}, ${"transparent"}), linear-gradient(to bottom, transparent 46%, ${resolvedFadeColor} 54%), ${flagBg}`
                  : `linear-gradient(${"transparent"}, ${"transparent"}), ${flagBg}`,
              backgroundSize:
                flagStyle === "fade"
                  ? "100% 100%, 100% 100%, 100% 100%"
                  : "100% 100%, 100% 100%",
              backgroundPosition:
                flagStyle === "fade"
                  ? `0% 0%, 0% 0%, ${worldFrameBackgroundPosition}`
                  : `0% 0%, ${worldFrameBackgroundPosition}`,
              backgroundRepeat: "no-repeat",
              backgroundClip:
                flagStyle === "fade"
                  ? "padding-box, border-box, border-box"
                  : "padding-box, border-box",
              backgroundOrigin:
                flagStyle === "fade"
                  ? "padding-box, border-box, border-box"
                  : "padding-box, border-box",
              border: "10px solid transparent",
              filter: worldFrameFilter,
              opacity: worldFrameOpacity,
            } as React.CSSProperties
          }
        />
        <div className={styles.cardFlagFace} style={varStyle}>
          {cardContent}
        </div>
      </div>
    ) : flagFlatShell ? (
      <div data-card-ui className={`${styles.cardShell}${staticClass}`}>
        <div
          className={styles.cardFlagFlat}
          aria-hidden
          style={
            {
              backgroundImage:
                flagStyle === "fade"
                  ? `linear-gradient(${"transparent"}, ${"transparent"}), linear-gradient(to right, transparent 42%, ${resolvedFadeColor} 58%), ${flagLayer}`
                  : `linear-gradient(${"transparent"}, ${"transparent"}), ${flagLayer}`,
              backgroundClip:
                flagStyle === "fade"
                  ? "padding-box, border-box, border-box"
                  : "padding-box, border-box",
              backgroundOrigin:
                flagStyle === "fade"
                  ? "padding-box, border-box, border-box"
                  : "padding-box, border-box",
              backgroundSize:
                flagStyle === "fade"
                  ? `100% 100%, 100% 100%, ${flatShellFrameBorderSize}`
                  : `100% 100%, ${flatShellFrameBorderSize}`,
              backgroundRepeat: "no-repeat",
              backgroundPosition:
                flagStyle === "fade"
                  ? `0% 0%, 0% 0%, ${worldFrameBackgroundPosition}`
                  : `0% 0%, ${worldFrameBackgroundPosition}`,
              border: "10px solid transparent",
              filter: worldFrameFilter,
              opacity: worldFrameOpacity,
            } as React.CSSProperties
          }
        />
        <div className={styles.cardFlagFace} style={varStyle}>
          {cardContent}
        </div>
      </div>
    ) : flagStyle === "fade" && flagBg ? (
      <div
        ref={cardFrameRef}
        className={`${styles.cardFrame}${frameStaticClass}`}
      >
        <div
          data-card-ui
          className={`${styles.card}${staticClass}`}
          style={{
            ...varStyle,
            border: "10px solid transparent",
            backgroundImage: `linear-gradient(${"transparent"}, ${"transparent"}), linear-gradient(to right, transparent 42%, ${resolvedFadeColor} 58%), ${flagBg}`,
            backgroundClip: "padding-box, border-box, border-box",
            backgroundOrigin: "padding-box, border-box, border-box",
            backgroundSize: `100% 100%, 100% 100%, ${flatShellFrameBgSize}`,
            backgroundPosition: `0% 0%, 0% 0%, ${worldFrameBackgroundPosition}`,
          }}
        >
          {cardContent}
        </div>
        {cardStrips}
      </div>
    ) : (
      <div
        ref={cardFrameRef}
        className={`${styles.cardFrame}${frameStaticClass}`}
      >
        <div
          data-card-ui
          className={`${styles.card}${staticClass}`}
          style={varStyle}
        >
          {cardContent}
        </div>
        {cardStrips}
      </div>
    );

  const onCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsZoomed(true);
    } else if (e.key === "Escape") {
      setIsZoomed(false);
    }
  };

  useEffect(() => {
    if (!isZoomed) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsZoomed(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isZoomed]);

  const baseCard = small ? (
    <div data-card-ui className={styles.wrapSm}>
      <div className={styles.cardSm}>{renderInnerCard()}</div>
    </div>
  ) : (
    renderInnerCard()
  );

  if (!enableZoom) {
    return <>{baseCard}</>;
  }

  return (
    <>
      <div
        className={styles.zoomTrigger}
        role="button"
        tabIndex={0}
        aria-label={`Zoom card ${card.title}`}
        onClick={() => setIsZoomed(true)}
        onKeyDown={onCardKeyDown}
      >
        {baseCard}
      </div>
      {isZoomed
        ? createPortal(
            <div
              className={styles.zoomOverlay}
              role="dialog"
              aria-modal="true"
              aria-label={`Zoomed card ${card.title}`}
              onClick={() => setIsZoomed(false)}
              onKeyDown={onCardKeyDown}
            >
              <div
                className={styles.zoomCard}
                onClick={(e) => e.stopPropagation()}
              >
                {renderInnerCard()}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
