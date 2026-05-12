"use client";

import { useEffect, useMemo, useState } from "react";
import CatalogCard from "@/components/catalog/CatalogCard";
import {
  CARD_RARITY_ORDER,
  deriveSongsInFromSongIndex,
  formatCatalogIntensity,
  WISHLIST_KINDS,
} from "@/lib/cards";
import type { CardSongIndex } from "@/lib/cards/song-graph";
import type { WishlistEntry } from "@/lib/cards/wishlist";
import type { Intensity } from "@/lib/genres";
import { intensityLevelIndex } from "@/lib/genres";

type WishlistSortKey =
  | "id"
  | "ordinal"
  | "title"
  | "artist"
  | "year"
  | "kind"
  | "country"
  | "lineGenre"
  | "appGenre"
  | "intensity"
  | "pop"
  | "rarity"
  | "artwork"
  | "artworkPrompt";

const thWrap =
  "align-top font-normal font-cinzel text-[10px] sm:text-[11px] tracking-[0.1em] text-gold/95 py-2 px-2";
const selectBase =
  "w-full max-w-[140px] mt-1 text-[10px] leading-tight bg-[#12121a] border border-ui-border rounded px-1 py-1 text-white/90";
const sortBtnBase =
  "shrink-0 inline-flex items-center justify-center min-w-[22px] h-[22px] rounded border border-ui-border bg-[#1a1a22] text-[10px] text-muted hover:text-gold hover:border-gold/40 transition-colors";
const sortBtnActive = "border-gold/50 text-gold";

const INTENSITY_VALUES: readonly Intensity[] = [
  "POP",
  "SOFT",
  "EXPERIMENTAL",
  "HARDCORE",
];

const ARTWORK_PROMPT_PREVIEW_WORDS = 7;

function artworkBasename(artworkUrl: string | undefined): string {
  if (!artworkUrl) return "";
  const parts = artworkUrl.split("/");
  return parts[parts.length - 1] ?? artworkUrl;
}

function artworkPromptPreview(full: string): {
  preview: string;
  hasMore: boolean;
} {
  const trimmed = full.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= ARTWORK_PROMPT_PREVIEW_WORDS) {
    return { preview: trimmed, hasMore: false };
  }
  return {
    preview: `${words.slice(0, ARTWORK_PROMPT_PREVIEW_WORDS).join(" ")}…`,
    hasMore: true,
  };
}

function trackRefsLabel(
  ids: number[] | undefined,
  byId: CardSongIndex,
): string {
  if (!ids || ids.length === 0) return "—";
  return ids
    .map((id) => {
      const t = byId[id];
      if (!t) return String(id);
      const artist = t.artist?.trim();
      return `${id} · ${t.title}${artist ? ` — ${artist}` : ""}`;
    })
    .join(" | ");
}

