/*
  Warnings:

  - The values [ELECTRICAL,PLUMBING,CLEANLINESS,INFRASTRUCTURE,INTERNET] on the enum `ReportCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReportCategory_new" AS ENUM ('CLASSROOM_DISRUPTION', 'MISCONDUCT', 'PROPERTY_DAMAGE', 'BULLYING', 'INDISCIPLINE', 'OTHER');
ALTER TABLE "Report" ALTER COLUMN "category" TYPE "ReportCategory_new" USING ("category"::text::"ReportCategory_new");
ALTER TYPE "ReportCategory" RENAME TO "ReportCategory_old";
ALTER TYPE "ReportCategory_new" RENAME TO "ReportCategory";
DROP TYPE "public"."ReportCategory_old";
COMMIT;
