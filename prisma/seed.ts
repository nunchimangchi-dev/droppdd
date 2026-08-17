import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { mockWorkouts, mockMeals, mockProgress } from "../src/lib/mock-data";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.exercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.weightRecord.deleteMany();
  await prisma.progress.deleteMany();

  // Seed Workouts and Exercises
  for (const workout of mockWorkouts) {
    await prisma.workout.create({
      data: {
        id: workout.id,
        title: workout.title,
        description: workout.description,
        duration: workout.duration,
        intensity: workout.intensity,
        category: workout.category,
        target: workout.target,
        caloriesBurn: workout.caloriesBurn,
        exercises: {
          create: workout.exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets,
            reps: String(ex.reps),
            rest: ex.rest,
            notes: ex.notes,
          })),
        },
      },
    });
  }

  // Seed Meals
  for (const meal of mockMeals) {
    await prisma.meal.create({
      data: {
        id: meal.id,
        title: meal.title,
        description: meal.description,
        calories: meal.calories,
        protein: meal.protein,
        fat: meal.fat,
        netCarbs: meal.netCarbs,
        category: meal.category,
        ingredients: meal.ingredients as Prisma.InputJsonValue, // Prisma handles string[] as Json for SQLite
        instructions: meal.instructions as Prisma.InputJsonValue,
      },
    });
  }

  // Seed Progress and WeightRecords
  await prisma.progress.create({
    data: {
      currentStreak: mockProgress.currentStreak,
      bestStreak: mockProgress.bestStreak,
      targetWeight: mockProgress.targetWeight,
      currentWeight: mockProgress.currentWeight,
      startWeight: mockProgress.startWeight,
    },
  });

  for (const record of mockProgress.weightHistory) {
    await prisma.weightRecord.create({
      data: {
        date: record.date,
        weight: record.weight,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