function compareWishlistRows(
  a: WishlistEntry,
  b: WishlistEntry,
  key: WishlistSortKey,
  asc: boolean,
): number {
  const dir = asc ? 1 : -1;
  const cmp = (x: number, y: number) => (x < y ? -1 : x > y ? 1 : 0) * dir;
  switch (key) {
    case "id":
      return cmp(a.card.id, b.card.id);
    case "ordinal":
      return cmp(a.ordinal, b.ordinal);
    case "year":
      return (
        String(a.card.year).localeCompare(String(b.card.year), undefined, {
          numeric: true,
        }) * dir
      );
    case "pop":
      return cmp(a.card.pop, b.card.pop);
    case "title":
      return (
        a.card.title.localeCompare(b.card.title, undefined, {
          sensitivity: "base",
        }) * dir
      );
    case "artist":
      return (
        (a.card.artist ?? "").localeCompare(b.card.artist ?? "", undefined, {
          sensitivity: "base",
        }) * dir
      );
    case "kind":
      return a.kind.localeCompare(b.kind) * dir;
    case "country":
      return (
        (a.card.country ?? "").localeCompare(b.card.country ?? "", undefined, {
          sensitivity: "base",
        }) * dir
      );
    case "lineGenre":
      return (
        (a.card.genre ?? "").localeCompare(b.card.genre ?? "", undefined, {
          sensitivity: "base",
        }) * dir
      );
    case "appGenre":
      return (
        a.appGenreLabel.localeCompare(b.appGenreLabel, undefined, {
          sensitivity: "base",
        }) * dir
      );
    case "intensity":
      return cmp(
        intensityLevelIndex(a.intensity),
        intensityLevelIndex(b.intensity),
      );
    case "rarity": {
      const ia = CARD_RARITY_ORDER.indexOf(a.card.rarity);
      const ib = CARD_RARITY_ORDER.indexOf(b.card.rarity);
      return cmp(ia === -1 ? 99 : ia, ib === -1 ? 99 : ib);
    }
    case "artwork": {
      const ha = a.card.artwork ? 1 : 0;
      const hb = b.card.artwork ? 1 : 0;
      if (ha !== hb) return cmp(ha, hb);
      return (
        artworkBasename(a.card.artwork).localeCompare(
          artworkBasename(b.card.artwork),
          undefined,
          { sensitivity: "base" },
        ) * dir
      );
    }
    case "artworkPrompt": {
      const pa = a.card.artworkPrompt ? 1 : 0;
      const pb = b.card.artworkPrompt ? 1 : 0;
      if (pa !== pb) return cmp(pa, pb);
      return (
        (a.card.artworkPrompt ?? "").localeCompare(
          b.card.artworkPrompt ?? "",
          undefined,
          { sensitivity: "base" },
        ) * dir
      );
    }
    default:
      return 0;
  }
}

