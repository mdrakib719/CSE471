import React, { useState } from "react";
import emailjs from "emailjs-com";
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Users,
  GraduationCap,
  Building,
  UserCheck,
  MoreHorizontal,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  useStudentData,
  useStudentStatistics,
  StudentData,
  StudentStatus,
} from "@/hooks/useStudentData";
import AddStudentForm from "./AddStudentForm";
import { LoadingSpinner } from "./LoadingSpinner";
import { supabase } from "@/lib/supabase";

const StudentManagement: React.FC = () => {
  const {
    students,
    loading,
    error,
    deleteStudent,
    searchStudents,
    filterByDepartment,
    filterByStatus,
    refetch,
  } = useStudentData();

  const { statistics, loading: statsLoading } = useStudentStatistics();
  const { toast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">(
    "all"
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // State for AI Email Generator
  const [emailPrompt, setEmailPrompt] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");

  // Get unique departments from students
  const departments = Array.from(
    new Set(students.map((s) => s.department))
  ).sort();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchStudents(query);
    } else {
      await refetch();
    }
  };

  const handleGenerateEmail = async () => {
    if (!emailPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter what you want the email to be about.",
        variant: "destructive",
      });
      return;
    }
    setEmailLoading(true);
    setGeneratedEmail("");
    try {
      const { CohereClientV2 } = await import("cohere-ai");
      const cohere = new CohereClientV2({
        token: "WXLRaDQGGcSLekKzhkd3S653Iwo4PX6LfU3wUeAF", // ⚠ Do not expose in production
      });

      const response = await cohere.chat({
        model: "command-a-03-2025",
        messages: [
          {
            role: "user",
            content: `Write a professional email for this scenario: ${emailPrompt}`,
          },
        ],
      });

      console.log("Full Cohere response:", response);

      setGeneratedEmail(
        (response.message?.content?.[0]?.text as string) ||
          (response.text as string) ||
          (response.generations?.[0]?.text as string) ||
          "No email generated."
      );
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate email.",
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendEmailToAllStudents = async () => {
    if (!generatedEmail) {
      toast({
        title: "No Email Content",
        description: "Please generate the email content first.",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const student of students) {
      try {
        await emailjs.send(
          "service_w0yrqzx", // Your service ID
          "template_nu1blhd", // Your template ID
          {
            to_name: student.full_name, // match your template variables
            to_email: student.email, // match your template variables
            message: generatedEmail,
          },
          "5z5hG6uOfJfySVK-U" // Your public key
        );

        console.log(`✅ Email sent to ${student.full_name} (${student.email})`);
        successCount++;
      } catch (err) {
        const errorMessage = err?.text || JSON.stringify(err);
        console.error(
          `❌ Failed for ${student.full_name} (${student.email}):`,
          errorMessage
        );
        failCount++;
      }
    }

    toast({
      title: "Email Sending Complete",
      description: `${successCount} sent, ${failCount} failed.`,
      variant: failCount > 0 ? "destructive" : "default",
    });

    toast({
      title: "Emails Sent",
      description: "Email has been sent to all students' inboxes.",
    });
  };

  // Inside StudentManagement component, after import statements but before return
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [selectedNotificationRecipients, setSelectedNotificationRecipients] =
    useState<string[]>([]);
  const updateNotificationForSelected = async (
    message: string,
    studentIds: string[]
  ) => {
    if (studentIds.length === 0) {
      throw new Error("No recipients selected");
    }

    // Create notification object
    const notification = {
      id: Date.now().toString(),
      title: "Student Management Notification",
      message: message,
      type: "info",
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Get selected students' emails from student_data
    const { data: selectedStudents, error: studentError } = await supabase
      .from("student_data")
      .select("email")
      .in("id", studentIds);

    if (studentError) throw new Error(studentError.message);

    if (!selectedStudents || selectedStudents.length === 0) {
      throw new Error("No students found");
    }

    const studentEmails = selectedStudents.map((s) => s.email);

    // Find corresponding users by email
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("id, notifications")
      .in("email", studentEmails);

    if (fetchError) throw new Error(fetchError.message);

    if (!users || users.length === 0) {
      throw new Error("No matching users found for selected students");
    }

    // Update each user's notifications
    const updatePromises = users.map((user) => {
      const currentNotifications = user.notifications || [];
      const updatedNotifications = [notification, ...currentNotifications];

      return supabase
        .from("users")
        .update({ notifications: updatedNotifications })
        .eq("id", user.id);
    });

    const results = await Promise.all(updatePromises);
    const errors = results.filter((result) => result.error);

    if (errors.length > 0) {
      throw new Error(`Failed to update ${errors.length} users`);
    }

    return results;
  };

  // Removed duplicate handleSendNotification function
  // Add notification options
  const notificationOptions = [
    "New Event Available",
    "Join New Club - Registration Open",
    "Exam Schedule Released",
    "Holiday Announcement",
    "Academic Calendar Update",
    "Important Deadline Reminder",
    "Course Registration Open",
    "Library Hours Changed",
    "Campus Facility Update",
    "Student Services Announcement",
    "Scholarship Opportunity",
    "Career Fair Announcement",
  ];

  // Function to update notification for all students using Supabase
  const updateNotificationForAll = async (message: string) => {
    // Create notification object
    const notification = {
      id: Date.now().toString(),
      title: "Student Management Notification",
      message: message,
      type: "info",
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Get all users with student role
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("id, notifications")
      .eq("role", "student");

    if (fetchError) throw new Error(fetchError.message);

    if (!users || users.length === 0) {
      throw new Error("No students found");
    }

    // Update each student's notifications
    const updatePromises = users.map((user) => {
      const currentNotifications = user.notifications || [];
      const updatedNotifications = [notification, ...currentNotifications];

      return supabase
        .from("users")
        .update({ notifications: updatedNotifications })
        .eq("id", user.id);
    });

    const results = await Promise.all(updatePromises);
    const errors = results.filter((result) => result.error);

    if (errors.length > 0) {
      throw new Error(`Failed to update ${errors.length} students`);
    }

    return results;
  };

  // New function to send notification
  const handleSendNotification = async () => {
    if (!notificationMessage) {
      toast({
        title: "No Notification Selected",
        description: "Please select a notification message to send.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Assuming you have an API function in useStudentData to update notifications for all students
      // This needs to be implemented in your hook/backend
      await updateNotificationForAll(notificationMessage);

      toast({
        title: "Notification Sent",
        description: `Notification "${notificationMessage}" sent to all students.`,
      });

      // Clear selection after sending
      setNotificationMessage("");
    } catch (error) {
      toast({
        title: "Error Sending Notification",
        description:
          error instanceof Error
            ? error.message
            : "Failed to send notification.",
        variant: "destructive",
      });
    }
  };

  const handleDepartmentFilter = async (department: string) => {
    setDepartmentFilter(department);
    await filterByDepartment(department);
  };

  const handleStatusFilter = async (status: StudentStatus | "all") => {
    setStatusFilter(status);
    await filterByStatus(status);
  };

  const handleDeleteStudent = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this student? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteStudent(id);
      toast({
        title: "Success!",
        description: "Student has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete student.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusBadge = (status: StudentStatus) => {
    const statusConfig = {
      active: { variant: "default" as const, label: "Active" },
      inactive: { variant: "secondary" as const, label: "Inactive" },
      graduated: { variant: "outline" as const, label: "Graduated" },
      suspended: { variant: "destructive" as const, label: "Suspended" },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const exportToCSV = () => {
    if (students.length === 0) {
      toast({
        title: "No Data",
        description: "No student data available to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Student ID",
      "Full Name",
      "Email",
      "Department",
      "Blood Group",
      "Phone",
      "Date of Birth",
      "Admission Date",
      "Status",
    ];

    const csvContent = [
      headers.join(","),
      ...students.map((student) =>
        [
          student.student_id,
          `"${student.full_name}"`,
          student.email,
          `"${student.department}"`,
          student.blood_group || "",
          student.phone_number || "",
          student.date_of_birth || "",
          student.admission_date,
          student.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success!",
      description: "Student data exported successfully.",
    });
  };

  if (loading && students.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground">
            Manage student admissions and data
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
          {/* Notification UI for selected/all students */}
          <div className="flex flex-col gap-2 items-start">
            <select
              className="border rounded px-3 py-1 text-sm"
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
            >
              <option value="">Select Notification</option>
              {notificationOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={async () => {
                  if (
                    !notificationMessage ||
                    selectedNotificationRecipients.length === 0
                  ) {
                    toast({
                      title: "Select Recipients and Notification",
                      description:
                        "Please select at least one recipient and a notification message.",
                      variant: "destructive",
                    });
                    return;
                  }
                  try {
                    await updateNotificationForSelected(
                      notificationMessage,
                      selectedNotificationRecipients
                    );
                    toast({
                      title: "Notification Sent",
                      description: `Notification "${notificationMessage}" sent to selected students.`,
                    });
                    setNotificationMessage("");
                    setSelectedNotificationRecipients([]);
                  } catch (error) {
                    toast({
                      title: "Error Sending Notification",
                      description:
                        error instanceof Error
                          ? error.message
                          : "Failed to send notification.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={
                  !notificationMessage ||
                  selectedNotificationRecipients.length === 0
                }
              >
                <Users className="h-4 w-4 mr-2" />
                Send to Selected
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!notificationMessage) {
                    toast({
                      title: "No Notification Selected",
                      description:
                        "Please select a notification message to send.",
                      variant: "destructive",
                    });
                    return;
                  }
                  try {
                    await updateNotificationForAll(notificationMessage);
                    toast({
                      title: "Notification Sent",
                      description: `Notification "${notificationMessage}" sent to all students.`,
                    });
                    setNotificationMessage("");
                    setSelectedNotificationRecipients([]);
                  } catch (error) {
                    toast({
                      title: "Error Sending Notification",
                      description:
                        error instanceof Error
                          ? error.message
                          : "Failed to send notification.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!notificationMessage}
              >
                <Users className="h-4 w-4 mr-2" />
                Send to All
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* AI Email Generator */}
      <div className="my-6 p-4 border rounded bg-muted">
        <h2 className="text-lg font-semibold mb-2">AI Email Generator</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-sm mb-1">
              Describe the email you want:
            </label>
            <Input
              placeholder="e.g. Invite students to the new club event"
              value={emailPrompt}
              onChange={(e) => setEmailPrompt(e.target.value)}
              disabled={emailLoading}
            />
          </div>
          <Button
            className="mt-2 sm:mt-0 sm:ml-2"
            onClick={handleGenerateEmail}
            disabled={emailLoading}
          >
            {emailLoading ? "Generating..." : "Generate Email"}
          </Button>
        </div>
        {generatedEmail && (
          <div className="mt-4 p-3 bg-white border rounded text-sm whitespace-pre-line">
            <strong>Generated Email:</strong>
            <div className="mt-2">{generatedEmail}</div>
          </div>
        )}
      </div>
      <Button
        variant="secondary"
        className="mt-2"
        onClick={handleSendEmailToAllStudents}
        disabled={!generatedEmail}
      >
        Send Email to All Students
      </Button>
      {/* Statistics Cards */}
      {statistics && !statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Students
                </p>
                <p className="text-2xl font-bold">
                  {statistics.total_students}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Active Students
                </p>
                <p className="text-2xl font-bold">
                  {statistics.active_students}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Building className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Departments
                </p>
                <p className="text-2xl font-bold">
                  {statistics.departments_count}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <GraduationCap className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Recent Admissions
                </p>
                <p className="text-2xl font-bold">
                  {statistics.recent_admissions}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Multi-select for choosing students to notify */}
      <div className="max-h-48 overflow-auto border rounded px-3 py-1 text-sm w-72 mb-4">
        <p className="font-semibold mb-1">Select Recipients:</p>
        {students.length === 0 ? (
          <p className="text-muted-foreground">No students available</p>
        ) : (
          students.map((student) => (
            <label
              key={student.id}
              className="flex items-center gap-2 mb-1 cursor-pointer"
            >
              <input
                type="checkbox"
                value={student.id}
                checked={selectedNotificationRecipients.includes(student.id)}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedNotificationRecipients((prev) =>
                    e.target.checked
                      ? [...prev, id]
                      : prev.filter((sid) => sid !== id)
                  );
                }}
              />
              <span>
                {student.full_name} ({student.student_id})
              </span>
            </label>
          ))
        )}
      </div>
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, student ID, email, or department..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Department Filter */}
            <Select
              value={departmentFilter}
              onValueChange={handleDepartmentFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No students found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery ||
                departmentFilter !== "all" ||
                statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Add your first student to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admission Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.student_id}
                      </TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${student.email}`}
                          className="text-inherit no-underline"
                        >
                          {student.email}
                        </a>
                      </TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell>{student.blood_group || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell>
                        {formatDate(student.admission_date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSelectedStudent(student)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteStudent(student.id)}
                              disabled={isDeleting === student.id}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isDeleting === student.id
                                ? "Deleting..."
                                : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Add Student Form */}
      {showAddForm && (
        <AddStudentForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            refetch();
            setShowAddForm(false);
          }}
        />
      )}
      {/* Student Details Dialog */}
      <Dialog
        open={!!selectedStudent}
        onOpenChange={() => setSelectedStudent(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Student ID
                  </p>
                  <p className="text-lg font-semibold">
                    {selectedStudent.student_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </p>
                  <p className="text-lg font-semibold">
                    {selectedStudent.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Department
                  </p>
                  <p>{selectedStudent.department}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  {getStatusBadge(selectedStudent.status)}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="font-medium">Contact Information</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedStudent.email}
                  </div>
                  {selectedStudent.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedStudent.phone_number}
                    </div>
                  )}
                  {selectedStudent.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      {selectedStudent.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">
                    Blood Group
                  </p>
                  <p>{selectedStudent.blood_group || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    Date of Birth
                  </p>
                  <p>{formatDate(selectedStudent.date_of_birth)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    Admission Date
                  </p>
                  <p>{formatDate(selectedStudent.admission_date)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    Validity Date
                  </p>
                  <p>{formatDate(selectedStudent.validity_date)}</p>
                </div>
              </div>

              {/* Guardian Info */}
              {(selectedStudent.guardian_name ||
                selectedStudent.guardian_phone ||
                selectedStudent.emergency_contact) && (
                <div className="space-y-2">
                  <h4 className="font-medium">Guardian Information</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {selectedStudent.guardian_name && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Name:{" "}
                        </span>
                        {selectedStudent.guardian_name}
                      </div>
                    )}
                    {selectedStudent.guardian_phone && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Phone:{" "}
                        </span>
                        {selectedStudent.guardian_phone}
                      </div>
                    )}
                    {selectedStudent.emergency_contact && (
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Emergency:{" "}
                        </span>
                        {selectedStudent.emergency_contact}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedStudent.notes && (
                <div>
                  <p className="font-medium text-muted-foreground mb-2">
                    Notes
                  </p>
                  <p className="text-sm bg-muted p-3 rounded">
                    {selectedStudent.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentManagement;
