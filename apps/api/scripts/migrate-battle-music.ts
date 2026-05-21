/**
 * One-time / idempotent upload of bundled MP3s from the web app to S3.
 * Run from repo root: `pnpm --filter api battle-music:migrate`
 *
 * Requires DATABASE_URL + S3_* env (see apps/api/.env.example).
 *
 * Filename convention:
 *   {token}.mp3              → token, version 1
 *   {token}-v{n}.mp3         → token, version n
 *
 * S3 key: audio/battles/singles/{token}-v{version}.mp3
 */
import { createReadStream, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
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

/**
 * Parse token and version from a filename like:
 *   genre-rock--intensity-experimental.mp3       → { token: "genre-rock--intensity-experimental", version: 1 }
 *   genre-disco-funk--intensity-experimental-v2.mp3 → { token: "genre-disco-funk--intensity-experimental", version: 2 }
 */
function parseFilename(filename: string): { token: string; version: number } | null {
  const withoutExt = filename.replace(/\.mp3$/i, "");
  const vMatch = withoutExt.match(/^(.+?)-v(\d+)$/);
  if (vMatch) {
    return { token: vMatch[1], version: Number(vMatch[2]) };
  }
  if (withoutExt.length > 0) {
    return { token: withoutExt, version: 1 };
  }
  return null;
}

async function main(): Promise<void> {
  const bucket = requireEnv("S3_BUCKET");
  const client = s3Client();
  const repoRoot = join(__dirname, "../../..");
  const singlesDir = join(repoRoot, "apps/web/public/audio/battles/singles");
  const files = readdirSync(singlesDir).filter((f) =>
    f.toLowerCase().endsWith(".mp3"),
  );
  let uploaded = 0;
  let skipped = 0;
  let invalid = 0;

  for (const filename of files) {
    const parsed = parseFilename(filename);
    if (!parsed) {
      console.warn(`Cannot parse filename: ${filename}`);
      invalid += 1;
      continue;
    }
    const { token, version } = parsed;
    const key = `audio/battle/singles/${token}-v${version}.mp3`;
    const filePath = join(singlesDir, filename);
    const bytes = statSync(filePath).size;
    const sha = await sha256File(filePath);

    const existing = await prisma.battleMusic.findUnique({
      where: { token_version: { token, version } },
    });

    if (existing?.checksum === sha) {
      console.log(`Skipped (unchanged): ${filename}`);
      skipped += 1;
      continue;
    }

    const stream = createReadStream(filePath);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: stream,
        ContentType: "audio/mpeg",
        ContentLength: bytes,
      }),
    );

    await prisma.battleMusic.upsert({
      where: { token_version: { token, version } },
      create: { token, version, audioKey: key, contentType: "audio/mpeg", bytes, checksum: sha },
      update: { audioKey: key, contentType: "audio/mpeg", bytes, checksum: sha },
    });

    console.log(`Uploaded: ${filename} → ${key}`);
    uploaded += 1;
  }

  console.log(
    `battle-music:migrate done — uploaded=${uploaded} skipped=${skipped} invalid=${invalid}`,
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
