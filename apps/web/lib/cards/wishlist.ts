import type { CardData } from "@/components/cards/Card";
import { assignCatalogRowKeys } from "@repo/cards-domain";
import type { GenreTheme } from "@/lib/card-theme-types";
import {
  APP_GENRE_THEMES,
  type RootGenreName,
  type Intensity,
  appGenreIntensity,
  displayGenreLabel,
  isCountrySubgenre,
  resolveThemeSelectionLoose,
  subgenreIntensity,
  themeForCountry,
} from "@/lib/genres";
import {
  SHIPPED_CATALOG_DEDUP_KEYS,
  normCatalogKey,
  CATALOG_ENTRIES,
} from "./catalog";
import type { WishlistCardDef } from "./wishlist-types";
import { WISHLIST_CARD_DEFS } from "./catalog-wishlist-defs";

export type WishlistKind = WishlistCardDef["kind"];

/** Resolved row for the wishlist tab — separate from {@link CatalogEntry}. */
export type WishlistEntry = {
  rowKey: string;
  kind: WishlistKind;
  card: CardData;
  theme: GenreTheme;
  /** 1-based order in the wishlist table (stable sort by card id). */
  ordinal: number;
  appGenreLabel: string;
  intensity: Intensity;
};

export const WISHLIST_KINDS: WishlistKind[] = ["Card", "Wishlist"];

type WishlistInterim = {
  rowKey: string;
  kind: WishlistKind;
  card: CardData;
  theme: GenreTheme;
};

function wishlistDefToInterim(
  d: WishlistCardDef,
  rowKey: string,
): WishlistInterim {
  const card: CardData = {
    id: d.id,
    title: d.title,
    artist: d.artist,
    year: d.year,
    genre: d.genre,
    country: d.country,
    ability: d.ability,
    abilityDesc: d.abilityDesc,
    pop: d.pop ?? 5,
    rarity: d.rarity,
    artworkPrompt: d.artworkPrompt,
  };
  const kind: WishlistKind = d.kind === "Wishlist" ? "Wishlist" : "Card";
  const theme = d.country
    ? themeForCountry(d.country)
    : resolveThemeSelectionLoose({
        genre: d.genre ?? "",
        fallbackTheme: APP_GENRE_THEMES.Mainstream,
      }).theme;
  return { rowKey, kind, card, theme };
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

const _filteredWishlistDefs = WISHLIST_CARD_DEFS.filter(
  (d) =>
    !SHIPPED_CATALOG_DEDUP_KEYS.has(
      normCatalogKey(d.title, d.genre, d.country, d.year),
    ),
);

// Global key assignment across shipped + wishlist to handle title+year collisions
const _wishlistRowKeyMap = assignCatalogRowKeys([
  ...CATALOG_ENTRIES.map((e) => ({
    id: e.card.id,
    title: e.card.title,
    year: e.card.year,
  })),
  ..._filteredWishlistDefs.map((d) => ({
    id: d.id,
    title: d.title,
    year: d.year,
  })),
]);

const wishlistInterimRows: WishlistInterim[] = _filteredWishlistDefs.map((d) =>
  wishlistDefToInterim(d, _wishlistRowKeyMap.get(d.id)!),
);

/** Wishlist / future cards not yet in the shipped deck (no bundled artwork). */
export const WISHLIST_ENTRIES: WishlistEntry[] = (() => {
  const sorted = [...wishlistInterimRows].sort((a, b) => a.card.id - b.card.id);
  return sorted.map((row, i) => ({
    rowKey: row.rowKey,
    kind: row.kind,
    card: row.card,
    theme: row.theme,
    ordinal: i + 1,
    appGenreLabel: wishlistRootGenreLabel(row.card, row.rowKey),
    intensity: wishlistIntensity(row.card, row.rowKey),
  }));
})();
