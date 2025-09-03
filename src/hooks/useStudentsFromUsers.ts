import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface StudentFromUsers {
  id: string;
  email: string;
  full_name: string;
  username?: string;
  role: string;
  status: string;
  department?: string;
  year?: string;
  gpa?: string;
  student_id?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at?: string;
}

export type StudentStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "pending"
  | "approved";

export interface CreateStudentData {
  email: string;
  full_name: string;
  username?: string;
  department?: string;
  year?: string;
  gpa?: string;
  student_id?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  status?: StudentStatus;
}

export function useStudentsFromUsers() {
  const [students, setStudents] = useState<StudentFromUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching students:", fetchError);
        setError(fetchError.message);
        return;
      }

      console.log("Students fetched from users table:", data);
      setStudents(data || []);
    } catch (err) {
      console.error("Error in fetchStudents:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const searchStudents = async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: searchError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .or(
          `full_name.ilike.%${query}%,email.ilike.%${query}%,student_id.ilike.%${query}%`
        )
        .order("created_at", { ascending: false });

      if (searchError) {
        console.error("Error searching students:", searchError);
        setError(searchError.message);
        return;
      }

      setStudents(data || []);
    } catch (err) {
      console.error("Error in searchStudents:", err);
      setError(
        err instanceof Error ? err.message : "Failed to search students"
      );
    } finally {
      setLoading(false);
    }
  };

  const filterByDepartment = async (department: string) => {
    try {
      setLoading(true);
      setError(null);

      if (department === "all") {
        await fetchStudents();
        return;
      }

      const { data, error: filterError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .eq("department", department)
        .order("created_at", { ascending: false });

      if (filterError) {
        console.error("Error filtering by department:", filterError);
        setError(filterError.message);
        return;
      }

      setStudents(data || []);
    } catch (err) {
      console.error("Error in filterByDepartment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to filter by department"
      );
    } finally {
      setLoading(false);
    }
  };

  const filterByStatus = async (status: StudentStatus | "all") => {
    try {
      setLoading(true);
      setError(null);

      if (status === "all") {
        await fetchStudents();
        return;
      }

      const { data, error: filterError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (filterError) {
        console.error("Error filtering by status:", filterError);
        setError(filterError.message);
        return;
      }

      setStudents(data || []);
    } catch (err) {
      console.error("Error in filterByStatus:", err);
      setError(
        err instanceof Error ? err.message : "Failed to filter by status"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) {
        console.error("Error deleting student:", error);
        throw new Error(error.message);
      }

      // Update local state
      setStudents((prev) => prev.filter((student) => student.id !== id));
      return { success: true };
    } catch (err) {
      console.error("Error in deleteStudent:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete student",
      };
    }
  };

  const createStudent = async (studentData: CreateStudentData) => {
    try {
      const newStudent = {
        ...studentData,
        role: "student",
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("users")
        .insert([newStudent])
        .select()
        .single();

      if (error) {
        console.error("Error creating student:", error);
        throw new Error(error.message);
      }

      // Update local state
      setStudents((prev) => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      console.error("Error in createStudent:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create student",
      };
    }
  };

  const updateStudent = async (id: string, updates: UpdateStudentData) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating student:", error);
        throw new Error(error.message);
      }

      // Update local state
      setStudents((prev) =>
        prev.map((student) =>
          student.id === id
            ? { ...student, ...updates, updated_at: new Date().toISOString() }
            : student
        )
      );

      return { success: true, data };
    } catch (err) {
      console.error("Error in updateStudent:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update student",
      };
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
    searchStudents,
    filterByDepartment,
    filterByStatus,
    deleteStudent,
    createStudent,
    updateStudent,
  };
}

export function useStudentStatistics() {
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    pending: 0,
    approved: 0,
    byDepartment: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select("status, department")
        .eq("role", "student");

      if (error) {
        console.error("Error fetching student statistics:", error);
        return;
      }

      const stats = {
        total: data.length,
        active: data.filter((s) => s.status === "active").length,
        inactive: data.filter((s) => s.status === "inactive").length,
        suspended: data.filter((s) => s.status === "suspended").length,
        pending: data.filter((s) => s.status === "pending").length,
        approved: data.filter((s) => s.status === "approved").length,
        byDepartment: data.reduce((acc, student) => {
          if (student.department) {
            acc[student.department] = (acc[student.department] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
      };

      setStatistics(stats);
    } catch (err) {
      console.error("Error in fetchStatistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    statistics,
    loading,
    refetch: fetchStatistics,
  };
}
