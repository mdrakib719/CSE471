import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group';
  lastMessage?: string;
  timestamp?: Date;
  unread?: number;
  avatar?: string;
  online?: boolean;
  members?: number;
  participants?: string[]; // Add participants field
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  sender_id: string;
  conversation_id?: string;
  sender_name: string;
  created_at: string;
  image_url?: string; // Add image URL support
  message_type?: 'text' | 'image' | 'text_with_image'; // Add message type
}

export const useChat2 = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch conversations where the logged-in user is participant
  const fetchConversations = async () => {
    if (!user?.id) return;

    try {
      // 1) Get participant rows for current user
      const { data: parts, error: partsError } = await supabase
        .from("conversation_participants2")
        .select("conversation_id")
        .eq("user_id", user.id.toString());

      if (partsError) {
        console.error("Error fetching conversation participants:", partsError);
        return;
      }

      const conversationIds = (parts || []).map((p: any) => p.conversation_id);
      if (conversationIds.length === 0) {
        setConversations([]);
        return;
      }

      // 2) Fetch conversations by IDs
      const { data: convs, error: convsError } = await supabase
        .from("conversations2")
        .select("id, name, type, created_at, updated_at")
        .in("id", conversationIds);

      if (convsError) {
        console.error("Error fetching conversations:", convsError);
        return;
      }

      // 3) Get participants for each conversation
      const conversationsWithParticipants = await Promise.all(
        (convs || []).map(async (conv: any) => {
          const { data: participants } = await supabase
            .from("conversation_participants2")
            .select("user_id")
            .eq("conversation_id", conv.id);
          
          const participantIds = (participants || []).map((p: any) => p.user_id);
          
          return {
            ...conv,
            participants: participantIds
          };
        })
      );

      const flatConversations: Conversation[] = conversationsWithParticipants.map((conv: any) => ({
        id: conv.id,
        name: conv.name,
        type: conv.type as 'direct' | 'group',
        timestamp: new Date(conv.updated_at || conv.created_at),
        unread: 0,
        members: conv.type === 'group' ? 0 : undefined,
        participants: conv.participants, // Include participants
      }));

      // Sort conversations by most recent first
      flatConversations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // For direct conversations, get the other participant's name
      if (flatConversations.length > 0) {
        const conversationsWithNames = await Promise.all(
          flatConversations.map(async (conv) => {
            if (conv.type === 'direct') {
              // Get the other participant's name for direct conversations
              const otherParticipant = await getOtherParticipantName(conv.id, user.id.toString());
              console.log('Conversation:', conv.id, 'Current user:', user.id, 'Other participant:', otherParticipant);
              if (otherParticipant) {
                return {
                  ...conv,
                  name: otherParticipant.full_name || otherParticipant.email || 'Unknown User',
                  displayName: otherParticipant.full_name || otherParticipant.email || 'Unknown User'
                };
              } else {
                // If we can't get the other participant, try to get it from the conversation name
                // This handles cases where the conversation name is already the other person's name
                const currentUserName = user.full_name || user.email;
                if (conv.name !== currentUserName) {
                  // The conversation name is already the other person's name
                  return conv;
                } else {
                  // Fall back to a generic name
                  return { ...conv, name: 'Unknown User' };
                }
              }
            }
            return conv;
          })
        );
        setConversations(conversationsWithNames);
      } else {
        setConversations(flatConversations);
      }

      // Auto-select first conversation if none selected
      if (flatConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(flatConversations[0].id);
      }
    } catch (error) {
      console.error("Unexpected error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a specific conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages2")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        sender: msg.sender_name,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isOwn: msg.sender_id === user?.id,
        sender_id: msg.sender_id,
        conversation_id: msg.conversation_id,
        sender_name: msg.sender_name,
        created_at: msg.created_at,
        image_url: msg.image_url,
        message_type: msg.message_type || 'text'
      }));

      setMessages(prev => ({
        ...prev,
        [conversationId]: formattedMessages
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Send a message
  const sendMessage = async (content: string, conversationId?: string, imageFile?: File) => {
    if ((!content.trim() && !imageFile) || !user?.id) return false;

    let targetConversationId = conversationId || selectedConversation;
    
    // If no conversation selected, create a new one
    if (!targetConversationId) {
      targetConversationId = await createConversation("New Chat", "direct");
      if (!targetConversationId) return false;
    }

    // Block checks for direct conversations
    try {
      // Get participants
      const { data: parts } = await supabase
        .from('conversation_participants2')
        .select('user_id')
        .eq('conversation_id', targetConversationId);
      const participantIds = (parts || []).map((p: any) => p.user_id);
      if (participantIds.length === 2) {
        const otherId = participantIds.find((id: string) => id !== user.id.toString());
        if (otherId) {
          // Check if either side blocked the other
          const { data: blocks } = await supabase
            .from('user_blocks')
            .select('blocker_id,blocked_id')
            .or(
              `and(blocker_id.eq.${user.id.toString()},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${user.id.toString()})`
            );
          if (blocks && blocks.length > 0) {
            console.warn('Message blocked due to user block');
            return false;
          }
        }
      }
    } catch (e) {
      console.error('Block check failed', e);
    }

    try {
      let imageUrl = null;
      let messageType = 'text';
      
      // Upload image if provided
      if (imageFile) {
        try {
          imageUrl = await uploadImageToCloudinary(imageFile, 'chat-images');
          messageType = content.trim() ? 'text_with_image' : 'image';
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          return false;
        }
      }

      const messageData: any = {
          conversation_id: targetConversationId,
          sender_id: user.id.toString(),
          sender_name: user.email || user.full_name || "Unknown User",
        content: content.trim() || '',
        message_type: messageType,
      };

      // Add image URL if available
      if (imageUrl) {
        messageData.image_url = imageUrl;
      }

      const { data, error } = await supabase
        .from("messages2")
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error("Error sending message:", error);
        return false;
      }

      // Message will be added via realtime subscription
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  };

  // Create a new conversation
  const createConversation = async (name: string, type: 'direct' | 'group'): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      // Create conversation
      const { data: convData, error: convError } = await supabase
        .from("conversations2")
        .insert({
          name: name.trim() || `Chat with ${user.full_name || user.email}`,
          type,
          created_by: user.id.toString(),
        })
        .select()
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
        return null;
      }

      // Add user as participant
      const { error: partError } = await supabase
        .from("conversation_participants2")
        .insert({
          conversation_id: convData.id,
          user_id: user.id.toString(),
          is_admin: true,
        });

      if (partError) {
        console.error("Error adding participant:", partError);
        // Still return the conversation ID as it was created successfully
      }

      // Add to local state
      const newConversation: Conversation = {
        id: convData.id,
        name: convData.name,
        type: convData.type,
        timestamp: new Date(convData.created_at),
        unread: 0,
        members: type === 'group' ? 1 : undefined
      };

      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(convData.id);

      return convData.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  // Lookup a user by university student_id (users.student_id)
  const findUserByStudentId = async (studentId: string): Promise<{ id: string; full_name?: string; email?: string } | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, student_id')
      .eq('student_id', studentId)
      .single();
    if (error) {
      console.error('findUserByStudentId error:', error);
      return null;
    }
    return data as any;
  };

  // Start a direct conversation with a user found by student_id
  const startDirectConversationWithStudentId = async (studentId: string): Promise<string | null> => {
    if (!user?.id) return null;
    setActionLoading(true);
    try {
      const target = await findUserByStudentId(studentId);
      if (!target) return null;

      // Check if a direct conversation already exists between these users
      const existingConv = await findExistingDirectConversation(user.id.toString(), target.id.toString());
      if (existingConv) {
        // If conversation exists, just select it and return
        setSelectedConversation(existingConv.id);
        setActionLoading(false);
        return existingConv.id;
      }

      // Create a direct conversation with a clear name format
      const conversationName = `${target.full_name || target.email || studentId}`;
      const { data: convData, error: convErr } = await supabase
        .from('conversations2')
        .insert({ name: conversationName, type: 'direct', created_by: user.id.toString() })
        .select()
        .single();
      if (convErr) {
        console.error('startDirectConversation: create convo error', convErr);
        setActionLoading(false);
        return null;
      }

      const participants = [
        { conversation_id: convData.id, user_id: user.id.toString(), is_admin: true },
        { conversation_id: convData.id, user_id: target.id.toString(), is_admin: false },
      ];
      const { error: partErr } = await supabase.from('conversation_participants2').insert(participants);
      if (partErr) {
        console.error('startDirectConversation: add participants error', partErr);
        setActionLoading(false);
        return null;
      }

      // Update local state
      const newConversation: Conversation = {
        id: convData.id,
        name: conversationName,
        type: 'direct',
        timestamp: new Date(convData.created_at),
        unread: 0,
      };
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(convData.id);
      setActionLoading(false);
      return convData.id;
    } catch (error) {
      console.error('startDirectConversation error:', error);
      setActionLoading(false);
      return null;
    }
  };

  // Helper function to find existing direct conversation between two users
  const findExistingDirectConversation = async (userId1: string, userId2: string): Promise<any> => {
    try {
      // Find conversations where both users are participants
      const { data, error } = await supabase
        .from('conversation_participants2')
        .select(`
          conversation_id,
          conversations2!inner(id, name, type)
        `)
        .eq('user_id', userId1)
        .eq('conversations2.type', 'direct');

      if (error || !data) return null;

      // Check if any of these conversations also have userId2 as participant
      for (const participant of data) {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants2')
          .select('conversation_id')
          .eq('conversation_id', participant.conversation_id)
          .eq('user_id', userId2)
          .single();

        if (otherParticipant) {
          return participant.conversations2;
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding existing conversation:', error);
      return null;
    }
  };

  // Helper function to get the other participant's name in a direct conversation
  const getOtherParticipantName = async (conversationId: string, currentUserId: string): Promise<any> => {
    try {
      // First, get all participants in this conversation
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants2')
        .select('user_id')
        .eq('conversation_id', conversationId);

      if (participantsError || !participants) return null;

      // Find the participant that is NOT the current user
      const otherParticipantId = participants.find(p => p.user_id !== currentUserId)?.user_id;
      
      if (!otherParticipantId) return null;

      // Now manually fetch the user data for the other participant
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', otherParticipantId)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Error getting other participant name:', error);
      return null;
    }
  };

  // Create a group conversation with a name and an array of studentIds
  const createGroupConversation = async (groupName: string, memberStudentIds: string[]): Promise<string | null> => {
    if (!user?.id) return null;
    setActionLoading(true);
    try {
      const { data: convData, error: convErr } = await supabase
        .from('conversations2')
        .insert({ name: groupName.trim() || 'New Group', type: 'group', created_by: user.id.toString() })
        .select()
        .single();
      if (convErr) { console.error('createGroupConversation error', convErr); return null; }

      // Resolve student IDs to user IDs
      const trimmed = memberStudentIds.map(s => s.trim()).filter(Boolean);
      let memberIds: string[] = [];
      if (trimmed.length > 0) {
        const { data: usersFound, error: usersErr } = await supabase
          .from('users')
          .select('id, student_id')
          .in('student_id', trimmed);
        if (usersErr) { console.error('createGroupConversation users lookup', usersErr); }
        memberIds = (usersFound || []).map((u: any) => u.id);
      }

      const participants = [
        { conversation_id: convData.id, user_id: user.id.toString(), is_admin: true },
        ...memberIds.map(id => ({ conversation_id: convData.id, user_id: id.toString(), is_admin: false }))
      ];
      const { error: partErr } = await supabase.from('conversation_participants2').insert(participants);
      if (partErr) { console.error('createGroupConversation add participants', partErr); }

      const newConversation: Conversation = {
        id: convData.id,
        name: convData.name,
        type: 'group',
        timestamp: new Date(convData.created_at),
        unread: 0,
        members: participants.length
      };
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(convData.id);
      return convData.id;
    } finally {
      setActionLoading(false);
    }
  };

  // Add members to an existing conversation by student IDs
  const addMembersByStudentIds = async (conversationId: string, memberStudentIds: string[]): Promise<boolean> => {
    const trimmed = memberStudentIds.map(s => s.trim()).filter(Boolean);
    if (trimmed.length === 0) return false;
    const { data: usersFound, error: usersErr } = await supabase
      .from('users')
      .select('id, student_id')
      .in('student_id', trimmed);
    if (usersErr) { console.error('addMembers users lookup', usersErr); return false; }
    const rows = (usersFound || []).map((u: any) => ({ conversation_id: conversationId, user_id: u.id.toString(), is_admin: false }));
    if (rows.length === 0) return false;
    const { error } = await supabase.from('conversation_participants2').insert(rows);
    if (error) { console.error('addMembers insert', error); return false; }
    return true;
  };

  // List participants for a conversation with user info
  const fetchParticipantsWithProfiles = async (conversationId: string): Promise<Array<{ user_id: string; full_name?: string; email?: string; student_id?: string }>> => {
    const { data: parts, error: partsErr } = await supabase
      .from('conversation_participants2')
      .select('user_id')
      .eq('conversation_id', conversationId);
    if (partsErr) { console.error('fetchParticipants parts', partsErr); return []; }
    const ids = (parts || []).map((p: any) => p.user_id);
    if (ids.length === 0) return [];
    const { data: usersFound, error: usersErr } = await supabase
      .from('users')
      .select('id, full_name, email, student_id')
      .in('id', ids);
    if (usersErr) { console.error('fetchParticipants users', usersErr); return []; }
    return (usersFound || []).map((u: any) => ({ user_id: u.id, full_name: u.full_name, email: u.email, student_id: u.student_id }));
  };

  // Add single member by student id
  const addMemberByStudentId = async (conversationId: string, studentId: string): Promise<boolean> => {
    const u = await findUserByStudentId(studentId);
    if (!u) return false;
    const { error } = await supabase
      .from('conversation_participants2')
      .insert({ conversation_id: conversationId, user_id: u.id.toString(), is_admin: false });
    if (error) { console.error('addMemberByStudentId', error); return false; }
    return true;
  };

  // Remove member by student id
  const removeMemberByStudentId = async (conversationId: string, studentId: string): Promise<boolean> => {
    const u = await findUserByStudentId(studentId);
    if (!u) return false;
    const { error } = await supabase
      .from('conversation_participants2')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', u.id.toString());
    if (error) { console.error('removeMemberByStudentId', error); return false; }
    return true;
  };

  // Rename a conversation
  const renameConversation = async (conversationId: string, newName: string): Promise<boolean> => {
    const { error } = await supabase
      .from('conversations2')
      .update({ name: newName })
      .eq('id', conversationId);
    if (error) {
      console.error('renameConversation error:', error);
      return false;
    }
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, name: newName } : c));
    return true;
  };

  // Delete a conversation (cascade removes messages and participants by FK)
  const deleteConversation = async (conversationId: string): Promise<boolean> => {
    const { error } = await supabase.from('conversations2').delete().eq('id', conversationId);
    if (error) {
      console.error('deleteConversation error:', error);
      return false;
    }
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConversation === conversationId) setSelectedConversation(null);
    return true;
  };

  // Block user in a direct chat by removing the other participant from the conversation
  const blockUserInConversation = async (conversationId: string): Promise<boolean> => {
    if (!user?.id) return false;
    // Find other participant
    const { data: parts, error } = await supabase
      .from('conversation_participants2')
      .select('user_id')
      .eq('conversation_id', conversationId);
    if (error) {
      console.error('blockUser: fetch participants error', error);
      return false;
    }
    const other = (parts || []).map((p: any) => p.user_id).find((uid: string) => uid !== user.id.toString());
    if (!other) return false;

    // Insert into global block table
    const { error: blkErr } = await supabase
      .from('user_blocks')
      .insert({ blocker_id: user.id.toString(), blocked_id: other })
      .select();
    if (blkErr) {
      console.error('blockUser: insert block error', blkErr);
    }
    const { error: delErr } = await supabase
      .from('conversation_participants2')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', other);
    if (delErr) {
      console.error('blockUser: delete participant error', delErr);
      return false;
    }
    return true;
  };

  // Setup realtime subscription for selected conversation
  useEffect(() => {
    if (selectedConversation && user?.id) {
      fetchMessages(selectedConversation);

      // Clean up existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Setup realtime subscription
      const channel = supabase.channel(`room:${selectedConversation}`, {
        config: { presence: { key: user.id } },
      });

              // Listen for new messages
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages2",
            filter: `conversation_id=eq.${selectedConversation}`,
          },
        (payload) => {
          const newMsg = payload.new as any;
          const formattedMessage: Message = {
            id: newMsg.id,
            sender: newMsg.sender_name,
            content: newMsg.content,
            timestamp: new Date(newMsg.created_at),
            isOwn: newMsg.sender_id === user.id,
            sender_id: newMsg.sender_id,
            conversation_id: newMsg.conversation_id,
            sender_name: newMsg.sender_name,
            created_at: newMsg.created_at,
            image_url: newMsg.image_url,
            message_type: newMsg.message_type || 'text'
          };

          setMessages(prev => ({
            ...prev,
            [selectedConversation]: [...(prev[selectedConversation] || []), formattedMessage]
          }));

          // Auto-scroll to bottom when new message arrives (like WhatsApp)
          setTimeout(() => {
            const messagesContainer = document.querySelector('.overflow-y-auto');
            if (messagesContainer) {
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          }, 100);
        }
      );

      // Presence tracking
      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const members = Object.values(state).flat();
        setOnlineCount(members.length);
      });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id });
        }
      });

      channelRef.current = channel;

      return () => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    }
  }, [selectedConversation, user?.id]);

  // Fetch conversations on mount
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    loading,
    actionLoading,
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
    fetchParticipantsWithProfiles,
    fetchConversations,
    refreshConversations: fetchConversations
  };
};
