import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { Check, X, Calendar, User, Mail, GraduationCap, Hash } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface SimplePendingRegistration {
  user_id: string;
  email: string;
  full_name: string;
  student_id: string;
  department: string;
  registered_at: string;
  role: string;
}

const SimplePendingRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<SimplePendingRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Fetch pending registrations
  const fetchPendingRegistrations = async () => {
    if (!user || user.role !== 'admin') {
      setError('Admin access required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_pending_registrations');

      if (error) throw error;

      setRegistrations(data || []);
    } catch (err: any) {
      console.error('Error fetching pending registrations:', err);
      setError(err.message || 'Failed to fetch pending registrations');
    } finally {
      setLoading(false);
    }
  };

  // Approve registration
  const handleApprove = async (userId: string, userName: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('approve_user_registration', {
        _user_id: userId,
        _admin_notes: adminNotes || null
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Registration Approved",
          description: `${userName}'s registration has been approved successfully.`,
        });
        setAdminNotes('');
        await fetchPendingRegistrations(); // Refresh list
      } else {
        throw new Error(data.error || 'Failed to approve registration');
      }
    } catch (err: any) {
      console.error('Error approving registration:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to approve registration',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject registration
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
      const { data, error } = await supabase.rpc('reject_user_registration', {
        _user_id: userId,
        _admin_notes: adminNotes
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Registration Rejected",
          description: `${userName}'s registration has been rejected.`,
        });
        setAdminNotes('');
        await fetchPendingRegistrations(); // Refresh list
      } else {
        throw new Error(data.error || 'Failed to reject registration');
      }
    } catch (err: any) {
      console.error('Error rejecting registration:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to reject registration',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Load data on component mount
  React.useEffect(() => {
    fetchPendingRegistrations();
  }, [user]);

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
            <Button onClick={fetchPendingRegistrations} className="mt-4">
              Try Again
            </Button>
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
    </div>
  );
};

export default SimplePendingRegistrations;
