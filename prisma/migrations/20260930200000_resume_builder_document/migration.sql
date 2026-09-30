CREATE TABLE "ResumeBuilderDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'My resume',
    "templateKey" TEXT NOT NULL DEFAULT 'ats',
    "sections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeBuilderDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResumeBuilderDocument_userId_key" ON "ResumeBuilderDocument"("userId");
CREATE INDEX "ResumeBuilderDocument_updatedAt_idx" ON "ResumeBuilderDocument"("updatedAt");

ALTER TABLE "ResumeBuilderDocument"
ADD CONSTRAINT "ResumeBuilderDocument_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
