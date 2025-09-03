import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface ClubSubscription {
  id: string;
  club_id: string;
  user_id: string;
  subscribed_at: string;
  notification_preferences: {
    events: boolean;
    announcements: boolean;
    activities: boolean;
  };
  is_active: boolean;
}

export const useClubSubscriptions = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<ClubSubscription[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's club subscriptions
  const fetchSubscriptions = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID for fetching subscriptions');
      return;
    }

    console.log('Fetching subscriptions for user:', user.id);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('club_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return;
      }

      console.log('Fetched subscriptions:', data);
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Subscribe to a club
  const subscribeToClub = useCallback(async (clubId: string): Promise<boolean> => {
    if (!user?.id) {
      console.log('No user ID for subscription');
      return false;
    }

    console.log('Attempting to subscribe user', user.id, 'to club', clubId);

    try {
      const subscriptionData = {
        club_id: clubId,
        user_id: user.id,
        notification_preferences: {
          events: true,
          announcements: true,
          activities: true
        }
      };
      
      console.log('Subscription data:', subscriptionData);

      const { data, error } = await supabase
        .from('club_subscriptions')
        .insert(subscriptionData)
        .select();

      if (error) {
        console.error('Error subscribing to club:', error);
        return false;
      }

      console.log('Subscription successful:', data);

      // Refresh subscriptions
      await fetchSubscriptions();
      return true;
    } catch (error) {
      console.error('Error subscribing to club:', error);
      return false;
    }
  }, [user?.id, fetchSubscriptions]);

  // Unsubscribe from a club
  const unsubscribeFromClub = useCallback(async (clubId: string): Promise<boolean> => {
    if (!user?.id) {
      console.log('No user ID for unsubscription');
      return false;
    }

    console.log('Attempting to unsubscribe user', user.id, 'from club', clubId);

    try {
      const { error } = await supabase
        .from('club_subscriptions')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error unsubscribing from club:', error);
        return false;
      }

      console.log('Unsubscription successful');

      // Refresh subscriptions
      await fetchSubscriptions();
      return true;
    } catch (error) {
      console.error('Error unsubscribing from club:', error);
      return false;
    }
  }, [user?.id, fetchSubscriptions]);

  // Check if user is subscribed to a specific club
  const isSubscribedToClub = useCallback((clubId: string): boolean => {
    return subscriptions.some(sub => sub.club_id === clubId);
  }, [subscriptions]);

  // Get subscription count for a club
  const getClubSubscriptionCount = useCallback(async (clubId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('club_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('is_active', true);

      if (error) {
        console.error('Error getting subscription count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting subscription count:', error);
      return 0;
    }
  }, []);

  // Get member count for a club
  const getClubMemberCount = useCallback(async (clubId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('club_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('status', 'active');

      if (error) {
        console.error('Error getting member count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting member count:', error);
      return 0;
    }
  }, []);

  // Fetch subscriptions on mount
  useEffect(() => {
    console.log('useClubSubscriptions useEffect triggered, user:', user?.id);
    if (user?.id) {
      fetchSubscriptions();
    }
  }, [user?.id, fetchSubscriptions]);

  return {
    subscriptions,
    loading,
    subscribeToClub,
    unsubscribeFromClub,
    isSubscribedToClub,
    getClubSubscriptionCount,
    getClubMemberCount,
    fetchSubscriptions
  };
};
