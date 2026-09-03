-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InviteRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "note" TEXT,
    "source" TEXT NOT NULL DEFAULT 'self_request',
    "invitedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InviteRequest_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InviteRequest" ("createdAt", "email", "id", "invitedById", "note") SELECT "createdAt", "email", "id", "invitedById", "note" FROM "InviteRequest";
DROP TABLE "InviteRequest";
ALTER TABLE "new_InviteRequest" RENAME TO "InviteRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
