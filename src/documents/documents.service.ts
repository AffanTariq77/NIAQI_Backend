import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private drive: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.initializeDrive();
  }

  private async initializeDrive() {
    try {
      const keyPath = this.configService.get<string>(
        "GOOGLE_SERVICE_ACCOUNT_KEY_PATH"
      );

      if (!keyPath) {
        this.logger.warn("GOOGLE_SERVICE_ACCOUNT_KEY_PATH not configured");
        return;
      }

      const keyFullPath = path.join(process.cwd(), keyPath);

      if (!fs.existsSync(keyFullPath)) {
        this.logger.warn(
          `Service account key not found at: ${keyFullPath}. Google Drive sync will not work.`
        );
        return;
      }

      const keyFile = JSON.parse(fs.readFileSync(keyFullPath, "utf8"));

      // Check if it's a placeholder file
      if (
        keyFile.private_key === "REPLACE_ME" ||
        keyFile.INSTRUCTIONS ||
        !keyFile.private_key ||
        keyFile.private_key.includes("REPLACE")
      ) {
        this.logger.warn(
          "Service account key file contains placeholder values. Please replace with real credentials from Google Cloud Console."
        );
        return;
      }

      const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });

      this.drive = google.drive({ version: "v3", auth });
      this.logger.log("Google Drive API initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize Google Drive API:", error);
    }
  }

  async getAllDocuments() {
    const documents = await this.prisma.documents.findMany({
      orderBy: { modifiedTime: "desc" },
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
    });

    // Convert BigInt to string for JSON serialization
    return documents.map((doc) => ({
      ...doc,
      size: doc.size ? doc.size.toString() : null,
    }));
  }

  async getDocumentById(id: string) {
    const document = await this.prisma.documents.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    return document;
  }

  async downloadDocument(id: string) {
    const document = await this.getDocumentById(id);

    if (!this.drive) {
      throw new Error("Google Drive API not initialized");
    }

    try {
      const response = await this.drive.files.get(
        {
          fileId: document.driveId,
          alt: "media",
        },
        { responseType: "arraybuffer" }
      );

      return {
        buffer: Buffer.from(response.data),
        mimeType: document.mimeType,
        name: document.name,
      };
    } catch (error) {
      this.logger.error("Failed to download from Google Drive:", error);
      throw new Error("Failed to download document from Google Drive");
    }
  }

  async syncWithGoogleDrive() {
    if (!this.drive) {
      throw new Error(
        "Google Drive API not initialized. Please configure service account credentials with a real JSON key from Google Cloud Console."
      );
    }

    const folderId = this.configService.get<string>("GOOGLE_DRIVE_FOLDER_ID");

    if (!folderId) {
      throw new Error("GOOGLE_DRIVE_FOLDER_ID not configured");
    }

    try {
      this.logger.log(`Starting sync from Google Drive folder: ${folderId}`);

      // List all files in the folder
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields:
          "files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink)",
        orderBy: "modifiedTime desc",
      });

      const files = response.data.files || [];
      this.logger.log(`Found ${files.length} files in Google Drive`);

      let newFiles = 0;
      let updatedFiles = 0;
      let skippedFiles = 0;

      for (const file of files) {
        try {
          const existing = await this.prisma.documents.findUnique({
            where: { driveId: file.id },
          });

          const fileData = {
            name: file.name,
            mimeType: file.mimeType,
            modifiedTime: new Date(file.modifiedTime),
            size: file.size ? BigInt(file.size) : null,
            updatedAt: new Date(),
          };

          if (!existing) {
            // Create new document
            await this.prisma.documents.create({
              data: {
                id: this.generateId(),
                driveId: file.id,
                ...fileData,
              },
            });
            newFiles++;
            this.logger.log(`Added new document: ${file.name}`);
          } else {
            // Check if file was modified
            const existingModified = new Date(existing.modifiedTime);
            const newModified = new Date(file.modifiedTime);

            if (newModified > existingModified) {
              await this.prisma.documents.update({
                where: { driveId: file.id },
                data: fileData,
              });
              updatedFiles++;
              this.logger.log(`Updated document: ${file.name}`);
            } else {
              skippedFiles++;
            }
          }
        } catch (error) {
          this.logger.error(`Failed to sync file ${file.name}:`, error);
        }
      }

      const result = {
        newFiles,
        updatedFiles,
        skippedFiles,
        totalFiles: files.length,
      };

      this.logger.log(`Sync completed: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error("Failed to sync with Google Drive:", error);
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
