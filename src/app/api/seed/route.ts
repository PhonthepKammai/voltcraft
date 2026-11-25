import { handleApiError, ok } from '@/lib/errors';
import { seedDatabase } from '@/services/seed.service';

export async function GET() {
  try {
    const result = await seedDatabase();
    return ok(result, 'Database seeded successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST() {
  try {
    const result = await seedDatabase();
    return ok(result, 'Database seeded successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}