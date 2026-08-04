import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url('EXPO_PUBLIC_SUPABASE_URL must be a valid URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY is required'),
});

export type SupabaseEnv = z.infer<typeof envSchema>;

function parseEnv(): SupabaseEnv {
  const result = envSchema.safeParse({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid Supabase environment variables:\n${messages}`);
  }

  const { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } =
    result.data;

  if (
    EXPO_PUBLIC_SUPABASE_URL.includes('your-project') ||
    EXPO_PUBLIC_SUPABASE_URL.includes('placeholder') ||
    EXPO_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon-key') ||
    EXPO_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
  ) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY from your Supabase project (Settings → API). Then restart the dev server.',
    );
  }

  return result.data;
}

export const supabaseEnv = parseEnv();
