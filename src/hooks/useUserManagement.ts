import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  role?: "student" | "faculty" | "admin";
  status?: "pending" | "approved" | "suspended";
  student_id?: string;
  department?: string;
  year?: string;
  gpa?: string;
  created_at: string;
  updated_at?: string;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching users:", fetchError);
        setError(fetchError.message);
        return;
      }

      console.log("Users fetched:", data);
      setUsers(data || []);
    } catch (err) {
      console.error("Error in fetchUsers:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: "approved" })
        .eq("id", userId);

      if (error) {
        console.error("Error approving user:", error);
        throw new Error(error.message);
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: "approved" as const } : user
        )
      );

      return { success: true };
    } catch (err) {
      console.error("Error in approveUser:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to approve user",
      };
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: "suspended" })
        .eq("id", userId);

      if (error) {
        console.error("Error suspending user:", error);
        throw new Error(error.message);
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: "suspended" as const } : user
        )
      );

      return { success: true };
    } catch (err) {
      console.error("Error in suspendUser:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to suspend user",
      };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) {
        console.error("Error deleting user:", error);
        throw new Error(error.message);
      }

      // Update local state
      setUsers((prev) => prev.filter((user) => user.id !== userId));

      return { success: true };
    } catch (err) {
      console.error("Error in deleteUser:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete user",
      };
    }
  };

  const updateUserRole = async (
    userId: string,
    newRole: "student" | "faculty" | "admin"
  ) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) {
        console.error("Error updating user role:", error);
        throw new Error(error.message);
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      return { success: true };
    } catch (err) {
      console.error("Error in updateUserRole:", err);
      return {
        success: false,
        error:
          err instanceof Error ? err.message : "Failed to update user role",
      };
    }
  };

  const getFilteredUsers = (
    filter: "all" | "pending" | "approved" | "suspended"
  ) => {
    if (filter === "all") return users;
    return users.filter((user) => (user.status || "pending") === filter);
  };

  const getUserStats = () => {
    const total = users.length;
    const pending = users.filter(
      (user) => (user.status || "pending") === "pending"
    ).length;
    const approved = users.filter(
      (user) => (user.status || "pending") === "approved"
    ).length;
    const suspended = users.filter(
      (user) => (user.status || "pending") === "suspended"
    ).length;
    const students = users.filter(
      (user) => (user.role || "student") === "student"
    ).length;
    const faculty = users.filter(
      (user) => (user.role || "student") === "faculty"
    ).length;
    const admins = users.filter(
      (user) => (user.role || "student") === "admin"
    ).length;

    return {
      total,
      pending,
      approved,
      suspended,
      students,
      faculty,
      admins,
    };
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    approveUser,
    suspendUser,
    deleteUser,
    updateUserRole,
    getFilteredUsers,
    getUserStats,
  };
}
