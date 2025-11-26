/**
 * Google Drive API Types
 */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
}

export interface SyncResult {
  success: boolean;
  newFiles: number;
  updatedFiles: number;
  skippedFiles: number;
  totalFiles: number;
}

export interface DocumentMetadata {
  id: string;
  driveId: string;
  name: string;
  mimeType: string;
  modifiedTime: Date;
  size: bigint | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentResponse {
  success: boolean;
  count: number;
  data: DocumentMetadata[];
}
