-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CardRarity" AS ENUM ('LEGENDARY', 'CLASSIC', 'BANGER', 'NICHE');

-- CreateEnum
CREATE TYPE "CardKind" AS ENUM ('SONG', 'TRANSITION');

-- CreateEnum
CREATE TYPE "Intensity" AS ENUM ('POP', 'SOFT', 'EXPERIMENTAL', 'HARDCORE');

-- CreateTable TypeCode (shared code registry — enforces global uniqueness of TYPE segments)
CREATE TABLE "TypeCode" (
    "code" VARCHAR(2) NOT NULL,
    CONSTRAINT "TypeCode_pkey" PRIMARY KEY ("code")
);

-- CreateTable Territory
CREATE TABLE "Territory" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Territory_pkey" PRIMARY KEY ("id")
);

-- CreateTable Genre
CREATE TABLE "Genre" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayLabel" TEXT,
    "parentId" INTEGER,
    "parentBId" INTEGER,
    "intensity" "Intensity" NOT NULL,
    "colorOverride" TEXT,
    "influenceId" INTEGER,
    "influenceIntensity" "Intensity",
    "wheelOrder" INTEGER,
    "code" VARCHAR(2),
    "parentTerritoryId" INTEGER,
    "theme" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable Card
CREATE TABLE "Card" (
    "id" INTEGER NOT NULL,
    "rowKey" TEXT NOT NULL,
    "kind" "CardKind" NOT NULL,
    "title" TEXT NOT NULL,
    "artworkKey" TEXT,
    "artworkContentType" TEXT,
    "artworkBytes" INTEGER,
    "artworkChecksum" TEXT,
    "artworkOffsetY" INTEGER,
    "artworkOverBorder" BOOLEAN NOT NULL DEFAULT false,
    "artworkCreatedAt" TIMESTAMP(3),
    "artworkPrompt" TEXT,
    "printedSetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable SongCard
CREATE TABLE "SongCard" (
    "id" INTEGER NOT NULL,
    "artist" TEXT,
    "year" TEXT,
    "genreId" INTEGER,
    "territoryId" INTEGER,
    "ability" TEXT NOT NULL,
    "abilityDesc" TEXT NOT NULL,
    "pop" INTEGER NOT NULL,
    "rarity" "CardRarity" NOT NULL,
    "catalogNumber" INTEGER,
    "wikipediaUrl" TEXT,
    "spotifyUrl" TEXT,
    "appleMusicUrl" TEXT,
    "youtubeUrl" TEXT,
    "bandcampUrl" TEXT,
    "soundcloudUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SongCard_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SongCard_artist_nonempty_when_set_check"
      CHECK ("artist" IS NULL OR length(trim("artist")) > 0)
);

-- CreateTable TransitionCard
CREATE TABLE "TransitionCard" (
    "id" INTEGER NOT NULL,
    "genre" TEXT,
    "genreId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransitionCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable WishlistSong
CREATE TABLE "WishlistSong" (
    "id" INTEGER NOT NULL,
    "rowKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "year" TEXT,
    "genre" TEXT,
    "country" TEXT,
    "ability" TEXT,
    "abilityDesc" TEXT,
    "pop" INTEGER,
    "rarity" "CardRarity",
    "artworkPrompt" TEXT,
    "wikipediaUrl" TEXT,
    "spotifyUrl" TEXT,
    "appleMusicUrl" TEXT,
    "youtubeUrl" TEXT,
    "bandcampUrl" TEXT,
    "soundcloudUrl" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistSong_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WishlistSong_artist_nonempty_when_set_check"
      CHECK ("artist" IS NULL OR length(trim("artist")) > 0)
);

-- CreateTable SongSongTransition
CREATE TABLE "SongSongTransition" (
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,

    CONSTRAINT "SongSongTransition_pkey" PRIMARY KEY ("fromId","toId")
);

-- CreateTable BattleMusic
CREATE TABLE "BattleMusic" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "audioKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'audio/mpeg',
    "bytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BattleMusic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Territory_code_key" ON "Territory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Territory_name_key" ON "Territory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_code_key" ON "Genre"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Card_rowKey_key" ON "Card"("rowKey");

-- CreateIndex
CREATE UNIQUE INDEX "Card_printedSetId_key" ON "Card"("printedSetId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistSong_rowKey_key" ON "WishlistSong"("rowKey");

-- CreateIndex
CREATE INDEX "SongSongTransition_toId_idx" ON "SongSongTransition"("toId");

-- CreateIndex
CREATE UNIQUE INDEX "BattleMusic_token_version_key" ON "BattleMusic"("token", "version");

-- AddForeignKey
ALTER TABLE "Territory" ADD CONSTRAINT "Territory_code_fkey" FOREIGN KEY ("code") REFERENCES "TypeCode"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Genre" ADD CONSTRAINT "Genre_code_fkey" FOREIGN KEY ("code") REFERENCES "TypeCode"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Genre" ADD CONSTRAINT "Genre_parentTerritoryId_fkey" FOREIGN KEY ("parentTerritoryId") REFERENCES "Territory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Genre" ADD CONSTRAINT "Genre_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Genre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Genre" ADD CONSTRAINT "Genre_parentBId_fkey" FOREIGN KEY ("parentBId") REFERENCES "Genre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Genre" ADD CONSTRAINT "Genre_influenceId_fkey" FOREIGN KEY ("influenceId") REFERENCES "Genre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongCard" ADD CONSTRAINT "SongCard_id_fkey" FOREIGN KEY ("id") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongCard" ADD CONSTRAINT "SongCard_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongCard" ADD CONSTRAINT "SongCard_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionCard" ADD CONSTRAINT "TransitionCard_id_fkey" FOREIGN KEY ("id") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionCard" ADD CONSTRAINT "TransitionCard_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongSongTransition" ADD CONSTRAINT "SongSongTransition_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "SongCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongSongTransition" ADD CONSTRAINT "SongSongTransition_toId_fkey" FOREIGN KEY ("toId") REFERENCES "SongCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
