import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Users, 
  Search, 
  X, 
  Building2,
  UserPlus,
  UserMinus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Department {
  id: string;
  name: string;
  description?: string;
  head_name?: string;
  head_student_id?: string;
  members: DepartmentMember[];
}

interface DepartmentMember {
  student_id: string;
  full_name: string;
  email: string;
  department: string;
  role?: string;
}

interface DepartmentManagerProps {
  departments: Department[];
  onDepartmentsChange: (departments: Department[]) => void;
}

const DepartmentManager: React.FC<DepartmentManagerProps> = ({
  departments,
  onDepartmentsChange
}) => {
  const { toast } = useToast();
  const [searchStudentId, setSearchStudentId] = useState("");
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [departmentHeadSearchId, setDepartmentHeadSearchId] = useState("");

  // Add new department
  const addDepartment = () => {
    const newDepartment: Department = {
      id: `dept_${Date.now()}`,
      name: "",
      description: "",
      head_name: "",
      head_student_id: "",
      members: []
    };
    onDepartmentsChange([...departments, newDepartment]);
  };

  // Remove department
  const removeDepartment = (departmentId: string) => {
    onDepartmentsChange(departments.filter(dept => dept.id !== departmentId));
  };

  // Update department
  const updateDepartment = (departmentId: string, field: keyof Department, value: any) => {
    onDepartmentsChange(
      departments.map(dept => 
        dept.id === departmentId 
          ? { ...dept, [field]: value }
          : dept
      )
    );
  };

  // Search student by ID
  const searchStudent = async (studentId: string) => {
    if (!studentId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a student ID",
        variant: "destructive",
      });
      return;
    }

    setSearchingStudent(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('student_id, full_name, email, department')
        .eq('student_id', studentId.trim())
        .single();

      if (error || !data) {
        toast({
          title: "Student Not Found",
          description: "No student found with this ID",
          variant: "destructive",
        });
        return;
      }

      return data;
    } catch (error) {
      console.error('Error searching student:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for student",
        variant: "destructive",
      });
      return null;
    } finally {
      setSearchingStudent(false);
    }
  };

  // Add member to department
  const addMemberToDepartment = async (departmentId: string) => {
    if (!searchStudentId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a student ID",
        variant: "destructive",
      });
      return;
    }

    const studentData = await searchStudent(searchStudentId);
    if (!studentData) return;

    // Check if student is already in this department
    const department = departments.find(dept => dept.id === departmentId);
    if (department?.members.some(member => member.student_id === studentData.student_id)) {
      toast({
        title: "Already Added",
        description: "This student is already in this department",
        variant: "destructive",
      });
      return;
    }

    const newMember: DepartmentMember = {
      student_id: studentData.student_id,
      full_name: studentData.full_name,
      email: studentData.email,
      department: studentData.department,
      role: "Member"
    };

    updateDepartment(departmentId, 'members', [...(department?.members || []), newMember]);
    setSearchStudentId("");
    
    toast({
      title: "Member Added",
      description: `${studentData.full_name} has been added to the department`,
    });
  };

  // Remove member from department
  const removeMemberFromDepartment = (departmentId: string, studentId: string) => {
    const department = departments.find(dept => dept.id === departmentId);
    if (department) {
      const updatedMembers = department.members.filter(member => member.student_id !== studentId);
      updateDepartment(departmentId, 'members', updatedMembers);
      
      toast({
        title: "Member Removed",
        description: "Member has been removed from the department",
      });
    }
  };

  // Set department head
  const setDepartmentHead = async (departmentId: string) => {
    if (!departmentHeadSearchId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a student ID for department head",
        variant: "destructive",
      });
      return;
    }

    const studentData = await searchStudent(departmentHeadSearchId);
    if (!studentData) return;

    updateDepartment(departmentId, 'head_name', studentData.full_name);
    updateDepartment(departmentId, 'head_student_id', studentData.student_id);
    setDepartmentHeadSearchId("");
    
    toast({
      title: "Department Head Set",
      description: `${studentData.full_name} has been set as department head`,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Department Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create departments and assign members to organize your club structure
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Department Button */}
        <Button 
          onClick={addDepartment}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>

        {/* Departments List */}
        {departments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No departments added yet</p>
            <p className="text-sm">Click "Add Department" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {departments.map((department) => (
              <Card key={department.id} className="border border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Department Name (e.g., Web Development)"
                        value={department.name}
                        onChange={(e) => updateDepartment(department.id, 'name', e.target.value)}
                        className="font-medium"
                      />
                      <Textarea
                        placeholder="Department description (optional)"
                        value={department.description || ""}
                        onChange={(e) => updateDepartment(department.id, 'description', e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDepartment(department.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Department Head */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Department Head</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by Student ID"
                        value={departmentHeadSearchId}
                        onChange={(e) => setDepartmentHeadSearchId(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => setDepartmentHead(department.id)}
                        disabled={searchingStudent}
                      >
                        {searchingStudent ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {department.head_name && (
                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{department.head_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {department.head_student_id}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Add Members */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Add Members</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by Student ID"
                        value={searchStudentId}
                        onChange={(e) => setSearchStudentId(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => addMemberToDepartment(department.id)}
                        disabled={searchingStudent}
                      >
                        {searchingStudent ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Members List */}
                  {department.members.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Members ({department.members.length})
                      </Label>
                      <div className="space-y-2">
                        {department.members.map((member) => (
                          <div key={member.student_id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-sm font-medium">{member.full_name}</span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{member.student_id}</span>
                                  <span>•</span>
                                  <span>{member.department}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMemberFromDepartment(department.id, member.student_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DepartmentManager;
