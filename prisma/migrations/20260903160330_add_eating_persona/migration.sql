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
    "age" INTEGER,
    "heightInches" REAL,
    "mealPreference" TEXT,
    "persona" TEXT NOT NULL DEFAULT 'KETO_OMAD',
    "eatingTargetNote" TEXT,
    CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Progress" ("age", "bestStreak", "currentStreak", "currentWeight", "heightInches", "id", "mealPreference", "startWeight", "targetWeight", "userId") SELECT "age", "bestStreak", "currentStreak", "currentWeight", "heightInches", "id", "mealPreference", "startWeight", "targetWeight", "userId" FROM "Progress";
DROP TABLE "Progress";
ALTER TABLE "new_Progress" RENAME TO "Progress";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
