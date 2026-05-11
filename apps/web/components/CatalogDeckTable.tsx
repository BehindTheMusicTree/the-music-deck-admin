"use client";

import { useEffect, useMemo, useState } from "react";
import CatalogCard from "@/components/catalog/CatalogCard";
import WishlistDeckTable from "@/components/catalog/WishlistDeckTable";
import CatalogSourceTabs from "@/components/catalog/CatalogSourceTabs";
import CatalogLayoutToolbar from "@/components/catalog/CatalogLayoutToolbar";
import CatalogSeriesSummaryTable from "@/components/catalog/CatalogSeriesSummaryTable";
import {
  CatalogArtworkPromptModal,
  CatalogEntryDetailModal,
} from "@/components/catalog/CatalogModals";
import {
  type CatalogEntry,
  CARD_RARITY_ORDER,
  CATALOG_KINDS,
  deriveSongsInFromSongIndex,
  formatCatalogIntensity,
} from "@/lib/cards";
import type { CardSongIndex } from "@/lib/cards/song-graph";
import type { WishlistEntry } from "@/lib/cards/wishlist";
import { resolveBundledArtworkPrompt } from "@/lib/cards/artwork-prompts";
import {
  type Intensity,
  intensityLevelIndex,
} from "@/lib/genres/subgenres-data";

type SortKey =
  | "id"
  | "title"
  | "year"
  | "pop"
  | "genre"
  | "artist"
  | "kind"
  | "country"
  | "rarity"
  | "catalogNo"
  | "series"
  | "lineGenre"
  | "intensity"
  | "era"
  | "artwork"
  | "artworkCreatedAt"
  | "artworkPrompt";

const thWrap =
  "align-top font-normal font-cinzel text-[10px] sm:text-[11px] tracking-[0.1em] text-gold/95 py-2 px-2";
const selectBase =
  "w-full max-w-[140px] mt-1 text-[10px] leading-tight bg-[#12121a] border border-ui-border rounded px-1 py-1 text-white/90";
const sortBtnBase =
  "shrink-0 inline-flex items-center justify-center min-w-[22px] h-[22px] rounded border border-ui-border bg-[#1a1a22] text-[10px] text-muted hover:text-gold hover:border-gold/40 transition-colors";
const sortBtnActive = "border-gold/50 text-gold";

/** Prior grid used scale(0.58) on the small card; this is 4× that preview size. */
const CATALOG_GRID_THUMB_SCALE = 0.58 * 4;

const INTENSITY_VALUES: readonly Intensity[] = [
  "POP",
  "SOFT",
  "EXPERIMENTAL",
  "HARDCORE",
];

function artworkBasename(artworkUrl: string | undefined): string {
  if (!artworkUrl) return "";
  const parts = artworkUrl.split("/");
  return parts[parts.length - 1] ?? artworkUrl;
}

/** Same source as `Card` artwork img: API uses `artworkUrl`, bundled deck uses `artwork`. */
function cardArtworkSrc(card: CatalogEntry["card"]): string | undefined {
  return card.artworkUrl ?? card.artwork;
}

const ARTWORK_PROMPT_PREVIEW_WORDS = 7;

/** Parse date-only or local datetime for sorting; invalid or missing → null. */
function artworkCreatedAtSortValue(raw: string | undefined): number | null {
  const s = raw?.trim();
  if (!s) return null;
  let candidate: string | null = null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    candidate = s.length === 16 ? `${s}:00` : s;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    candidate = `${s}T00:00:00`;
  }
  if (!candidate) return null;
  const t = Date.parse(candidate);
  return Number.isNaN(t) ? null : t;
}

