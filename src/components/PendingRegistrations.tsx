import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { usePendingRegistrations } from '@/hooks/usePendingRegistrations';
import { useToast } from "@/hooks/use-toast";
import { Eye, Check, X, Calendar, User, Mail, GraduationCap, Hash } from 'lucide-react';

const PendingRegistrations = () => {
  const { 
    registrations, 
    loading, 
    error, 
    approveRegistration, 
    rejectRegistration,
    getStudentIdUrl 
  } = usePendingRegistrations();
  
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [studentIdUrl, setStudentIdUrl] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleViewStudentId = async (filePath: string, userName: string) => {
    try {
      const url = await getStudentIdUrl(filePath);
      if (url) {
        setStudentIdUrl(url);
        setSelectedUser(userName);
      } else {
        toast({
          title: "Error",
          description: "Could not load student ID image",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error viewing student ID:', error);
      toast({
        title: "Error",
        description: "Failed to load student ID image",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (userId: string, userName: string) => {
    setIsProcessing(true);
    try {
      const success = await approveRegistration(userId, adminNotes);
      if (success) {
        toast({
          title: "Registration Approved",
          description: `${userName}'s registration has been approved successfully.`,
        });
        setAdminNotes('');
      }
    } catch (error) {
      console.error('Error approving registration:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    if (!adminNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const success = await rejectRegistration(userId, adminNotes);
      if (success) {
        toast({
          title: "Registration Rejected",
          description: `${userName}'s registration has been rejected.`,
        });
        setAdminNotes('');
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading pending registrations</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pending Registrations</h2>
        <Badge variant="secondary" className="text-sm">
          {registrations.length} pending
        </Badge>
      </div>

      {registrations.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No pending registrations</p>
              <p className="text-sm mt-1">All new registrations will appear here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {registrations.map((registration) => (
            <Card key={registration.user_id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{registration.full_name}</CardTitle>
                  <Badge variant="outline">Pending Review</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span>{registration.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Student ID:</span>
                      <span>{registration.student_id}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Department:</span>
                      <span>{registration.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Registered:</span>
                      <span>{new Date(registration.registered_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Student ID Document */}
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Student ID Document</p>
                      <p className="text-xs text-muted-foreground">
                        {registration.file_name} • {(registration.file_size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStudentId(registration.file_path, registration.full_name)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <Label htmlFor={`notes-${registration.user_id}`}>Admin Notes</Label>
                  <Textarea
                    id={`notes-${registration.user_id}`}
                    placeholder="Add notes about this registration..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(registration.user_id, registration.full_name)}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(registration.user_id, registration.full_name)}
                    disabled={isProcessing || !adminNotes.trim()}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student ID Viewer Dialog */}
      <Dialog open={!!studentIdUrl} onOpenChange={() => setStudentIdUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student ID Card - {selectedUser}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {studentIdUrl && (
              <img
                src={studentIdUrl}
                alt="Student ID Card"
                className="max-w-full max-h-96 object-contain rounded border"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingRegistrations;
