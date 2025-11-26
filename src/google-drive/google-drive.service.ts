import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { google } from "googleapis";
import { PrismaService } from "../prisma/prisma.service";
import * as path from "path";

@Injectable()
export class GoogleDriveService implements OnModuleInit {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive: any;
  private auth: any;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.initializeAuth();
  }

  /**
   * Initialize Google Auth with Service Account
   */
  private async initializeAuth() {
    try {
      const keyFilePath = path.join(
        process.cwd(),
        "keys",
        "service-account.json"
      );

      this.auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });

      this.drive = google.drive({ version: "v3", auth: this.auth });

      this.logger.log("Google Drive authentication initialized successfully");
    } catch (error) {
      this.logger.error(
        "Failed to initialize Google Drive authentication",
        error
      );
      throw error;
    }
  }

  /**
   * List all non-folder files from Google Drive
   */
  async listFiles() {
    try {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      let query = "mimeType!='application/vnd.google-apps.folder'";

      // If folder ID is specified, only list files in that folder
      if (folderId) {
        query += ` and '${folderId}' in parents`;
        this.logger.log(`Listing files from folder: ${folderId}`);
      }

      const response = await this.drive.files.list({
        q: query,
        fields: "files(id,name,mimeType,modifiedTime,size)",
        pageSize: 1000, // Adjust as needed
      });

      this.logger.log(
        `Found ${response.data.files.length} files in Google Drive`
      );
      return response.data.files;
    } catch (error) {
      this.logger.error("Failed to list files from Google Drive", error);
      throw error;
    }
  }

  /**
   * Download file content from Google Drive
   */
  async downloadFile(fileId: string, mimeType: string): Promise<Buffer> {
    try {
      let response;

      // Google Workspace files need to be exported
      if (mimeType.startsWith("application/vnd.google-apps")) {
        this.logger.log(`Exporting Google Workspace file ${fileId} as PDF`);
        response = await this.drive.files.export(
          {
            fileId: fileId,
            mimeType: "application/pdf",
          },
          { responseType: "arraybuffer" }
        );
      } else {
        // Regular files can be downloaded directly
        this.logger.log(`Downloading file ${fileId}`);
        response = await this.drive.files.get(
          {
            fileId: fileId,
            alt: "media",
          },
          { responseType: "arraybuffer" }
        );
      }

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`Failed to download file ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Sync Google Drive files with database
   */
  async syncFiles() {
    this.logger.log("Starting Google Drive sync...");

    try {
      const driveFiles = await this.listFiles();
      let newFiles = 0;
      let updatedFiles = 0;
      let skippedFiles = 0;

      for (const file of driveFiles) {
        try {
          // Find existing document in database
          const existingDoc = await this.prisma.document.findUnique({
            where: { driveId: file.id },
          });

          const fileModifiedTime = new Date(file.modifiedTime);

          // Determine if we need to download the file
          const shouldDownload =
            !existingDoc ||
            (existingDoc && fileModifiedTime > existingDoc.modifiedTime);

          if (shouldDownload) {
            this.logger.log(`Processing file: ${file.name} (${file.id})`);

            // Download file content
            const content = await this.downloadFile(file.id, file.mimeType);

            if (existingDoc) {
              // Update existing document
              await this.prisma.document.update({
                where: { driveId: file.id },
                data: {
                  name: file.name,
                  mimeType: file.mimeType,
                  modifiedTime: fileModifiedTime,
                  size: file.size ? BigInt(file.size) : null,
                  content: Buffer.from(content),
                  updatedAt: new Date(),
                },
              });
              updatedFiles++;
              this.logger.log(`Updated file: ${file.name}`);
            } else {
              // Insert new document
              await this.prisma.document.create({
                data: {
                  driveId: file.id,
                  name: file.name,
                  mimeType: file.mimeType,
                  modifiedTime: fileModifiedTime,
                  size: file.size ? BigInt(file.size) : null,
                  content: Buffer.from(content),
                },
              });
              newFiles++;
              this.logger.log(`Added new file: ${file.name}`);
            }
          } else {
            skippedFiles++;
            this.logger.debug(`Skipped unchanged file: ${file.name}`);
          }
        } catch (fileError) {
          this.logger.error(
            `Error processing file ${file.name} (${file.id})`,
            fileError
          );
          // Continue with next file
        }
      }

      this.logger.log(
        `Sync completed: ${newFiles} new, ${updatedFiles} updated, ${skippedFiles} skipped`
      );

      return {
        success: true,
        newFiles,
        updatedFiles,
        skippedFiles,
        totalFiles: driveFiles.length,
      };
    } catch (error) {
      this.logger.error("Failed to sync files", error);
      throw error;
    }
  }

  /**
   * Get all documents metadata from database
   */
  async getAllDocuments() {
    return this.prisma.document.findMany({
      select: {
        id: true,
        driveId: true,
        name: true,
        mimeType: true,
        modifiedTime: true,
        size: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        modifiedTime: "desc",
      },
    });
  }

  /**
   * Get single document by ID (with content)
   */
  async getDocumentById(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
    });
  }
}
