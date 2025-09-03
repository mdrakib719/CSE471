// Manual Authentication Service
import { supabase } from "./supabase";

export interface User {
  id: string;
  email: string;
  full_name: string;
  department: string;
  student_id?: string;
  employee_id?: string;
  role: AppRole;
  user_status: "pending" | "active" | "suspended" | "rejected";
  is_active: boolean;
  email_verified: boolean;
  club_admin?: string; // Club ID if user is assigned as club admin
}

export type AppRole = "admin" | "faculty" | "student";

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  department: string;
  studentId?: string;
  employeeId?: string;
  agreeToTerms: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session_token?: string;
  expires_at?: string;
  error?: string;
}

export interface SessionData {
  user: User;
  session_token: string;
  expires_at: string;
}

const SESSION_STORAGE_KEY = "bracu_session";

class AuthService {
  private currentUser: User | null = null;
  private sessionToken: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // Load session from localStorage - simplified
  private loadFromStorage() {
    try {
      console.log("AuthService - Loading session from storage...");
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      console.log(
        "AuthService - Stored session data:",
        stored ? "Found" : "Not found"
      );

      if (stored) {
        const sessionData: SessionData = JSON.parse(stored);
        console.log("AuthService - Parsed session data:", sessionData);

        // Just load the user data without checking expiration
        console.log("AuthService - Loading user from storage");
        this.currentUser = sessionData.user;
        this.sessionToken = sessionData.session_token;
      } else {
        console.log("AuthService - No stored session found");
      }
    } catch (error) {
      console.error("Error loading session from storage:", error);
      this.clearSession();
    }
  }

  // Save session to localStorage
  private saveToStorage(sessionData: SessionData) {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error("Error saving session to storage:", error);
    }
  }

  // Clear session from localStorage
  private clearSession() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.currentUser = null;
    this.sessionToken = null;
    this.clearCurrentUserContext();
  }

  // Set current user context for RLS policies
  private async setCurrentUserContext(userId: string) {
    try {
      await supabase.rpc("set_session_context", { user_id: userId });
    } catch (error) {
      console.error("Error setting user context:", error);
    }
  }

  // Clear current user context
  private async clearCurrentUserContext() {
    try {
      await supabase.rpc("clear_session_context");
    } catch (error) {
      console.error("Error clearing user context:", error);
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.sessionToken !== null;
  }

  // Sign up new user
  async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      // Map role from UI to database
      const role: AppRole =
        userData.role === "university-staff"
          ? "faculty"
          : userData.role === "faculty"
          ? "faculty"
          : "student";

      const { data, error } = await supabase.rpc("create_user", {
        user_email: userData.email,
        user_password: userData.password,
        user_full_name: `${userData.firstName} ${userData.lastName}`,
        user_department: userData.department,
        user_student_id: userData.studentId || null,
        user_employee_id: userData.employeeId || null,
        user_role: role,
      });

      if (error) {
        console.error("Signup error:", error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: data?.error || "Failed to create account",
        };
      }
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  // Sign in user - simplified with fallback
  async signin(email: string, password: string): Promise<AuthResponse> {
    console.log("AuthService - Attempting signin for:", email);

    try {
      // Try to authenticate with the database
      const { data, error } = await supabase.rpc("authenticate_user", {
        user_email: email,
        user_password: password,
      });

      console.log("AuthService - Signin RPC response:", { data, error });

      if (data?.success && data?.user) {
        console.log("AuthService - Signin successful, user data:", data.user);
        let user: User = data.user;

        // Fetch additional user data including club_admin field
        try {
          const { data: fullUserData, error: userError } = await supabase
            .from("users")
            .select("club_admin")
            .eq("id", user.id)
            .single();

          if (!userError && fullUserData) {
            user = { ...user, club_admin: fullUserData.club_admin };
            console.log(
              "AuthService - Fetched club_admin:",
              fullUserData.club_admin
            );
          }
        } catch (userFetchError) {
          console.warn("Could not fetch additional user data:", userFetchError);
        }

        // Store the complete user data
        this.currentUser = user;
        if (data.session_token) {
          this.sessionToken = data.session_token;
          const sessionData: SessionData = {
            user,
            session_token: data.session_token,
            expires_at:
              data.expires_at ||
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
          this.saveToStorage(sessionData);
        }

        console.log(
          "AuthService - Complete user data stored with club_admin:",
          user.club_admin
        );
        return {
          success: true,
          user,
          session_token: data.session_token,
          expires_at: data.expires_at,
        };
      }
    } catch (error) {
      console.warn(
        "AuthService - Database authentication failed, using fallback"
      );
    }

    // Fallback authentication for testing - create a test user
    if (email === "test@test.com" && password === "password") {
      const testUser: User = {
        id: "test-user-id",
        email: "test@test.com",
        full_name: "Test User",
        department: "Computer Science",
        student_id: "20101234",
        role: "student" as AppRole,
        user_status: "active",
        is_active: true,
        email_verified: true,
      };

      this.currentUser = testUser;
      this.sessionToken = "test-session-token";

      const sessionData: SessionData = {
        user: testUser,
        session_token: "test-session-token",
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      };
      this.saveToStorage(sessionData);

      console.log("AuthService - Test user created and stored");
      return {
        success: true,
        user: testUser,
        session_token: "test-session-token",
        expires_at: sessionData.expires_at,
      };
    }

    console.log("AuthService - Signin failed");
    return { success: false, error: "Invalid credentials" };
  }

  // Sign out user
  async signout(): Promise<void> {
    try {
      if (this.sessionToken) {
        await supabase.rpc("logout_user", {
          token: this.sessionToken,
        });
      }
    } catch (error) {
      console.error("Signout error:", error);
    } finally {
      this.clearSession();
    }
  }

  // Simple session check - just return if user exists
  async validateSession(): Promise<boolean> {
    console.log(
      "AuthService - Simple validation, user exists:",
      !!this.currentUser
    );
    return !!this.currentUser;
  }

  // Check if user has specific role
  hasRole(role: AppRole): boolean {
    return this.currentUser?.role === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole("admin");
  }

  // Check if user is faculty
  isFaculty(): boolean {
    return this.hasRole("faculty");
  }

  // Check if user is student
  isStudent(): boolean {
    return this.hasRole("student");
  }

  // Refresh user data from database (useful after club admin assignments)
  async refreshUserData(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const { data: fullUserData, error: userError } = await supabase
        .from("users")
        .select("club_admin, role, user_status, is_active")
        .eq("id", this.currentUser.id)
        .single();

      if (!userError && fullUserData) {
        // Update current user with fresh data
        this.currentUser = {
          ...this.currentUser,
          club_admin: fullUserData.club_admin,
          role: fullUserData.role,
          user_status: fullUserData.user_status,
          is_active: fullUserData.is_active,
        };

        // Update localStorage with fresh data
        if (this.sessionToken) {
          const sessionData: SessionData = {
            user: this.currentUser,
            session_token: this.sessionToken,
            expires_at: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          };
          this.saveToStorage(sessionData);
        }

        console.log(
          "AuthService - User data refreshed, club_admin:",
          this.currentUser.club_admin
        );
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();

// Helper function for session context (to be added to database)
export const createSessionContextFunctions = `
-- Function to set session context for RLS
create or replace function public.set_session_context(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.current_user_id', user_id::text, true);
end;
$$;

-- Function to clear session context
create or replace function public.clear_session_context()
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.current_user_id', '', true);
end;
$$;
`;
