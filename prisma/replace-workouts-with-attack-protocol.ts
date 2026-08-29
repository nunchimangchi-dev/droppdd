// One-off, safe replacement of the 4 gym-equipment workouts with the new
// Attack page's single home-equipment-only Strength Protocol - deliberately
// NOT using prisma/seed.ts, which wipes Workout/Meal/WeightRecord/Progress
// before reseeding. That's fine against a fresh dev DB but destructive
// against prod, which now holds real beta users' check-in history.
//
// Deletes by known id (not a blanket deleteMany) - these are the exact 4
// rows confirmed present on prod before writing this script, not a guess.
// Run with: npx tsx prisma/replace-workouts-with-attack-protocol.ts
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const OLD_WORKOUT_IDS = ["hellfire-metcon", "iron-apex", "chainbreaker-amrap", "blackout-cardio"];

async function main() {
  for (const id of OLD_WORKOUT_IDS) {
    const existing = await prisma.workout.findUnique({ where: { id } });
    if (existing) {
      await prisma.exercise.deleteMany({ where: { workoutId: id } });
      await prisma.workout.delete({ where: { id } });
      console.log(`Removed old gym workout: ${id}`);
    }
  }

  await prisma.workout.upsert({
    where: { id: "attack-strength-protocol" },
    update: {},
    create: {
      id: "attack-strength-protocol",
      title: "STRENGTH PROTOCOL",
      description:
        "The standing daily strength prescription. No gym membership required - bodyweight plus one pair of dumbbells. Complete any 3 of the 6 to go green on Check-In.",
      duration: "15-20 MIN",
      intensity: "MEDIUM",
      category: "STRENGTH",
      target: "FULL BODY",
      caloriesBurn: 150,
      exercises: {
        create: [
          { name: "Pushups", sets: 3, reps: "15", rest: "60 sec" },
          { name: "Sit-ups", sets: 3, reps: "15", rest: "60 sec" },
          { name: "Pull-ups", sets: 3, reps: "15", rest: "60 sec" },
          { name: "Dumbbell Floor Press", sets: 3, reps: "15", rest: "60 sec" },
          { name: "Dumbbell Floor Overhead Press", sets: 3, reps: "15", rest: "60 sec" },
          { name: "Planks", sets: 3, reps: "30 sec", rest: "60 sec" },
        ],
      },
    },
  });

  console.log("Upserted workout: attack-strength-protocol");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
