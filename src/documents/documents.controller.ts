import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  Query,
  UseGuards,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DocumentsService } from "./documents.service";

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async getAllDocuments() {
    try {
      const documents = await this.documentsService.getAllDocuments();
      return {
        success: true,
        data: documents,
      };
    } catch (error) {
      return {
        success: true,
        data: [],
        message:
          "No documents synced yet. Use the Sync button to fetch documents from Google Drive.",
      };
    }
  }

  @Get(":id")
  async getDocumentById(@Param("id") id: string) {
    const document = await this.documentsService.getDocumentById(id);
    return {
      success: true,
      data: document,
    };
  }

  @Get(":id/download")
  async downloadDocument(
    @Param("id") id: string,
    @Res() res: Response,
    @Query("token") token?: string
  ) {
    try {
      // If token is provided in query, validate it
      // For now, we'll rely on JWT guard, but query token can be used for direct links

      const { buffer, mimeType, name } =
        await this.documentsService.downloadDocument(id);

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(buffer);
    } catch (error: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to download document",
        error: error.message,
      });
    }
  }

  @Post("sync")
  async triggerSync() {
    try {
      const result = await this.documentsService.syncWithGoogleDrive();
      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Sync failed",
        error: error.message,
      };
    }
  }
}
