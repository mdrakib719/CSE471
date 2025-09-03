import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface SocialPost {
  id: string;
  user_id: string;
  group_id?: string;
  club_id?: string;
  content: string;
  post_type: 'text' | 'image' | 'video' | 'link' | 'announcement' | 'event';
  media_urls?: string[];
  external_link?: string;
  is_announcement: boolean;
  is_pinned: boolean;
  visibility: 'public' | 'group' | 'club' | 'private';
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  author_name: string;
  author_avatar?: string;
  author_department?: string;
  group_name?: string;
  club_name?: string;
  is_liked: boolean;
  is_author: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  author_name: string;
  author_avatar?: string;
  is_liked: boolean;
  is_author: boolean;
}

export interface CreatePostData {
  content: string;
  post_type?: 'text' | 'image' | 'video' | 'link' | 'announcement' | 'event';
  media_urls?: string[];
  external_link?: string;
  is_announcement?: boolean;
  visibility?: 'public' | 'group' | 'club' | 'private';
  group_id?: string;
  club_id?: string;
}

export const useSocialFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch social feed
  const fetchSocialFeed = async (reset = false) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 0 : page;
      const offset = currentPage * limit;

      const { data, error } = await supabase.rpc('get_social_feed', {
        _user_id: user.id,
        _limit: limit,
        _offset: offset
      });

      if (error) throw error;

      if (reset) {
        setPosts(data || []);
        setPage(0);
      } else {
        setPosts(prev => [...prev, ...(data || [])]);
        setPage(currentPage + 1);
      }

      setHasMore((data || []).length === limit);
    } catch (err) {
      console.error('Error fetching social feed:', err);
      setError('Failed to fetch social feed');
    } finally {
      setLoading(false);
    }
  };

  // Create new post
  const createPost = async (postData: CreatePostData): Promise<string | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          post_type: postData.post_type || 'text',
          media_urls: postData.media_urls || null,
          external_link: postData.external_link || null,
          is_announcement: postData.is_announcement || false,
          visibility: postData.visibility || 'public',
          group_id: postData.group_id || null,
          club_id: postData.club_id || null
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh the feed
      await fetchSocialFeed(true);
      return data.id;
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Like/unlike post
  const togglePostLike = async (postId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return false;

      if (post.is_liked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, is_liked: false, likes_count: p.likes_count - 1 }
            : p
        ));
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;

        // Update local state
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, is_liked: true, likes_count: p.likes_count + 1 }
            : p
        ));
      }

      return true;
    } catch (err) {
      console.error('Error toggling post like:', err);
      return false;
    }
  };

  // Delete post
  const deletePost = async (postId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state
      setPosts(prev => prev.filter(p => p.id !== postId));
      return true;
    } catch (err) {
      console.error('Error deleting post:', err);
      return false;
    }
  };

  // Load more posts
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchSocialFeed();
    }
  };

  // Refresh feed
  const refreshFeed = () => {
    fetchSocialFeed(true);
  };

  // Load initial feed
  useEffect(() => {
    if (user?.id) {
      fetchSocialFeed(true);
    }
  }, [user?.id]);

  return {
    posts,
    loading,
    error,
    hasMore,
    createPost,
    togglePostLike,
    deletePost,
    loadMore,
    refreshFeed
  };
};

// Hook for managing post comments
export const usePostComments = (postId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments for a post
  const fetchComments = async () => {
    if (!postId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:users!post_comments_user_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedComments: PostComment[] = (data || []).map(comment => ({
        ...comment,
        author_name: comment.user?.full_name || 'Unknown User',
        author_avatar: comment.user?.avatar_url,
        is_liked: false, // TODO: Implement comment likes
        is_author: comment.user_id === user?.id
      }));

      setComments(formattedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  // Add comment
  const addComment = async (content: string, parentCommentId?: string): Promise<boolean> => {
    if (!user?.id || !postId) return false;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          parent_comment_id: parentCommentId || null,
          content
        });

      if (error) throw error;

      // Refresh comments
      await fetchComments();
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      return false;
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state
      setComments(prev => prev.filter(c => c.id !== commentId));
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      return false;
    }
  };

  // Load comments when postId changes
  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    refreshComments: fetchComments
  };
};
