import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { GoogleDriveService } from "./google-drive.service";

@Injectable()
export class GoogleDriveSyncTask {
  private readonly logger = new Logger(GoogleDriveSyncTask.name);

  constructor(private readonly googleDriveService: GoogleDriveService) {}

  /**
   * Run sync every 5 minutes
   * Cron expression: every 5 minutes
   */
  @Cron("*/5 * * * *", {
    name: "google-drive-sync",
    timeZone: "America/New_York", // Adjust to your timezone
  })
  async handleSync() {
    this.logger.log("Starting scheduled Google Drive sync...");

    try {
      const result = await this.googleDriveService.syncFiles();

      this.logger.log(
        `Scheduled sync completed: ${result.newFiles} new, ${result.updatedFiles} updated, ${result.skippedFiles} skipped`
      );
    } catch (error) {
      this.logger.error("Scheduled sync failed", error);
    }
  }
}
