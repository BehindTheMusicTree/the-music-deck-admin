/** Catalog seed — `rowKey` = slugified `title-year`; see ./README.md */
import { basename } from "node:path";
import { CardKind, PrismaClient } from "@prisma/client";

function persistedArtist(value: string | undefined | null): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}
import {
  APP_GENRE_NAMES,
  assignCatalogRowKeys,
  printedTypeCodeForSongCard,
  type CardData,
  type WishlistCardDef,
} from "@repo/cards-domain";
import {
  formatPrintedSetId,
  printedTypeCodeForTransitionGenre,
  PRINTED_DEFAULT_SEASON,
} from "./seed-data/type-codes";
import { seedGenres } from "./seed-data/genre-taxonomy";
import { ALL_GENRE_CARDS } from "./seed-data/genre";
import { WORLD_FLAG_CARDS, WORLD_MIXED_CARDS } from "./seed-data/world";
import { LA_MACARENA_CARD } from "./seed-data/la-macarena";
import { WISHLIST_CARD_DEFS } from "./seed-data/catalog-wishlist-defs";
import { WIKIPEDIA_URLS } from "./seed-data/wikipedia-urls";
import { STREAMING_URLS } from "./seed-data/streaming-urls";

const prisma = new PrismaClient();

type Db = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

type ShippedRow = { card: CardData; rowKey: string };
type WishlistRow = { def: WishlistCardDef; rowKey: string };
type TransitionRow = {
  id: number;
  rowKey: string;
  title: string;
  genre: string | null;
};

function shippedCards(): CardData[] {
  return [
    ...ALL_GENRE_CARDS,
    ...WORLD_FLAG_CARDS,
    ...WORLD_MIXED_CARDS,
    LA_MACARENA_CARD,
  ];
}

function maxShippedDeckId(cards: CardData[]): number {
  return cards.reduce((max, c) => (c.id < 1000 ? Math.max(max, c.id) : max), 0);
}

function compactWishlistDefs(
  defs: WishlistCardDef[],
  cards: CardData[],
): WishlistCardDef[] {
  let nextId = maxShippedDeckId(cards) + 1;
  const used = new Set(cards.map((c) => c.id));
  return defs.map((def) => {
    while (used.has(nextId)) nextId += 1;
    const id = nextId;
    nextId += 1;
    used.add(id);
    return { ...def, id };
  });
}

function collectRows(): { shipped: ShippedRow[]; wishlist: WishlistRow[] } {
  const shipped = shippedCards();
  const compactWishlist = compactWishlistDefs(WISHLIST_CARD_DEFS, shipped);
  const all = [
    ...shipped.map((c) => ({ id: c.id, title: c.title, year: c.year })),
    ...compactWishlist.map((d) => ({ id: d.id, title: d.title, year: d.year })),
  ];
  const rowKeyMap = assignCatalogRowKeys(all);

  return {
    shipped: shipped.map((card) => ({ card, rowKey: rowKeyMap.get(card.id)! })),
    wishlist: compactWishlist.map((def) => ({
      def,
      rowKey: rowKeyMap.get(def.id)!,
    })),
  };
}