function formatArtworkCreatedAtDisplay(raw: string): string {
  const s = raw.trim();
  const dt = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (dt) {
    const [, year, month, day, hour, minute, second] = dt;
    return `${day}/${month}/${year} ${hour}:${minute}:${second ?? "00"}`;
  }
  const d = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (d) {
    const [, year, month, day] = d;
    return `${day}/${month}/${year}`;
  }
  return s;
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

function effectiveArtworkPrompt(card: CatalogEntry["card"]): string {
  return resolveBundledArtworkPrompt(card.id, card.artworkPrompt);
}

function compareRows(
  a: CatalogEntry,
  b: CatalogEntry,
  key: SortKey,
  asc: boolean,
): number {
  const dir = asc ? 1 : -1;
  const cmp = (x: number, y: number) => (x < y ? -1 : x > y ? 1 : 0) * dir;
  switch (key) {
    case "id":
      return cmp(a.card.id, b.card.id);
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
    case "rarity": {
      const ia = CARD_RARITY_ORDER.indexOf(a.card.rarity);
      const ib = CARD_RARITY_ORDER.indexOf(b.card.rarity);
      return cmp(ia === -1 ? 99 : ia, ib === -1 ? 99 : ib);
    }
    case "genre":
      return (
        a.catalogGenreLabel.localeCompare(b.catalogGenreLabel, undefined, {
          sensitivity: "base",
        }) * dir
      );
    case "lineGenre":
      return (
        (a.card.genre ?? "").localeCompare(b.card.genre ?? "", undefined, {
          sensitivity: "base",
        }) * dir
      );
    case "intensity":
      return cmp(
        intensityLevelIndex(a.catalogIntensity),
        intensityLevelIndex(b.catalogIntensity),
      );
    case "era":
      return (
        a.catalogEra.localeCompare(b.catalogEra, undefined, {
          sensitivity: "base",
        }) * dir
      );
    case "series": {
      const s =
        a.catalogSeriesType.localeCompare(b.catalogSeriesType) * dir ||
        a.catalogSeriesLabel.localeCompare(b.catalogSeriesLabel, undefined, {
          sensitivity: "base",
        }) * dir ||
        cmp(a.catalogNumber, b.catalogNumber);
      return s;
    }
    case "catalogNo": {
      const s =
        a.catalogSeriesType.localeCompare(b.catalogSeriesType) * dir ||
        a.catalogSeriesLabel.localeCompare(b.catalogSeriesLabel, undefined, {
          sensitivity: "base",
        }) * dir ||
        cmp(a.catalogNumber, b.catalogNumber);
      return s;
    }
    case "artwork": {
      const sa = cardArtworkSrc(a.card);
      const sb = cardArtworkSrc(b.card);
      const ha = sa ? 1 : 0;
      const hb = sb ? 1 : 0;
      if (ha !== hb) return cmp(ha, hb);
      return (
        artworkBasename(sa).localeCompare(artworkBasename(sb), undefined, {
          sensitivity: "base",
        }) * dir
      );
    }
    case "artworkCreatedAt": {
      const A = artworkCreatedAtSortValue(a.card.artworkCreatedAt);
      const B = artworkCreatedAtSortValue(b.card.artworkCreatedAt);
      if (A === null && B === null) return 0;
      if (A === null) return 1 * dir;
      if (B === null) return -1 * dir;
      return cmp(A, B);
    }
    case "artworkPrompt": {
      const ap = effectiveArtworkPrompt(a.card);
      const bp = effectiveArtworkPrompt(b.card);
      const pa = ap ? 1 : 0;
      const pb = bp ? 1 : 0;
      if (pa !== pb) return cmp(pa, pb);
      return (
        ap.localeCompare(bp, undefined, {
          sensitivity: "base",
        }) * dir
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
  sortKey: SortKey;
  activeKey: SortKey;
  asc: boolean;
  onActivate: (key: SortKey) => void;
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
        {active ? (asc ? "\u25B2" : "\u25BC") : "\u21C5"}
      </button>
    </div>
  );
}

export default function CatalogDeckTable({
  className = "",
  catalogEntries,
  wishlistEntries,
  cardSongIndex,
}: {
  className?: string;
  catalogEntries: CatalogEntry[];
  wishlistEntries: WishlistEntry[];
  cardSongIndex: CardSongIndex;
}) {
  const [filterKind, setFilterKind] = useState<string>("all");
  const [filterSeries, setFilterSeries] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [filterLineGenre, setFilterLineGenre] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterRarity, setFilterRarity] = useState<string>("all");
  const [filterIntensity, setFilterIntensity] = useState<string>("all");
  const [filterEra, setFilterEra] = useState<string>("all");
  const [titleQuery, setTitleQuery] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [abilityQuery, setAbilityQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortAsc, setSortAsc] = useState(true);
  const [artworkPromptModal, setArtworkPromptModal] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [catalogPanel, setCatalogPanel] = useState<"deck" | "wishlist">("deck");
  const [catalogEntryDetail, setCatalogEntryDetail] =
    useState<CatalogEntry | null>(null);

  useEffect(() => {
    if (artworkPromptModal === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArtworkPromptModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [artworkPromptModal]);

  useEffect(() => {
    if (catalogEntryDetail === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCatalogEntryDetail(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [catalogEntryDetail]);

  const onActivateSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const clearAllFilters = () => {
    setFilterKind("all");
    setFilterSeries("all");
    setFilterGenre("all");
    setFilterLineGenre("all");
    setFilterCountry("all");
    setFilterRarity("all");
    setFilterIntensity("all");
    setFilterEra("all");
    setTitleQuery("");
    setArtistQuery("");
    setAbilityQuery("");
    setSortKey("id");
    setSortAsc(true);
  };

  const seriesOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of catalogEntries) {
      const value = `${e.catalogSeriesType}\t${e.catalogSeriesLabel}`;
      const label =
        e.catalogSeriesType === "country"
          ? `${e.catalogSeriesLabel} (country / region)`
          : `${e.catalogSeriesLabel} (genre)`;
      seen.set(value, label);
    }
    return [...seen.entries()]
      .sort(([, la], [, lb]) =>
        la.localeCompare(lb, undefined, { sensitivity: "base" }),
      )
      .map(([value, label]) => ({ value, label }));
  }, [catalogEntries]);

  const eraFilterOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of catalogEntries) s.add(e.catalogEra);
    return [...s].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [catalogEntries]);

  const genreFilterOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of catalogEntries) s.add(e.catalogGenreLabel);
    return [...s].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [catalogEntries]);

  const lineGenreFilterOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of catalogEntries) {
      s.add(e.card.genre ?? "__empty__");
    }
    return [...s].sort((a, b) => {
      if (a === "__empty__") return -1;
      if (b === "__empty__") return 1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  }, [catalogEntries]);

  const countryFilterOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of catalogEntries) {
      s.add(e.card.country ?? "__empty__");
    }
    return [...s].sort((a, b) => {
      if (a === "__empty__") return 1;
      if (b === "__empty__") return -1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  }, [catalogEntries]);

  const visibleRows = useMemo(() => {
    let rows = catalogEntries;
    if (filterKind !== "all") rows = rows.filter((r) => r.kind === filterKind);
    if (filterSeries !== "all") {
      const [t, lab] = filterSeries.split("\t");
      rows = rows.filter(
        (r) => r.catalogSeriesType === t && r.catalogSeriesLabel === lab,
      );
    }
    if (filterGenre !== "all") {
      rows = rows.filter((r) => r.catalogGenreLabel === filterGenre);
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
      rows = rows.filter((r) => r.catalogIntensity === filterIntensity);
    }
    if (filterEra !== "all") {
      rows = rows.filter((r) => r.catalogEra === filterEra);
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
    return [...rows].sort((a, b) => compareRows(a, b, sortKey, sortAsc));
  }, [
    filterKind,
    filterSeries,
    filterGenre,
    filterLineGenre,
    filterCountry,
    filterRarity,
    filterIntensity,
    filterEra,
    titleQuery,
    artistQuery,
    abilityQuery,
    catalogEntries,
    sortKey,
    sortAsc,
  ]);

  const catalogEntryById = useMemo(() => {
    const byId = new Map<number, CatalogEntry>();
    for (const e of catalogEntries) byId.set(e.card.id, e);
    return byId;
  }, [catalogEntries]);
  return (
    <div className={["w-full min-w-0", className].filter(Boolean).join(" ")}>
      <CatalogSourceTabs
        catalogPanel={catalogPanel}
        onSelectDeck={() => setCatalogPanel("deck")}
        onSelectWishlist={() => {
          setCatalogPanel("wishlist");
          setCatalogEntryDetail(null);
          setArtworkPromptModal(null);
        }}
      />

      {catalogPanel === "wishlist" ? (
        <div
          id="catalog-panel-wishlist"
          role="tabpanel"
          aria-labelledby="catalog-tab-wishlist"
        >
          <WishlistDeckTable
            wishlistEntries={wishlistEntries}
            cardSongIndex={cardSongIndex}
          />
        </div>
      ) : (
        <div
          id="catalog-panel-deck"
          role="tabpanel"
          aria-labelledby="catalog-tab-deck"
        >
          <CatalogSeriesSummaryTable entries={catalogEntries} />

          <CatalogLayoutToolbar
            viewMode={viewMode}
            visibleCount={visibleRows.length}
            onSelectTable={() => {
              setViewMode("table");
              setCatalogEntryDetail(null);
            }}
            onSelectGrid={() => setViewMode("grid")}
          />
          <div className="w-full min-w-0 rounded-[6px] border border-ui-border bg-[#0f0f14]/35 overflow-x-auto">
            <table className="w-full min-w-[1820px] border-collapse text-left">
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
                        sortKey="genre"
                        activeKey={sortKey}
                        asc={sortAsc}
                        onActivate={onActivateSort}
                      />
                      <select
                        className={selectBase}
                        value={filterGenre}
                        onChange={(e) => setFilterGenre(e.target.value)}
                        aria-label="Filter by app / table genre"
                      >
                        <option value="all">All app genres</option>
                        {genreFilterOptions.map((g) => (
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
                        label="Genre"
                        sortKey="lineGenre"
                        activeKey={sortKey}
                        asc={sortAsc}
                        onActivate={onActivateSort}
                      />
                      <select
                        className={selectBase}
                        value={filterLineGenre}
                        onChange={(e) => setFilterLineGenre(e.target.value)}
                        aria-label="Filter by card genre line (subgenre or app genre)"
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
                  <th className={`${thWrap} min-w-[88px]`}>
                    <div className="flex flex-col gap-1">
                      <SortToggle
                        label="Era"
                        sortKey="era"
                        activeKey={sortKey}
                        asc={sortAsc}
                        onActivate={onActivateSort}
                      />
                      <select
                        className={selectBase}
                        value={filterEra}
                        onChange={(e) => setFilterEra(e.target.value)}
                        aria-label="Filter by card era (season)"
                      >
                        <option value="all">All eras</option>
                        {eraFilterOptions.map((era) => (
                          <option key={era} value={era}>
                            {era}
                          </option>
                        ))}
                      </select>
                      <span className="text-[9px] text-muted/75 leading-tight mt-0.5">
                        Card season
                      </span>
                    </div>
                  </th>
                  <th className={`${thWrap} w-[56px]`}>
                    <SortToggle
                      label="№"
                      sortKey="catalogNo"
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
                  <th className={`${thWrap} min-w-[108px]`}>
                    <div className="flex flex-col gap-1">
                      <SortToggle
                        label="Series"
                        sortKey="series"
                        activeKey={sortKey}
                        asc={sortAsc}
                        onActivate={onActivateSort}
                      />
                      <select
                        className={selectBase}
                        value={filterSeries}
                        onChange={(e) => setFilterSeries(e.target.value)}
                        aria-label="Filter by series"
                      >
                        <option value="all">All series</option>
                        {seriesOptions.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
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
                        aria-label="Filter by card type"
                      >
                        <option value="all">All types</option>
                        {CATALOG_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                  <th className={`${thWrap} min-w-[100px]`}>
                    <div className="flex flex-col gap-1">
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
                        className={`${selectBase} placeholder:text-muted/70`}
                        value={titleQuery}
                        onChange={(e) => setTitleQuery(e.target.value)}
                        aria-label="Filter by title"
                      />
                    </div>
                  </th>
                  <th className={`${thWrap} min-w-[100px]`}>
                    <div className="flex flex-col gap-1">
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
                        className={`${selectBase} placeholder:text-muted/70`}
                        value={artistQuery}
                        onChange={(e) => setArtistQuery(e.target.value)}
                        aria-label="Filter artist name"
                      />
                    </div>
                  </th>
                  <th className={`${thWrap} w-8`}>
                    <span className="leading-snug">Wiki</span>
                  </th>
                  <th className={`${thWrap} min-w-[92px]`}>
                    <span className="leading-snug">Songs in</span>
                  </th>
                  <th className={`${thWrap} min-w-[92px]`}>
                    <span className="leading-snug">Songs out</span>
                  </th>
                  <th className={`${thWrap} min-w-[132px]`}>
                    <SortToggle
                      label="Artwork"
                      sortKey="artwork"
                      activeKey={sortKey}
                      asc={sortAsc}
                      onActivate={onActivateSort}
                    />
                    <span className="text-[9px] text-muted/75 leading-tight mt-1 block font-garamond font-normal tracking-normal">
                      Bundled file name
                    </span>
                  </th>
                  <th className={`${thWrap} w-[96px]`}>
                    <SortToggle
                      label="Art created"
                      sortKey="artworkCreatedAt"
                      activeKey={sortKey}
                      asc={sortAsc}
                      onActivate={onActivateSort}
                    />
                    <span className="text-[9px] text-muted/75 leading-tight mt-1 block font-garamond font-normal tracking-normal">
                      Local from PNG birth time
                    </span>
                  </th>
                  <th className={`${thWrap} min-w-[200px]`}>
                    <SortToggle
                      label="Artwork prompt"
                      sortKey="artworkPrompt"
                      activeKey={sortKey}
                      asc={sortAsc}
                      onActivate={onActivateSort}
                    />
                    <span className="text-[9px] text-muted/75 leading-tight mt-1 block font-garamond font-normal tracking-normal">
                      First seven words; click for full text
                    </span>
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
                  <th className={`${thWrap} min-w-[120px] pr-3`}>
                    <div className="flex flex-col gap-1">
                      <span className="leading-snug">Ability</span>
                      <input
                        type="search"
                        placeholder="Contains…"
                        className={`${selectBase} max-w-none`}
                        value={abilityQuery}
                        onChange={(e) => setAbilityQuery(e.target.value)}
                        aria-label="Filter ability name or description"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              {viewMode === "table" ? (
                <tbody className="font-garamond text-[15px] text-white/95">
                  {visibleRows.map((entry) => {
                    const {
                      rowKey,
                      kind,
                      card,
                      theme,
                      catalogNumber,
                      catalogSeriesType,
                      catalogSeriesLabel,
                      catalogGenreLabel,
                      catalogIntensity,
                      catalogEra,
                    } = entry;
                    const artworkSrc = cardArtworkSrc(card);
                    return (
                      <tr
                        key={rowKey}
                        className="border-b border-ui-border/60 last:border-0 align-top cursor-pointer hover:bg-white/[0.03] transition-colors"
                        tabIndex={0}
                        role="button"
                        aria-label={`Open catalogue details for ${card.title}`}
                        onClick={() => setCatalogEntryDetail(entry)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setCatalogEntryDetail(entry);
                          }
                        }}
                      >
                        <td className="py-2 pl-2 pr-1">
                          {artworkSrc ? (
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
                          ) : (
                            <div
                              className="mx-auto flex justify-center items-center rounded border border-dashed border-ui-border/80 bg-[#12121a]/60 text-center px-1"
                              style={{ width: 102, height: 150 }}
                            >
                              <span className="font-garamond text-[11px] leading-snug text-muted">
                                No artwork
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-muted max-w-[120px] align-middle">
                          {card.country ?? "—"}
                        </td>
                        <td className="py-2.5 px-2 text-white/90 align-middle whitespace-nowrap">
                          {catalogGenreLabel}
                        </td>
                        <td className="py-2.5 px-2 text-muted max-w-[140px] align-middle">
                          {card.genre ?? "—"}
                        </td>
                        <td className="py-2.5 px-2 text-white/90 align-middle whitespace-nowrap font-mono text-[13px] tracking-wide">
                          {catalogEra}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-gold tabular-nums align-middle">
                          {catalogNumber}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-muted tabular-nums align-middle">
                          {card.id}
                        </td>
                        <td className="py-2.5 px-2 text-muted align-middle">
                          <div className="text-white/90">
                            {catalogSeriesLabel}
                          </div>
                          <div className="text-[11px] mt-0.5 opacity-80">
                            {catalogSeriesType === "country"
                              ? "by country / region"
                              : "by genre"}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-muted whitespace-nowrap align-middle">
                          {kind}
                        </td>
                        <td className="py-2.5 px-2 align-middle">
                          {card.title}
                        </td>
                        <td className="py-2.5 px-2 text-muted align-middle">
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
                        <td className="py-2.5 px-2 text-muted align-middle min-w-0">
                          {(() => {
                            const ids = deriveSongsInFromSongIndex(
                              cardSongIndex,
                              card.id,
                            );
                            if (!ids || ids.length === 0) {
                              return <span className="text-muted/80">—</span>;
                            }
                            return (
                              <div className="flex items-center gap-1.5">
                                {ids.map((id) => {
                                  const target = catalogEntryById.get(id);
                                  if (!target) {
                                    return (
                                      <span
                                        key={id}
                                        className="inline-flex h-9 min-w-8 items-center justify-center rounded border border-ui-border/70 bg-[#12121a] px-1 font-mono text-[10px] text-muted"
                                      >
                                        {id}
                                      </span>
                                    );
                                  }
                                  return (
                                    <button
                                      key={id}
                                      type="button"
                                      className="flex justify-center rounded border border-ui-border/60 bg-[#12121a]/50 hover:border-gold/40"
                                      style={{
                                        width: 102,
                                        height: 150,
                                        overflow: "hidden",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCatalogEntryDetail(target);
                                      }}
                                      aria-label={`Open catalogue details for ${target.card.title}`}
                                    >
                                      <div
                                        style={{
                                          transform: "scale(0.58)",
                                          transformOrigin: "top center",
                                        }}
                                      >
                                        <CatalogCard
                                          card={target.card}
                                          theme={target.theme}
                                          small
                                          enableZoom={false}
                                          cardSongIndex={cardSongIndex}
                                        />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-2.5 px-2 text-muted align-middle min-w-0">
                          {(() => {
                            const ids = cardSongIndex[card.id]?.songsOut;
                            if (!ids || ids.length === 0) {
                              return <span className="text-muted/80">—</span>;
                            }
                            return (
                              <div className="flex items-center gap-1.5">
                                {ids.map((id) => {
                                  const target = catalogEntryById.get(id);
                                  if (!target) {
                                    return (
                                      <span
                                        key={id}
                                        className="inline-flex h-9 min-w-8 items-center justify-center rounded border border-ui-border/70 bg-[#12121a] px-1 font-mono text-[10px] text-muted"
                                      >
                                        {id}
                                      </span>
                                    );
                                  }
                                  return (
                                    <button
                                      key={id}
                                      type="button"
                                      className="flex justify-center rounded border border-ui-border/60 bg-[#12121a]/50 hover:border-gold/40"
                                      style={{
                                        width: 102,
                                        height: 150,
                                        overflow: "hidden",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCatalogEntryDetail(target);
                                      }}
                                      aria-label={`Open catalogue details for ${target.card.title}`}
                                    >
                                      <div
                                        style={{
                                          transform: "scale(0.58)",
                                          transformOrigin: "top center",
                                        }}
                                      >
                                        <CatalogCard
                                          card={target.card}
                                          theme={target.theme}
                                          small
                                          enableZoom={false}
                                          cardSongIndex={cardSongIndex}
                                        />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-2.5 px-2 text-muted align-middle min-w-0">
                          {artworkSrc ? (
                            <span
                              className="font-mono text-[11px] leading-snug break-all text-white/85"
                              title={artworkSrc}
                            >
                              {artworkBasename(artworkSrc)}
                            </span>
                          ) : (
                            <span className="text-muted/80">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-muted tabular-nums align-middle whitespace-nowrap font-mono text-[11px]">
                          {card.artworkCreatedAt?.trim() ? (
                            <span
                              className="text-white/85"
                              title={card.artworkCreatedAt.trim()}
                            >
                              {formatArtworkCreatedAtDisplay(
                                card.artworkCreatedAt.trim(),
                              )}
                            </span>
                          ) : (
                            <span className="text-muted/80">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-muted align-middle min-w-0">
                          {effectiveArtworkPrompt(card) ? (
                            <button
                              type="button"
                              className="block w-full max-w-[28ch] text-left font-garamond text-[11px] leading-snug text-white/80 hover:text-gold rounded border border-transparent px-0.5 py-0.5 -mx-0.5 hover:border-ui-border/50 hover:bg-white/3 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setArtworkPromptModal(
                                  effectiveArtworkPrompt(card),
                                );
                              }}
                              aria-label="Open full artwork prompt"
                            >
                              {
                                artworkPromptPreview(
                                  effectiveArtworkPrompt(card),
                                ).preview
                              }
                            </button>
                          ) : (
                            <span className="text-muted/80">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-muted tabular-nums align-middle">
                          {card.year}
                        </td>
                        <td className="py-2.5 px-2 text-muted align-middle whitespace-nowrap">
                          {formatCatalogIntensity(catalogIntensity)}
                        </td>
                        <td className="py-2.5 px-2 text-muted tabular-nums align-middle">
                          {card.pop}
                        </td>
                        <td className="py-2.5 px-2 text-muted whitespace-nowrap align-middle">
                          {card.rarity}
                        </td>
                        <td className="py-2.5 pr-3 pl-2 text-muted min-w-0 align-middle">
                          {card.ability}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ) : null}
            </table>
          </div>

          {viewMode === "grid" ? (
            <div className="mt-6 w-full min-w-0 rounded-[6px] border border-ui-border bg-[#0f0f14]/35 p-4 sm:p-6 overflow-x-auto">
              <div className="grid grid-cols-1 min-[900px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 justify-items-center">
                {visibleRows.map((entry) => {
                  const {
                    rowKey,
                    kind,
                    card,
                    theme,
                    catalogNumber,
                    catalogSeriesLabel,
                    catalogGenreLabel,
                  } = entry;
                  return (
                    <button
                      key={rowKey}
                      type="button"
                      className="group flex flex-col items-center gap-2 rounded-lg border border-ui-border bg-[#12121a]/45 p-3 min-w-0 text-left transition-colors hover:border-gold/40 hover:bg-white/4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50"
                      onClick={() => setCatalogEntryDetail(entry)}
                      aria-label={`Open catalogue details for ${card.title}`}
                    >
                      <div
                        className="mx-auto flex justify-center shrink-0 overflow-hidden"
                        style={{
                          width: 102 * 4,
                          height: 150 * 4,
                        }}
                      >
                        {cardArtworkSrc(card) ? (
                          <div
                            style={{
                              transform: `scale(${CATALOG_GRID_THUMB_SCALE})`,
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
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center rounded border border-dashed border-ui-border/80 bg-[#12121a]/60 px-1 text-center"
                            style={{ width: 102 * 4, height: 150 * 4 }}
                          >
                            <span className="font-garamond text-[10px] leading-snug text-muted">
                              No artwork
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="w-full min-w-0 text-center">
                        <div className="font-garamond text-[13px] text-white/95 leading-snug line-clamp-2 group-hover:text-gold/95 transition-colors">
                          {card.title}
                        </div>
                        <div className="font-garamond text-[11px] text-muted mt-0.5 line-clamp-1">
                          {card.artist ?? "—"}
                        </div>
                        <div className="font-mono text-[10px] text-gold/90 tabular-nums mt-1">
                          № {catalogNumber} · {catalogGenreLabel}
                        </div>
                        <div className="font-mono text-[9px] text-muted/90 mt-0.5 truncate w-full">
                          {catalogSeriesLabel}
                        </div>
                        <div className="font-mono text-[9px] text-muted/70 mt-0.5">
                          {kind}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {visibleRows.length === 0 ? (
            <p className="font-garamond text-muted text-center mt-4 text-sm">
              No cards match the current filters.
            </p>
          ) : null}

          <CatalogEntryDetailModal
            entry={catalogEntryDetail}
            effectiveArtworkPrompt={effectiveArtworkPrompt}
            cardSongIndex={cardSongIndex}
            onClose={() => setCatalogEntryDetail(null)}
            onOpenArtworkPrompt={(text) => {
              setCatalogEntryDetail(null);
              setArtworkPromptModal(text);
            }}
          />

          <CatalogArtworkPromptModal
            text={artworkPromptModal}
            onClose={() => setArtworkPromptModal(null)}
          />
        </div>
      )}
    </div>
  );
}
