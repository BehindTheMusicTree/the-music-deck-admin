import { Module } from "@nestjs/common";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { BattleMusicController } from "./battle-music.controller";
import { BattleMusicService } from "./battle-music.service";

@Module({
  controllers: [BattleMusicController],
  providers: [BattleMusicService, AdminAuthGuard],
})
export class BattleMusicModule {}
