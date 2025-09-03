import { useEffect, useRef, useState } from "react";
// Remove ChatCompletionMessage import, not compatible with HuggingFace router
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, Send, Bot, User } from "lucide-react";
import { OpenAI } from "openai";

import Layout from "@/components/Layout";

type MessageRole = "user" | "assistant" | "system";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

const Assistant = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);

  const [clubsCtx, setClubsCtx] = useState<any[]>([]);
  const [eventsCtx, setEventsCtx] = useState<any[]>([]);
  const [careersCtx, setCareersCtx] = useState<any[]>([]);
  const [usingAI, setUsingAI] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  // Initialize OpenAI client
  // Use NEXT_PUBLIC_HF_TOKEN for client-side env variable (Vite/Next.js convention)
  // WARNING: Exposing API keys in the browser is unsafe. Only use this for public/test keys or with proper backend proxying in production.
  const openAIClient = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: "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",
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading]);

  // Fetch context from Supabase
  const fetchContext = async () => {
    try {
      setContextLoading(true);
      const clubsQ = supabase.from("clubs").select("*").limit(50);
      const eventsQ = supabase
        .from("events")
        .select("*")
        .in("status", ["upcoming", "ongoing"])
        .order("start_at", { ascending: true })
        .limit(50);
      const careersQ = supabase
        .from("careers_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const [{ data: clubs }, { data: events }, { data: careers }] =
        await Promise.all([clubsQ, eventsQ, careersQ]);

      setClubsCtx(clubs || []);
      setEventsCtx(events || []);
      setCareersCtx(careers || []);
    } catch (err) {
      console.error("Error loading assistant context:", err);
      toast({
        title: "Assistant",
        description: "Failed to load context",
        variant: "destructive",
      });
    } finally {
      setContextLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("assistant-context")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clubs" },
        fetchContext
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        fetchContext
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "careers_posts" },
        fetchContext
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Build a text summary of context
  const buildContextSummary = (): string => {
    const clubs = clubsCtx
      .map((c) => `Club: ${c.name} — ${c.description ?? ""} [${c.category}]`)
      .slice(0, 10)
      .join("\n");
    const events = eventsCtx
      .map(
        (e) =>
          `Event: ${e.title} — ${e.status} on ${new Date(
            e.start_at
          ).toLocaleString()} at ${e.location ?? "TBA"}`
      )
      .slice(0, 10)
      .join("\n");
    const careers = careersCtx
      .map(
        (p) =>
          `Career: [${p.type}] ${p.title}${p.company ? ` @ ${p.company}` : ""}${
            p.location ? ` (${p.location})` : ""
          }`
      )
      .slice(0, 10)
      .join("\n");
    return [clubs, events, careers].filter(Boolean).join("\n");
  };

  // Enhanced heuristic response system
  const heuristicAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes("club") || lowerQuestion.includes("join")) {
      if (clubsCtx.length > 0) {
        const availableClubs = clubsCtx
          .slice(0, 3)
          .map((c) => `• ${c.name} (${c.category})`)
          .join("\n");
        return `Here are some clubs you can join:\n\n${availableClubs}\n\nTo join a club, visit the Clubs page and click "Join Club" on any club you're interested in.`;
      }
      return "I can help you find clubs to join! Visit the Clubs page to see all available clubs and their categories.";
    }

    if (lowerQuestion.includes("event") || lowerQuestion.includes("upcoming")) {
      if (eventsCtx.length > 0) {
        const upcomingEvents = eventsCtx
          .filter((e) => e.status === "upcoming" || e.status === "published")
          .slice(0, 3)
          .map(
            (e) => `• ${e.title} - ${new Date(e.start_at).toLocaleDateString()}`
          )
          .join("\n");
        return `Here are some upcoming events:\n\n${upcomingEvents}`;
      }
      return "Check the Events page for upcoming activities!";
    }

    if (
      lowerQuestion.includes("career") ||
      lowerQuestion.includes("job") ||
      lowerQuestion.includes("internship")
    ) {
      if (careersCtx.length > 0) {
        const careerOpportunities = careersCtx
          .slice(0, 3)
          .map((c) => `• ${c.title} (${c.type})`)
          .join("\n");
        return `Here are some career opportunities:\n\n${careerOpportunities}`;
      }
      return "The Careers section has job postings, internships, and career guidance!";
    }

    if (
      lowerQuestion.includes("help") ||
      lowerQuestion.includes("what can you do")
    ) {
      return `I'm your university assistant! I can help you with:\n• Clubs\n• Events\n• Careers\n• Resources\n• Forums`;
    }

    return `I'm here to help with university life! You can ask me about clubs, events, careers, study resources, and general university information.`;
  };

  // Ask using OpenAI client
  const askWithOpenAI = async (question: string): Promise<string> => {
    try {
      const context = buildContextSummary();

      // Use correct type for OpenAI messages
      const messages: any = [
        {
          role: "system",
          content: "You are a helpful university assistant.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ];

      const response = await openAIClient.chat.completions.create({
        // model: "openai/gpt-oss-120b:cerebras",
        model: "deepseek-ai/DeepSeek-V3-0324:fireworks-ai",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      // HuggingFace router returns OpenAI-compatible response
      return (
        response.choices?.[0]?.message?.content || heuristicAnswer(question)
      );
    } catch (err) {
      console.error("OpenAI API error:", err);
      return heuristicAnswer(question);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput("");
    setLoading(true);
    setUsingAI(true);

    try {
      const answer = await askWithOpenAI(text);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Error getting response:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I'm sorry, I encountered an error. Let me try a different approach.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setUsingAI(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">AI Assistant</h2>
          {contextLoading ? (
            <Badge variant="secondary">Loading context…</Badge>
          ) : (
            <Badge variant="outline">Context ready plus OpenAI</Badge>
          )}
          {usingAI && (
            <Badge variant="default" className="bg-blue-500">
              🤖 AI Powered
            </Badge>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Ask about clubs, events, and careers</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={listRef}
              className="h-[50vh] overflow-y-auto space-y-4 pr-2"
            >
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Bot className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div className="rounded-md px-3 py-2 text-sm bg-accent/50">
                      👋 Hello! I'm your university assistant. I can help you
                      with:
                      <br />
                      <br />• <strong>Clubs:</strong> Find and join student
                      organizations
                      <br />• <strong>Events:</strong> Discover upcoming
                      activities and workshops
                      <br />• <strong>Careers:</strong> Explore job
                      opportunities and internships
                      <br />• <strong>Resources:</strong> Access study materials
                      and templates
                      <br />
                      <br />
                      What would you like to know about?
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2 ${
                      m.role === "assistant" ? "" : "justify-end"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <Bot className="h-5 w-5 mt-1 text-muted-foreground" />
                    ) : (
                      <User className="h-5 w-5 mt-1 text-muted-foreground" />
                    )}
                    <div
                      className={`rounded-md px-3 py-2 text-sm whitespace-pre-wrap ${
                        m.role === "assistant"
                          ? "bg-accent/50"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {usingAI ? "🤖 AI is thinking..." : "Thinking..."}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("What clubs can I join?")}
                  className="text-xs"
                >
                  Find Clubs 🤖
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("What events are coming up?")}
                  className="text-xs"
                >
                  Upcoming Events 🤖
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Show me career opportunities")}
                  className="text-xs"
                >
                  Career Opportunities 🤖
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("What can you help me with?")}
                  className="text-xs"
                >
                  Help 🤖
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                🤖 AI-powered responses with fallback to smart heuristics
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Ask me about a club, event, or job…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                />
                <Button onClick={handleSend} disabled={loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Assistant;
