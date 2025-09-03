import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface PanelMember {
  role: string;
  student_id: string;
  user_id?: string;
  full_name?: string;
  department?: string;
}

interface ClubPanelManagerProps {
  clubId?: string;
  panelMembers: PanelMember[];
  onPanelMembersChange: (members: PanelMember[]) => void;
}

const PANEL_ROLES = [
  'President',
  'Vice President', 
  'General Secretary',
  'Financial Secretary'
];

const ClubPanelManager: React.FC<ClubPanelManagerProps> = ({
  clubId,
  panelMembers,
  onPanelMembersChange
}) => {
  const { toast } = useToast();
  const [newMember, setNewMember] = useState({ role: '', student_id: '' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserByStudentId = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, department, student_id')
        .eq('student_id', studentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  const addPanelMember = async () => {
    if (!newMember.role || !newMember.student_id) {
      toast({
        title: "Missing Information",
        description: "Please select a role and enter a student ID",
        variant: "destructive",
      });
      return;
    }

    // Check if role already exists
    const roleExists = panelMembers.some(member => member.role === newMember.role);
    if (roleExists) {
      toast({
        title: "Role Already Assigned",
        description: `The ${newMember.role} role is already assigned to another member`,
        variant: "destructive",
      });
      return;
    }

    // Check if student is already in panel
    const studentExists = panelMembers.some(member => member.student_id === newMember.student_id);
    if (studentExists) {
      toast({
        title: "Student Already in Panel",
        description: "This student is already assigned to a panel role",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const userData = await fetchUserByStudentId(newMember.student_id);
      if (!userData) {
        toast({
          title: "Student Not Found",
          description: `No user found with student ID: ${newMember.student_id}`,
          variant: "destructive",
        });
        return;
      }

      const memberToAdd: PanelMember = {
        role: newMember.role,
        student_id: newMember.student_id,
        user_id: userData.id,
        full_name: userData.full_name,
        department: userData.department
      };

      // If club exists, add to database
      if (clubId) {
        const { error } = await supabase.rpc('add_club_panel_member', {
          _club_id: clubId,
          _role: newMember.role,
          _student_id: newMember.student_id
        });

        if (error) throw error;
      }

      // Update local state
      onPanelMembersChange([...panelMembers, memberToAdd]);
      setNewMember({ role: '', student_id: '' });

      toast({
        title: "Panel Member Added",
        description: `${userData.full_name} has been added as ${newMember.role}`,
      });

    } catch (error) {
      console.error('Error adding panel member:', error);
      toast({
        title: "Error",
        description: "Failed to add panel member",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removePanelMember = async (studentId: string) => {
    try {
      // If club exists, remove from database
      if (clubId) {
        const { error } = await supabase.rpc('remove_club_panel_member', {
          _club_id: clubId,
          _student_id: studentId
        });

        if (error) throw error;
      }

      // Update local state
      const updatedMembers = panelMembers.filter(member => member.student_id !== studentId);
      onPanelMembersChange(updatedMembers);

      toast({
        title: "Panel Member Removed",
        description: "Panel member has been removed successfully",
      });

    } catch (error) {
      console.error('Error removing panel member:', error);
      toast({
        title: "Error",
        description: "Failed to remove panel member",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Panel Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Panel Member */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="role">Designation</Label>
            <Select value={newMember.role} onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                {PANEL_ROLES.map((role) => (
                  <SelectItem key={role} value={role} disabled={panelMembers.some(m => m.role === role)}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="student_id">Student ID</Label>
            <Input
              id="student_id"
              placeholder="Enter student ID"
              value={newMember.student_id}
              onChange={(e) => setNewMember(prev => ({ ...prev, student_id: e.target.value }))}
            />
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={addPanelMember} 
              disabled={isLoading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Current Panel Members */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Current Panel Members</h3>
          {panelMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {panelMembers.map((member, index) => {
                const initials = member.full_name 
                  ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                  : member.student_id.slice(-2).toUpperCase();
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.full_name || 'Unknown User'}</p>
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">ID: {member.student_id}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePanelMember(member.student_id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No panel members assigned yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubPanelManager;
