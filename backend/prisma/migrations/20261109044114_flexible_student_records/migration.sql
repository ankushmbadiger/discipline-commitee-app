/*
  Warnings:

  - Added the required column `requestedFullName` to the `StudentVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedUsn` to the `StudentVerification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReportInvolvement" ADD COLUMN     "reportedDepartment" TEXT,
ADD COLUMN     "reportedName" TEXT,
ADD COLUMN     "reportedSemester" INTEGER,
ADD COLUMN     "reportedUsn" TEXT;

-- AlterTable
ALTER TABLE "StudentVerification" ADD COLUMN     "requestedDepartment" TEXT,
ADD COLUMN     "requestedFullName" TEXT NOT NULL,
ADD COLUMN     "requestedSemester" INTEGER,
ADD COLUMN     "requestedUsn" TEXT NOT NULL,
ALTER COLUMN "studentId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ReportInvolvement_reportedUsn_idx" ON "ReportInvolvement"("reportedUsn");
