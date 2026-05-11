import { describe, expect, it } from "vitest";
import type { CatalogEntry } from "@/lib/cards";
import type { GenreTheme } from "@/lib/card-theme-types";
import {
  artworkBasename,
  artworkPromptPreview,
  cardArtworkSrc,
  compareRows,
  formatArtworkCreatedAtDisplay,
} from "./catalog-table-utils";

const fakeTheme = {} as GenreTheme;

function makeEntry(overrides: Partial<CatalogEntry> & { card?: Partial<CatalogEntry["card"]> } = {}): CatalogEntry {
  const { card: cardOverrides, ...rest } = overrides;
  return {
    rowKey: "test",
    kind: "Genre",
    theme: fakeTheme,
    catalogSeriesType: "genre",
    catalogSeriesLabel: "Rock",
    catalogNumber: 1,
    catalogGenreLabel: "Rock",
    catalogIntensity: "POP",
    catalogEra: "Era I",
    ...rest,
    card: {
      id: 1,
      title: "Test",
      ability: "Reserve",
      abilityDesc: "desc",
      pop: 5,
      rarity: "CLASSIC",
      year: "2000",
      genre: "Rock",
      ...cardOverrides,
    },
  };
}

// ─── artworkBasename ─────────────────────────────────────────────────────────

describe("artworkBasename", () => {
  it("returns the last path segment of a URL", () => {
    expect(artworkBasename("https://cdn.example.com/deck/bohemian.png")).toBe("bohemian.png");
  });

  it("returns the string unchanged when there is no slash", () => {
    expect(artworkBasename("file.png")).toBe("file.png");
  });

  it("returns empty string for undefined", () => {
    expect(artworkBasename(undefined)).toBe("");
  });
});

// ─── cardArtworkSrc ──────────────────────────────────────────────────────────

describe("cardArtworkSrc", () => {
  it("prefers artworkUrl over artwork", () => {
    const card = makeEntry({ card: { artworkUrl: "url", artwork: "bundled" } }).card;
    expect(cardArtworkSrc(card)).toBe("url");
  });

  it("falls back to artwork when artworkUrl is absent", () => {
    const card = makeEntry({ card: { artwork: "bundled" } }).card;
    expect(cardArtworkSrc(card)).toBe("bundled");
  });

  it("returns undefined when neither is set", () => {
    const card = makeEntry().card;
    expect(cardArtworkSrc(card)).toBeUndefined();
  });
});

// ─── artworkPromptPreview ────────────────────────────────────────────────────

describe("artworkPromptPreview", () => {
  it("returns the full text when it is 7 words or fewer", () => {
    const { preview, hasMore } = artworkPromptPreview("one two three four five six seven");
    expect(preview).toBe("one two three four five six seven");
    expect(hasMore).toBe(false);
  });

  it("truncates at 7 words and sets hasMore when longer", () => {
    const { preview, hasMore } = artworkPromptPreview("one two three four five six seven eight nine");
    expect(preview).toBe("one two three four five six seven…");
    expect(hasMore).toBe(true);
  });

  it("handles leading/trailing whitespace", () => {
    const { preview } = artworkPromptPreview("  hello world  ");
    expect(preview).toBe("hello world");
  });
});

// ─── formatArtworkCreatedAtDisplay ──────────────────────────────────────────

describe("formatArtworkCreatedAtDisplay", () => {
  it("formats a datetime string as DD/MM/YYYY HH:MM:SS", () => {
    expect(formatArtworkCreatedAtDisplay("2024-03-15T14:30:00")).toBe("15/03/2024 14:30:00");
  });

  it("fills in :00 seconds when seconds are absent", () => {
    expect(formatArtworkCreatedAtDisplay("2024-03-15T14:30")).toBe("15/03/2024 14:30:00");
  });

  it("formats a date-only string as DD/MM/YYYY", () => {
    expect(formatArtworkCreatedAtDisplay("2024-03-15")).toBe("15/03/2024");
  });

  it("returns the raw string unchanged for unrecognised formats", () => {
    expect(formatArtworkCreatedAtDisplay("march 2024")).toBe("march 2024");
  });
});

// ─── compareRows ─────────────────────────────────────────────────────────────

describe("compareRows", () => {
  it("sorts by id numerically", () => {
    const a = makeEntry({ card: { id: 10 } });
    const b = makeEntry({ card: { id: 2 } });
    expect(compareRows(a, b, "id", true)).toBeGreaterThan(0);
    expect(compareRows(a, b, "id", false)).toBeLessThan(0);
  });

  it("sorts by title alphabetically", () => {
    const a = makeEntry({ card: { title: "Bohemian Rhapsody" } });
    const b = makeEntry({ card: { title: "Hotel California" } });
    expect(compareRows(a, b, "title", true)).toBeLessThan(0);
    expect(compareRows(a, b, "title", false)).toBeGreaterThan(0);
  });

  it("treats missing artist as empty string", () => {
    const a = makeEntry({ card: { artist: undefined } });
    const b = makeEntry({ card: { artist: "Zz Top" } });
    expect(compareRows(a, b, "artist", true)).toBeLessThan(0);
  });

  it("sorts rarity in defined order (NICHE < BANGER < CLASSIC < LEGENDARY)", () => {
    const niche = makeEntry({ card: { rarity: "NICHE" } });
    const legendary = makeEntry({ card: { rarity: "LEGENDARY" } });
    expect(compareRows(niche, legendary, "rarity", true)).toBeLessThan(0);
    expect(compareRows(legendary, niche, "rarity", true)).toBeGreaterThan(0);
  });

  it("puts cards without artwork before cards with artwork (asc)", () => {
    const withArt = makeEntry({ card: { artworkUrl: "https://example.com/a.png" } });
    const noArt = makeEntry();
    expect(compareRows(noArt, withArt, "artwork", true)).toBeLessThan(0);
    expect(compareRows(withArt, noArt, "artwork", true)).toBeGreaterThan(0);
  });

  it("puts cards without artworkCreatedAt at the natural end of the sort direction", () => {
    const withDate = makeEntry({ card: { artworkCreatedAt: "2024-01-01" } });
    const noDate = makeEntry();
    // ascending: null dates go after dated entries
    expect(compareRows(noDate, withDate, "artworkCreatedAt", true)).toBeGreaterThan(0);
    // descending: null dates go before dated entries (at start of desc list)
    expect(compareRows(noDate, withDate, "artworkCreatedAt", false)).toBeLessThan(0);
  });

  it("sorts artworkCreatedAt chronologically", () => {
    const older = makeEntry({ card: { artworkCreatedAt: "2023-01-01" } });
    const newer = makeEntry({ card: { artworkCreatedAt: "2024-06-15" } });
    expect(compareRows(older, newer, "artworkCreatedAt", true)).toBeLessThan(0);
    expect(compareRows(older, newer, "artworkCreatedAt", false)).toBeGreaterThan(0);
  });

  it("sorts by pop numerically", () => {
    const lo = makeEntry({ card: { pop: 2 } });
    const hi = makeEntry({ card: { pop: 8 } });
    expect(compareRows(lo, hi, "pop", true)).toBeLessThan(0);
  });

  it("returns 0 for an unknown sort key", () => {
    const a = makeEntry();
    const b = makeEntry();
    // @ts-expect-error intentional unknown key
    expect(compareRows(a, b, "unknown", true)).toBe(0);
  });
});
