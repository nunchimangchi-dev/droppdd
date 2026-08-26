-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WeightRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" REAL NOT NULL,
    CONSTRAINT "WeightRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WeightRecord" ("date", "id", "userId", "weight") SELECT "date", "id", "userId", "weight" FROM "WeightRecord";
DROP TABLE "WeightRecord";
ALTER TABLE "new_WeightRecord" RENAME TO "WeightRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
