import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { GoogleDriveService } from "./google-drive.service";
import { GoogleDriveController } from "./google-drive.controller";
import { GoogleDriveSyncTask } from "./google-drive-sync.task";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  controllers: [GoogleDriveController],
  providers: [GoogleDriveService, GoogleDriveSyncTask],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}
