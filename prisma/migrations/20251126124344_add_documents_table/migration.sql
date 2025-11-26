-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "modifiedTime" TIMESTAMP(3) NOT NULL,
    "size" BIGINT,
    "content" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_driveId_key" ON "documents"("driveId");
