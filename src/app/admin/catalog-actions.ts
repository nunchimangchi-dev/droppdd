"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "./actions";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

async function getUniqueWorkoutId(title: string, excludeId?: string) {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    if (excludeId && slug === excludeId) {
      break;
    }
    const existing = await prisma.workout.findUnique({
      where: { id: slug },
    });
    if (!existing) {
      break;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

async function getUniqueMealId(title: string, excludeId?: string) {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    if (excludeId && slug === excludeId) {
      break;
    }
    const existing = await prisma.meal.findUnique({
      where: { id: slug },
    });
    if (!existing) {
      break;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

const exerciseSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sets: z.coerce.number().int().positive(),
  reps: z.string().trim().min(1).max(100),
  rest: z.string().trim().min(1).max(100),
  notes: z.string().trim().max(500).optional().nullable(),
});

const workoutSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1000),
  duration: z.string().trim().min(1).max(100),
  intensity: z.enum(["HIGH", "EXtreme", "ANARCHIC", "MEDIUM"]),
  category: z.enum(["METCON", "STRENGTH", "AMRAP", "ENDURANCE"]),
  target: z.string().trim().min(1).max(100),
  caloriesBurn: z.coerce.number().int().nonnegative(),
  exercises: z.array(exerciseSchema).min(1),
});

const mealSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1000),
  calories: z.coerce.number().int().nonnegative(),
  protein: z.coerce.number().int().nonnegative(),
  fat: z.coerce.number().int().nonnegative(),
  netCarbs: z.coerce.number().int().nonnegative(),
  category: z.enum(["OMAD FEAST", "KETO POWER", "REFUEL"]),
  ingredients: z.array(z.string().trim().min(1).max(500)).min(1),
  instructions: z.array(z.string().trim().min(1).max(1000)).min(1),
});

export async function createWorkout(rawData: unknown) {
  if (!(await checkAdmin())) {
    redirect("/admin?error=unauthorized");
  }

  const parsed = workoutSchema.safeParse(rawData);
  if (!parsed.success) {
    redirect("/admin/workouts?error=invalid-data");
  }

  const { title, description, duration, intensity, category, target, caloriesBurn, exercises } = parsed.data;

  const id = await getUniqueWorkoutId(title);

  await prisma.workout.create({
    data: {
      id,
      title,
      description,
      duration,
      intensity,
      category,
      target,
      caloriesBurn,
      exercises: {
        create: exercises,
      },
    },
  });

  revalidatePath("/admin/workouts");
  revalidatePath("/attack");
  redirect("/admin/workouts?success=created");
}

export async function updateWorkout(id: string, rawData: unknown) {
  if (!(await checkAdmin())) {
    redirect("/admin?error=unauthorized");
  }

  const parsed = workoutSchema.safeParse(rawData);
  if (!parsed.success) {
    redirect(`/admin/workouts?error=invalid-data`);
  }

  const { title, description, duration, intensity, category, target, caloriesBurn, exercises } = parsed.data;

  // Verify workout exists
  const existingWorkout = await prisma.workout.findUnique({
    where: { id },
  });
  if (!existingWorkout) {
    redirect("/admin/workouts?error=workout-not-found");
  }

  // Determine slug id change (if title changed, find unique ID)
  const newId = await getUniqueWorkoutId(title, id);

  // Use a transaction to update
  await prisma.$transaction(async (tx) => {
    // Delete existing exercises
    await tx.exercise.deleteMany({
      where: { workoutId: id },
    });

    if (newId !== id) {
      // Create new workout with new slug id
      await tx.workout.create({
        data: {
          id: newId,
          title,
          description,
          duration,
          intensity,
          category,
          target,
          caloriesBurn,
          exercises: {
            create: exercises,
          },
        },
      });

      // Delete old workout
      await tx.workout.delete({
        where: { id },
      });
    } else {
      // Normal update
      await tx.workout.update({
        where: { id },
        data: {
          title,
          description,
          duration,
          intensity,
          category,
          target,
          caloriesBurn,
          exercises: {
            create: exercises,
          },
        },
      });
    }
  });

  revalidatePath("/admin/workouts");
  revalidatePath("/attack");
  redirect("/admin/workouts?success=updated");
}

export async function deleteWorkout(id: string) {
  if (!(await checkAdmin())) {
    redirect("/admin?error=unauthorized");
  }

  const existingWorkout = await prisma.workout.findUnique({
    where: { id },
  });
  if (!existingWorkout) {
    redirect("/admin/workouts?error=workout-not-found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.exercise.deleteMany({
      where: { workoutId: id },
    });
    await tx.workout.delete({
      where: { id },
    });
  });

  revalidatePath("/admin/workouts");
  revalidatePath("/attack");
  redirect("/admin/workouts?success=deleted");
}

export async function createMeal(rawData: unknown) {
  if (!(await checkAdmin())) {
    redirect("/admin?error=unauthorized");
  }

  const parsed = mealSchema.safeParse(rawData);
  if (!parsed.success) {
    redirect("/admin/meals?error=invalid-data");
  }

  const { title, description, calories, protein, fat, netCarbs, category, ingredients, instructions } = parsed.data;

  const id = await getUniqueMealId(title);

  await prisma.meal.create({
    data: {
      id,
      title,
      description,
      calories,
      protein,
      fat,
      netCarbs,
      category,
      ingredients,
      instructions,
    },
  });

  revalidatePath("/admin/meals");
  revalidatePath("/meals");
  redirect("/admin/meals?success=created");
}

export async function updateMeal(id: string, rawData: unknown) {
  if (!(await checkAdmin())) {
    redirect("/admin?error=unauthorized");
  }

  const parsed = mealSchema.safeParse(rawData);
  if (!parsed.success) {
    redirect("/admin/meals?error=invalid-data");
  }

  const { title, description, calories, protein, fat, netCarbs, category, ingredients, instructions } = parsed.data;

  const existingMeal = await prisma.meal.findUnique({
    where: { id },
  });
  if (!existingMeal) {
    redirect("/admin/meals?error=meal-not-found");
  }

  const newId = await getUniqueMealId(title, id);

  if (newId !== id) {
    await prisma.$transaction(async (tx) => {
      await tx.meal.create({
        data: {
          id: newId,
          title,
          description,
          calories,
          protein,
          fat,
          netCarbs,
          category,
          ingredients,
          instructions,
        },
      });
      await tx.meal.delete({
        where: { id },
      });
    });
  } else {
    await prisma.meal.update({
      where: { id },
      data: {
        title,
        description,
        calories,
        protein,
        fat,
        netCarbs,
        category,
        ingredients,
        instructions,
      },
    });
  }

  revalidatePath("/admin/meals");
  revalidatePath("/meals");
  redirect("/admin/meals?success=updated");
}

export async function deleteMeal(id: string) {
  if (!(await checkAdmin())) {
    redirect("/admin?error=unauthorized");
  }

  const existingMeal = await prisma.meal.findUnique({
    where: { id },
  });
  if (!existingMeal) {
    redirect("/admin/meals?error=meal-not-found");
  }

  await prisma.meal.delete({
    where: { id },
  });

  revalidatePath("/admin/meals");
  revalidatePath("/meals");
  redirect("/admin/meals?success=deleted");
}
