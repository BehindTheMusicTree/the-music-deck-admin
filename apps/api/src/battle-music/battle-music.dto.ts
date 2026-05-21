import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class BattleMusicCatalogGenreDto {
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: Number, nullable: true })
  wheelOrder!: number | null;
}

export class BattleMusicCatalogTerritoryDto {
  @ApiProperty() name!: string;
  @ApiProperty() isRegion!: boolean;
}

export class BattleMusicCatalogDto {
  @ApiProperty({ type: [BattleMusicCatalogGenreDto] })
  genres!: BattleMusicCatalogGenreDto[];
  @ApiProperty({ type: [BattleMusicCatalogTerritoryDto] })
  territories!: BattleMusicCatalogTerritoryDto[];
}

export class BattleMusicDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  token!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty()
  audioKey!: string;

  @ApiProperty()
  contentType!: string;

  @ApiProperty()
  bytes!: number;

  @ApiProperty()
  checksum!: string;

  @ApiPropertyOptional()
  durationSec?: number;

  @ApiProperty()
  audioUrl!: string;

  @ApiProperty()
  createdAt!: string;
}
