-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AllowedEmail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_AllowedEmail" ("email", "id") SELECT "email", "id" FROM "AllowedEmail";
DROP TABLE "AllowedEmail";
ALTER TABLE "new_AllowedEmail" RENAME TO "AllowedEmail";
CREATE UNIQUE INDEX "AllowedEmail_email_key" ON "AllowedEmail"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
