-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyCheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "checkInDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "strengthPushups" BOOLEAN NOT NULL DEFAULT false,
    "strengthSitups" BOOLEAN NOT NULL DEFAULT false,
    "strengthPullups" BOOLEAN NOT NULL DEFAULT false,
    "strengthFloorPress" BOOLEAN NOT NULL DEFAULT false,
    "strengthFloorOverhead" BOOLEAN NOT NULL DEFAULT false,
    "strengthPlanks" BOOLEAN NOT NULL DEFAULT false,
    "movementMet" BOOLEAN NOT NULL DEFAULT false,
    "eatingMet" BOOLEAN NOT NULL DEFAULT false,
    "mindfulnessMet" BOOLEAN NOT NULL DEFAULT false,
    "restDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyCheckIn" ("checkInDate", "createdAt", "eatingMet", "id", "movementMet", "restDay", "strengthFloorOverhead", "strengthFloorPress", "strengthPlanks", "strengthPullups", "strengthPushups", "strengthSitups", "updatedAt", "userId") SELECT "checkInDate", "createdAt", "eatingMet", "id", "movementMet", "restDay", "strengthFloorOverhead", "strengthFloorPress", "strengthPlanks", "strengthPullups", "strengthPushups", "strengthSitups", "updatedAt", "userId" FROM "DailyCheckIn";
DROP TABLE "DailyCheckIn";
ALTER TABLE "new_DailyCheckIn" RENAME TO "DailyCheckIn";
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
    "mindfulnessEnabled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Progress" ("age", "bestStreak", "currentStreak", "currentWeight", "eatingTargetNote", "heightInches", "id", "mealPreference", "persona", "startWeight", "targetWeight", "userId") SELECT "age", "bestStreak", "currentStreak", "currentWeight", "eatingTargetNote", "heightInches", "id", "mealPreference", "persona", "startWeight", "targetWeight", "userId" FROM "Progress";
DROP TABLE "Progress";
ALTER TABLE "new_Progress" RENAME TO "Progress";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
