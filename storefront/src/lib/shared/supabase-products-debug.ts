// TEMPORARILY DISABLED - Supabase products debug disabled during migration to Medusa
// This file is kept as a stub to prevent import errors during migration

export function createDebugClient() {
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null })
    })
  }
}

export default createDebugClient()