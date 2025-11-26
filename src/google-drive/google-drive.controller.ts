import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Logger,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { GoogleDriveService } from "./google-drive.service";

@Controller("documents")
export class GoogleDriveController {
  private readonly logger = new Logger(GoogleDriveController.name);

  constructor(private readonly googleDriveService: GoogleDriveService) {}

  /**
   * GET /documents
   * List all documents metadata
   */
  @Get()
  async listDocuments() {
    try {
      const documents = await this.googleDriveService.getAllDocuments();

      // Convert BigInt to string for JSON serialization
      const serializedDocuments = documents.map((doc) => ({
        ...doc,
        size: doc.size ? doc.size.toString() : null,
      }));

      return {
        success: true,
        count: documents.length,
        data: serializedDocuments,
      };
    } catch (error) {
      this.logger.error("Failed to list documents", error);
      throw error;
    }
  }

  /**
   * GET /documents/:id
   * Download a specific document
   */
  @Get(":id")
  async getDocument(@Param("id") id: string, @Res() res: Response) {
    try {
      const document = await this.googleDriveService.getDocumentById(id);

      if (!document) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }

      if (!document.content) {
        throw new NotFoundException(
          `Document content not available for ID ${id}`
        );
      }

      // Determine content type
      let contentType = document.mimeType;

      // If it was a Google Workspace file, it was exported as PDF
      if (document.mimeType.startsWith("application/vnd.google-apps")) {
        contentType = "application/pdf";
      }

      // Set response headers
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.name}"`
      );
      res.setHeader("Content-Length", document.content.length);

      // Send the file content
      res.send(document.content);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to get document ${id}`, error);
      throw error;
    }
  }

  /**
   * GET /documents/sync/now
   * Trigger manual sync
   */
  @Get("sync/now")
  async triggerSync() {
    try {
      this.logger.log("Manual sync triggered");
      const result = await this.googleDriveService.syncFiles();

      return {
        message: "Sync completed successfully",
        ...result,
      };
    } catch (error) {
      this.logger.error("Manual sync failed", error);
      return {
        success: false,
        message: "Sync failed",
        error: error.message,
      };
    }
  }
}
