import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Plus,
  Search,
  User,
  MessageCircle,
  Eye,
  Calendar,
  Reply,
  Edit,
  Trash2,
  Pin,
  Lock,
  Image as ImageIcon,
  X,
  Upload,
  Loader,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { uploadImageToCloudinary, getOptimizedImageUrl } from "@/lib/cloudinary";
import { PostAuthor } from "@/components/PostAuthor";

interface ForumThread {
  id: string;
  title: string;
  content: string;
  created_by: string; // Author user id as UUID
  updated_by?: string;
  author_name?: string;
  category?: string;
  tags?: string[];
  image_url?: string; // New field for thread images
  is_pinned?: boolean;
  is_locked?: boolean;
  view_count?: number;
  reply_count?: number;
  created_at: string;
  updated_at: string;
  last_reply_at?: string;
}

interface ForumPost {
  id: string;
  thread_id: string;
  content: string;
  created_by: string; // Author user id as UUID
  updated_by?: string;
  author_name?: string;
  parent_post_id?: string;
  image_url?: string; // New field for post images
  is_edited?: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
}

const Forum = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(
    null
  );
  const [threadPosts, setThreadPosts] = useState<ForumPost[]>([]);
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [showReplies, setShowReplies] = useState(false); // Toggle for showing replies
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [repliesEnabled, setRepliesEnabled] = useState(true); // Toggle for enabling replies
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const [threadForm, setThreadForm] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    image_url: "",
  });

  const [postForm, setPostForm] = useState({
    content: "",
    image_url: "",
  });

  // Image upload states
  const [threadImageFile, setThreadImageFile] = useState<File | null>(null);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [uploadingThreadImage, setUploadingThreadImage] = useState(false);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostImageUrl, setEditPostImageUrl] = useState("");
  const [editPostImageFile, setEditPostImageFile] = useState<File | null>(null);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  
  // Thread editing states
  const [editingThread, setEditingThread] = useState<ForumThread | null>(null);
  const [editThreadForm, setEditThreadForm] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    image_url: "",
  });
  const [editThreadImageFile, setEditThreadImageFile] = useState<File | null>(null);
  const [uploadingEditThreadImage, setUploadingEditThreadImage] = useState(false);
  const editPostImageInputRef = useRef<HTMLInputElement>(null);
  const editThreadImageInputRef = useRef<HTMLInputElement>(null);
  const threadImageInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    "General Discussion",
    "Academic",
    "Student Life",
    "Technology",
    "Arts & Culture",
    "Career & Jobs",
    "Events",
    "Clubs & Organizations",
    "Other",
  ];

  const fetchThreads = async () => {
    try {
      setLoading(true);

      const { data: threadsData, error: threadsError } = await supabase
        .from("forum_threads")
        .select("*")
        .order("created_at", { ascending: false });

      if (threadsError) {
        console.error("Error fetching threads:", threadsError);
        return;
      }

      const threadsWithAuthors = await Promise.all(
        threadsData.map(async (thread) => {
          const authorId = thread.created_by;
          if (authorId) {
            const { data: userData } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", authorId)
              .single();

            return {
              ...thread,
              author_name: userData?.full_name || "Anonymous",
              tags: Array.isArray(thread.tags) ? thread.tags : 
                    typeof thread.tags === 'string' ? 
                      (() => {
                        try {
                          // Try to parse as JSON first
                          const parsed = JSON.parse(thread.tags);
                          return Array.isArray(parsed) ? parsed : [];
                        } catch {
                          // If not JSON, split by comma
                          return thread.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                        }
                      })() : 
                      []
            };
          }
          return { 
            ...thread, 
            author_name: "Anonymous",
            tags: Array.isArray(thread.tags) ? thread.tags : 
                  typeof thread.tags === 'string' ? 
                    (() => {
                      try {
                        // Try to parse as JSON first
                        const parsed = JSON.parse(thread.tags);
                        return Array.isArray(parsed) ? parsed : [];
                      } catch {
                        // If not JSON, split by comma
                        return thread.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                      }
                    })() : 
                    []
          };
        })
      );

      setThreads(threadsWithAuthors);
    } catch (err) {
      console.error("Error in fetchThreads:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreadPosts = async (threadId: string) => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        return;
      }

      const postsWithAuthors = await Promise.all(
        postsData.map(async (post) => {
          const authorId = post.created_by;
          if (authorId) {
            const { data: userData } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", authorId)
              .single();

            return {
              ...post,
              author_name: userData?.full_name || "Anonymous",
            };
          }
          return { ...post, author_name: "Anonymous" };
        })
      );

      setThreadPosts(postsWithAuthors);
    } catch (err) {
      console.error("Error in fetchThreadPosts:", err);
    }
  };

  const handleCreateThread = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a thread",
        variant: "destructive",
      });
      return;
    }

    if (!threadForm.title.trim() || !threadForm.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const tagsArray = threadForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const newThread = {
        title: threadForm.title.trim(),
        content: threadForm.content.trim(),
        category: threadForm.category,
        tags: tagsArray,
        image_url: threadForm.image_url || null,
        created_by: String(user.id),
        updated_by: String(user.id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("forum_threads")
        .insert(newThread)
        .select()
        .single();

      if (error) {
        console.error("Error creating thread:", error);
        return;
      }

      toast({
        title: "Success",
        description: "Thread created successfully",
      });

      setShowNewThreadDialog(false);
      setThreadForm({ title: "", content: "", category: "", tags: "", image_url: "" });
      setThreadImageFile(null);
      fetchThreads();
    } catch (err) {
      console.error("Error in handleCreateThread:", err);
    }
  };

  const handleCreatePost = async () => {
    if (!user?.id || !selectedThread) return;

    if (!postForm.content.trim()) {
      toast({
        title: "Error",
        description: "Post content is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPost = {
        thread_id: selectedThread.id,
        content: postForm.content.trim(),
        image_url: postForm.image_url || null,
        created_by: String(user.id),
        updated_by: String(user.id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("forum_posts")
        .insert(newPost)
        .select()
        .single();

      if (error) {
        console.error("Error creating post:", error);
        return;
      }

      await supabase
        .from("forum_threads")
        .update({
          reply_count: (selectedThread.reply_count || 0) + 1,
          last_reply_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedThread.id);

      toast({
        title: "Success",
        description: "Post created successfully",
      });

      setShowNewPostDialog(false);
      setPostForm({ content: "", image_url: "" });
      setPostImageFile(null);
      fetchThreadPosts(selectedThread.id);
      fetchThreads();
    } catch (err) {
      console.error("Error in handleCreatePost:", err);
    }
  };

  const startEditPost = (post: ForumPost) => {
    setEditingPost(post);
    setEditPostContent(post.content);
    setEditPostImageUrl(post.image_url || "");
    setEditPostImageFile(null);
  };

  const cancelEditPost = () => {
    setEditingPost(null);
    setEditPostContent("");
    setEditPostImageUrl("");
    setEditPostImageFile(null);
    if (editPostImageInputRef.current) {
      editPostImageInputRef.current.value = "";
    }
  };

  // Thread edit/delete functions
  const handleDeleteThread = async (threadId: string) => {
    if (!user?.id) return;

    if (!confirm("Are you sure you want to delete this thread? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("forum_threads")
        .delete()
        .eq("id", threadId);

      if (error) throw error;

      setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
      
      // If the deleted thread was selected, clear selection
      if (selectedThread?.id === threadId) {
        setSelectedThread(null);
        setThreadPosts([]);
      }

      toast({
        title: "Success",
        description: "Thread deleted successfully.",
      });
    } catch (err) {
      console.error("Error deleting thread:", err);
      toast({
        title: "Error",
        description: "Failed to delete thread. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditThread = async () => {
    if (!editingThread || !editThreadForm.title.trim() || !editThreadForm.content.trim() || !user) return;

    try {
      const { error } = await supabase
        .from("forum_threads")
        .update({
          title: editThreadForm.title.trim(),
          content: editThreadForm.content.trim(),
          category: editThreadForm.category,
          tags: editThreadForm.tags,
          image_url: editThreadForm.image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingThread.id);

      if (error) throw error;

      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === editingThread.id
            ? {
                ...thread,
                title: editThreadForm.title.trim(),
                content: editThreadForm.content.trim(),
                category: editThreadForm.category,
                tags: editThreadForm.tags,
                image_url: editThreadForm.image_url || null,
                updated_at: new Date().toISOString(),
              }
            : thread
        )
      );

      // Update selected thread if it's the one being edited
      if (selectedThread?.id === editingThread.id) {
        setSelectedThread({
          ...selectedThread,
          title: editThreadForm.title.trim(),
          content: editThreadForm.content.trim(),
          category: editThreadForm.category,
          tags: editThreadForm.tags,
          image_url: editThreadForm.image_url || null,
          updated_at: new Date().toISOString(),
        });
      }

      setEditingThread(null);
      setEditThreadForm({
        title: "",
        content: "",
        category: "",
        tags: "",
        image_url: "",
      });
      setEditThreadImageFile(null);
      if (editThreadImageInputRef.current) {
        editThreadImageInputRef.current.value = "";
      }

      toast({
        title: "Success",
        description: "Thread updated successfully.",
      });
    } catch (err) {
      console.error("Error updating thread:", err);
      toast({
        title: "Error",
        description: "Failed to update thread. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditThread = (thread: ForumThread) => {
    setEditingThread(thread);
    setEditThreadForm({
      title: thread.title,
      content: thread.content,
      category: thread.category || "",
      tags: Array.isArray(thread.tags) ? thread.tags.join(", ") : thread.tags || "",
      image_url: thread.image_url || "",
    });
    setEditThreadImageFile(null);
  };

  const cancelEditThread = () => {
    setEditingThread(null);
    setEditThreadForm({
      title: "",
      content: "",
      category: "",
      tags: "",
      image_url: "",
    });
    setEditThreadImageFile(null);
    if (editThreadImageInputRef.current) {
      editThreadImageInputRef.current.value = "";
    }
  };

  const openThread = async (thread: ForumThread) => {
    setSelectedThread(thread);
    await fetchThreadPosts(thread.id);

    try {
      await supabase
        .from("forum_threads")
        .update({ view_count: (thread.view_count || 0) + 1 })
        .eq("id", thread.id);

      setThreads((prev) =>
        prev.map((t) =>
          t.id === thread.id ? { ...t, view_count: (t.view_count || 0) + 1 } : t
        )
      );
    } catch (err) {
      console.error("Error updating view count:", err);
    }
  };

  // Image upload functions
  const handleThreadImageUpload = async (file: File) => {
    try {
      setUploadingThreadImage(true);
      
      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(file, 'forum-threads');
      
      if (!imageUrl) {
        throw new Error('Upload failed');
      }

      const optimizedUrl = getOptimizedImageUrl(imageUrl, 800, 600);
      setThreadForm(prev => ({ ...prev, image_url: optimizedUrl }));
      setThreadImageFile(file);
      
      toast({
        title: "Success!",
        description: "Image uploaded successfully!",
      });
    } catch (err) {
      console.error('Upload error:', err);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingThreadImage(false);
    }
  };

  const handlePostImageUpload = async (file: File) => {
    try {
      setUploadingPostImage(true);
      
      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(file, 'forum-posts');
      
      if (!imageUrl) {
        throw new Error('Upload failed');
      }

      const optimizedUrl = getOptimizedImageUrl(imageUrl, 800, 600);
      setPostForm(prev => ({ ...prev, image_url: optimizedUrl }));
      setPostImageFile(file);
      
      toast({
        title: "Success!",
        description: "Image uploaded successfully!",
      });
    } catch (err) {
      console.error('Upload error:', err);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingPostImage(false);
    }
  };

  const removeThreadImage = () => {
    setThreadForm(prev => ({ ...prev, image_url: "" }));
    setThreadImageFile(null);
    if (threadImageInputRef.current) {
      threadImageInputRef.current.value = '';
    }
  };

  const removePostImage = () => {
    setPostForm(prev => ({ ...prev, image_url: "" }));
    setPostImageFile(null);
    if (postImageInputRef.current) {
      postImageInputRef.current.value = '';
    }
  };

  const handleEditPostImageUpload = async (file: File) => {
    try {
      setUploadingEditImage(true);
      
      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(file, 'forum-posts');
      
      if (!imageUrl) {
        throw new Error('Upload failed');
      }

      const optimizedUrl = getOptimizedImageUrl(imageUrl, 800, 600);
      setEditPostImageUrl(optimizedUrl);
      setEditPostImageFile(file);
      
      toast({
        title: "Success!",
        description: "Image uploaded successfully!",
      });
    } catch (err) {
      console.error('Upload error:', err);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingEditImage(false);
    }
  };

  const removeEditPostImage = () => {
    setEditPostImageUrl("");
    setEditPostImageFile(null);
    if (editPostImageInputRef.current) {
      editPostImageInputRef.current.value = "";
    }
  };

  const handleEditThreadImageUpload = async (file: File) => {
    try {
      setUploadingEditThreadImage(true);
      
      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(file, 'forum-threads');
      
      if (!imageUrl) {
        throw new Error('Upload failed');
      }

      const optimizedUrl = getOptimizedImageUrl(imageUrl, 800, 600);
      setEditThreadForm(prev => ({ ...prev, image_url: optimizedUrl }));
      setEditThreadImageFile(file);
      
      toast({
        title: "Success!",
        description: "Image uploaded successfully!",
      });
    } catch (err) {
      console.error('Upload error:', err);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingEditThreadImage(false);
    }
  };

  const removeEditThreadImage = () => {
    setEditThreadForm(prev => ({ ...prev, image_url: "" }));
    setEditThreadImageFile(null);
    if (editThreadImageInputRef.current) {
      editThreadImageInputRef.current.value = "";
    }
  };

  const handleEditPost = async () => {
    if (!editingPost || !user?.id) return;

    if (!editPostContent.trim()) {
      toast({
        title: "Error",
        description: "Post content is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("forum_posts")
        .update({
          content: editPostContent.trim(),
          image_url: editPostImageUrl || null,
          updated_by: String(user.id),
          is_edited: true,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPost.id);

      if (error) {
        console.error("Error updating post:", error);
        toast({
          title: "Error",
          description: "Failed to update post",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Post updated successfully",
      });

      setEditingPost(null);
      setEditPostContent("");
      setEditPostImageUrl("");
      setEditPostImageFile(null);
      if (editPostImageInputRef.current) {
        editPostImageInputRef.current.value = '';
      }

      // Refresh the posts
      if (selectedThread) {
        fetchThreadPosts(selectedThread.id);
      }
    } catch (err) {
      console.error("Error in handleEditPost:", err);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user?.id) return;

    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("forum_posts")
        .delete()
        .eq("id", postId);

      if (error) {
        console.error("Error deleting post:", error);
        toast({
          title: "Error",
          description: "Failed to delete post",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      // Update reply count
      if (selectedThread) {
        await supabase
          .from("forum_threads")
          .update({
            reply_count: Math.max((selectedThread.reply_count || 1) - 1, 0),
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedThread.id);

        // Refresh the posts and threads
        fetchThreadPosts(selectedThread.id);
        fetchThreads();
      }
    } catch (err) {
      console.error("Error in handleDeletePost:", err);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const startEditingPost = (post: ForumPost) => {
    setEditingPost(post);
    setEditPostContent(post.content);
    setEditPostImageUrl(post.image_url || "");
    setEditPostImageFile(null);
  };

  const cancelEditingPost = () => {
    setEditingPost(null);
    setEditPostContent("");
    setEditPostImageUrl("");
    setEditPostImageFile(null);
    if (editPostImageInputRef.current) {
      editPostImageInputRef.current.value = '';
    }
  };

  const getFilteredThreads = () => {
    let filtered = threads;

    // Filter by "My Threads" if active tab is "my"
    if (activeTab === "my" && user) {
      filtered = filtered.filter(
        (thread) => thread.created_by === user.id
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (thread) =>
          thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          thread.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (thread.tags && Array.isArray(thread.tags) &&
            thread.tags.some((tag) =>
              tag.toLowerCase().includes(searchTerm.toLowerCase())
            ))
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (thread) => thread.category === categoryFilter
      );
    }

    switch (sortBy) {
      case "latest":
        filtered = filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "most_replied":
        filtered = filtered.sort(
          (a, b) => (b.reply_count || 0) - (a.reply_count || 0)
        );
        break;
      case "most_viewed":
        filtered = filtered.sort(
          (a, b) => (b.view_count || 0) - (a.view_count || 0)
        );
        break;
      case "pinned":
        filtered = filtered.sort(
          (a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)
        );
        break;
    }

    return filtered;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const filteredThreads = getFilteredThreads();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Threads List */}
          <div className="lg:w-2/3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Forum</h1>
                <p className="text-muted-foreground">
                  Join the conversation with your university community
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={repliesEnabled ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setRepliesEnabled(!repliesEnabled)}
                >
                  {repliesEnabled ? "Replies Enabled" : "Replies Disabled"}
                </Button>
                <Button onClick={() => setShowNewThreadDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Thread
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "all"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("all")}
              >
                All Threads
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "my"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("my")}
              >
                My Threads
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search threads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="most_replied">Most Replied</SelectItem>
                  <SelectItem value="most_viewed">Most Viewed</SelectItem>
                  <SelectItem value="pinned">Pinned First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="h-3 bg-muted rounded w-20"></div>
                        <div className="h-3 bg-muted rounded w-16"></div>
                        <div className="h-3 bg-muted rounded w-12"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No threads found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || categoryFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Be the first to start a conversation!"}
                  </p>
                  {!searchTerm && categoryFilter === "all" && (
                    <Button onClick={() => setShowNewThreadDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Thread
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredThreads.map((thread) => (
                  <Card
                    key={thread.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedThread?.id === thread.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => openThread(thread)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {thread.is_pinned && (
                              <Pin className="h-4 w-4 text-yellow-500" />
                            )}
                            {thread.is_locked && (
                              <Lock className="h-4 w-4 text-red-500" />
                            )}
                            <h3 className="text-lg font-semibold line-clamp-2">
                              {thread.title}
                            </h3>
                          </div>
                          <p className="text-muted-foreground line-clamp-2 mb-3">
                            {thread.content}
                          </p>
                          {thread.image_url && (
                            <div className="mb-3">
                              <img
                                src={thread.image_url}
                                alt="Thread image"
                                className="w-20 h-20 object-cover rounded-md"
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <PostAuthor
                              userId={thread.created_by}
                              authorName={thread.author_name}
                              size="sm"
                              showTimestamp={false}
                              className="text-muted-foreground"
                            />
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(thread.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {thread.reply_count || 0} replies
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {thread.view_count || 0} views
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {thread.category && (
                            <Badge variant="secondary">{thread.category}</Badge>
                          )}
                          {thread.tags && Array.isArray(thread.tags) && thread.tags.length > 0 && (
                            <div className="flex gap-1">
                              {thread.tags.slice(0, 2).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {thread.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{thread.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                          {/* Edit/Delete buttons for My Threads */}
                          {activeTab === "my" && user?.id === thread.created_by && (
                            <div className="flex items-center gap-1 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditThread(thread);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteThread(thread.id);
                                }}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Thread View */}
          <div className="lg:w-1/3">
            {selectedThread ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {selectedThread.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Started by{" "}
                          <PostAuthor
                            userId={selectedThread.created_by}
                            authorName={selectedThread.author_name}
                            size="sm"
                            showTimestamp={false}
                            variant="hover"
                            className="inline-flex"
                          />
                          {" • "}
                          {formatDate(selectedThread.created_at)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {selectedThread.category && (
                        <Badge variant="secondary">
                          {selectedThread.category}
                        </Badge>
                      )}
                      {selectedThread.tags && Array.isArray(selectedThread.tags) &&
                        selectedThread.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed mb-4">
                      {selectedThread.content}
                    </p>
                    {selectedThread.image_url && (
                      <div className="mt-4">
                        <img
                          src={selectedThread.image_url}
                          alt="Thread image"
                          className="w-full max-w-md rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        Replies ({threadPosts.length})
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReplies(!showReplies)}
                      >
                        {showReplies ? "Hide Replies" : "Show Replies"}
                      </Button>
                      <Button
                        variant={repliesEnabled ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setRepliesEnabled(!repliesEnabled)}
                      >
                        {repliesEnabled ? "Replies ON" : "Replies OFF"}
                      </Button>
                    </div>
                    {repliesEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewPostDialog(true)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    )}
                  </div>

                  {!showReplies ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          {threadPosts.length === 0
                            ? "No replies yet"
                            : `${threadPosts.length} replies hidden`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {threadPosts.length === 0
                            ? "Be the first to reply!"
                            : "Click 'Show Replies' to view them"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : threadPosts.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No replies yet</p>
                        <p className="text-sm text-muted-foreground">
                          Be the first to reply!
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                                         <div className="space-y-3">
                       {threadPosts.map((post) => (
                         <Card key={post.id}>
                           <CardContent className="p-4">
                             <div className="flex items-start gap-3">
                               <PostAuthor
                                 userId={post.created_by}
                                 authorName={post.author_name}
                                 size="md"
                                 timestamp={post.created_at}
                                 showTimestamp={true}
                                 className="flex-shrink-0"
                               />
                               <div className="flex-1">
                                 <div className="flex items-center justify-between mb-2">
                                   <div className="flex items-center gap-2">
                                     {post.is_edited && (
                                       <Badge
                                         variant="outline"
                                         className="text-xs"
                                       >
                                         edited
                                       </Badge>
                                     )}
                                   </div>
                                   {user?.id === post.created_by && (
                                     <div className="flex items-center gap-1">
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         onClick={() => startEditPost(post)}
                                         className="h-6 w-6 p-0"
                                       >
                                         <Edit className="h-3 w-3" />
                                       </Button>
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         onClick={() => handleDeletePost(post.id)}
                                         className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                       >
                                         <Trash2 className="h-3 w-3" />
                                       </Button>
                                     </div>
                                   )}
                                 </div>
                                 <p className="text-sm leading-relaxed mb-2">
                                   {post.content}
                                 </p>
                                 {post.image_url && (
                                   <div className="mt-3">
                                     <img
                                       src={post.image_url}
                                       alt="Post image"
                                       className="w-full max-w-sm rounded-lg shadow-sm"
                                     />
                                   </div>
                                 )}
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                       ))}
                     </div>
                  )}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Select a Thread
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a thread from the list to view the discussion
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* New Thread Dialog */}
        <Dialog
          open={showNewThreadDialog}
          onOpenChange={setShowNewThreadDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Thread</DialogTitle>
              <DialogDescription>
                Start a new conversation in the forum
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Enter thread title..."
                  value={threadForm.title}
                  onChange={(e) =>
                    setThreadForm({ ...threadForm, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={threadForm.category}
                  onValueChange={(value) =>
                    setThreadForm({ ...threadForm, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Tags (comma-separated)
                </label>
                <Input
                  placeholder="e.g., technology, programming, help"
                  value={threadForm.tags}
                  onChange={(e) =>
                    setThreadForm({ ...threadForm, tags: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Write your thread content..."
                  value={threadForm.content}
                  onChange={(e) =>
                    setThreadForm({ ...threadForm, content: e.target.value })
                  }
                  rows={6}
                />
              </div>
              
              {/* Image Upload Section */}
              <div>
                <label className="text-sm font-medium">Image (Optional)</label>
                <div className="space-y-3">
                  {threadForm.image_url ? (
                    <div className="relative">
                      <img
                        src={threadForm.image_url}
                        alt="Preview"
                        className="w-full max-w-md rounded-lg shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeThreadImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        ref={threadImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleThreadImageUpload(file);
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => threadImageInputRef.current?.click()}
                        disabled={uploadingThreadImage}
                        className="w-full"
                      >
                        {uploadingThreadImage ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Max 5MB • JPG, PNG, GIF
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNewThreadDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateThread}>Create Thread</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Post Dialog */}
        <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reply to Thread</DialogTitle>
              <DialogDescription>
                Add your response to the discussion
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your Reply</label>
                <Textarea
                  placeholder="Write your reply..."
                  value={postForm.content}
                  onChange={(e) =>
                    setPostForm({ ...postForm, content: e.target.value })
                  }
                  rows={6}
                />
              </div>
              
              {/* Image Upload Section */}
              <div>
                <label className="text-sm font-medium">Image (Optional)</label>
                <div className="space-y-3">
                  {postForm.image_url ? (
                    <div className="relative">
                      <img
                        src={postForm.image_url}
                        alt="Preview"
                        className="w-full max-w-md rounded-lg shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removePostImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        ref={postImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handlePostImageUpload(file);
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => postImageInputRef.current?.click()}
                        disabled={uploadingPostImage}
                        className="w-full"
                      >
                        {uploadingPostImage ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Max 5MB • JPG, PNG, GIF
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNewPostDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePost}>Post Reply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Post Dialog */}
        <Dialog open={!!editingPost} onOpenChange={() => cancelEditPost()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
              <DialogDescription>
                Make changes to your post below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={editPostContent}
                  onChange={(e) => setEditPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="min-h-[100px]"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="text-sm font-medium">Image (Optional)</label>
                {editPostImageUrl ? (
                  <div className="relative mt-2">
                    <img
                      src={editPostImageUrl}
                      alt="Post preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeEditPostImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <input
                      ref={editPostImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleEditPostImageUpload(file);
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => editPostImageInputRef.current?.click()}
                      disabled={uploadingEditImage}
                      className="w-full"
                    >
                      {uploadingEditImage ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={cancelEditPost}
              >
                Cancel
              </Button>
              <Button onClick={handleEditPost}>Update Post</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Thread Dialog */}
        <Dialog open={!!editingThread} onOpenChange={() => cancelEditThread()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Thread</DialogTitle>
              <DialogDescription>
                Make changes to your thread below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Enter thread title..."
                  value={editThreadForm.title}
                  onChange={(e) =>
                    setEditThreadForm({ ...editThreadForm, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={editThreadForm.category}
                  onValueChange={(value) =>
                    setEditThreadForm({ ...editThreadForm, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  placeholder="e.g., technology, programming, help"
                  value={editThreadForm.tags}
                  onChange={(e) =>
                    setEditThreadForm({ ...editThreadForm, tags: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Write your thread content..."
                  value={editThreadForm.content}
                  onChange={(e) =>
                    setEditThreadForm({ ...editThreadForm, content: e.target.value })
                  }
                  className="min-h-[120px]"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="text-sm font-medium">Image (Optional)</label>
                {editThreadForm.image_url ? (
                  <div className="relative mt-2">
                    <img
                      src={editThreadForm.image_url}
                      alt="Thread preview"
                      className="w-full max-w-md h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeEditThreadImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <input
                      ref={editThreadImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleEditThreadImageUpload(file);
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => editThreadImageInputRef.current?.click()}
                      disabled={uploadingEditThreadImage}
                      className="w-full"
                    >
                      {uploadingEditThreadImage ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={cancelEditThread}
              >
                Cancel
              </Button>
              <Button onClick={handleEditThread}>Update Thread</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Forum;
