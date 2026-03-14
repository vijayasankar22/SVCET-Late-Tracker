
'use server';

// This file is currently unused as seeding has been moved to the client side
// to ensure proper authentication context for Firestore operations.

export type SeedResult = {
  success: boolean;
  message: string;
  isPermissionError?: boolean;
  errorContext?: any;
};

export async function seedDatabase(): Promise<SeedResult> {
  return { success: false, message: 'Seeding has been moved to the client-side for security compliance.' };
}
