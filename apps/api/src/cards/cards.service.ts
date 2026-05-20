import { createHash } from "node:crypto";
import { basename } from "node:path";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Card, CardKind, CardRarity, Prisma, SongCard, WishlistSong } from "@prisma/client";
import {
  printedSetIdTypeSegment,
  printedTypeCodeForSongCard,
} from "@repo/cards-domain";
import { PrismaService } from "../prisma/prisma.service";
import { S3Service } from "../storage/s3.service";
import {
  CardListQuery,
  CardResponse,
  CardSongIndexEntryDto,
  CreateCardDto,
  GenreTaxonomyEntryDto,
  GenreTaxonomyKindValue,
  GenreTaxonomyResponse,
  GenreThemeDto,
  UpdateCardDto,
} from "./cards.dto";

function persistedArtist(value: string | undefined | null): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

/** Undefined = omit patch; null or blank = clear to null. */
function patchArtist(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return persistedArtist(value);
}

function normalizeCountry(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

type SongFull = SongCard & {
  card: Card;
  songsOut: { fromId: number; toId: number }[];
  genreRef: {
    id: number;
    name: string;
    theme: Prisma.JsonValue | null;
    parent: { theme: Prisma.JsonValue | null } | null;
  } | null;
  territory: { name: string } | null;
};

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService,
    private readonly s3: S3Service,
  ) {}

  /**
   * Compose the public artwork URL from the bucket key.
   * Falls back to undefined when no key (placeholder cards) or no bucket configured.
   */
  artworkUrlFor(card: Pick<Card, "artworkKey">): string | undefined {
    if (!card.artworkKey) return undefined;
    const base = this.config.get<string>("S3_PUBLIC_BASE_URL");
    if (!base) return undefined;
    return `${base.replace(/\/+$/, "")}/${card.artworkKey}`;
  }

  private songToResponse(song: SongFull): CardResponse {
    const genreRef = song.genreRef;
    return {
      id: song.id,
      rowKey: song.card.rowKey,
      status: "Shipped",
      kind: "SONG",
      title: song.card.title,
      artist: song.artist ?? undefined,
      year: song.year ?? undefined,
      genre: genreRef?.name ?? "",
      genreId: genreRef?.id,
      genreTheme: toGenreThemeDto(genreRef?.theme ?? genreRef?.parent?.theme),
      country: song.territory?.name ?? undefined,
      ability: song.ability,
      abilityDesc: song.abilityDesc,
      pop: song.pop,
      rarity: song.rarity,
      catalogNumber: song.catalogNumber ?? undefined,
      printedSetId: song.card.printedSetId ?? undefined,
      artworkUrl: this.artworkUrlFor(song.card),
      artworkKey: song.card.artworkKey ?? undefined,
      artworkContentType: song.card.artworkContentType ?? undefined,
      artworkBytes: song.card.artworkBytes ?? undefined,
      artworkChecksum: song.card.artworkChecksum ?? undefined,
      artworkOffsetY: song.card.artworkOffsetY ?? undefined,
      artworkOverBorder: song.card.artworkOverBorder,
      artworkCreatedAt: song.card.artworkCreatedAt
        ? song.card.artworkCreatedAt.toISOString()
        : undefined,
      artworkPrompt: song.card.artworkPrompt ?? undefined,
      wikipediaUrl: song.wikipediaUrl ?? undefined,
      spotifyUrl: song.spotifyUrl ?? undefined,
      appleMusicUrl: song.appleMusicUrl ?? undefined,
      youtubeUrl: song.youtubeUrl ?? undefined,
      bandcampUrl: song.bandcampUrl ?? undefined,
      soundcloudUrl: song.soundcloudUrl ?? undefined,
      songsOut: song.songsOut.map((t) => t.toId),
    };
  }

  private wishlistToResponse(row: WishlistSong): CardResponse {
    return {
      id: row.id,
      rowKey: row.rowKey,
      status: "Wishlist",
      kind: "SONG",
      title: row.title,
      artist: row.artist ?? undefined,
      year: row.year ?? undefined,
      genre: row.genre ?? "",
      country: row.country ?? undefined,
      ability: row.ability ?? "",
      abilityDesc: row.abilityDesc ?? "",
      pop: row.pop ?? 0,
      rarity: row.rarity ?? "NICHE",
      artworkPrompt: row.artworkPrompt ?? undefined,
      wikipediaUrl: row.wikipediaUrl ?? undefined,
      spotifyUrl: row.spotifyUrl ?? undefined,
      appleMusicUrl: row.appleMusicUrl ?? undefined,
      youtubeUrl: row.youtubeUrl ?? undefined,
      bandcampUrl: row.bandcampUrl ?? undefined,
      soundcloudUrl: row.soundcloudUrl ?? undefined,
      comment: row.comment ?? undefined,
      songsOut: [],
    };
  }

  async list(query: CardListQuery): Promise<CardResponse[]> {
    if (query.status === "Wishlist") return this.wishlist();
    if (query.status === "Shipped") return this.catalog();

    const [songs, wishlist] = await Promise.all([
      this.catalog(),
      this.wishlist(),
    ]);
    let rows = [...songs, ...wishlist];
    if (query.genre) rows = rows.filter((r) => r.genre === query.genre);
    if (query.country) rows = rows.filter((r) => r.country === query.country);
    return rows.sort((a, b) => a.id - b.id);
  }

  async getById(id: number): Promise<CardResponse> {
    const song = await this.prisma.songCard.findUnique({
      where: { id },
      include: SONG_INCLUDE,
    });
    if (song) return this.songToResponse(song);
    const wishlist = await this.prisma.wishlistSong.findUnique({
      where: { id },
    });
    if (wishlist) return this.wishlistToResponse(wishlist);
    throw new NotFoundException(`Card ${id} not found`);
  }

  async catalog(): Promise<CardResponse[]> {
    const where: Prisma.SongCardWhereInput = {};
    const songs = await this.prisma.songCard.findMany({
      where,
      include: SONG_INCLUDE,
      orderBy: { id: "asc" },
    });
    return songs.map((s) => this.songToResponse(s));
  }

  async wishlist(): Promise<CardResponse[]> {
    const rows = await this.prisma.wishlistSong.findMany({
      orderBy: { id: "asc" },
    });
    return rows.map((r) => this.wishlistToResponse(r));
  }

  async trackIndex(): Promise<Record<number, CardSongIndexEntryDto>> {
    const songs = await this.prisma.songCard.findMany({
      include: SONG_INCLUDE,
      orderBy: { id: "asc" },
    });
    const index: Record<number, CardSongIndexEntryDto> = {};
    for (const s of songs) {
      index[s.id] = {
        id: s.id,
        title: s.card.title,
        artist: s.artist ?? undefined,
        genre: s.genreRef?.name ?? "",
        artworkUrl: this.artworkUrlFor(s.card),
        printedSetId: s.card.printedSetId ?? undefined,
        songsOut: s.songsOut.map((t) => t.toId),
      };
    }
    return index;
  }

  async genreTaxonomy(): Promise<GenreTaxonomyResponse> {
    const genres = await this.prisma.genre.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
        parentBId: true,
        parentTerritoryId: true,
        intensity: true,
        displayLabel: true,
        code: true,
        theme: true,
        updatedAt: true,
      },
      orderBy: { id: "asc" },
    });
    const latestUpdatedAt = genres.reduce<Date | null>(
      (latest, row) =>
        !latest || row.updatedAt > latest ? row.updatedAt : latest,
      null,
    );
    const updatedAt = (latestUpdatedAt ?? new Date(0)).toISOString();
    const entries: GenreTaxonomyEntryDto[] = genres.map((g) => ({
      id: g.id,
      name: g.name,
      parentId: g.parentId ?? undefined,
      parentBId: g.parentBId ?? undefined,
      parentTerritoryId: g.parentTerritoryId ?? undefined,
      intensity: g.intensity,
      displayLabel: g.displayLabel ?? undefined,
      theme: toGenreThemeDto(g.theme),
      kind: classifyGenreKind(g.parentTerritoryId, g.parentId ?? null),
      code: g.code ?? undefined,
      updatedAt: g.updatedAt.toISOString(),
    }));
    return {
      taxonomyVersion: updatedAt,
      updatedAt,
      entries,
    };
  }

  async create(dto: CreateCardDto): Promise<CardResponse> {
    const songsOut = dto.songsOut ?? [];
    return this.prisma.$transaction(async (tx) => {
      const existingSong = await tx.songCard.findUnique({ where: { id: dto.id } });
      const existingWishlist = await tx.wishlistSong.findUnique({
        where: { id: dto.id },
      });
      if (existingSong)
        throw new ConflictException(`Card ${dto.id} already exists`);
      if (existingWishlist)
        throw new ConflictException(`Card ${dto.id} already exists`);
      const conflictCard = await tx.card.findUnique({
        where: { rowKey: dto.rowKey },
      });
      if (conflictCard) {
        throw new ConflictException(
          `Card with rowKey "${dto.rowKey}" already exists`,
        );
      }
      if (dto.printedSetId) {
        const byPrinted = await tx.card.findFirst({
          where: { printedSetId: dto.printedSetId },
        });
        if (byPrinted)
          throw new ConflictException(
            `Card with printedSetId "${dto.printedSetId}" already exists`,
          );
      }
      if (dto.status === "Shipped") {
        if (!dto.genre)
          throw new BadRequestException("genre is required for shipped songs");
        if (!dto.ability)
          throw new BadRequestException(
            "ability is required for shipped songs",
          );
        if (!dto.abilityDesc)
          throw new BadRequestException(
            "abilityDesc is required for shipped songs",
          );
        if (dto.pop === undefined)
          throw new BadRequestException("pop is required for shipped songs");
        if (!dto.rarity)
          throw new BadRequestException("rarity is required for shipped songs");
        await this.assertSongsReferentialIntegrity(tx, songsOut, dto.id);
        const genreId = await this.resolveGenreId(tx, dto.genre);
        const territoryId = await this.resolveTerritoryId(tx, dto.country);
        await this.assertPrintedSetIdMatchesSongStripe(
          tx,
          dto.printedSetId,
          dto.genre,
          dto.country,
        );
        await tx.card.create({
          data: {
            id: dto.id,
            rowKey: dto.rowKey,
            kind: CardKind.SONG,
            title: dto.title,
            printedSetId: dto.printedSetId ?? null,
            artworkOffsetY: dto.artworkOffsetY ?? null,
            artworkOverBorder: dto.artworkOverBorder ?? false,
            artworkPrompt: dto.artworkPrompt ?? null,
          },
        });
        await tx.songCard.create({
          data: {
            id: dto.id,
            artist: persistedArtist(dto.artist),
            year: dto.year,
            genreId,
            territoryId,
            ability: dto.ability,
            abilityDesc: dto.abilityDesc,
            pop: dto.pop,
            rarity: dto.rarity as CardRarity,
            catalogNumber: dto.catalogNumber ?? null,
            wikipediaUrl: dto.wikipediaUrl ?? null,
            spotifyUrl: dto.spotifyUrl ?? null,
            appleMusicUrl: dto.appleMusicUrl ?? null,
            youtubeUrl: dto.youtubeUrl ?? null,
            bandcampUrl: dto.bandcampUrl ?? null,
            soundcloudUrl: dto.soundcloudUrl ?? null,
          },
        });
        if (songsOut.length > 0) {
          await tx.songSongTransition.createMany({
            data: songsOut.map((toId) => ({ fromId: dto.id, toId })),
            skipDuplicates: true,
          });
        }
      } else {
        await tx.wishlistSong.create({
          data: {
            id: dto.id,
            rowKey: dto.rowKey,
            title: dto.title,
            artist: persistedArtist(dto.artist),
            year: dto.year ?? null,
            genre: dto.genre ?? null,
            country: dto.country ?? null,
            ability: dto.ability ?? null,
            abilityDesc: dto.abilityDesc ?? null,
            pop: dto.pop ?? null,
            rarity: (dto.rarity as CardRarity) ?? null,
            artworkPrompt: dto.artworkPrompt ?? null,
            wikipediaUrl: dto.wikipediaUrl ?? null,
            spotifyUrl: dto.spotifyUrl ?? null,
            appleMusicUrl: dto.appleMusicUrl ?? null,
            youtubeUrl: dto.youtubeUrl ?? null,
            bandcampUrl: dto.bandcampUrl ?? null,
            soundcloudUrl: dto.soundcloudUrl ?? null,
            comment: dto.comment ?? null,
          },
        });
      }
      return this.getById(dto.id);
    });
  }

  async update(id: number, dto: UpdateCardDto): Promise<CardResponse> {
    return this.prisma.$transaction(async (tx) => {
      const existingSong = await tx.songCard.findUnique({
        where: { id },
        include: {
          card: true,
          genreRef: { select: { name: true } },
          territory: { select: { name: true } },
        },
      });
      const existingWishlist = await tx.wishlistSong.findUnique({
        where: { id },
      });
      if (!existingSong && !existingWishlist)
        throw new NotFoundException(`Card ${id} not found`);
      const existingRowKey = existingSong
        ? existingSong.card.rowKey
        : (existingWishlist?.rowKey ?? "");
      if (dto.rowKey && dto.rowKey !== existingRowKey) {
        const conflictCard = await tx.card.findUnique({
          where: { rowKey: dto.rowKey },
        });
        const conflictWishlist = await tx.wishlistSong.findUnique({
          where: { rowKey: dto.rowKey },
        });
        const conflict = conflictCard ?? conflictWishlist;
        if (conflict && conflict.id !== id) {
          throw new ConflictException(
            `Card with rowKey "${dto.rowKey}" already exists`,
          );
        }
      }
      if (existingSong) {
        const genreId = dto.genre
          ? await this.resolveGenreId(tx, dto.genre)
          : undefined;
        const territoryId =
          dto.country !== undefined
            ? await this.resolveTerritoryId(tx, dto.country)
            : undefined;
        const nextGenre =
          dto.genre ?? existingSong.genreRef?.name ?? "";
        const nextCountry =
          dto.country !== undefined
            ? normalizeCountry(dto.country)
            : existingSong.territory?.name;
        const nextPrintedSetId =
          dto.printedSetId !== undefined
            ? dto.printedSetId
            : existingSong.card.printedSetId;

        if (dto.printedSetId && dto.printedSetId !== existingSong.card.printedSetId) {
          const taken = await tx.card.findFirst({
            where: { printedSetId: dto.printedSetId },
            select: { id: true },
          });
          if (taken && taken.id !== id) {
            throw new ConflictException(
              `Card with printedSetId "${dto.printedSetId}" already exists`,
            );
          }
        }

        if (nextPrintedSetId) {
          await this.assertPrintedSetIdMatchesSongStripe(
            tx,
            nextPrintedSetId,
            nextGenre,
            nextCountry,
          );
        }

        await tx.songCard.update({
          where: { id },
          data: {
            artist: patchArtist(dto.artist),
            year: dto.year ?? undefined,
            genreId: genreId ?? undefined,
            territoryId,
            ability: dto.ability ?? undefined,
            abilityDesc: dto.abilityDesc ?? undefined,
            pop: dto.pop ?? undefined,
            rarity: dto.rarity ? (dto.rarity as CardRarity) : undefined,
            catalogNumber: dto.catalogNumber ?? undefined,
            wikipediaUrl: dto.wikipediaUrl ?? undefined,
            spotifyUrl: dto.spotifyUrl ?? undefined,
            appleMusicUrl: dto.appleMusicUrl ?? undefined,
            youtubeUrl: dto.youtubeUrl ?? undefined,
            bandcampUrl: dto.bandcampUrl ?? undefined,
            soundcloudUrl: dto.soundcloudUrl ?? undefined,
          },
        });
        await tx.card.update({
          where: { id },
          data: {
            rowKey: dto.rowKey ?? undefined,
            title: dto.title ?? undefined,
            printedSetId: dto.printedSetId ?? undefined,
            artworkOffsetY: dto.artworkOffsetY ?? undefined,
            artworkOverBorder: dto.artworkOverBorder ?? undefined,
            artworkPrompt: dto.artworkPrompt ?? undefined,
          },
        });
      } else {
        await tx.wishlistSong.update({
          where: { id },
          data: {
            rowKey: dto.rowKey ?? undefined,
            title: dto.title ?? undefined,
            artist: patchArtist(dto.artist),
            year: dto.year ?? undefined,
            genre: dto.genre ?? undefined,
            country: dto.country ?? undefined,
            ability: dto.ability ?? undefined,
            abilityDesc: dto.abilityDesc ?? undefined,
            pop: dto.pop ?? undefined,
            rarity: dto.rarity ? (dto.rarity as CardRarity) : undefined,
            wikipediaUrl: dto.wikipediaUrl ?? undefined,
            spotifyUrl: dto.spotifyUrl ?? undefined,
            appleMusicUrl: dto.appleMusicUrl ?? undefined,
            youtubeUrl: dto.youtubeUrl ?? undefined,
            bandcampUrl: dto.bandcampUrl ?? undefined,
            soundcloudUrl: dto.soundcloudUrl ?? undefined,
            artworkPrompt: dto.artworkPrompt ?? undefined,
            comment: dto.comment ?? undefined,
          },
        });
      }
      return this.getById(id);
    });
  }

  async remove(id: number): Promise<void> {
    const song = await this.prisma.songCard.findUnique({ where: { id } });
    if (song) {
      await this.prisma.card.delete({ where: { id } });
      return;
    }
    const wishlist = await this.prisma.wishlistSong.findUnique({
      where: { id },
    });
    if (!wishlist) throw new NotFoundException(`Card ${id} not found`);
    await this.prisma.wishlistSong.delete({ where: { id } });
  }

  async resolveArtworkRedirectUrl(id: number): Promise<string> {
    const c = await this.prisma.songCard.findUnique({
      where: { id },
      select: { card: { select: { artworkKey: true } } },
    });
    if (!c?.card.artworkKey) {
      throw new NotFoundException(`No artwork for card ${id}`);
    }
    const pub = this.s3.publicUrl(c.card.artworkKey);
    if (pub) return pub;
    return this.s3.signedGetUrl(c.card.artworkKey);
  }

  async uploadArtworkFile(
    id: number,
    file: Express.Multer.File,
  ): Promise<CardResponse> {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Empty file");
    }
    if (!/^image\//.test(file.mimetype)) {
      throw new BadRequestException("Only image uploads are allowed");
    }
    const deckBasename = safeDeckBasename(file.originalname ?? "", id);
    const key = `card-artworks/${deckBasename}`;
    const sha = createHash("sha256").update(file.buffer).digest("hex");
    const existing = await this.prisma.songCard.findUnique({
      where: { id },
      include: SONG_INCLUDE,
    });
    if (!existing) throw new NotFoundException(`Card ${id} not found`);
    if (
      existing.card.artworkChecksum === sha &&
      existing.card.artworkKey === key
    ) {
      return this.songToResponse(existing);
    }
    await this.s3.putObject(key, file.buffer, file.mimetype, file.size);
    if (existing.card.artworkKey && existing.card.artworkKey !== key) {
      try {
        await this.s3.deleteObject(existing.card.artworkKey);
      } catch {
        /* best-effort cleanup */
      }
    }
    return this.setArtworkMetadata(id, {
      artworkKey: key,
      artworkContentType: file.mimetype,
      artworkBytes: file.size,
      artworkChecksum: sha,
    });
  }

  async deleteArtworkFromBucket(id: number): Promise<CardResponse> {
    const existing = await this.prisma.songCard.findUnique({
      where: { id },
      include: { card: true },
    });
    if (!existing) throw new NotFoundException(`Card ${id} not found`);
    if (existing.card.artworkKey) {
      try {
        await this.s3.deleteObject(existing.card.artworkKey);
      } catch {
        /* ignore missing object */
      }
    }
    return this.clearArtworkMetadata(id);
  }

  async replaceSongsOut(id: number, songsOut: number[]): Promise<CardResponse> {
    return this.prisma.$transaction(async (tx) => {
      const sc = await tx.songCard.findUnique({ where: { id } });
      if (!sc) throw new NotFoundException(`Card ${id} not found`);
      await this.assertSongsReferentialIntegrity(tx, songsOut, id);
      await tx.songSongTransition.deleteMany({ where: { fromId: id } });
      if (songsOut.length > 0) {
        await tx.songSongTransition.createMany({
          data: songsOut.map((toId) => ({ fromId: id, toId })),
          skipDuplicates: true,
        });
      }
      const refreshed = await tx.songCard.findUnique({
        where: { id },
        include: SONG_INCLUDE,
      });
      if (!refreshed) throw new NotFoundException(`Card ${id} not found`);
      return this.songToResponse(refreshed);
    });
  }

  async setArtworkMetadata(
    id: number,
    metadata: {
      artworkKey: string;
      artworkContentType: string;
      artworkBytes: number;
      artworkChecksum: string;
    },
  ): Promise<CardResponse> {
    await this.prisma.card.update({
      where: { id },
      data: {
        artworkKey: metadata.artworkKey,
        artworkContentType: metadata.artworkContentType,
        artworkBytes: metadata.artworkBytes,
        artworkChecksum: metadata.artworkChecksum,
        artworkCreatedAt: new Date(),
      },
    });
    const sc = await this.prisma.songCard.findUnique({
      where: { id },
      include: SONG_INCLUDE,
    });
    if (!sc) throw new NotFoundException(`Card ${id} not found`);
    return this.songToResponse(sc);
  }

  async clearArtworkMetadata(id: number): Promise<CardResponse> {
    await this.prisma.card.update({
      where: { id },
      data: {
        artworkKey: null,
        artworkContentType: null,
        artworkBytes: null,
        artworkChecksum: null,
      },
    });
    const sc = await this.prisma.songCard.findUnique({
      where: { id },
      include: SONG_INCLUDE,
    });
    if (!sc) throw new NotFoundException(`Card ${id} not found`);
    return this.songToResponse(sc);
  }

  private async printedTypeCodeAnchorMap(
    tx: Prisma.TransactionClient,
  ): Promise<Map<string, string>> {
    const [genreRows, territoryRows] = await Promise.all([
      tx.genre.findMany({
        where: { code: { not: null } },
        select: { name: true, code: true },
      }),
      tx.territory.findMany({ select: { name: true, code: true } }),
    ]);
    const m = new Map<string, string>();
    for (const r of genreRows) if (r.code) m.set(r.name, r.code);
    for (const r of territoryRows) m.set(r.name, r.code);
    return m;
  }

  private async assertPrintedSetIdMatchesSongStripe(
    tx: Prisma.TransactionClient,
    printedSetId: string | null | undefined,
    genreStripe: string,
    country: string | null | undefined,
  ): Promise<void> {
    if (!printedSetId?.trim()) return;
    const map = await this.printedTypeCodeAnchorMap(tx);
    let expected: string;
    try {
      expected = printedTypeCodeForSongCard({ genre: genreStripe, country }, map);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : "Cannot resolve printed TYPE for genre",
      );
    }
    let parsed: string;
    try {
      parsed = printedSetIdTypeSegment(printedSetId);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : "Invalid printedSetId",
      );
    }
    if (parsed !== expected) {
      throw new BadRequestException(
        `printedSetId TYPE "${parsed}" does not match genre taxonomy (${expected} expected for stripe "${genreStripe}")`,
      );
    }
  }

  private async resolveGenreId(
    tx: Prisma.TransactionClient,
    genre: string,
  ): Promise<number> {
    const g = await tx.genre.findUnique({
      where: { name: genre },
      select: { id: true },
    });
    if (!g) throw new BadRequestException(`Unknown genre "${genre}"`);
    return g.id;
  }

  private async resolveTerritoryId(
    tx: Prisma.TransactionClient,
    country: string | null | undefined,
  ): Promise<number | null> {
    const normalized = normalizeCountry(country);
    if (normalized == null) return null;
    const t = await tx.territory.findUnique({
      where: { name: normalized },
      select: { id: true },
    });
    if (!t) throw new BadRequestException(`Unknown country "${normalized}"`);
    return t.id;
  }

  private async assertSongsReferentialIntegrity(
    tx: Prisma.TransactionClient,
    songsOut: number[],
    fromId: number,
  ): Promise<void> {
    const seen = new Set<number>();
    for (const id of songsOut) {
      if (seen.has(id)) {
        throw new ConflictException(
          `Duplicate songsOut id ${id} for card ${fromId}`,
        );
      }
      seen.add(id);
    }
    if (seen.size === 0) return;
    const found = await tx.songCard.findMany({
      where: { id: { in: Array.from(seen) } },
      select: { id: true },
    });
    if (found.length !== seen.size) {
      const foundIds = new Set(found.map((c) => c.id));
      const missing = Array.from(seen).filter((id) => !foundIds.has(id));
      throw new ConflictException(
        `songsOut references unknown card ids: ${missing.join(", ")}`,
      );
    }
  }
}

