import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),

  // Optional OAuth providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Email configuration (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Legacy SMTP configuration (for NextAuth fallback)
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),

  // Test database
  TEST_DATABASE_URL: z.string().url().optional(),

  // Azure Blob Storage configuration
  AZURE_STORAGE_ACCOUNT_NAME: z.string().optional(),
  AZURE_STORAGE_ACCOUNT_KEY: z.string().optional(),
  AZURE_STORAGE_CONTAINER_NAME: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
function parseEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      // Only call process.exit in Node.js environment (server-side)
      if (typeof process !== 'undefined' && typeof process.exit === 'function') {
        process.exit(1);
      }
      // In browser, throw error instead
      throw new Error('Invalid environment variables. Check console for details.');
    }
    throw error;
  }
}

// Only parse env on server-side
export const env = typeof window === 'undefined' ? parseEnv() : ({} as Env);
