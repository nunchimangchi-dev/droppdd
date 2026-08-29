-- CreateTable
CREATE TABLE "DailyCheckIn" (
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
    "restDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