export function classifyGenreKind(
  parentTerritoryId: number | null | undefined,
  parentId: number | null,
): GenreTaxonomyKindValue {
  if (parentTerritoryId != null) return "COUNTRY_SUB_GENRE";
  if (!parentId) return "GENRE_ROOT";
  return "SUB_GENRE";
}

function toGenreThemeDto(
  raw: Prisma.JsonValue | null | undefined,
): GenreThemeDto | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const value = raw as Record<string, unknown>;
  if (
    typeof value.border !== "string" ||
    typeof value.headerBg !== "string" ||
    typeof value.textMain !== "string" ||
    typeof value.textBody !== "string" ||
    typeof value.parchStrip !== "string" ||
    typeof value.parchAbility !== "string" ||
    typeof value.barGlowPop !== "string" ||
    typeof value.barGlowExp !== "string" ||
    typeof value.icon !== "string" ||
    !isColorPair(value.barPop) ||
    !isColorPair(value.barExp)
  ) {
    return undefined;
  }
  return {
    border: value.border,
    frameBorder:
      typeof value.frameBorder === "string" ? value.frameBorder : undefined,
    frameBg: typeof value.frameBg === "string" ? value.frameBg : undefined,
    frameBackgroundPosition:
      typeof value.frameBackgroundPosition === "string"
        ? value.frameBackgroundPosition
        : undefined,
    frameRotateR90:
      typeof value.frameRotateR90 === "boolean"
        ? value.frameRotateR90
        : undefined,
    frameFilter:
      typeof value.frameFilter === "string" ? value.frameFilter : undefined,
    frameOpacity:
      typeof value.frameOpacity === "number" ? value.frameOpacity : undefined,
    headerBg: value.headerBg,
    textMain: value.textMain,
    textBody: value.textBody,
    parchStrip: value.parchStrip,
    parchAbility: value.parchAbility,
    barPop: value.barPop,
    barExp: value.barExp,
    barGlowPop: value.barGlowPop,
    barGlowExp: value.barGlowExp,
    typePip: toCardTypePip(value.typePip),
    icon: value.icon,
  };
}

