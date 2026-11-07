import type { DataAdapter } from "./adapter";
import { localStorageAdapter } from "./localStorageAdapter";

/**
 * The active persistence adapter. Swap for a Supabase adapter later, e.g.
 *   export const adapter = process.env.NEXT_PUBLIC_SUPABASE_URL ? supabaseAdapter : localStorageAdapter;
 */
export const adapter: DataAdapter = localStorageAdapter;
export type { DataAdapter };
