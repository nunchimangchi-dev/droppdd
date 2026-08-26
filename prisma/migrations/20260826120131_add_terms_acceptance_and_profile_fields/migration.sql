-- AlterTable
ALTER TABLE "Progress" ADD COLUMN "age" INTEGER;
ALTER TABLE "Progress" ADD COLUMN "heightInches" REAL;
ALTER TABLE "Progress" ADD COLUMN "mealPreference" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" DATETIME;
