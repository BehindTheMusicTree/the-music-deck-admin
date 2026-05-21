import type { CardData } from "@/components/cards/Card";
import { assignCatalogRowKeys } from "@repo/cards-domain";
import type { CatalogSeriesType, GenreTheme } from "@/lib/card-theme-types";
import {
  APP_GENRE_THEMES,
  type RootGenreName,
  type Intensity,
  appGenreIntensity,
  canonicalCountryFromSubgenre,
  displayGenreLabel,
  isCountrySubgenre,
  isGenreSubgenre,
  resolveThemeSelection,
  subgenreIntensity,
  themeForCountry,
} from "@/lib/genres";
import { ARTWORK_CREATED_AT } from "./artwork-created-at";
import { CARD_ARTWORK_BASE } from "./card-artworks-base";
import { deriveCatalogSeriesLabel } from "./_card-helpers";
import { ALL_GENRE_CARDS, DECK_ADDITIONAL_GENRE_CARDS } from "./genre";
import { WORLD_FLAG_CARDS, WORLD_MIXED_CARDS } from "./world";
import { buildCardSongIndex } from "./song-graph";

export type { CatalogSeriesType };

/** Card season label: every shipped catalogue card is season 1 for now. */
export const CATALOG_DEFAULT_ERA = "Era I" as const;
export type CatalogEra = typeof CATALOG_DEFAULT_ERA;

export type CatalogEntryKind =
  | "Genre"
  | "World"
  | "World blend"
  | "World + genre";

export type CatalogEntry = {
  rowKey: string;
  kind: CatalogEntryKind;
  card: CardData;
  theme: GenreTheme;
  /** Inferred: "country" when series label equals country, else "genre". */
  catalogSeriesType: CatalogSeriesType;
  /** Derived from card `genre`/`country`. */
  catalogSeriesLabel: string;
  /** Copied from `card.catalogNumber` (per-series index from shipped meta). */
  catalogNumber: number;
  /** Parent app genre for the table (World for pure country-native strips). */
  catalogGenreLabel: string;
  /** Same intensity as the card gauge (from subgenre when set, else app genre). */
  catalogIntensity: Intensity;
  /** Card season (release wave); bundled deck is all Era I today. */
  catalogEra: CatalogEra;
};

export type RawCatalogRow = {
  rowKey: string;
  kind: CatalogEntryKind;
  card: CardData;
  theme: GenreTheme;
};

export const CATALOG_GENRE_REPRESENTATIVE_IDS: Record<RootGenreName, number> = {
  Rock: 1,
  Mainstream: 2,
  Electronic: 3,
  "Reggae/Dub": 4,
  "Hip-Hop": 5,
  "Disco/Funk": 6,
  Classical: 7,
  Vintage: 8,
};

const _allGenreCardsById = new Map(ALL_GENRE_CARDS.map((c) => [c.id, c]));

type IntermCatalogRow = {
  card: CardData;
  kind: CatalogEntryKind;
  theme: GenreTheme;
};

const _intermGenreRows: IntermCatalogRow[] = (
  Object.keys(CATALOG_GENRE_REPRESENTATIVE_IDS) as RootGenreName[]
).map((g) => {
  const card = _allGenreCardsById.get(CATALOG_GENRE_REPRESENTATIVE_IDS[g]);
  if (!card) {
    throw new Error(`Missing genre representative card for "${g}"`);
  }
  return { kind: "Genre", card, theme: APP_GENRE_THEMES[g] };
});

const _intermWorldRows: IntermCatalogRow[] = WORLD_FLAG_CARDS.map((c) => ({
  kind: "World",
  card: c,
  theme: themeForCountry(c.country!),
}));

const _intermBlendRows: IntermCatalogRow[] = WORLD_MIXED_CARDS.map((c) => ({
  kind: "World blend",
  card: c,
  theme: themeForCountry(c.country!),
}));

/**
 * Catalog row kind + table theme for non-pillar genre-deck cards. Uses `themeForCountry` for
 * world-style rows instead of `resolveThemeSelection` so the table shows the country shell
 * consistently; full card chrome still comes from `resolveThemeSelection` on `Card`.
 */
