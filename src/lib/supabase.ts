import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

// Create Supabase client for database operations only (no auth)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable auth session persistence
    autoRefreshToken: false, // Disable auto token refresh
  },
});

// Types for our database schema
export interface Profile {
  id: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type AppRole = "admin" | "faculty" | "student";

export interface ManualUser {
  id: string;
  email: string;
  full_name: string;
  department: string;
  student_id: string | null;
  employee_id: string | null;
  role: AppRole;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  club_id: string | null;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  location: string | null;
  capacity: number | null;
  status: "scheduled" | "cancelled" | "completed";
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Legacy interface for compatibility - use ManualUser for new code
export interface User {
  id: string;
  email: string;
  full_name: string;
  department: string;
  student_id?: string;
  employee_id?: string;
  role: AppRole;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  bucket_id: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
  file_size?: number;
  file_type?: string;
  category?: string;
  subject?: string;
  course_code?: string;
  tags?: string[];
  download_count?: number;
  is_approved?: boolean;
}

export interface ClubMembershipApplication {
  id: string;
  club_id: string;
  applicant_id: string;
  motivation: string;
  experience: string | null;
  skills: string | null;
  availability: string;
  expectations: string | null;
  portfolio_file_path: string | null;
  resume_file_path: string | null;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  application_date: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  agreed_to_terms: boolean;
  created_at: string;
  updated_at: string;
}
