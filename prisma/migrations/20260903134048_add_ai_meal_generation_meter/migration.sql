-- CreateTable
CREATE TABLE "AiMealGeneration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiMealGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AiMealGeneration_createdAt_idx" ON "AiMealGeneration"("createdAt");

-- CreateIndex
CREATE INDEX "AiMealGeneration_userId_createdAt_idx" ON "AiMealGeneration"("userId", "createdAt");