export function catalogMetaForGenreDeckCard(card: CardData): {
  kind: CatalogEntryKind;
  theme: GenreTheme;
} {
  const g = card.genre;
  if (!g) {
    throw new Error(
      `Genre deck card "${card.title}" (${card.id}) must set genre`,
    );
  }
  if (isCountrySubgenre(g)) {
    const expected = canonicalCountryFromSubgenre(g);
    const ctry = card.country ?? expected;
    if (ctry !== expected) {
      throw new Error(
        `"${card.title}": country-native "${g}" expects country "${expected}", got "${card.country}"`,
      );
    }
    return { kind: "World", theme: themeForCountry(ctry) };
  }
  if (card.country) {
    if (isGenreSubgenre(g)) {
      return { kind: "World blend", theme: themeForCountry(card.country) };
    }
    return { kind: "World + genre", theme: themeForCountry(card.country) };
  }
  const r = resolveThemeSelection({ genre: g });
  if (!r.resolvedGenre) {
    throw new Error(`"${card.title}": no resolved app genre for "${g}"`);
  }
  return {
    kind: "Genre",
    theme: APP_GENRE_THEMES[r.resolvedGenre as RootGenreName],
  };
}

const ADDITIONAL_GENRE_CATALOG_META: Record<
  number,
  { kind: CatalogEntryKind; theme: GenreTheme }
> = (() => {
  return Object.fromEntries(
    DECK_ADDITIONAL_GENRE_CARDS.map((c) => [
      c.id,
      catalogMetaForGenreDeckCard(c),
    ]),
  );
})();

const _intermAdditionalGenreRows: IntermCatalogRow[] =
  DECK_ADDITIONAL_GENRE_CARDS.map((card) => {
    const meta = ADDITIONAL_GENRE_CATALOG_META[card.id];
    if (!meta) {
      throw new Error(
        `Missing ADDITIONAL_GENRE_CATALOG_META[${card.id}] for "${card.title}"`,
      );
    }
    return { kind: meta.kind, card, theme: meta.theme };
  });

const _intermLaMacarena: IntermCatalogRow = {
  kind: "World + genre",
  card: {
    id: 9101,
    title: "La Macarena",
    artist: "Los Del Rio",
    year: "1993",
    ability: "Festival Pulse",
    abilityDesc: "Gain +10 popularity when played after a World card.",
    pop: 9,
    rarity: "CLASSIC",
    artwork: `${CARD_ARTWORK_BASE}los-del-rio-la-macarena-v1.png`,
    artworkCreatedAt:
      ARTWORK_CREATED_AT["los-del-rio-la-macarena-v1.png"],
    country: "Spain",
    genre: "Electronic",
    catalogNumber: 17,
  },
  theme: themeForCountry("Spain"),
};

function catalogCardIntensity(row: RawCatalogRow): Intensity {
  const { card } = row;
  if (!card.genre) {
    throw new Error(
      `Cannot resolve intensity for "${row.card.title}" (${row.rowKey}): missing genre`,
    );
  }
  const resolved = resolveThemeSelection({
    genre: card.genre,
    country: card.country,
  });
  if (resolved.resolvedSubgenre) {
    return subgenreIntensity(resolved.resolvedSubgenre);
  }
  if (resolved.resolvedGenre) {
    return appGenreIntensity(resolved.resolvedGenre as RootGenreName);
  }
  throw new Error(
    `Cannot resolve intensity for "${row.card.title}" (${row.rowKey})`,
  );
}

/** Human-readable intensity for tables (matches charter wording). */
export function formatCatalogIntensity(i: Intensity): string {
  return i.charAt(0).toUpperCase() + i.slice(1);
}

function catalogGenreLabel(row: RawCatalogRow): string {
  const { card } = row;
  if (card.genre && isCountrySubgenre(card.genre)) {
    return "World";
  }
  if (!card.genre) return "—";
  return displayGenreLabel(resolvedRootGenre(row));
}

