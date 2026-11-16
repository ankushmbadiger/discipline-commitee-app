-- CreateTable
CREATE TABLE "CommitteeVerificationPermission" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "collegeId" UUID NOT NULL,
    "grantedById" UUID NOT NULL,
    "revokedById" UUID,
    "grantedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(6),

    CONSTRAINT "CommitteeVerificationPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommitteeVerificationPermission_userId_collegeId_revokedAt_idx" ON "CommitteeVerificationPermission"("userId", "collegeId", "revokedAt");

-- CreateIndex
CREATE INDEX "CommitteeVerificationPermission_collegeId_revokedAt_idx" ON "CommitteeVerificationPermission"("collegeId", "revokedAt");

-- CreateIndex
CREATE INDEX "CommitteeVerificationPermission_grantedById_idx" ON "CommitteeVerificationPermission"("grantedById");

-- AddForeignKey
ALTER TABLE "CommitteeVerificationPermission" ADD CONSTRAINT "CommitteeVerificationPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeVerificationPermission" ADD CONSTRAINT "CommitteeVerificationPermission_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeVerificationPermission" ADD CONSTRAINT "CommitteeVerificationPermission_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeVerificationPermission" ADD CONSTRAINT "CommitteeVerificationPermission_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
