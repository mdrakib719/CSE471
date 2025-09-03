import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  cover_image_url?: string;
  is_public: boolean;
  max_members: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'suspended';
  member_count: number;
  is_member: boolean;
  user_role?: 'admin' | 'moderator' | 'member';
  creator_name: string;
  creator_avatar?: string;
}

export interface CreateGroupData {
  name: string;
  description: string;
  category: string;
  cover_image_url?: string;
  is_public: boolean;
  max_members: number;
}

export const useCommunityGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [userGroups, setUserGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all public groups
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('community_groups')
        .select(`
          *,
          creator:users!community_groups_created_by_fkey(
            full_name,
            avatar_url
          ),
          members:group_memberships(count)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedGroups: CommunityGroup[] = (data || []).map(group => ({
        ...group,
        member_count: group.members?.[0]?.count || 0,
        is_member: false, // Will be updated by fetchUserGroups
        creator_name: group.creator?.full_name || 'Unknown User',
        creator_avatar: group.creator?.avatar_url
      }));

      setGroups(formattedGroups);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  // Fetch groups that the user is a member of
  const fetchUserGroups = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('group_memberships')
        .select(`
          *,
          group:community_groups(
            *,
            creator:users!community_groups_created_by_fkey(
              full_name,
              avatar_url
            ),
            members:group_memberships(count)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('group.status', 'active');

      if (error) throw error;

      const formattedUserGroups: CommunityGroup[] = (data || []).map(membership => ({
        ...membership.group,
        member_count: membership.group.members?.[0]?.count || 0,
        is_member: true,
        user_role: membership.role,
        creator_name: membership.group.creator?.full_name || 'Unknown User',
        creator_avatar: membership.group.creator?.avatar_url
      }));

      setUserGroups(formattedUserGroups);

      // Update the main groups list to show membership status
      setGroups(prev => prev.map(group => ({
        ...group,
        is_member: formattedUserGroups.some(ug => ug.id === group.id),
        user_role: formattedUserGroups.find(ug => ug.id === group.id)?.user_role
      })));
    } catch (err) {
      console.error('Error fetching user groups:', err);
    }
  };

  // Create new group
  const createGroup = async (groupData: CreateGroupData): Promise<string | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('community_groups')
        .insert({
          ...groupData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the group as admin
      await supabase
        .from('group_memberships')
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: 'admin'
        });

      // Refresh groups
      await fetchGroups();
      await fetchUserGroups();

      return data.id;
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Join group
  const joinGroup = async (groupId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('group_memberships')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      // Refresh groups
      await fetchGroups();
      await fetchUserGroups();

      return true;
    } catch (err) {
      console.error('Error joining group:', err);
      return false;
    }
  };

  // Leave group
  const leaveGroup = async (groupId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('group_memberships')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh groups
      await fetchGroups();
      await fetchUserGroups();

      return true;
    } catch (err) {
      console.error('Error leaving group:', err);
      return false;
    }
  };

  // Update group
  const updateGroup = async (groupId: string, updates: Partial<CreateGroupData>): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('community_groups')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)
        .eq('created_by', user.id);

      if (error) throw error;

      // Refresh groups
      await fetchGroups();
      await fetchUserGroups();

      return true;
    } catch (err) {
      console.error('Error updating group:', err);
      return false;
    }
  };

  // Delete group
  const deleteGroup = async (groupId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('community_groups')
        .delete()
        .eq('id', groupId)
        .eq('created_by', user.id);

      if (error) throw error;

      // Refresh groups
      await fetchGroups();
      await fetchUserGroups();

      return true;
    } catch (err) {
      console.error('Error deleting group:', err);
      return false;
    }
  };

  // Load groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchUserGroups();
    }
  }, [user?.id]);

  return {
    groups,
    userGroups,
    loading,
    error,
    createGroup,
    joinGroup,
    leaveGroup,
    updateGroup,
    deleteGroup,
    refreshGroups: fetchGroups,
    refreshUserGroups: fetchUserGroups
  };
};
