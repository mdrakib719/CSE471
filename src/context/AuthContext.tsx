import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  authService,
  type User,
  type SignupData,
  type AppRole,
} from "@/lib/auth";

interface AuthError {
  message: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: AuthError }>;
  signup: (userData: SignupData) => Promise<{ error?: AuthError }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state - simplified
  useEffect(() => {
    console.log("AuthContext - Initializing auth...");
    // Just get the current user without validation
    const currentUser = authService.getCurrentUser();
    console.log("AuthContext - Current user from service:", currentUser);

    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    console.log("AuthContext - Attempting login for:", email);
    const response = await authService.signin(email, password);
    console.log("AuthContext - Login response:", response);

    if (response.success && response.user) {
      console.log(
        "AuthContext - Login successful, setting user:",
        response.user
      );
      setUser(response.user);
      return {};
    } else {
      console.log("AuthContext - Login failed:", response.error);
      return { error: { message: response.error || "Login failed" } };
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      const response = await authService.signup(userData);

      if (response.success) {
        return {};
      } else {
        return { error: { message: response.error || "Signup failed" } };
      }
    } catch (error) {
      return { error: { message: "An unexpected error occurred" } };
    }
  };

  const logout = async () => {
    try {
      await authService.signout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      await authService.refreshUserData();
      const refreshedUser = authService.getCurrentUser();
      setUser(refreshedUser);
      console.log("AuthContext - User data refreshed:", refreshedUser);
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
