import { resolveBundledArtworkPrompt } from "@/lib/cards/artwork-prompts";
import { CARD_RARITY_ORDER } from "@/lib/cards";
import { intensityLevelIndex } from "@/lib/genres/subgenres-data";
import type { CatalogEntry } from "@/lib/cards";

export type SortKey =
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

const ARTWORK_PROMPT_PREVIEW_WORDS = 7;

export function artworkBasename(artworkUrl: string | undefined): string {
  if (!artworkUrl) return "";
  const parts = artworkUrl.split("/");
  return parts[parts.length - 1] ?? artworkUrl;
}

export function cardArtworkSrc(
  card: CatalogEntry["card"],
): string | undefined {
  return card.artworkUrl ?? card.artwork;
}

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

export function formatArtworkCreatedAtDisplay(raw: string): string {
  const s = raw.trim();
  const dt = s.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
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

export function artworkPromptPreview(full: string): {
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

export function effectiveArtworkPrompt(card: CatalogEntry["card"]): string {
  return resolveBundledArtworkPrompt(card.id, card.artworkPrompt);
}

export function compareRows(
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
      return (
        a.catalogSeriesType.localeCompare(b.catalogSeriesType) * dir ||
        a.catalogSeriesLabel.localeCompare(b.catalogSeriesLabel, undefined, {
          sensitivity: "base",
        }) * dir ||
        cmp(a.catalogNumber, b.catalogNumber)
      );
    }
    case "catalogNo": {
      return (
        a.catalogSeriesType.localeCompare(b.catalogSeriesType) * dir ||
        a.catalogSeriesLabel.localeCompare(b.catalogSeriesLabel, undefined, {
          sensitivity: "base",
        }) * dir ||
        cmp(a.catalogNumber, b.catalogNumber)
      );
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
        ap.localeCompare(bp, undefined, { sensitivity: "base" }) * dir
      );
    }
    default:
      return 0;
  }
}
