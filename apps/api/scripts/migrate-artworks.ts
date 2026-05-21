/**
 * Idempotent upload of bundled PNGs from the web app to S3.
 * Run from repo root: `pnpm --filter api artworks:migrate`
 *
 * Idempotency is based on S3 object existence, not DB state, so this is safe
 * to re-run after `db:reset` without re-uploading files already in S3.
 *
 * Requires DATABASE_URL + S3_* env (see apps/api/.env.example).
 */
import { createReadStream, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { ARTWORK_CREATED_AT } from "../prisma/seed-data/artwork-created-at";

type MigrateArtworksPrisma = {
  card: {
    findFirst(args: {
      where: { artworkKey: string; kind: "SONG" };
    }): Promise<{
      id: number;
      artworkKey: string | null;
      artworkChecksum: string | null;
    } | null>;
    update(args: {
      where: { id: number };
      data: {
        artworkKey: string;
        artworkContentType: string;
        artworkBytes: number;
        artworkChecksum: string;
        artworkCreatedAt: Date;
      };
    }): Promise<void>;
  };
  $disconnect(): Promise<void>;
};

const prisma = new PrismaClient() as unknown as MigrateArtworksPrisma;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env ${name}`);
  return v;
}

function s3Client(): S3Client {
  const region = process.env.S3_REGION ?? "us-east-1";
  const endpoint = process.env.S3_ENDPOINT;
  const forcePathStyle =
    process.env.S3_FORCE_PATH_STYLE === "true" ||
    process.env.S3_FORCE_PATH_STYLE === "1";
  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: forcePathStyle || Boolean(endpoint),
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    },
  });
}

async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk: Buffer) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function existsInS3(client: S3Client, bucket: string, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const bucket = requireEnv("S3_BUCKET");
  const client = s3Client();
  const repoRoot = join(__dirname, "../../..");
  const deckDir = join(repoRoot, "apps/web/public/cards/artworks/deck");
  const files = readdirSync(deckDir).filter((f) =>
    f.toLowerCase().endsWith(".png"),
  );
  let uploaded = 0;
  let skipped = 0;
  let orphaned = 0;

  for (const filename of files) {
    const key = `card-artworks/${filename}`;
    const cardRow = await prisma.card.findFirst({
      where: { artworkKey: key, kind: "SONG" },
    });
    if (!cardRow) {
      console.warn(`Orphan file (no card): ${filename}`);
      orphaned += 1;
      continue;
    }
    const effectiveKey = cardRow.artworkKey ?? key;
    const filePath = join(deckDir, filename);
    const bytes = statSync(filePath).size;
    const sha = await sha256File(filePath);
    const birth = ARTWORK_CREATED_AT[filename];
    const artworkCreatedAt = birth ? new Date(birth) : new Date();

    if (await existsInS3(client, bucket, effectiveKey)) {
      console.log(`Skipped (already in S3): ${filename}`);
      skipped += 1;
    } else {
      const stream = createReadStream(filePath);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: effectiveKey,
          Body: stream,
          ContentType: "image/png",
          ContentLength: bytes,
        }),
      );
      console.log(`Uploaded: ${filename} → ${effectiveKey}`);
      uploaded += 1;
    }

    // Always write DB record — restores state after db:reset without re-uploading.
    await prisma.card.update({
      where: { id: cardRow.id },
      data: {
        artworkKey: effectiveKey,
        artworkContentType: "image/png",
        artworkBytes: bytes,
        artworkChecksum: sha,
        artworkCreatedAt,
      },
    });
  }

  console.log(
    `artworks:migrate done — uploaded=${uploaded} skipped=${skipped} orphaned=${orphaned}`,
  );
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
