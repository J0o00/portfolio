/**
 * lib/supabaseClient.js
 *
 * The Engineering Intelligence CMS already initializes a Supabase
 * client elsewhere in the codebase (Quantum Control, Media Library,
 * Resume Intelligence, etc. all read/write through it). The gallery
 * should reuse that same client rather than opening a second
 * connection — if you already have one, replace the body of this
 * file with a re-export from its real location, e.g.:
 *
 *   export { supabase } from '../../supabase/client.js';
 *
 * The implementation below is a fully working standalone client
 * (reads standard Vite env vars) so the gallery compiles and runs
 * on its own until that import path is pointed at the existing one.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabaseClient] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. '
    + 'Set them in .env, or point this file at the project\'s existing Supabase client.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
