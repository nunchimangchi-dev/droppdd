-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wager" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "challengedUserId" TEXT,
    "title" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "startValue" REAL,
    "targetValue" REAL NOT NULL,
    "stakeDescription" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Wager_challengedUserId_fkey" FOREIGN KEY ("challengedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Wager" ("createdAt", "endDate", "id", "metric", "resolvedAt", "stakeDescription", "startDate", "startValue", "status", "targetValue", "title", "userId") SELECT "createdAt", "endDate", "id", "metric", "resolvedAt", "stakeDescription", "startDate", "startValue", "status", "targetValue", "title", "userId" FROM "Wager";
DROP TABLE "Wager";
ALTER TABLE "new_Wager" RENAME TO "Wager";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
