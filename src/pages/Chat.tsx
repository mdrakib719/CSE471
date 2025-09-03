import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";

interface Conversation {
  id: string;
  name: string;
  type: "direct" | "group";
}

interface Message {
  id: string;
  conversation_id?: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

const Chat = () => {
  const { user } = useAuth(); // user info from your auth context
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationName, setNewConversationName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch conversations where the logged-in user is participant
  const fetchConversations = async () => {
    console.log("Fetching conversations for user:", user.id);

    try {
      // First try to fetch from conversation_participants
      const { data, error } = await supabase
        .from("conversation_participants")
        .select(`conversation:conversations(id, name, type)`)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching conversations from participants:", error);
        // If that fails, try to fetch all conversations (fallback)
        const { data: allConvs, error: allError } = await supabase
          .from("conversations")
          .select("id, name, type");

        if (allError) {
          console.error("Error fetching all conversations:", allError);
          setConversations([]);
          return;
        }

        console.log("Using fallback - all conversations:", allConvs);
        setConversations(allConvs || []);
        return;
      }

      if (data && data.length > 0) {
        console.log("Conversations data:", data);
        const flatConversations = data.flatMap((item) => item.conversation);
        console.log("Flat conversations:", flatConversations);
        setConversations(flatConversations);

        if (
          data.length > 0 &&
          Array.isArray(data[0].conversation) &&
          data[0].conversation.length > 0 &&
          data[0].conversation[0].id
        ) {
          console.log(
            "Setting selected conversation:",
            data[0].conversation[0].id
          );
          setSelectedConversation(data[0].conversation[0].id);
        }
      } else {
        console.log("No conversations found, user can create new ones");
        setConversations([]);
      }
    } catch (error) {
      console.error("Unexpected error fetching conversations:", error);
      setConversations([]);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select(`id, content, sender_id, created_at, sender_name`)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setMessages(data || []);
      scrollToBottom();
    }
  };

  // Scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // On conversation change, load messages
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);

      // Clean up existing channel if any
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Setup realtime subscription for this conversation (messages + presence + typing)
      const channel = supabase.channel(`room:${selectedConversation}`, {
        config: { presence: { key: user?.id || "anonymous" } },
      });

      // Postgres changes -> new messages
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
        }
      );

      // Presence sync (who is online in this room)
      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const members = Object.values(state).flat() as Array<{
          presence_ref: string;
        }>;
        setOnlineCount(members.length);
      });

      // Typing indicator broadcast
      channel.on("broadcast", { event: "typing" }, ({ payload }) => {
        const senderId: string = payload?.user_id;
        if (!senderId || senderId === user?.id) return;
        setTypingUsers((prev) => new Set([...prev, senderId]));
        // Clear after short delay
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(senderId);
            return next;
          });
        }, 1200);
      });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track presence for current user
          await channel.track({ user_id: user?.id || "anonymous" });
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
  }, [selectedConversation]);

  // Fetch conversations on mount
  useEffect(() => {
    if (user?.id) fetchConversations();
  }, [user]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Send message handler
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // If no conversation is selected, create a new one
    let conversationId = selectedConversation;
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) {
        console.error("Failed to create conversation");
        return;
      }
    }

    const newMessage: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      sender_name: user.email || user.full_name || "Unknown User",
      content: message.trim(),
      created_at: new Date().toISOString(),
    };

    // Add message to local state immediately (optimistic update)
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    scrollToBottom();

    // Try to send to database if online
    if (isOnline) {
      try {
        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            sender_name: user.email || user.full_name || "Unknown User",
            content: newMessage.content,
          })
          .select();

        if (error) {
          console.error("Error sending message:", error);
          // Mark message as failed
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newMessage.id
                ? { ...msg, id: `failed_${Date.now()}` }
                : msg
            )
          );
        } else {
          console.log("Message sent successfully:", data);
          // Update message with real ID from database
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newMessage.id ? { ...msg, id: data[0].id } : msg
            )
          );
        }
      } catch (error) {
        console.error("Network error:", error);
        // Mark message as failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id
              ? { ...msg, id: `failed_${Date.now()}` }
              : msg
          )
        );
      }
    } else {
      // Store message locally when offline
      const offlineMessages = JSON.parse(
        localStorage.getItem("offlineMessages") || "[]"
      );
      offlineMessages.push(newMessage);
      localStorage.setItem("offlineMessages", JSON.stringify(offlineMessages));
      console.log("Message stored offline");
    }
  };

  // Create new conversation
  const createNewConversation = async (): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const conversationName =
        newConversationName.trim() ||
        `Chat with ${user.full_name || user.email}`;

      // Create conversation without foreign key constraints
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .insert({
          name: conversationName,
          type: "direct",
          created_by: user.id,
        })
        .select()
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
        return null;
      }

      // Add user as participant without foreign key constraints
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert({
          conversation_id: convData.id,
          user_id: user.id,
          is_admin: true,
        });

      if (partError) {
        console.error("Error adding participant:", partError);
        // If participant creation fails, still return the conversation ID
        // The user can still use the chat
        console.log(
          "Conversation created but participant addition failed, continuing anyway"
        );
      }

      // Add to local state
      const newConversation: Conversation = {
        id: convData.id,
        name: conversationName,
        type: "direct",
      };

      setConversations((prev) => [newConversation, ...prev]);
      setSelectedConversation(convData.id);
      setShowNewConversation(false);
      setNewConversationName("");

      return convData.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  // Typing indicator handler (throttled)
  const lastTypingRef = useRef<number>(0);
  const handleTyping = () => {
    const now = Date.now();
    if (!channelRef.current || now - lastTypingRef.current < 400) return;
    lastTypingRef.current = now;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user?.id },
    });
  };

  return (
    <Layout>
    <div className="h-[calc(100vh-80px)] grid grid-cols-12 gap-4 p-4">
      {/* Conversations sidebar */}
      <div className="col-span-12 md:col-span-3 border rounded-lg overflow-hidden">
        <div className="p-3 border-b font-semibold flex items-center justify-between">
          <span>Conversations</span>
          <button
            onClick={() => setShowNewConversation(true)}
            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
          >
            New Chat
          </button>
        </div>

        {/* New Conversation Modal */}
        {showNewConversation && (
          <div className="p-3 border-b bg-muted/50">
            <input
              type="text"
              placeholder="Chat name (optional)"
              value={newConversationName}
              onChange={(e) => setNewConversationName(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded"
              onKeyDown={(e) => e.key === "Enter" && createNewConversation()}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => createNewConversation()}
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewConversation(false);
                  setNewConversationName("");
                }}
                className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded hover:bg-muted/90"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="max-h-full overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full text-left px-4 py-3 border-b hover:bg-muted ${
                  conv.id === selectedConversation ? "bg-muted" : ""
                }`}
              >
                <div className="text-sm font-medium">{conv.name}</div>
                {conv.id === selectedConversation && (
                  <div className="text-xs text-muted-foreground">
                    {onlineCount} online
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="col-span-12 md:col-span-9 border rounded-lg flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="font-semibold">
            {selectedConversation ? "Chat" : "Start a New Conversation"}
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <div className="text-xs text-muted-foreground">
              {isOnline ? "Online" : "Offline"}
            </div>
            {selectedConversation && (
              <div className="text-xs text-muted-foreground">
                {onlineCount} online
              </div>
            )}
          </div>
        </div>

        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-lg mb-2">Welcome to Chat!</div>
              <div className="text-sm mb-4">
                Start typing below to create a new conversation
              </div>
              <div className="text-xs">
                Your messages will be saved locally when offline
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow ${
                  msg.sender_id === user.id
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted"
                } ${msg.id.startsWith("failed_") ? "opacity-50" : ""}`}
              >
                {msg.sender_id !== user.id && (
                  <div className="text-xs font-medium opacity-80 mb-0.5">
                    {msg.sender_name}
                  </div>
                )}
                <div>{msg.content}</div>
                <div className="text-[10px] opacity-70 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString()}
                  {msg.id.startsWith("failed_") && " (Failed to send)"}
                </div>
              </div>
            ))}
            {!!typingUsers.size && (
              <div className="text-xs text-muted-foreground">
                Someone is typing…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="p-3 border-t flex gap-2">
          <input
            type="text"
            placeholder={
              selectedConversation
                ? "Type a message"
                : "Type to start a new conversation"
            }
            className="flex-1 border rounded px-3 py-2 text-sm"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (selectedConversation) handleTyping();
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm"
            disabled={!message.trim()}
          >
            {selectedConversation ? "Send" : "Start Chat"}
          </button>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default Chat;
