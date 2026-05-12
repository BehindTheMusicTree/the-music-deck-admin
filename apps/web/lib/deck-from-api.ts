import type { CardData } from "@/components/cards/Card";
import type { CatalogSeriesType, GenreTheme } from "@/lib/card-theme-types";
import {
  APP_GENRE_THEMES,
  type RootGenreName,
  type Intensity,
  appGenreIntensity,
  displayGenreLabel,
  isCountrySubgenre,
  resolveThemeSelection,
  resolveThemeSelectionLoose,
  subgenreIntensity,
  themeForCountry,
} from "@/lib/genres";
import {
  CATALOG_DEFAULT_ERA,
  CATALOG_GENRE_REPRESENTATIVE_IDS,
  catalogMetaForGenreDeckCard,
  normCatalogKey,
  type CatalogEntry,
  type CatalogEntryKind,
} from "@/lib/cards/catalog";
import { deriveCatalogSeriesLabel } from "@/lib/cards/_card-helpers";
import type { WishlistEntry, WishlistKind } from "@/lib/cards/wishlist";

/** JSON shape returned by `GET /cards` family (matches Nest `CardResponse`). */
export type ApiCardJson = {
  id: number;
  rowKey: string;
  status: string;
  title: string;
  artist?: string;
  year: string;
  genre?: string;
  genreTheme?: GenreTheme;
  country?: string;
  ability: string;
  abilityDesc: string;
  pop: number;
  rarity: CardData["rarity"];
  catalogNumber?: number;
  printedSetId?: string;
  artworkUrl?: string;
  artworkKey?: string;
  artworkContentType?: string;
  artworkBytes?: number;
  artworkChecksum?: string;
  artworkOffsetY?: number;
  artworkOverBorder?: boolean;
  artworkCreatedAt?: string;
  artworkPrompt?: string;
  wikipediaUrl: string;
  songsOut: number[];
};

const ID_TO_APP_GENRE = Object.fromEntries(
  (
    Object.entries(CATALOG_GENRE_REPRESENTATIVE_IDS) as [
      RootGenreName,
      number,
    ][]
  ).map(([g, id]) => [id, g]),
) as Record<number, RootGenreName>;

export function apiCardToCardData(a: ApiCardJson): CardData {
  return {
    id: a.id,
    title: a.title,
    artist: a.artist,
    year: a.year,
    genre: a.genre ?? "",
    country: a.country,
    ability: a.ability,
    abilityDesc: a.abilityDesc,
    pop: a.pop,
    rarity: a.rarity,
    catalogNumber: a.catalogNumber,
    printedSetId: a.printedSetId,
    artworkUrl: a.artworkUrl,
    artworkKey: a.artworkKey,
    artworkPrompt: a.artworkPrompt,
    artworkCreatedAt: a.artworkCreatedAt,
    artworkOffsetY: a.artworkOffsetY,
    artworkOverBorder: a.artworkOverBorder,
    wikipediaUrl: a.wikipediaUrl,
    songsOut: a.songsOut?.length ? a.songsOut : undefined,
  };
}

type RawCatalogRow = {
  rowKey: string;
  kind: CatalogEntryKind;
  card: CardData;
  theme: GenreTheme;
};

function resolveCardTheme(
  apiCard: ApiCardJson,
  fallback: GenreTheme,
): GenreTheme {
  return apiCard.genreTheme ?? fallback;
}

function rawCatalogRowFromApiShipped(a: ApiCardJson): RawCatalogRow {
  const card = apiCardToCardData(a);
  const g = ID_TO_APP_GENRE[a.id];
  const meta = g
    ? { kind: "Genre" as CatalogEntryKind, theme: APP_GENRE_THEMES[g] }
    : catalogMetaForGenreDeckCard(card);
  return {
    rowKey: a.rowKey,
    kind: meta.kind,
    card,
    theme: resolveCardTheme(a, meta.theme),
  };
}

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

/** Rebuild shipped {@link CatalogEntry} rows from API payloads (same table output as static bundle). */
export function buildCatalogEntriesFromShippedApi(
  shipped: ApiCardJson[],
): CatalogEntry[] {
  const rawRows = shipped.map(rawCatalogRowFromApiShipped);
  return rawRows.map(catalogEntryFromRow).sort((a, b) => a.card.id - b.card.id);
}

function wishlistInterimFromApi(a: ApiCardJson): {
  rowKey: string;
  kind: WishlistKind;
  card: CardData;
  theme: GenreTheme;
} {
  const card = apiCardToCardData(a);
  const kind: WishlistKind = "Wishlist";
  const fallbackTheme = card.country
    ? themeForCountry(card.country)
    : resolveThemeSelectionLoose({
        genre: card.genre ?? "",
        fallbackTheme: APP_GENRE_THEMES.Mainstream,
      }).theme;
  const theme = resolveCardTheme(a, fallbackTheme);
  return { rowKey: a.rowKey, kind, card, theme };
}

function wishlistRootGenreLabel(card: CardData, rowKey: string): string {
  if (card.genre && isCountrySubgenre(card.genre)) {
    return "World";
  }
  if (!card.genre) return "—";
  const r = resolveThemeSelectionLoose({
    genre: card.genre,
    country: card.country,
    fallbackTheme: APP_GENRE_THEMES.Mainstream,
  });
  if (r.resolvedGenre) {
    return displayGenreLabel(r.resolvedGenre as RootGenreName);
  }
  return card.genre;
}

function wishlistIntensity(card: CardData, rowKey: string): Intensity {
  if (!card.genre) {
    throw new Error(
      `Wishlist row "${rowKey}" (${card.title}): missing genre for intensity`,
    );
  }
  const resolved = resolveThemeSelectionLoose({
    genre: card.genre,
    country: card.country,
    fallbackTheme: APP_GENRE_THEMES.Mainstream,
  });
  if (resolved.resolvedSubgenre) {
    return subgenreIntensity(resolved.resolvedSubgenre);
  }
  if (resolved.resolvedGenre) {
    return appGenreIntensity(resolved.resolvedGenre as RootGenreName);
  }
  return "POP";
}

/** Wishlist + planned rows, deduped against shipped catalogue keys like the static bundle. */
export function buildWishlistEntriesFromApi(
  wishlist: ApiCardJson[],
  shippedCatalog: CatalogEntry[],
): WishlistEntry[] {
  const shippedKeys = new Set(
    shippedCatalog.map((r) =>
      normCatalogKey(r.card.title, r.card.genre, r.card.country, r.card.year),
    ),
  );
  const interim = wishlist
    .filter(
      (a) =>
        !shippedKeys.has(normCatalogKey(a.title, a.genre, a.country, a.year)),
    )
    .map(wishlistInterimFromApi);
  const sorted = [...interim].sort((a, b) => a.card.id - b.card.id);
  return sorted.map((row, i) => ({
    rowKey: row.rowKey,
    kind: row.kind,
    card: row.card,
    theme: row.theme,
    ordinal: i + 1,
    appGenreLabel: wishlistRootGenreLabel(row.card, row.rowKey),
    intensity: wishlistIntensity(row.card, row.rowKey),
  }));
}
