-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('BASIC', 'PREMIUM', 'PREMIUM_PLUS');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "membershipType" "MembershipType" NOT NULL DEFAULT 'BASIC';
