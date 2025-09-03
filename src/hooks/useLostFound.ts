import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  location: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  status: "lost" | "found" | "claimed";
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLostFoundItem {
  title: string;
  description: string;
  location: string;
}

export interface UpdateLostFoundItem {
  title?: string;
  description?: string;
  location?: string;
  image_url?: string;
}

export const useLostFound = () => {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all lost and found items
  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("lost_found_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setItems(data || []);
    } catch (err) {
      console.error("Error fetching lost and found items:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  // Create a new lost/found item
  const createItem = async (itemData: CreateLostFoundItem) => {
    try {
      setError(null);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error: createError } = await supabase
        .from("lost_found_items")
        .insert({
          ...itemData,
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Refresh the items list
      await fetchItems();
      return data;
    } catch (err) {
      console.error("Error creating lost/found item:", err);
      setError(err instanceof Error ? err.message : "Failed to create item");
      throw err;
    }
  };

  // Update an item
  const updateItem = async (itemId: string, updates: UpdateLostFoundItem) => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from("lost_found_items")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update the item in the local state
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? { ...item, ...updates, updated_at: new Date().toISOString() }
            : item
        )
      );

      return data;
    } catch (err) {
      console.error("Error updating item:", err);
      setError(err instanceof Error ? err.message : "Failed to update item");
      throw err;
    }
  };

  // Update an item status
  const updateItemStatus = async (
    itemId: string,
    status: "lost" | "found" | "claimed"
  ) => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from("lost_found_items")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update the item in the local state
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? { ...item, status, updated_at: new Date().toISOString() }
            : item
        )
      );

      return data;
    } catch (err) {
      console.error("Error updating item status:", err);
      setError(err instanceof Error ? err.message : "Failed to update item");
      throw err;
    }
  };

  // Delete an item
  const deleteItem = async (itemId: string) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from("lost_found_items")
        .delete()
        .eq("id", itemId);

      if (deleteError) {
        throw deleteError;
      }

      // Remove the item from local state
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Error deleting item:", err);
      setError(err instanceof Error ? err.message : "Failed to delete item");
      throw err;
    }
  };

  // Get items by status
  const getItemsByStatus = (status: "lost" | "found" | "claimed") => {
    return items.filter((item) => item.status === status);
  };

  // Get user's own items
  const getUserItems = () => {
    if (!user?.id) return [];
    return items.filter((item) => item.user_id === user.id);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    updateItemStatus,
    deleteItem,
    getItemsByStatus,
    getUserItems,
  };
};