function toCardTypePip(raw: unknown): GenreThemeDto["typePip"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const value = raw as Record<string, unknown>;
  return {
    symbol: toCardTypePipSymbol(value.symbol),
    flagBg: typeof value.flagBg === "string" ? value.flagBg : undefined,
  };
}

function toCardTypePipSymbol(
  raw: unknown,
): { sym: string; color: string; size?: number; svg?: string } | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const value = raw as Record<string, unknown>;
  if (typeof value.sym !== "string" || typeof value.color !== "string") {
    return undefined;
  }
  return {
    sym: value.sym,
    color: value.color,
    size: typeof value.size === "number" ? value.size : undefined,
    svg: typeof value.svg === "string" ? value.svg : undefined,
  };
}

function isColorPair(raw: unknown): raw is [string, string] {
  return (
    Array.isArray(raw) &&
    raw.length === 2 &&
    typeof raw[0] === "string" &&
    typeof raw[1] === "string"
  );
}

const SONG_INCLUDE = {
  card: true,
  songsOut: true,
  genreRef: {
    select: {
      id: true,
      name: true,
      theme: true,
      parent: { select: { theme: true } },
    },
  },
  territory: { select: { name: true } },
} satisfies Prisma.SongCardInclude;

function safeDeckBasename(original: string, id: number): string {
  const b = basename(original).replace(/[^a-zA-Z0-9._-]+/g, "_");
  if (!b || b === "." || b === "..") return `artwork-${id}.png`;
  return b.slice(0, 180);
}
