const SUPABASE_CONFIG = {
  // Fill these values from your Supabase project settings.
  url: "https://gverpqggkpetyysoeeuv.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2ZXJwcWdna3BldHl5c29lZXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzgyOTYsImV4cCI6MjA5MTM1NDI5Nn0.UhgZK5JbYKZTconamZBUTyAO1Jea9a7U5rlwb7OfR_4",
  functionName: "workout-sync"
};

function hasSupabaseConfig() {
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
}

export { SUPABASE_CONFIG, hasSupabaseConfig };
