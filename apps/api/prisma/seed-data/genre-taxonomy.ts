import {
  APP_GENRE_NAMES,
  APP_GENRE_THEMES,
  SUBGENRES,
  type RootGenreName,
} from "@repo/cards-domain";
import { ROOT_GENRE_PRINTED_TYPE_CODE, TERRITORY_PRINTED_TYPE_CODE } from "./type-codes";
import { Intensity, Prisma, type PrismaClient } from "@prisma/client";

const WHEEL_ORDER = [
  "Reggae/Dub",
  "Electronic",
  "Disco/Funk",
  "Hip-Hop",
  "Rock",
  "Classical",
  "Vintage",
] as const;

export async function seedGenres(prisma: PrismaClient): Promise<void> {
  // Validate no code is used for both a root genre and a territory
  const genreCodes = new Set(Object.values(ROOT_GENRE_PRINTED_TYPE_CODE));
  const territoryCodes = new Set(Object.values(TERRITORY_PRINTED_TYPE_CODE));
  const overlap = [...genreCodes].filter((c) => territoryCodes.has(c));
  if (overlap.length > 0) {
    throw new Error(`Genre/territory code collision: ${overlap.join(", ")}`);
  }

  // Pass 1: Register all TypeCode values (must exist before Genre and Territory rows)
  for (const code of [...genreCodes, ...territoryCodes]) {
    await prisma.typeCode.upsert({
      where: { code },
      create: { code },
      update: {},
    });
  }

  // Pass 2: Seed all Territory rows from the canonical territory map
  for (const [name, code] of Object.entries(TERRITORY_PRINTED_TYPE_CODE)) {
    await prisma.territory.upsert({
      where: { name },
      create: { name, code },
      update: { code },
    });
  }

  // Pass 3: Root genre rows (wheel anchors, no parent)
  for (const name of APP_GENRE_NAMES) {
    const wheelIdx = WHEEL_ORDER.indexOf(name as (typeof WHEEL_ORDER)[number]);
    const code = ROOT_GENRE_PRINTED_TYPE_CODE[name as RootGenreName];
    await prisma.genre.upsert({
      where: { name },
      create: {
        name,
        intensity: name === "Mainstream" ? Intensity.POP : Intensity.SOFT,
        displayLabel: name === "Mainstream" ? "Pop" : null,
        wheelOrder: wheelIdx >= 0 ? wheelIdx + 1 : null,
        code,
        theme:
          (
            APP_GENRE_THEMES as unknown as Record<string, Prisma.InputJsonValue>
          )[name] ?? Prisma.DbNull,
      },
      update: {
        code,
        theme:
          (
            APP_GENRE_THEMES as unknown as Record<string, Prisma.InputJsonValue>
          )[name] ?? Prisma.DbNull,
      },
    });
  }

  // Pass 4: Subgenre rows
  for (const sub of SUBGENRES) {
    if (sub.kind === "country") {
      const territory = await prisma.territory.findUniqueOrThrow({
        where: { name: sub.parentA },
      });
      await prisma.genre.upsert({
        where: { name: sub.n },
        create: {
          name: sub.n,
          intensity: sub.intensity as Intensity,
          colorOverride: sub.color ?? null,
          parentTerritoryId: territory.id,
        },
        update: {
          parentTerritoryId: territory.id,
          parentId: null,
          code: null,
        },
      });
    } else {
      const parent = await prisma.genre.findUniqueOrThrow({
        where: { name: sub.parentA },
      });
      const parentBId = sub.parentB
        ? (
            await prisma.genre.findUniqueOrThrow({ where: { name: sub.parentB } })
          ).id
        : null;
      const influenceId = sub.influence
        ? (
            await prisma.genre.findUniqueOrThrow({
              where: { name: sub.influence.genre },
            })
          ).id
        : null;

      await prisma.genre.upsert({
        where: { name: sub.n },
        create: {
          name: sub.n,
          parentId: parent.id,
          parentBId,
          intensity: sub.intensity as Intensity,
          colorOverride: sub.color ?? null,
          influenceId,
          influenceIntensity: sub.influence
            ? (sub.influence.intensity as Intensity)
            : null,
        },
        update: {
          parentId: parent.id,
          parentBId,
          code: null,
          parentTerritoryId: null,
        },
      });
    }
  }
}
