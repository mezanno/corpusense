import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

export type JobRow = Database['public']['Tables']['cs_jobs']['Row'];
export type UserFile = Database['public']['Views']['user_files']['Row'];
