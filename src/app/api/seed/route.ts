import { fail, handle, ok } from "@/lib/api";
import { seedDatabase } from "@/services/seed.service";

// DESTRUCTIVE: wipes every collection. Blocked in production unless ALLOW_SEED=true.
const run = handle(async () => {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "true") {
    return fail("Seeding is disabled in production", 403);
  }
  return ok(await seedDatabase(), "Seeded VoltCraft database (THB)", 201);
});

export const POST = run;
export const GET = run;
