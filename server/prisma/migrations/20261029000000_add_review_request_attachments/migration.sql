-- CreateTable
CREATE TABLE "ReviewRequestAttachment" (
    "id" TEXT NOT NULL,
    "reviewRequestId" TEXT NOT NULL,
    "projectId" TEXT,
    "evidenceId" TEXT,
    "externalUrl" TEXT,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRequestAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewRequestAttachment_reviewRequestId_idx" ON "ReviewRequestAttachment"("reviewRequestId");

-- AddForeignKey
ALTER TABLE "ReviewRequestAttachment" ADD CONSTRAINT "ReviewRequestAttachment_reviewRequestId_fkey" FOREIGN KEY ("reviewRequestId") REFERENCES "ReviewRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRequestAttachment" ADD CONSTRAINT "ReviewRequestAttachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRequestAttachment" ADD CONSTRAINT "ReviewRequestAttachment_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
