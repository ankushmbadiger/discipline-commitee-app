-- CreateEnum
CREATE TYPE "CollegeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "College" ADD COLUMN     "status" "CollegeStatus" NOT NULL DEFAULT 'ACTIVE';
