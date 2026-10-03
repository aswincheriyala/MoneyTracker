export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  redirectScheme: process.env.EXPO_PUBLIC_REDIRECT_SCHEME ?? 'moneytracker',
};

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabasePublishableKey);
