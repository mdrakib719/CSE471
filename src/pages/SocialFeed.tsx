import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  MoreHorizontal, 
  Plus, 
  Users, 
  Globe, 
  Bell,
  Image as ImageIcon,
  Link as LinkIcon,
  Video,
  FileText,
  Calendar,
  Megaphone
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocialFeed, usePostComments, type SocialPost } from "@/hooks/useSocialFeed";
import { useCommunityGroups } from "@/hooks/useCommunityGroups";
import Layout from "@/components/Layout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

const SocialFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    posts, 
    loading, 
    error, 
    hasMore, 
    createPost, 
    togglePostLike, 
    deletePost, 
    loadMore, 
    refreshFeed 
  } = useSocialFeed();
  
  const { 
    groups, 
    userGroups, 
    loading: groupsLoading, 
    createGroup, 
    joinGroup, 
    leaveGroup 
  } = useCommunityGroups();

  const [activeTab, setActiveTab] = useState("feed");
  const [newPostContent, setNewPostContent] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    category: "",
    is_public: true,
    max_members: 100
  });

  const categories = [
    "Technology", "Academic", "Sports", "Creative", "Health", 
    "Business", "Cultural", "Environmental", "Social", "Other"
  ];

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    const postId = await createPost({
      content: newPostContent,
      post_type: 'text'
    });

    if (postId) {
      setNewPostContent("");
      toast({
        title: "Post Created",
        description: "Your post has been shared successfully!",
      });
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.name.trim() || !newGroupData.description.trim() || !newGroupData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const groupId = await createGroup(newGroupData);
    if (groupId) {
      setShowCreateGroup(false);
      setNewGroupData({ name: "", description: "", category: "", is_public: true, max_members: 100 });
      toast({
        title: "Group Created",
        description: "Your community group has been created successfully!",
      });
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    const success = await joinGroup(groupId);
    if (success) {
      toast({
        title: "Joined Group",
        description: "You have successfully joined the group!",
      });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    const success = await leaveGroup(groupId);
    if (success) {
      toast({
        title: "Left Group",
        description: "You have left the group successfully.",
      });
    }
  };

  const handleLikePost = async (postId: string) => {
    await togglePostLike(postId);
  };

  const handleDeletePost = async (postId: string) => {
    const success = await deletePost(postId);
    if (success) {
      toast({
        title: "Post Deleted",
        description: "Your post has been deleted successfully.",
      });
    }
  };

  if (loading && posts.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Social Feed</h1>
                <p className="text-muted-foreground mt-2">
                  Connect with your university community, join interest groups, and stay updated
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowCreateGroup(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
                <Button onClick={refreshFeed}>
                  <Globe className="h-4 w-4 mr-2" />
                  Refresh Feed
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm">
              <TabsTrigger value="feed" className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/20 hover:bg-background/50 rounded-lg">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Social Feed</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/20 hover:bg-background/50 rounded-lg">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Community Groups</span>
              </TabsTrigger>
              <TabsTrigger value="my-groups" className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/20 hover:bg-background/50 rounded-lg">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">My Groups</span>
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border/20 hover:bg-background/50 rounded-lg">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">News & Updates</span>
              </TabsTrigger>
            </TabsList>

            {/* Social Feed Tab */}
            <TabsContent value="feed" className="mt-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Post */}
                <div className="lg:col-span-2">
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.avatar_url} />
                          <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <textarea
                            className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="What's on your mind? Share with your university community..."
                            rows={3}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                          />
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Photo
                              </Button>
                              <Button size="sm" variant="outline">
                                <Video className="h-4 w-4 mr-2" />
                                Video
                              </Button>
                              <Button size="sm" variant="outline">
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Link
                              </Button>
                            </div>
                            <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                              Post
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Posts Feed */}
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        onLike={handleLikePost}
                        onDelete={handleDeletePost}
                      />
                    ))}
                    
                    {hasMore && (
                      <div className="text-center">
                        <Button onClick={loadMore} variant="outline" disabled={loading}>
                          {loading ? "Loading..." : "Load More Posts"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Posts</span>
                        <Badge variant="secondary">{posts.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Groups Joined</span>
                        <Badge variant="secondary">{userGroups.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Available Groups</span>
                        <Badge variant="secondary">{groups.length}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trending Topics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Trending Topics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {['#UniversityLife', '#StudentSuccess', '#CampusEvents', '#StudyTips'].map((topic) => (
                          <div key={topic} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                            <span className="text-sm font-medium">{topic}</span>
                            <Badge variant="outline" className="text-xs">Trending</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Community Groups Tab */}
            <TabsContent value="groups" className="mt-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                  <GroupCard 
                    key={group.id} 
                    group={group} 
                    onJoin={handleJoinGroup}
                    onLeave={handleLeaveGroup}
                  />
                ))}
              </div>
            </TabsContent>

            {/* My Groups Tab */}
            <TabsContent value="my-groups" className="mt-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userGroups.map((group) => (
                  <GroupCard 
                    key={group.id} 
                    group={group} 
                    onJoin={handleJoinGroup}
                    onLeave={handleLeaveGroup}
                    isUserGroup
                  />
                ))}
              </div>
            </TabsContent>

            {/* News & Updates Tab */}
            <TabsContent value="news" className="mt-8 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">University News & Announcements</CardTitle>
                  <CardDescription>Stay updated with the latest university news and important announcements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-border/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Megaphone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">Welcome to the New Academic Year!</h3>
                          <p className="text-muted-foreground mt-1">
                            We're excited to welcome all students back to campus for the 2024-2025 academic year. 
                            Check your email for important orientation information and class schedules.
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span>Published: 2 hours ago</span>
                            <Badge variant="secondary">Important</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-border/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">Upcoming Career Fair</h3>
                          <p className="text-muted-foreground mt-1">
                            Don't miss our annual Career Fair on October 15th. Over 50 companies will be 
                            present to discuss internship and job opportunities.
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span>Published: 1 day ago</span>
                            <Badge variant="outline">Event</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Create Group Dialog */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold mb-4">Create New Community Group</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Group Name *</label>
                  <Input
                    value={newGroupData.name}
                    onChange={(e) => setNewGroupData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea
                    className="w-full p-3 border border-border rounded-lg resize-none"
                    rows={3}
                    value={newGroupData.description}
                    onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your group"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <select
                    className="w-full p-3 border border-border rounded-lg"
                    value={newGroupData.category}
                    onChange={(e) => setNewGroupData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newGroupData.is_public}
                      onChange={(e) => setNewGroupData(prev => ({ ...prev, is_public: e.target.checked }))}
                    />
                    <span className="text-sm">Public Group</span>
                  </label>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowCreateGroup(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} className="flex-1">
                    Create Group
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Post Card Component
const PostCard = ({ post, onLike, onDelete }: { 
  post: SocialPost; 
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const { comments, addComment } = usePostComments(post.id);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    const success = await addComment(newComment);
    if (success) {
      setNewComment("");
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author_avatar} />
              <AvatarFallback>{post.author_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{post.author_name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                {post.group_name && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">{post.group_name}</Badge>
                  </>
                )}
                {post.club_name && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">{post.club_name}</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          {post.is_author && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(post.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-foreground leading-relaxed">{post.content}</p>
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-2 ${post.is_liked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
              <span>{post.likes_count}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{post.comments_count}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
              <Share2 className="h-4 w-4" />
              <span>{post.shares_count}</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author_avatar} />
                    <AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Comment */}
            <div className="flex gap-3">
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddComment} size="sm">
                Comment
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Group Card Component
const GroupCard = ({ 
  group, 
  onJoin, 
  onLeave, 
  isUserGroup = false 
}: { 
  group: any; 
  onJoin: (groupId: string) => void;
  onLeave: (groupId: string) => void;
  isUserGroup?: boolean;
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{group.name}</CardTitle>
            <CardDescription className="line-clamp-2">{group.description}</CardDescription>
          </div>
          <Badge variant={group.is_public ? "default" : "secondary"}>
            {group.is_public ? "Public" : "Private"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Category</span>
            <Badge variant="outline">{group.category}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Members</span>
            <span className="font-medium">{group.member_count}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Created by</span>
            <span className="font-medium">{group.creator_name}</span>
          </div>
          
          <div className="pt-4 border-t border-border/50">
            {isUserGroup ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{group.user_role}</Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onLeave(group.id)}
                  className="ml-auto"
                >
                  Leave Group
                </Button>
              </div>
            ) : (
              <Button 
                variant={group.is_member ? "outline" : "default"}
                size="sm" 
                onClick={() => group.is_member ? onLeave(group.id) : onJoin(group.id)}
                className="w-full"
                disabled={group.is_member}
              >
                {group.is_member ? "Already Joined" : "Join Group"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialFeed;
