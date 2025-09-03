import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  MoreVertical, 
  Search, 
  Plus,
  Users,
  Hash,
  Paperclip,
  Image,
  MessageSquare,
  X,
  Upload
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useChat2, type Conversation, type Message } from "@/hooks/useChat2";
import { supabase } from "@/lib/supabase";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const Chat = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [studentIdQuery, setStudentIdQuery] = useState("");
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState("");
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [members, setMembers] = useState<Array<{ user_id: string; full_name?: string; email?: string; student_id?: string }>>([]);
  const [memberStudentId, setMemberStudentId] = useState("");
  const [conversationAvatars, setConversationAvatars] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    loading,
    onlineCount,
    sendMessage,
    createConversation,
    createGroupConversation,
    renameConversation,
    deleteConversation,
    blockUserInConversation,
    startDirectConversationWithStudentId,
    addMemberByStudentId,
    removeMemberByStudentId,
    fetchParticipantsWithProfiles
  } = useChat2();

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];



  // Fetch avatar for a specific user by student ID
  const fetchUserAvatarByStudentId = async (studentId: string) => {
    try {
      // Try to fetch from users table first
      let { data, error } = await supabase
        .from("users")
        .select("id, avatar_url")
        .eq("student_id", studentId)
        .single();

      // If that fails, try manual_users table as fallback
      if (error) {
        if (error.code === "PGRST116" || error.code === "PGRST204") {
          const fallbackResult = await supabase
            .from("manual_users")
            .select("id, avatar_url")
            .eq("student_id", studentId)
            .single();
          
          data = fallbackResult.data;
          error = fallbackResult.error;
        }
      }

      if (!error && data?.avatar_url) {
        return { userId: data.id, avatarUrl: data.avatar_url };
      }
      return null;
    } catch (err) {
      console.error("Error fetching user avatar by student ID:", err);
      return null;
    }
  };

  // Fetch avatar for a specific conversation
  const fetchConversationAvatar = async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation || conversation.type !== 'direct' || !conversation.participants) {
      return;
    }

    try {
      // Find the other participant
      const otherParticipantId = conversation.participants.find(id => id !== user?.id);
      if (!otherParticipantId) {
        return;
      }

      // Try to fetch from users table first
      let { data, error } = await supabase
        .from("users")
        .select("avatar_url")
        .eq("id", otherParticipantId)
        .single();

      // If that fails, try manual_users table as fallback
      if (error) {
        if (error.code === "PGRST116" || error.code === "PGRST204") {
          const fallbackResult = await supabase
            .from("manual_users")
            .select("avatar_url")
            .eq("id", otherParticipantId)
            .single();
          
          data = fallbackResult.data;
          error = fallbackResult.error;
        }
      }

      if (!error && data?.avatar_url) {
        setConversationAvatars(prev => ({
          ...prev,
          [conversationId]: data.avatar_url
        }));
      }
    } catch (err) {
      console.error("Error fetching conversation avatar:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);



  // Listen for avatar refresh events
  useEffect(() => {
    const handleAvatarRefresh = () => {
      // Refresh avatar for currently selected conversation
      if (selectedConversation) {
        fetchConversationAvatar(selectedConversation);
      }
    };

    window.addEventListener('avatar-refreshed', handleAvatarRefresh);
    return () => {
      window.removeEventListener('avatar-refreshed', handleAvatarRefresh);
    };
  }, [selectedConversation]);

  // Fetch avatar when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchConversationAvatar(selectedConversation);
    }
  }, [selectedConversation]);

  // Fetch avatars for existing conversations when they're loaded
  useEffect(() => {
    if (conversations.length > 0) {
      conversations.forEach(conversation => {
        if (conversation.type === 'direct') {
          if (!conversationAvatars[conversation.id]) {
            fetchConversationAvatar(conversation.id);
          }
        }
      });
    }
  }, [conversations]); // Removed conversationAvatars dependency to avoid infinite loop



  // Force fetch avatars when component mounts and conversations are available
  useEffect(() => {
    if (conversations.length > 0 && user) {
      conversations.forEach(conversation => {
        if (conversation.type === 'direct') {
          // Force fetch even if avatar exists
          fetchConversationAvatar(conversation.id);
        }
      });
    }
  }, [conversations, user]); // Only run when conversations or user changes

  const handleSendMessage = async () => {
    if (message.trim() || selectedImage) {
      const success = await sendMessage(message, undefined, selectedImage);
      if (success) {
        setMessage("");
        setSelectedImage(null);
        setImagePreview(null);
      }
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleCreateConversation = async () => {
    if (!studentIdQuery.trim()) return;
    
    try {
      // First, fetch the user's avatar by student ID
      const avatarData = await fetchUserAvatarByStudentId(studentIdQuery.trim());
      
      // Start direct chat by student id
    const id = await startDirectConversationWithStudentId(studentIdQuery.trim());
    if (id) {
        // If we found an avatar, store it for this conversation
        if (avatarData?.avatarUrl) {
          setConversationAvatars(prev => ({
            ...prev,
            [id]: avatarData.avatarUrl
          }));
        }
        
      setShowNewConversation(false);
      setStudentIdQuery("");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Layout>
      <div className="h-screen bg-background pt-16">
        <div className="h-full flex">
          {/* Sidebar */}
          <div className="w-80 border-r border-border bg-card flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Messages</h2>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => setShowNewConversation(true)}
                  aria-label="Start new chat"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2"
                  onClick={() => setShowGroupDialog(true)}
                >
                  New Group
                </Button>
              </div>
              
              
              
              {/* New Conversation Modal */}
              {showNewConversation && (
                <div className="mb-4 p-3 border rounded-lg bg-muted/50">
                  <Input
                    placeholder="Enter student ID to start chat"
                    value={studentIdQuery}
                    onChange={(e) => setStudentIdQuery(e.target.value)}
                    className="mb-2"
                    autoComplete="off"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateConversation()}
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleCreateConversation}
                      className="bg-gradient-hero"
                    >
                      Start
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setShowNewConversation(false);
                        setStudentIdQuery("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              

            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Loading conversations...</div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex items-center justify-center p-8 text-center">
                    <div>
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No conversations yet</p>
                      <p className="text-muted-foreground text-xs">Click the + button to start a chat</p>
                    </div>
                  </div>
                ) : (
                  conversations
                    .filter(conv => 
                      conv.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-100 ${
                        selectedConversation === conversation.id ? 'bg-orange-200' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                             <AvatarImage src={conversationAvatars[conversation.id] || conversation.avatar} />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {conversation.type === 'group' ? (
                                <Users className="h-6 w-6" />
                              ) : (
                                conversation.name.split(' ').map(n => n[0]).join('')
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.type === 'direct' && conversation.online && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-success rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium truncate">{conversation.name}</h4>
                              {conversation.type === 'group' && (
                                <Hash className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {conversation.timestamp ? formatLastSeen(conversation.timestamp) : 'New'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage || 'No messages yet'}
                            </p>
                            {conversation.unread && conversation.unread > 0 && (
                              <Badge variant="default" className="ml-2 min-w-[20px] h-5 text-xs">
                                {conversation.unread}
                              </Badge>
                            )}
                          </div>
                          {conversation.type === 'group' && conversation.members && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {conversation.members} members
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation && currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                         <AvatarImage src={conversationAvatars[currentConversation.id] || currentConversation.avatar} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {currentConversation.type === 'group' ? (
                            <Users className="h-5 w-5" />
                          ) : (
                            currentConversation.name.split(' ').map(n => n[0]).join('')
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {currentConversation.type === 'direct' 
                            ? currentConversation.name 
                            : currentConversation.name
                          }
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {currentConversation.type === 'group' 
                            ? `${onlineCount} online`
                            : 'Active now'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" aria-label="Conversation menu">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onClick={async () => {
                              if (!selectedConversation) return;
                              const list = await fetchParticipantsWithProfiles(selectedConversation);
                              setMembers(list);
                              setShowMembersDialog(true);
                            }}
                          >
                            View/Add members
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (!currentConversation) return;
                              setRenameValue(currentConversation.name);
                              setShowRenameDialog(true);
                            }}
                          >
                            Rename conversation
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setShowBlockDialog(true)}
                          >
                            Block user
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setShowDeleteDialog(true)}
                          >
                            Remove chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Rename dialog */}
                <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rename conversation</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2">
                      <Input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        placeholder="Enter new name"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowRenameDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          if (selectedConversation && renameValue.trim()) {
                            const ok = await renameConversation(selectedConversation, renameValue.trim());
                            if (ok) setShowRenameDialog(false);
                          }
                        }}
                      >
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* New group dialog */}
                <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                      <Input
                        placeholder="Group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                      />
                      <Input
                        placeholder="Member student IDs (comma separated)"
                        value={groupMembers}
                        onChange={(e) => setGroupMembers(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowGroupDialog(false)}>Cancel</Button>
                      <Button
                        onClick={async () => {
                          const ids = groupMembers.split(',').map(s => s.trim()).filter(Boolean);
                          if (groupName.trim() && ids.length) {
                            const id = await createGroupConversation(groupName.trim(), ids);
                            if (id) {
                              setGroupName("");
                              setGroupMembers("");
                              setShowGroupDialog(false);
                            }
                          }
                        }}
                      >
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Block user dialog */}
                <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block user</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      The other participant will be removed from this conversation. You can re‑add them later by starting a new chat.
                    </p>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowBlockDialog(false)}>Cancel</Button>
                      <Button
                        onClick={async () => {
                          if (selectedConversation) {
                            const ok = await blockUserInConversation(selectedConversation);
                            if (ok) setShowBlockDialog(false);
                          }
                        }}
                      >
                        Block
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete conversation dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove chat</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      This will delete the conversation and its messages. This action cannot be undone.
                    </p>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                      <Button
                        className="bg-red-600 hover:bg-red-700"
                        onClick={async () => {
                          if (selectedConversation) {
                            const ok = await deleteConversation(selectedConversation);
                            if (ok) setShowDeleteDialog(false);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Members dialog */}
                <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Members</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      {members.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No members found.</p>
                      ) : (
                        <div className="space-y-2">
                          {members.map((m) => (
                            <div key={m.user_id} className="flex items-center justify-between border rounded px-3 py-2">
                              <div>
                                <div className="text-sm font-medium">{m.full_name || m.email || m.student_id || m.user_id}</div>
                                {m.student_id && <div className="text-xs text-muted-foreground">ID: {m.student_id}</div>}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (!selectedConversation || !m.student_id) return;
                                  const ok = await removeMemberByStudentId(selectedConversation, m.student_id);
                                  if (ok) setMembers(prev => prev.filter(x => x.user_id !== m.user_id));
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <div className="text-sm font-medium mb-2">Add member</div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Student ID"
                            value={memberStudentId}
                            onChange={(e) => setMemberStudentId(e.target.value)}
                          />
                          <Button
                            onClick={async () => {
                              if (!selectedConversation || !memberStudentId.trim()) return;
                              const ok = await addMemberByStudentId(selectedConversation, memberStudentId.trim());
                              if (ok) {
                                const list = await fetchParticipantsWithProfiles(selectedConversation);
                                setMembers(list);
                                setMemberStudentId("");
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowMembersDialog(false)}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {!msg.isOwn && currentConversation.type === 'group' && (
                            <p className="text-xs font-medium text-primary mb-1">
                              {msg.sender_name || msg.sender}
                            </p>
                          )}
                           
                           {/* Image Display */}
                           {msg.image_url && (
                             <div className="mb-2">
                               <img 
                                 src={msg.image_url} 
                                 alt="Message image" 
                                 className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                 onClick={() => window.open(msg.image_url, '_blank')}
                               />
                             </div>
                           )}
                           
                           {/* Text Content */}
                           {msg.content && (
                          <p className="text-sm">{msg.content}</p>
                           )}
                           
                          <p className={`text-xs mt-1 ${
                            msg.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input - Fixed at bottom */}
                <div className="p-4 border-t border-border bg-card flex-shrink-0">
                   {/* Image Preview */}
                   {imagePreview && (
                     <div className="mb-3 relative">
                       <div className="relative inline-block">
                         <img 
                           src={imagePreview} 
                           alt="Preview" 
                           className="max-w-48 max-h-48 rounded-lg object-cover"
                         />
                         <Button
                           size="icon"
                           variant="destructive"
                           className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                           onClick={removeSelectedImage}
                         >
                           <X className="h-3 w-3" />
                         </Button>
                       </div>
                     </div>
                   )}
                   
                  <div className="flex items-center space-x-2">
                    <Button size="icon" variant="ghost">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                     
                     {/* Image Upload Button */}
                     <div className="relative">
                       <input
                         type="file"
                         accept="image/*"
                         onChange={handleImageSelect}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         id="image-upload"
                       />
                       <Button 
                         size="icon" 
                         variant="ghost"
                         className={selectedImage ? "text-blue-600" : ""}
                         disabled={isUploadingImage}
                       >
                      <Image className="h-5 w-5" />
                    </Button>
                     </div>
                     
                    <div className="flex-1 relative">
                      <Input
                         placeholder={selectedImage ? "Add a message (optional)..." : "Type a message..."}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="pr-10"
                         disabled={isUploadingImage}
                      />
                    </div>
                     
                     <Button 
                       onClick={handleSendMessage} 
                       className="bg-gradient-hero"
                       disabled={isUploadingImage || (!message.trim() && !selectedImage)}
                     >
                       {isUploadingImage ? (
                         <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                       ) : (
                      <Send className="h-4 w-4" />
                       )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Welcome to Chat!</h3>
                  <p className="text-muted-foreground mb-4">
                    {conversations.length === 0 
                      ? "Create your first conversation to start messaging"
                      : "Select a conversation from the sidebar to start messaging"
                    }
                  </p>
                  {conversations.length === 0 && (
                    <Button 
                      onClick={() => setShowNewConversation(true)}
                      className="bg-gradient-hero"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start New Chat
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;