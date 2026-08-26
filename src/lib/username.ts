import { z } from "zod";
import { prisma } from "./prisma";

export const usernameSchema = z
  .string()
  .transform((val) => val.trim())
  .pipe(
    z
      .string()
      .min(3, "Username must be between 3 and 20 characters.")
      .max(20, "Username must be between 3 and 20 characters.")
      .regex(/^[a-zA-Z0-9_]+$/, "Alphanumeric and underscores only, no spaces.")
  );

/**
 * Checks if a username is already taken (case-insensitively).
 * Optionally excludes a specific user ID (e.g., when a user is updating their own username).
 * Returns true if taken, false if available.
 */
export async function checkUsernameTaken(username: string, excludingUserId?: string): Promise<boolean> {
  const users = await prisma.user.findMany({
    where: {
      username: {
        not: null,
      },
      NOT: excludingUserId ? { id: excludingUserId } : undefined,
    },
    select: {
      username: true,
    },
  });

  return users.some(
    (u) => u.username?.toLowerCase() === username.toLowerCase()
  );
}
