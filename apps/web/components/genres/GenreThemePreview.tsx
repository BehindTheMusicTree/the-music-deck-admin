"use client";

import { useEffect, useRef, useState } from "react";
import { FLAG_BORDERS, FLAG_BG } from "@/lib/countries";
import {
  appGenreIntensity,
  GENRE_NAMES,
  GENRE_THEMES,
  GENRE_THEME_NAV_EVENT,
  genreThemeSectionDomId,
  genreIntensityColor,
  intensityLevelIndex,
  SUBGENRES,
  SUBGENRE_COLOR,
  WORLD_THEMES,
  isCountrySubgenre,
  resolveThemeSelection,
  subgenreTheme,
} from "@/lib/genres";
import type { GenreName, GenreThemeNavigateDetail } from "@/lib/genres";
import Card, { type CardData } from "@/components/cards/Card";
import type { GenreTheme } from "@/lib/card-theme-types";
import IntensityGauge from "./IntensityGauge";
import { DEFAULT_PREVIEW_CARD } from "@/lib/cards";
import type { Intensity } from "@/lib/genres";

function isVeryLight(hex: string) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance > 205;
}

function subgenresForGenreSection(name: string) {
  return SUBGENRES.filter((s) => s.parentA === name || s.parentB === name).sort(
    (a, b) => {
      const d =
        intensityLevelIndex(a.intensity) - intensityLevelIndex(b.intensity);
      if (d !== 0) return d;
      return a.n.localeCompare(b.n);
    },
  );
}

function formatIntensityLabel(intensity: Intensity): string {
  return intensity.charAt(0).toUpperCase() + intensity.slice(1);
}

/**
 * Rectangular flag swatch for World Themes table UI only — not used on {@link Card} (cards
 * always use the diamond .pipFlag for country identity on the Genre strip).
 */
