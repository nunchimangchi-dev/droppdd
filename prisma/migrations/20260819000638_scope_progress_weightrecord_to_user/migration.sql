/*
  Warnings:

  - Added the required column `userId` to the `Progress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `WeightRecord` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Progress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL,
    "bestStreak" INTEGER NOT NULL,
    "targetWeight" REAL NOT NULL,
    "currentWeight" REAL NOT NULL,
    "startWeight" REAL NOT NULL,
    CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Backfill: at migration time this app has exactly one User row, so every
-- existing Progress/WeightRecord row belongs to them.
INSERT INTO "new_Progress" ("bestStreak", "currentStreak", "currentWeight", "id", "startWeight", "targetWeight", "userId") SELECT "bestStreak", "currentStreak", "currentWeight", "id", "startWeight", "targetWeight", (SELECT "id" FROM "User" LIMIT 1) FROM "Progress";
DROP TABLE "Progress";
ALTER TABLE "new_Progress" RENAME TO "Progress";
CREATE TABLE "new_WeightRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    CONSTRAINT "WeightRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WeightRecord" ("date", "id", "weight", "userId") SELECT "date", "id", "weight", (SELECT "id" FROM "User" LIMIT 1) FROM "WeightRecord";
DROP TABLE "WeightRecord";
ALTER TABLE "new_WeightRecord" RENAME TO "WeightRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
