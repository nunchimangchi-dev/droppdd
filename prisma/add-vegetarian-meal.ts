// One-off, safe, idempotent insert for the new vegetarian catalog meal -
// deliberately NOT using prisma/seed.ts, which wipes Workout/Meal/
// WeightRecord/Progress before reseeding. That's fine against a fresh
// dev DB but destructive against prod, which now holds real beta users'
// check-in history. Run with: npx tsx prisma/add-vegetarian-meal.ts
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { mockMeals } from "../src/lib/mock-data";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const meal = mockMeals.find((m) => m.id === "triple-cheese-spinach-bowl");
  if (!meal) throw new Error("triple-cheese-spinach-bowl not found in mockMeals");

  await prisma.meal.upsert({
    where: { id: meal.id },
    update: {},
    create: {
      id: meal.id,
      title: meal.title,
      description: meal.description,
      calories: meal.calories,
      protein: meal.protein,
      fat: meal.fat,
      netCarbs: meal.netCarbs,
      category: meal.category,
      ingredients: meal.ingredients as Prisma.InputJsonValue,
      instructions: meal.instructions as Prisma.InputJsonValue,
    },
  });

  console.log(`Upserted meal: ${meal.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