function resolvedRootGenre(row: RawCatalogRow): RootGenreName {
  const { card } = row;
  if (!card.genre) {
    throw new Error(`Catalog row "${row.rowKey}" has no card.genre`);
  }
  if (isCountrySubgenre(card.genre)) {
    throw new Error(
      `Catalog row "${row.rowKey}": country-native "${card.genre}" must not reach resolvedRootGenre`,
    );
  }
  const r = resolveThemeSelection({ genre: card.genre, country: card.country });
  if (r.resolvedGenre) {
    return r.resolvedGenre as RootGenreName;
  }
  throw new Error(
    `Catalog row "${card.title}" (genre "${card.genre}") has no resolved app genre`,
  );
}

function inferCatalogSeriesType(
  country: string | undefined,
  label: string,
): CatalogSeriesType {
  return country != null && label === country ? "country" : "genre";
}

function catalogEntryFromRow(row: RawCatalogRow): CatalogEntry {
  const { card } = row;
  if (card.catalogNumber == null) {
    throw new Error(
      `Shipped card "${card.title}" (id ${card.id}): set catalogNumber on the card definition`,
    );
  }
  const catalogSeriesLabel = deriveCatalogSeriesLabel(card);
  return {
    rowKey: row.rowKey,
    kind: row.kind,
    card,
    theme: row.theme,
    catalogSeriesType: inferCatalogSeriesType(card.country, catalogSeriesLabel),
    catalogSeriesLabel,
    catalogNumber: card.catalogNumber,
    catalogGenreLabel: catalogGenreLabel(row),
    catalogIntensity: catalogCardIntensity(row),
    catalogEra: CATALOG_DEFAULT_ERA,
  };
}

const _allShippedInterm: IntermCatalogRow[] = [
  ..._intermGenreRows,
  ..._intermWorldRows,
  ..._intermBlendRows,
  ..._intermAdditionalGenreRows,
  _intermLaMacarena,
];

const _shippedRowKeyMap = assignCatalogRowKeys(
  _allShippedInterm.map((r) => ({
    id: r.card.id,
    title: r.card.title,
    year: r.card.year,
  })),
);

const rawCatalogRows: RawCatalogRow[] = _allShippedInterm.map((r) => ({
  rowKey: _shippedRowKeyMap.get(r.card.id)!,
  kind: r.kind,
  card: r.card,
  theme: r.theme,
}));

/** Normalised key for deduplicating wishlist rows against the shipped deck. */
export function normCatalogKey(
  title: string,
  genre?: string,
  country?: string,
  year?: string,
): string {
  const norm = (s?: string) =>
    (s ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return [norm(title), norm(genre), norm(country), norm(year)].join("|");
}

/** Keys for shipped catalogue rows only — used by `lib/cards/wishlist.ts`. */
export const SHIPPED_CATALOG_DEDUP_KEYS = new Set(
  rawCatalogRows.map((r) =>
    normCatalogKey(r.card.title, r.card.genre, r.card.country, r.card.year),
  ),
);

/** Shipped deck only (bundled artwork). Wishlist rows live in {@link WISHLIST_ENTRIES}. */
export const CATALOG_ENTRIES: CatalogEntry[] = rawCatalogRows
  .map(catalogEntryFromRow)
  .sort((a, b) => a.card.id - b.card.id);

/**
 * Per-id transition data for shipped catalogue cards. `buildCardSongIndex` runs
 * `buildSongGraph` once (validates `songsOut` links on the same card list).
 */
export const CATALOG_CARD_TRACK_INDEX = buildCardSongIndex(
  rawCatalogRows.map((r) => r.card),
);

/**
 * Pass to `Card` (or use `CatalogCard`) so transition strips resolve — only
 * `cardSongIndex` is required.
 */
export const CATALOG_CARD_TRANSITION_PROPS = {
  cardSongIndex: CATALOG_CARD_TRACK_INDEX,
} as const;

export const CATALOG_KINDS: CatalogEntryKind[] = [
  "Genre",
  "World",
  "World blend",
  "World + genre",
];