function collectTransitionRows(shipped: ShippedRow[], wishlist: WishlistRow[]): TransitionRow[] {
  let nextId =
    Math.max(
      0,
      ...shipped.map((r) => r.card.id),
      ...wishlist.map((r) => r.def.id),
    ) + 1;

  return APP_GENRE_NAMES.map((genre) => {
    const id = nextId;
    nextId += 1;
    return {
      id,
      rowKey: `transition-${genre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: `${genre} Transition`,
      genre,
    };
  });
}

async function loadPrintedTypeCodeByGenreName(db: Db): Promise<Map<string, string>> {
  const [genreRows, territoryRows] = await Promise.all([
    db.genre.findMany({
      where: { code: { not: null } },
      select: { name: true, code: true },
    }),
    db.territory.findMany({ select: { name: true, code: true } }),
  ]);
  const out = new Map<string, string>();
  for (const r of genreRows) if (r.code) out.set(r.name, r.code);
  for (const r of territoryRows) out.set(r.name, r.code);
  return out;
}

/** Global S1 numbering: one sequence for shipped songs + transition pillars (sorted by numeric id). */
async function computePrintedSetIdsByCardId(
  shipped: ShippedRow[],
  transitions: TransitionRow[],
  codeByAnchorName: ReadonlyMap<string, string>,
): Promise<Map<number, string>> {
  type Tagged =
    | { id: number; kind: "song"; card: CardData }
    | { id: number; kind: "transition"; genre: string };

  const merged: Tagged[] = [
    ...shipped.map((r) => ({ id: r.card.id, kind: "song" as const, card: r.card })),
    ...transitions.map((t) => ({
      id: t.id,
      kind: "transition" as const,
      genre: t.genre ?? "",
    })),
  ];
  merged.sort((a, b) => a.id - b.id);

  const season = PRINTED_DEFAULT_SEASON;
  const out = new Map<number, string>();
  let seq = 1;
  for (const row of merged) {
    const typeCode =
      row.kind === "song"
        ? printedTypeCodeForSongCard(
            {
              genre: row.card.genre,
              country: row.card.country ?? null,
              title: row.card.title,
              id: row.card.id,
            },
            codeByAnchorName,
          )
        : printedTypeCodeForTransitionGenre(row.genre, codeByAnchorName);
    out.set(row.id, formatPrintedSetId(typeCode, season, seq));
    seq += 1;
  }
  return out;
}

function artworkKeyFromCard(card: CardData): string | null {
  if (!card.artwork) return null;
  return `card-artworks/${basename(card.artwork)}`;
}

function dateFromArtworkCreatedAt(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function upsertShipped(db: Db, row: ShippedRow, printedSetId: string): Promise<void> {
  const { card, rowKey } = row;
  const genreRow = card.genre
    ? await db.genre.findUnique({
        where: { name: card.genre },
        select: { id: true },
      })
    : null;
  const territoryName = card.country?.trim() ? card.country.trim() : null;
  const territoryRow = territoryName
    ? await db.territory.findUnique({
        where: { name: territoryName },
        select: { id: true },
      })
    : null;
  if (territoryName && !territoryRow) {
    throw new Error(`Unknown territory "${territoryName}" for song card ${card.id}`);
  }

  await db.card.upsert({
    where: { id: card.id },
    create: {
      id: card.id,
      rowKey,
      kind: CardKind.SONG,
      title: card.title,
      printedSetId,
      artworkKey: artworkKeyFromCard(card),
      artworkContentType: card.artwork ? "image/png" : null,
      artworkOffsetY: card.artworkOffsetY ?? null,
      artworkOverBorder: card.artworkOverBorder ?? false,
      artworkCreatedAt: dateFromArtworkCreatedAt(card.artworkCreatedAt),
      artworkPrompt: card.artworkPrompt ?? null,
    },
    update: {
      rowKey,
      kind: CardKind.SONG,
      title: card.title,
      printedSetId,
      artworkKey: artworkKeyFromCard(card),
      artworkContentType: card.artwork ? "image/png" : null,
      artworkOffsetY: card.artworkOffsetY ?? null,
      artworkOverBorder: card.artworkOverBorder ?? false,
      artworkCreatedAt: dateFromArtworkCreatedAt(card.artworkCreatedAt),
      artworkPrompt: card.artworkPrompt ?? null,
    },
  });

  await db.songCard.upsert({
    where: { id: card.id },
    create: {
      id: card.id,
      artist: persistedArtist(card.artist),
      year: card.year,
      genreId: genreRow?.id ?? null,
      territoryId: territoryRow?.id ?? null,
      ability: card.ability,
      abilityDesc: card.abilityDesc,
      pop: card.pop,
      rarity: card.rarity,
      catalogNumber: card.catalogNumber ?? null,
      wikipediaUrl: WIKIPEDIA_URLS[card.id] ?? null,
      spotifyUrl: STREAMING_URLS[card.id]?.spotifyUrl ?? null,
      appleMusicUrl: STREAMING_URLS[card.id]?.appleMusicUrl ?? null,
      youtubeUrl: STREAMING_URLS[card.id]?.youtubeUrl ?? null,
      bandcampUrl: STREAMING_URLS[card.id]?.bandcampUrl ?? null,
      soundcloudUrl: STREAMING_URLS[card.id]?.soundcloudUrl ?? null,
    },
    update: {
      artist: persistedArtist(card.artist),
      year: card.year,
      genreId: genreRow?.id ?? undefined,
      territoryId: territoryRow?.id ?? null,
      ability: card.ability,
      abilityDesc: card.abilityDesc,
      pop: card.pop,
      rarity: card.rarity,
      catalogNumber: card.catalogNumber ?? null,
      wikipediaUrl: WIKIPEDIA_URLS[card.id] ?? null,
      spotifyUrl: STREAMING_URLS[card.id]?.spotifyUrl ?? null,
      appleMusicUrl: STREAMING_URLS[card.id]?.appleMusicUrl ?? null,
      youtubeUrl: STREAMING_URLS[card.id]?.youtubeUrl ?? null,
      bandcampUrl: STREAMING_URLS[card.id]?.bandcampUrl ?? null,
      soundcloudUrl: STREAMING_URLS[card.id]?.soundcloudUrl ?? null,
    },
  });
}

async function upsertWishlist(db: Db, row: WishlistRow): Promise<void> {
  const { def, rowKey } = row;
  await db.wishlistSong.upsert({
    where: { id: def.id },
    create: {
      id: def.id,
      rowKey,
      title: def.title,
      artist: persistedArtist(def.artist),
      year: def.year ?? null,
      genre: def.genre ?? null,
      country: def.country ?? null,
      ability: def.ability ?? null,
      abilityDesc: def.abilityDesc ?? null,
      pop: def.pop ?? null,
      rarity: def.rarity ?? null,
      artworkPrompt: def.artworkPrompt ?? null,
      wikipediaUrl: WIKIPEDIA_URLS[def.id] ?? null,
      spotifyUrl: STREAMING_URLS[def.id]?.spotifyUrl ?? null,
      appleMusicUrl: STREAMING_URLS[def.id]?.appleMusicUrl ?? null,
      youtubeUrl: STREAMING_URLS[def.id]?.youtubeUrl ?? null,
      bandcampUrl: STREAMING_URLS[def.id]?.bandcampUrl ?? null,
      soundcloudUrl: STREAMING_URLS[def.id]?.soundcloudUrl ?? null,
    },
    update: {
      rowKey,
      title: def.title,
      artist: persistedArtist(def.artist),
      year: def.year ?? null,
      genre: def.genre ?? null,
      country: def.country ?? null,
      ability: def.ability ?? null,
      abilityDesc: def.abilityDesc ?? null,
      pop: def.pop ?? null,
      rarity: def.rarity ?? null,
      artworkPrompt: def.artworkPrompt ?? null,
      wikipediaUrl: WIKIPEDIA_URLS[def.id] ?? null,
      spotifyUrl: STREAMING_URLS[def.id]?.spotifyUrl ?? null,
      appleMusicUrl: STREAMING_URLS[def.id]?.appleMusicUrl ?? null,
      youtubeUrl: STREAMING_URLS[def.id]?.youtubeUrl ?? null,
      bandcampUrl: STREAMING_URLS[def.id]?.bandcampUrl ?? null,
      soundcloudUrl: STREAMING_URLS[def.id]?.soundcloudUrl ?? null,
    },
  });
}

async function upsertTransition(db: Db, row: TransitionRow, printedSetId: string): Promise<void> {
  const genreRow = row.genre
    ? await db.genre.findUnique({
        where: { name: row.genre },
        select: { id: true },
      })
    : null;

  await db.card.upsert({
    where: { id: row.id },
    create: {
      id: row.id,
      rowKey: row.rowKey,
      kind: CardKind.TRANSITION,
      title: row.title,
      printedSetId,
    },
    update: {
      rowKey: row.rowKey,
      kind: CardKind.TRANSITION,
      title: row.title,
      printedSetId,
    },
  });

  await db.transitionCard.upsert({
    where: { id: row.id },
    create: {
      id: row.id,
      genre: row.genre,
      genreId: genreRow?.id ?? null,
    },
    update: {
      genre: row.genre,
      genreId: genreRow?.id ?? undefined,
    },
  });
}

async function replaceSongs(
  db: Db,
  card: CardData,
  validIds: Set<number>,
): Promise<void> {
  const desired = (card.songsOut ?? []).filter((id) => {
    if (!validIds.has(id)) {
      throw new Error(
        `Card "${card.title}" (${card.id}) songsOut references unknown id ${id}`,
      );
    }
    return true;
  });
  await db.songSongTransition.deleteMany({ where: { fromId: card.id } });
  if (desired.length === 0) return;
  await db.songSongTransition.createMany({
    data: desired.map((toId) => ({ fromId: card.id, toId })),
    skipDuplicates: true,
  });
}

async function main(): Promise<void> {
  const existing = await prisma.card.count();
  if (existing > 0) {
    console.log("Seed: database already populated, skipping.");
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await seedGenres(tx as unknown as PrismaClient);
      const codeByAnchorName = await loadPrintedTypeCodeByGenreName(tx);
      const { shipped, wishlist } = collectRows();
      const transitions = collectTransitionRows(shipped, wishlist);
      const printedById = await computePrintedSetIdsByCardId(
        shipped,
        transitions,
        codeByAnchorName,
      );
      const validSongIds = new Set(shipped.map((r) => r.card.id));

      for (const row of shipped)
        await upsertShipped(tx, row, printedById.get(row.card.id)!);
      for (const row of shipped) await replaceSongs(tx, row.card, validSongIds);
      for (const row of wishlist) await upsertWishlist(tx, row);
      for (const row of transitions)
        await upsertTransition(tx, row, printedById.get(row.id)!);

      console.log(
        `Seed: ${shipped.length} songs, ${wishlist.length} wishlist songs, and ${transitions.length} transition cards inserted.`,
      );
    },
    { timeout: 60_000 },
  );
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