function SortToggle({
  label,
  sortKey,
  activeKey,
  asc,
  onActivate,
}: {
  label: string;
  sortKey: WishlistSortKey;
  activeKey: WishlistSortKey;
  asc: boolean;
  onActivate: (key: WishlistSortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <div className="flex items-start justify-between gap-1">
      <span className="leading-snug pt-0.5">{label}</span>
      <button
        type="button"
        className={[sortBtnBase, active ? sortBtnActive : ""].join(" ")}
        aria-label={
          active
            ? `${label}: sorted ${asc ? "ascending" : "descending"}, click to reverse`
            : `Sort by ${label}`
        }
        aria-pressed={active}
        onClick={() => onActivate(sortKey)}
      >
        {active ? (asc ? "▲" : "▼") : "⇅"}
      </button>
    </div>
  );
}

const CATALOG_DETAIL_CARD_SCALE = 2;
const CATALOG_CARD_NATIVE_W = 272;
const CATALOG_CARD_NATIVE_H = 400;
const CATALOG_DETAIL_CARD_BOX_W =
  CATALOG_CARD_NATIVE_W * CATALOG_DETAIL_CARD_SCALE;
const CATALOG_DETAIL_CARD_BOX_H =
  CATALOG_CARD_NATIVE_H * CATALOG_DETAIL_CARD_SCALE;

export default function WishlistDeckTable({
  className = "",
  wishlistEntries,
  cardSongIndex,
}: {
  className?: string;
  wishlistEntries: WishlistEntry[];
  cardSongIndex: CardSongIndex;
}) {
  const [filterKind, setFilterKind] = useState<string>("all");
  const [filterRootGenre, setFilterRootGenre] = useState<string>("all");
  const [filterLineGenre, setFilterLineGenre] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterRarity, setFilterRarity] = useState<string>("all");
  const [filterIntensity, setFilterIntensity] = useState<string>("all");
  const [titleQuery, setTitleQuery] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [abilityQuery, setAbilityQuery] = useState("");
  const [sortKey, setSortKey] = useState<WishlistSortKey>("id");
  const [sortAsc, setSortAsc] = useState(true);
  const [artworkPromptModal, setArtworkPromptModal] = useState<string | null>(
    null,
  );
  const [detailEntry, setDetailEntry] = useState<WishlistEntry | null>(null);

  useEffect(() => {
    if (artworkPromptModal === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArtworkPromptModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [artworkPromptModal]);

  useEffect(() => {
    if (detailEntry === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailEntry(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailEntry]);

  const onActivateSort = (key: WishlistSortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const clearAllFilters = () => {
    setFilterKind("all");
    setFilterRootGenre("all");
    setFilterLineGenre("all");
    setFilterCountry("all");
    setFilterRarity("all");
    setFilterIntensity("all");
    setTitleQuery("");
    setArtistQuery("");
    setAbilityQuery("");
    setSortKey("id");
    setSortAsc(true);
  };

  const appGenreFilterOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of wishlistEntries) s.add(e.appGenreLabel);
    return [...s].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, []);

  const lineGenreFilterOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of wishlistEntries) {
      s.add(e.card.genre ?? "__empty__");
    }
    return [...s].sort((a, b) => {
      if (a === "__empty__") return -1;
      if (b === "__empty__") return 1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  }, []);

  const countryFilterOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of wishlistEntries) {
      s.add(e.card.country ?? "__empty__");
    }
    return [...s].sort((a, b) => {
      if (a === "__empty__") return 1;
      if (b === "__empty__") return -1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  }, []);

  const visibleRows = useMemo(() => {
    let rows = wishlistEntries;
    if (filterKind !== "all") rows = rows.filter((r) => r.kind === filterKind);
    if (filterRootGenre !== "all") {
      rows = rows.filter((r) => r.appGenreLabel === filterRootGenre);
    }
    if (filterLineGenre !== "all") {
      rows = rows.filter((r) =>
        filterLineGenre === "__empty__"
          ? !r.card.genre
          : r.card.genre === filterLineGenre,
      );
    }
    if (filterCountry !== "all") {
      rows = rows.filter((r) =>
        filterCountry === "__empty__"
          ? !r.card.country
          : r.card.country === filterCountry,
      );
    }
    if (filterRarity !== "all") {
      rows = rows.filter((r) => r.card.rarity === filterRarity);
    }
    if (filterIntensity !== "all") {
      rows = rows.filter((r) => r.intensity === filterIntensity);
    }
    const tq = titleQuery.trim().toLowerCase();
    if (tq) {
      rows = rows.filter((r) => r.card.title.toLowerCase().includes(tq));
    }
    const aq = artistQuery.trim().toLowerCase();
    if (aq) {
      rows = rows.filter((r) =>
        (r.card.artist ?? "").toLowerCase().includes(aq),
      );
    }
    const ab = abilityQuery.trim().toLowerCase();
    if (ab) {
      rows = rows.filter(
        (r) =>
          r.card.ability.toLowerCase().includes(ab) ||
          r.card.abilityDesc.toLowerCase().includes(ab),
      );
    }
    return [...rows].sort((a, b) =>
      compareWishlistRows(a, b, sortKey, sortAsc),
    );
  }, [
    filterKind,
    filterRootGenre,
    filterLineGenre,
    filterCountry,
    filterRarity,
    filterIntensity,
    titleQuery,
    artistQuery,
    abilityQuery,
    sortKey,
    sortAsc,
  ]);

  return (
    <div className={["w-full min-w-0", className].filter(Boolean).join(" ")}>
      <p className="font-garamond text-muted text-[14px] leading-relaxed mb-4 max-w-[720px]">
        Wishlist songs without bundled deck artwork. They are excluded from
        shipped catalogue numbering and from the deck transition graph until
        they ship.
      </p>
      <div className="flex flex-wrap items-center justify-end gap-3 mb-3 min-w-0">
        <span className="font-mono text-[11px] text-muted tabular-nums shrink-0">
          {visibleRows.length} row{visibleRows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="w-full min-w-0 rounded-[6px] border border-ui-border bg-[#0f0f14]/35 overflow-x-auto">
        <table className="w-full min-w-[1280px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ui-border">
              <th className={`${thWrap} w-[120px] pl-3`}>
                <div className="flex flex-col gap-1.5">
                  <span className="leading-snug">Preview</span>
                  <button
                    type="button"
                    className="text-[9px] font-mono tracking-wide text-muted hover:text-gold underline-offset-2 hover:underline text-left"
                    onClick={clearAllFilters}
                  >
                    Reset filters and sort
                  </button>
                </div>
              </th>
              <th className={`${thWrap} min-w-[104px]`}>
                <div className="flex flex-col gap-1">
                  <SortToggle
                    label="Country / region"
                    sortKey="country"
                    activeKey={sortKey}
                    asc={sortAsc}
                    onActivate={onActivateSort}
                  />
                  <select
                    className={selectBase}
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    aria-label="Filter by country or region"
                  >
                    <option value="all">All countries</option>
                    {countryFilterOptions.map((c) => (
                      <option key={c} value={c}>
                        {c === "__empty__" ? "— (none)" : c}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th className={`${thWrap} min-w-[96px]`}>
                <div className="flex flex-col gap-1">
                  <SortToggle
                    label="App genre"
                    sortKey="appGenre"
                    activeKey={sortKey}
                    asc={sortAsc}
                    onActivate={onActivateSort}
                  />
                  <select
                    className={selectBase}
                    value={filterRootGenre}
                    onChange={(e) => setFilterRootGenre(e.target.value)}
                    aria-label="Filter by app genre"
                  >
                    <option value="all">All app genres</option>
                    {appGenreFilterOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th className={`${thWrap} min-w-[100px]`}>
                <div className="flex flex-col gap-1">
                  <SortToggle
                    label="Genre line"
                    sortKey="lineGenre"
                    activeKey={sortKey}
                    asc={sortAsc}
                    onActivate={onActivateSort}
                  />
                  <select
                    className={selectBase}
                    value={filterLineGenre}
                    onChange={(e) => setFilterLineGenre(e.target.value)}
                    aria-label="Filter by genre line"
                  >
                    <option value="all">All</option>
                    {lineGenreFilterOptions.map((sg) => (
                      <option key={sg} value={sg}>
                        {sg === "__empty__" ? "— (none)" : sg}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th className={`${thWrap} w-[52px]`}>
                <SortToggle
                  label="#"
                  sortKey="ordinal"
                  activeKey={sortKey}
                  asc={sortAsc}
                  onActivate={onActivateSort}
                />
              </th>
              <th className={`${thWrap} w-[56px]`}>
                <SortToggle
                  label="ID"
                  sortKey="id"
                  activeKey={sortKey}
                  asc={sortAsc}
                  onActivate={onActivateSort}
                />
              </th>
              <th className={`${thWrap} min-w-[88px]`}>
                <div className="flex flex-col gap-1">
                  <SortToggle
                    label="Type"
                    sortKey="kind"
                    activeKey={sortKey}
                    asc={sortAsc}
                    onActivate={onActivateSort}
                  />
                  <select
                    className={selectBase}
                    value={filterKind}
                    onChange={(e) => setFilterKind(e.target.value)}
                    aria-label="Filter by row type"
                  >
                    <option value="all">All types</option>
                    {WISHLIST_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th className={`${thWrap} min-w-[100px]`}>
                <SortToggle
                  label="Title"
                  sortKey="title"
                  activeKey={sortKey}
                  asc={sortAsc}
                  onActivate={onActivateSort}
                />
                <input
                  type="search"
                  placeholder="Contains…"
                  className={`${selectBase} mt-1 placeholder:text-muted/70`}
                  value={titleQuery}
                  onChange={(e) => setTitleQuery(e.target.value)}
                  aria-label="Filter by title"
                />
              </th>
              <th className={`${thWrap} min-w-[100px]`}>
                <SortToggle
                  label="Artist"
                  sortKey="artist"
                  activeKey={sortKey}
                  asc={sortAsc}
                  onActivate={onActivateSort}
                />
                <input
                  type="search"
                  placeholder="Contains…"
                  className={`${selectBase} mt-1 placeholder:text-muted/70`}
                  value={artistQuery}
                  onChange={(e) => setArtistQuery(e.target.value)}
                  aria-label="Filter artist name"
                />
              </th>
              <th className={`${thWrap} w-8`}>
                <span className="leading-snug">Wiki</span>
              </th>
              <th className={`${thWrap} w-[64px]`}>
                <SortToggle
                  label="Year"
                  sortKey="year"
                  activeKey={sortKey}
                  asc={sortAsc}
                  onActivate={onActivateSort}
                />
              </th>
              <th className={`${thWrap} min-w-[96px]`}>
                <div className="flex flex-col gap-1">
                  <SortToggle
                    label="Intensity"
                    sortKey="intensity"
                    activeKey={sortKey}
                    asc={sortAsc}
                    onActivate={onActivateSort}
                  />
                  <select
                    className={selectBase}
                    value={filterIntensity}
                    onChange={(e) => setFilterIntensity(e.target.value)}
                    aria-label="Filter by intensity"
                  >
                    <option value="all">All levels</option>
                    {INTENSITY_VALUES.map((v) => (
                      <option key={v} value={v}>
                        {formatCatalogIntensity(v)}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th className={`${thWrap} w-[56px]`}>
                <SortToggle
                  label="Pop"
                  sortKey="pop"
                  activeKey={sortKey}
                  asc={sortAsc}
                  onActivate={onActivateSort}
                />
              </th>
              <th className={`${thWrap} min-w-[88px]`}>
                <div className="flex flex-col gap-1">
                  <SortToggle
                    label="Rarity"
                    sortKey="rarity"
                    activeKey={sortKey}
                    asc={sortAsc}
                    onActivate={onActivateSort}
                  />
                  <select
                    className={selectBase}
                    value={filterRarity}
                    onChange={(e) => setFilterRarity(e.target.value)}
                    aria-label="Filter by rarity"
                  >
                    <option value="all">All rarities</option>
                    {CARD_RARITY_ORDER.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              <th className={`${thWrap} min-w-[120px]`}>
                <SortToggle
                  label="Artwork"
                  sortKey="artwork"
                  activeKey={sortKey}
                  asc={sortAsc}
                  onActivate={onActivateSort}
                />
              </th>
              <th className={`${thWrap} min-w-[160px]`}>
                <SortToggle
                  label="Artwork prompt"
                  sortKey="artworkPrompt"
                  activeKey={sortKey}
                  asc={sortAsc}
                  onActivate={onActivateSort}
                />
              </th>
              <th className={`${thWrap} min-w-[120px] pr-3`}>
                <span className="leading-snug">Ability</span>
                <input
                  type="search"
                  placeholder="Contains…"
                  className={`${selectBase} mt-1 max-w-none`}
                  value={abilityQuery}
                  onChange={(e) => setAbilityQuery(e.target.value)}
                  aria-label="Filter ability name or description"
                />
              </th>
            </tr>
          </thead>
          <tbody className="font-garamond text-[15px] text-white/95">
            {visibleRows.map((entry) => {
              const {
                rowKey,
                kind,
                card,
                theme,
                ordinal,
                appGenreLabel,
                intensity,
              } = entry;
              const prompt = card.artworkPrompt?.trim();
              const promptPrev = prompt ? artworkPromptPreview(prompt) : null;
              return (
                <tr
                  key={rowKey}
                  className="border-b border-ui-border/60 last:border-0 align-top cursor-pointer hover:bg-white/3 transition-colors"
                  tabIndex={0}
                  role="button"
                  aria-label={`Open wishlist details for ${card.title}`}
                  onClick={() => setDetailEntry(entry)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDetailEntry(entry);
                    }
                  }}
                >
                  <td className="py-2 pl-2 pr-1">
                    <div
                      className="mx-auto flex justify-center"
                      style={{
                        width: 102,
                        height: 150,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          transform: "scale(0.58)",
                          transformOrigin: "top center",
                        }}
                      >
                        <CatalogCard
                          card={card}
                          theme={theme}
                          small
                          enableZoom={false}
                          cardSongIndex={cardSongIndex}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-muted max-w-[120px] align-middle">
                    {card.country ?? "—"}
                  </td>
                  <td className="py-2.5 px-2 text-white/90 align-middle whitespace-nowrap">
                    {appGenreLabel}
                  </td>
                  <td className="py-2.5 px-2 text-muted max-w-[140px] align-middle">
                    {card.genre ?? "—"}
                  </td>
                  <td className="py-2.5 px-2 font-mono text-[13px] text-gold/90 tabular-nums align-middle">
                    {ordinal}
                  </td>
                  <td className="py-2.5 px-2 font-mono text-[13px] text-muted tabular-nums align-middle">
                    {card.id}
                  </td>
                  <td className="py-2.5 px-2 text-muted align-middle">
                    {kind}
                  </td>
                  <td className="py-2.5 px-2 text-white/95 align-middle max-w-[180px]">
                    {card.title}
                  </td>
                  <td className="py-2.5 px-2 text-muted align-middle max-w-[140px]">
                    {card.artist ?? "—"}
                  </td>
                  <td className="py-2.5 px-2 align-middle">
                    {card.wikipediaUrl && (
                      <a
                        href={card.wikipediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs"
                        aria-label="Wikipedia"
                      >
                        W
                      </a>
                    )}
                  </td>
                  <td className="py-2.5 px-2 font-mono text-[13px] align-middle">
                    {card.year}
                  </td>
                  <td className="py-2.5 px-2 text-muted align-middle">
                    {formatCatalogIntensity(intensity)}
                  </td>
                  <td className="py-2.5 px-2 font-mono text-[13px] align-middle">
                    {card.pop}
                  </td>
                  <td className="py-2.5 px-2 align-middle">{card.rarity}</td>
                  <td className="py-2.5 px-2 text-muted text-[13px] align-middle font-mono">
                    {card.artwork ? artworkBasename(card.artwork) : "—"}
                  </td>
                  <td className="py-2.5 px-2 text-muted text-[13px] align-middle max-w-[200px]">
                    {promptPrev ? (
                      <button
                        type="button"
                        className="text-left hover:text-gold/95 underline-offset-2 hover:underline w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setArtworkPromptModal(prompt!);
                        }}
                      >
                        {promptPrev.preview}
                        {promptPrev.hasMore ? " (full…)" : ""}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2.5 px-2 pr-3 text-muted text-[13px] align-middle max-w-[200px]">
                    {card.ability}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visibleRows.length === 0 ? (
        <p className="font-garamond text-muted text-center mt-4 text-sm">
          No wishlist rows match the current filters.
        </p>
      ) : null}

      {detailEntry !== null ? (
        <div
          className="fixed inset-0 z-100 overflow-y-auto bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wishlist-entry-detail-title"
          onClick={() => setDetailEntry(null)}
        >
          <div className="flex min-h-full justify-center px-4 pb-12 pt-[max(1.25rem,calc(env(safe-area-inset-top,0px)+1rem))] sm:items-center sm:px-6 sm:py-12 sm:pb-14 sm:pt-[max(1.5rem,calc(env(safe-area-inset-top,0px)+1.25rem))] items-start">
            <div
              className="max-w-5xl w-full rounded-lg border border-ui-border bg-[#12121a] p-5 sm:p-6 shadow-xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const d = detailEntry;
                const c = d.card;
                const detailLine = (label: string, value: string) => (
                  <div className="grid grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px] sm:text-[14px]">
                    <dt className="font-cinzel text-[9px] sm:text-[10px] tracking-[0.12em] text-muted uppercase shrink-0 pt-0.5">
                      {label}
                    </dt>
                    <dd className="font-garamond text-white/90 min-w-0 wrap-break-word m-0">
                      {value}
                    </dd>
                  </div>
                );
                return (
                  <>
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                      <div
                        className="shrink-0 mx-auto lg:mx-0 overflow-hidden rounded-[32px] bg-[#0a0a0e]"
                        style={{
                          width: CATALOG_DETAIL_CARD_BOX_W,
                          height: CATALOG_DETAIL_CARD_BOX_H,
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: 0,
                            width: CATALOG_CARD_NATIVE_W,
                            height: CATALOG_CARD_NATIVE_H,
                            transform: "translateX(-50%) scale(2)",
                            transformOrigin: "top center",
                          }}
                        >
                          <CatalogCard
                            card={c}
                            theme={d.theme}
                            enableZoom={false}
                            hoverLift={false}
                            cardSongIndex={cardSongIndex}
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <h2
                          id="wishlist-entry-detail-title"
                          className="font-cinzel text-sm sm:text-base tracking-[0.14em] text-gold mb-1"
                        >
                          {c.title}
                        </h2>
                        <p className="font-garamond text-muted text-[15px] mb-5">
                          {c.artist ?? "—"} · {c.year}
                        </p>
                        <dl className="flex flex-col gap-2.5 mb-6">
                          {detailLine("Wishlist #", String(d.ordinal))}
                          {detailLine("Card ID", String(c.id))}
                          {detailLine("Type", d.kind)}
                          {detailLine("App genre", d.appGenreLabel)}
                          {detailLine("Genre line", c.genre ?? "—")}
                          {detailLine("Country / region", c.country ?? "—")}
                          {detailLine(
                            "Songs in",
                            trackRefsLabel(
                              deriveSongsInFromSongIndex(cardSongIndex, c.id),
                              cardSongIndex,
                            ),
                          )}
                          {detailLine(
                            "Songs out",
                            trackRefsLabel(
                              cardSongIndex[c.id]?.songsOut,
                              cardSongIndex,
                            ),
                          )}
                          {detailLine(
                            "Intensity",
                            formatCatalogIntensity(d.intensity),
                          )}
                          {detailLine("Popularity", String(c.pop))}
                          {detailLine("Rarity", c.rarity)}
                          {detailLine(
                            "Artwork file",
                            c.artwork ? artworkBasename(c.artwork) : "—",
                          )}
                        </dl>
                        <div className="rounded-md border border-ui-border/80 bg-[#0f0f14]/40 px-3 py-3">
                          <div className="font-cinzel text-[10px] tracking-[0.14em] text-gold mb-1">
                            Ability
                          </div>
                          <p className="font-garamond text-white/95 text-[15px] m-0">
                            {c.ability}
                          </p>
                          <p className="font-garamond text-muted text-[13px] leading-relaxed mt-2 m-0">
                            {c.abilityDesc}
                          </p>
                        </div>
                        {c.artworkPrompt?.trim() ? (
                          <button
                            type="button"
                            className="mt-4 font-garamond text-left text-[13px] text-gold/95 hover:underline underline-offset-2"
                            onClick={() => {
                              setDetailEntry(null);
                              setArtworkPromptModal(c.artworkPrompt!.trim());
                            }}
                          >
                            View full artwork prompt
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-8 font-mono text-[12px] tracking-wide text-gold border border-ui-border rounded px-4 py-2 hover:bg-white/5 w-full sm:w-auto"
                      onClick={() => setDetailEntry(null)}
                    >
                      Close
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}

      {artworkPromptModal !== null ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wishlist-artwork-prompt-title"
          onClick={() => setArtworkPromptModal(null)}
        >
          <div
            className="max-w-2xl w-full max-h-[min(85vh,800px)] overflow-y-auto rounded-lg border border-ui-border bg-[#12121a] p-5 sm:p-6 shadow-xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="wishlist-artwork-prompt-title"
              className="font-cinzel text-xs sm:text-sm tracking-[0.18em] text-gold mb-4"
            >
              Artwork prompt
            </h2>
            <div className="font-garamond text-[14px] sm:text-[15px] text-white/90 whitespace-pre-wrap wrap-break-word leading-relaxed">
              {artworkPromptModal}
            </div>
            <button
              type="button"
              className="mt-6 font-mono text-[12px] tracking-wide text-gold border border-ui-border rounded px-4 py-2 hover:bg-white/5"
              onClick={() => setArtworkPromptModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
