import { createHash } from "node:crypto";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { BattleAudio } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { S3Service } from "../storage/s3.service";
import { BattleAudioDto } from "./battle-audio.dto";

@Injectable()
export class BattleAudioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  private toDto(row: BattleAudio): BattleAudioDto {
    const audioUrl =
      this.s3.publicUrl(row.audioKey) ?? `/battle-audio/${row.token}/audio?version=${row.version}`;
    return {
      id: row.id,
      token: row.token,
      version: row.version,
      audioKey: row.audioKey,
      contentType: row.contentType,
      bytes: row.bytes,
      checksum: row.checksum,
      durationSec: row.durationSec ?? undefined,
      audioUrl,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(): Promise<BattleAudioDto[]> {
    const rows = await this.prisma.battleAudio.findMany({
      orderBy: [{ token: "asc" }, { version: "asc" }],
    });
    return rows.map((r) => this.toDto(r));
  }

  async resolveRedirectUrl(token: string, version: number): Promise<string> {
    const row = await this.prisma.battleAudio.findUnique({
      where: { token_version: { token, version } },
    });
    if (!row) {
      throw new NotFoundException(`No audio for token "${token}" v${version}`);
    }
    const pub = this.s3.publicUrl(row.audioKey);
    if (pub) return pub;
    return this.s3.signedGetUrl(row.audioKey);
  }

  async uploadAudioFile(
    token: string,
    version: number,
    file: Express.Multer.File,
  ): Promise<BattleAudioDto> {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Empty file");
    }
    if (!file.mimetype.startsWith("audio/")) {
      throw new BadRequestException("Only audio uploads are allowed");
    }
    const key = `audio/battle/singles/${token}-v${version}.mp3`;
    const sha = createHash("sha256").update(file.buffer).digest("hex");

    const existing = await this.prisma.battleAudio.findUnique({
      where: { token_version: { token, version } },
    });

    if (existing?.checksum === sha) {
      return this.toDto(existing);
    }

    if (existing?.audioKey && existing.audioKey !== key) {
      try {
        await this.s3.deleteObject(existing.audioKey);
      } catch {
        /* best-effort cleanup */
      }
    }

    await this.s3.putObject(key, file.buffer, file.mimetype, file.size);

    const row = await this.prisma.battleAudio.upsert({
      where: { token_version: { token, version } },
      create: {
        token,
        version,
        audioKey: key,
        contentType: file.mimetype,
        bytes: file.size,
        checksum: sha,
      },
      update: {
        audioKey: key,
        contentType: file.mimetype,
        bytes: file.size,
        checksum: sha,
      },
    });

    return this.toDto(row);
  }

  async deleteAudio(token: string, version: number): Promise<void> {
    const row = await this.prisma.battleAudio.findUnique({
      where: { token_version: { token, version } },
    });
    if (!row) {
      throw new NotFoundException(`No audio for token "${token}" v${version}`);
    }
    try {
      await this.s3.deleteObject(row.audioKey);
    } catch {
      /* ignore missing object */
    }
    await this.prisma.battleAudio.delete({
      where: { token_version: { token, version } },
    });
  }
}