function CountryFlagSwatch({
  country,
  size,
}: {
  country: string;
  size: "row" | "panel";
}) {
  const flagBg = FLAG_BG[country] ?? FLAG_BORDERS[country];
  if (!flagBg) return null;
  const isImage = /^url\(/.test(flagBg.trim());
  const bgPos = WORLD_THEMES[country]?.frameBackgroundPosition ?? "center";
  const ow = size === "row" ? 48 : 200;
  const oh = size === "row" ? 28 : 112;
  return (
    <div
      className="shrink-0 rounded-[5px] border border-black/15 shadow-sm"
      style={{
        width: ow,
        height: oh,
        backgroundImage: flagBg,
        backgroundSize: isImage ? "cover" : "100% 100%",
        backgroundPosition: bgPos,
        backgroundRepeat: "no-repeat",
      }}
      aria-hidden
    />
  );
}

function TypePipMarker({
  theme,
  fallbackColor,
}: {
  theme: GenreTheme;
  fallbackColor: string;
}) {
  const symbol = theme.typePip?.symbol;
  if (symbol) {
    const size = Math.min(symbol.size ?? 10, 12);
    if (symbol.svg) {
      return (
        <span
          className="shrink-0"
          style={{ color: symbol.color, fontSize: size }}
          dangerouslySetInnerHTML={{ __html: symbol.svg }}
        />
      );
    }
    return (
      <span
        className="shrink-0 leading-none"
        style={{ color: symbol.color, fontSize: size }}
      >
        {symbol.sym}
      </span>
    );
  }
  if (theme.typePip?.flagBg) {
    return (
      <div
        className="w-3 h-3 shrink-0 rounded-[1px] border border-black/20"
        style={{
          backgroundImage: theme.typePip.flagBg,
          backgroundSize: "100% 100%",
          backgroundPosition: theme.frameBackgroundPosition ?? "center",
          backgroundRepeat: "no-repeat",
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        }}
      />
    );
  }
  return (
    <div
      className="w-3 h-3 shrink-0 rotate-45 rounded-[1px] border border-black/20"
      style={{ background: fallbackColor }}
    />
  );
}

export default function GenreThemePreview() {
  const [card, setCard] = useState<CardData>({ ...DEFAULT_PREVIEW_CARD });
  const [theme, setTheme] = useState<GenreTheme>(GENRE_THEMES.Mainstream);
  const [selectedGenreLabel, setSelectedGenreLabel] =
    useState<string>("Mainstream");
  const [selectedRightLabel, setSelectedRightLabel] =
    useState<string>("Disco Pop");
  const [selectedGenreOnly, setSelectedGenreOnly] = useState<
    GenreName | undefined
  >("Mainstream");
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(
    undefined,
  );
  const [selectedSubgenre, setSelectedSubgenre] = useState<string | undefined>(
    undefined,
  );

  const orderedGenres: GenreName[] = [
    "Mainstream",
    ...GENRE_NAMES.filter((name) => name !== "Mainstream"),
  ];
  /** `genre` is a canonical subgenre name or an app-level genre (e.g. World+genre). */
  const applyRulePreview = ({
    genre,
    country,
  }: {
    genre: string;
    country?: string;
  }) => {
    const resolved = resolveThemeSelection({ genre, country });
    setTheme(resolved.theme);
    setSelectedGenreLabel(resolved.leftLabel);
    setSelectedRightLabel(resolved.rightLabel);
    setCard({
      ...DEFAULT_PREVIEW_CARD,
      country: resolved.resolvedCountry,
      genre,
    });
  };

  const applyRulePreviewRef = useRef(applyRulePreview);
  useEffect(() => {
    applyRulePreviewRef.current = applyRulePreview;
  });

  useEffect(() => {
    const onWheelNavigate = (e: Event) => {
      const detail = (e as CustomEvent<GenreThemeNavigateDetail>).detail;
      if (!detail) return;
      const apply = applyRulePreviewRef.current;
      if (detail.kind === "genre") {
        const name = detail.genre;
        const subs = subgenresForGenreSection(name);
        setSelectedCountry(undefined);
        setSelectedGenreOnly(name);
        const firstSubgenre = subs[0]?.n;
        if (!firstSubgenre) {
          setSelectedSubgenre(undefined);
          apply({ genre: name });
          return;
        }
        setSelectedSubgenre(firstSubgenre);
        apply({ genre: firstSubgenre });
        return;
      }
      const sub = SUBGENRES.find((s) => s.n === detail.subgenre);
      if (!sub) return;
      setSelectedCountry(undefined);
      setSelectedGenreOnly(undefined);
      setSelectedSubgenre(sub.n);
      apply({ genre: sub.n });
    };
    window.addEventListener(GENRE_THEME_NAV_EVENT, onWheelNavigate);
    return () =>
      window.removeEventListener(GENRE_THEME_NAV_EVENT, onWheelNavigate);
  }, []);

  return (
    <div className="w-full overflow-x-auto md:overflow-visible pb-2">
      <div className="flex gap-8 items-start min-w-[980px] md:min-w-0">
        {/* Sticky card preview */}
        <div className="shrink-0 flex flex-col items-center gap-2 self-start md:sticky md:top-[104px]">
          <div className="sm:hidden">
            <Card card={card} theme={theme} small />
          </div>
          <div className="hidden sm:block">
            <Card card={card} theme={theme} />
          </div>
          <div className="font-mono text-[10px] tracking-[1px] text-muted">
            {`${selectedGenreLabel} · ${selectedRightLabel}`}
          </div>
        </div>

        {/* Genre themes table */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {orderedGenres.map((name) => {
            const t = GENRE_THEMES[name];
            const subs = subgenresForGenreSection(name);

            return (
              <div
                key={name}
                id={genreThemeSectionDomId(name)}
                className="border border-ui-border rounded-[6px] overflow-hidden scroll-mt-28"
              >
                {/* Genre header — clickable */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-opacity hover:opacity-80"
                  style={{
                    borderLeft: `4px solid ${t.border}`,
                    background: "#ede4cc",
                  }}
                  onClick={() => {
                    const inThisGenre =
                      selectedGenreOnly === name ||
                      Boolean(
                        selectedSubgenre &&
                        subs.some((x) => x.n === selectedSubgenre),
                      );
                    if (selectedCountry && inThisGenre) {
                      setSelectedCountry(undefined);
                      setSelectedGenreOnly(name);
                      const sg =
                        selectedSubgenre &&
                        subs.some((x) => x.n === selectedSubgenre)
                          ? selectedSubgenre
                          : subs[0]?.n;
                      if (!sg) return;
                      setSelectedSubgenre(sg);
                      applyRulePreview({ genre: sg });
                      return;
                    }
                    setSelectedGenreOnly(name);
                    setSelectedCountry(undefined);
                    const firstSubgenre = subs[0]?.n;
                    if (!firstSubgenre) return;
                    setSelectedSubgenre(firstSubgenre);
                    applyRulePreview({ genre: firstSubgenre });
                  }}
                >
                  <span
                    className="shrink-0"
                    dangerouslySetInnerHTML={{
                      __html: t.icon.replace(/currentColor/g, t.border),
                    }}
                  />
                  <span
                    className="font-cinzel text-sm tracking-[2px]"
                    style={{ color: "#2e2010" }}
                  >
                    {name === "Mainstream" ? "Pop" : name}
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    {(
                      [
                        ["border", t.border],
                        ["header", t.headerBg],
                        ["text", t.textMain],
                        ["muted", t.textBody],
                      ] as [string, string][]
                    ).map(([lbl, val]) => (
                      <div
                        key={lbl}
                        className="flex items-center gap-1"
                        title={`${lbl}: ${val}`}
                      >
                        <div
                          className="w-3 h-3 rounded-[2px] border border-black/10 shrink-0"
                          style={{ background: val }}
                        />
                        <span
                          className="font-mono text-[10px] hidden lg:inline"
                          style={{ color: "#8a7050" }}
                        >
                          {val}
                        </span>
                      </div>
                    ))}
                    <div
                      className="w-14 h-3 rounded-[2px] shrink-0"
                      style={{
                        background: `linear-gradient(to right, ${t.barPop[0]}, ${t.barPop[1]})`,
                      }}
                      title="barPop"
                    />
                    <div
                      className="w-14 h-3 rounded-[2px] shrink-0"
                      style={{
                        background: `linear-gradient(to right, ${t.barExp[0]}, ${t.barExp[1]})`,
                      }}
                      title="barExp"
                    />
                  </div>
                  <div className="w-[118px] shrink-0">
                    <IntensityGauge small intensity={appGenreIntensity(name)} />
                  </div>
                </button>

                {/* Subgenre rows — clickable */}
                {subs.length > 0 && (
                  <div className="divide-y divide-[#d8cca8] border-t border-[#d8cca8]">
                    {(
                      ["POP", "SOFT", "EXPERIMENTAL", "HARDCORE"] as Intensity[]
                    ).map((intensity) => {
                      const group = subs.filter(
                        (s) => s.intensity === intensity,
                      );
                      if (group.length === 0) return null;
                      const baseGroupColor =
                        name === "Mainstream"
                          ? GENRE_THEMES.Mainstream.border
                          : genreIntensityColor(name, intensity);
                      const groupTheme = subgenreTheme(baseGroupColor, t);
                      return (
                        <div key={intensity}>
                          <div
                            className="px-9 py-1.5 flex items-center gap-3 border-b border-[#d8cca8]"
                            style={{ color: "#7a6444", background: "#eee2c8" }}
                          >
                            <span className="font-mono text-[10px] tracking-[0.14em] uppercase">
                              {formatIntensityLabel(intensity)}
                            </span>
                            <div
                              className="w-3 h-3 shrink-0 rotate-45 rounded-[1px] box-border"
                              style={{
                                background: baseGroupColor,
                                border: isVeryLight(baseGroupColor)
                                  ? "1px solid rgba(20, 16, 10, 0.45)"
                                  : "none",
                              }}
                            />
                            <span
                              className="font-mono text-xs"
                              style={{ color: "#8a7050" }}
                            >
                              {baseGroupColor}
                            </span>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              {[
                                groupTheme.headerBg,
                                groupTheme.textMain,
                                groupTheme.textBody,
                              ].map((c, i) => (
                                <div
                                  key={i}
                                  className="w-3 h-3 rounded-[2px] border border-black/10"
                                  style={{ background: c }}
                                />
                              ))}
                              <div
                                className="w-10 h-3 rounded-[2px]"
                                style={{
                                  background: `linear-gradient(to right, ${groupTheme.barPop[0]}, ${groupTheme.barPop[1]})`,
                                }}
                              />
                            </div>
                            <div className="w-[112px] ml-auto shrink-0">
                              <IntensityGauge small intensity={intensity} />
                            </div>
                          </div>
                          {group.map((s) => {
                            const resolvedSubColor = SUBGENRE_COLOR[s.n];
                            const hasInfluence =
                              resolvedSubColor !== baseGroupColor;
                            const effectiveColor = hasInfluence
                              ? resolvedSubColor
                              : baseGroupColor;
                            const influenceLabel = s.influence
                              ? `${s.influence.genre} ${formatIntensityLabel(
                                  s.influence.intensity,
                                )} (33%)`
                              : "—";
                            const parentLabel = s.parentB
                              ? `${s.parentA} + ${s.parentB}`
                              : s.parentA;
                            return (
                              <button
                                key={s.n}
                                className="w-full flex items-center gap-3 pl-9 pr-4 py-2 text-left transition-opacity hover:opacity-80"
                                style={{ background: "#f4edd8" }}
                                onClick={() => {
                                  if (
                                    selectedSubgenre === s.n &&
                                    selectedCountry &&
                                    !isCountrySubgenre(s.n)
                                  ) {
                                    setSelectedCountry(undefined);
                                    setSelectedGenreOnly(undefined);
                                    setSelectedSubgenre(s.n);
                                    applyRulePreview({ genre: s.n });
                                    return;
                                  }
                                  setSelectedGenreOnly(undefined);
                                  setSelectedSubgenre(s.n);
                                  applyRulePreview({
                                    genre: s.n,
                                    country: selectedCountry,
                                  });
                                }}
                              >
                                <div
                                  className="w-3 h-3 shrink-0 rotate-45 rounded-[1px] box-border"
                                  style={{
                                    background: effectiveColor,
                                    border: isVeryLight(effectiveColor)
                                      ? "1px solid rgba(20, 16, 10, 0.45)"
                                      : "none",
                                  }}
                                />
                                <span
                                  className="font-garamond text-sm flex-1"
                                  style={{ color: "#5a4a30" }}
                                >
                                  {s.n}
                                </span>
                                <span
                                  className="font-mono text-[10px] tracking-wide uppercase"
                                  style={{ color: "#8a7050" }}
                                >
                                  {parentLabel}
                                </span>
                                <span
                                  className="font-mono text-xs"
                                  style={{ color: "#8a7050" }}
                                >
                                  {hasInfluence ? effectiveColor : "—"}
                                </span>
                                <span
                                  className="w-44 shrink-0 font-mono text-[10px] tracking-wide uppercase truncate"
                                  style={{ color: "#8a7050" }}
                                  title={influenceLabel}
                                >
                                  {influenceLabel}
                                </span>
                                <div className="w-[112px] shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="section-title-sub mt-2 mb-1">World Themes</div>
          {Object.entries(WORLD_THEMES)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([country, t]) => {
              const countrySubs = SUBGENRES.filter(
                (s) => s.kind === "country" && s.parentA === country,
              ).sort((a, b) => {
                const d =
                  intensityLevelIndex(a.intensity) -
                  intensityLevelIndex(b.intensity);
                if (d !== 0) return d;
                return a.n.localeCompare(b.n);
              });
              return (
                <div
                  key={country}
                  className="border border-ui-border rounded-[6px] overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full flex items-center gap-4 px-4 py-2.5 text-left transition-opacity hover:opacity-80"
                    style={{
                      borderLeft: `4px solid ${t.border}`,
                      background: "#ede4cc",
                    }}
                    aria-label={`${country} theme`}
                    title={country}
                    onClick={() => {
                      const firstSub = countrySubs[0]?.n;
                      setSelectedCountry(country);
                      setSelectedGenreOnly(undefined);
                      if (firstSub) {
                        setSelectedSubgenre(firstSub);
                        applyRulePreview({ genre: firstSub, country });
                        return;
                      }
                      // Countries in `COUNTRY_DATA` with no `kind: "country"` subgenres
                      // (e.g. Netherlands, Germany): use explicit country-only selection.
                      setSelectedSubgenre(undefined);
                      applyRulePreview({ genre: country, country });
                    }}
                  >
                    <span
                      className="shrink-0"
                      dangerouslySetInnerHTML={{
                        __html: t.icon.replace(/currentColor/g, t.border),
                      }}
                    />
                    <CountryFlagSwatch country={country} size="row" />
                    <span
                      className="font-cinzel text-sm tracking-[2px] ml-1"
                      style={{ color: "#2e2010" }}
                    >
                      {country}
                    </span>
                  </button>

                  {countrySubs.length > 0 && (
                    <div className="divide-y divide-[#d8cca8] border-t border-[#d8cca8]">
                      {countrySubs.map((s) => (
                        <button
                          key={s.n}
                          type="button"
                          className="w-full flex items-center gap-3 pl-9 pr-4 py-2 text-left transition-opacity hover:opacity-80"
                          style={{ background: "#f4edd8" }}
                          onClick={() => {
                            setSelectedCountry(country);
                            setSelectedGenreOnly(undefined);
                            setSelectedSubgenre(s.n);
                            applyRulePreview({ genre: s.n, country });
                          }}
                        >
                          <TypePipMarker theme={t} fallbackColor={t.border} />
                          <span
                            className="font-garamond text-sm flex-1"
                            style={{ color: "#5a4a30" }}
                          >
                            {s.n}
                          </span>
                          <span
                            className="font-mono text-[10px] tracking-wide uppercase"
                            style={{ color: "#8a7050" }}
                          >
                            {country}
                          </span>
                          <span
                            className="font-mono text-xs"
                            style={{ color: "#8a7050" }}
                          >
                            {t.border}
                          </span>
                          <div className="w-[112px] shrink-0">
                            <IntensityGauge small intensity={s.intensity} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
