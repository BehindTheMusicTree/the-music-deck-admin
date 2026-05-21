import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BattleMusicModule } from "./battle-music/battle-music.module";
import { CardsModule } from "./cards/cards.module";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { StorageModule } from "./storage/storage.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate(config: Record<string, unknown>) {
        const required = [
          "DATABASE_URL",
          "ADMIN_API_TOKEN",
          "S3_ENDPOINT",
          "S3_BUCKET",
          "S3_ACCESS_KEY_ID",
          "S3_SECRET_ACCESS_KEY",
          "S3_PUBLIC_BASE_URL",
        ];
        const missing = required.filter((k) => !String(config[k] ?? "").trim());
        if (missing.length) {
          throw new Error(
            `Missing required environment variables: ${missing.join(", ")}`,
          );
        }
        return config;
      },
    }),
    PrismaModule,
    StorageModule,
    CardsModule,
    BattleMusicModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
