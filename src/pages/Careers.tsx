import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type CareerType = "job" | "internship" | "guideline" | "discussion";

interface CareerPost {
  id: string;
  title: string;
  description: string;
  type: CareerType;
  company?: string | null;
  location?: string | null;
  apply_url?: string | null;
  posted_by: string;
  created_at: string;
}

interface CareerComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

const Careers = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<CareerPost[]>([]);
  const [activeType, setActiveType] = useState<CareerType>("job");

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<CareerPost | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "job" as CareerType,
    company: "",
    location: "",
    apply_url: "",
  });

  const filtered = useMemo(
    () => posts.filter((p) => p.type === activeType),
    [posts, activeType]
  );

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("careers_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPosts((data as CareerPost[]) || []);
    } catch (err) {
      console.error("Error fetching careers posts:", err);
      toast({
        title: "Error",
        description: "Failed to load careers posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const resetForm = () => {
    setEditingPost(null);
    setForm({
      title: "",
      description: "",
      type: "job",
      company: "",
      location: "",
      apply_url: "",
    });
    setFormOpen(false);
  };

  const handleCreateOrUpdate = async () => {
    if (!user?.id) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast({
        title: "Validation",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }
    try {
      setSaving(true);
      if (editingPost) {
        const { error } = await supabase
          .from("careers_posts")
          .update({
            title: form.title.trim(),
            description: form.description.trim(),
            type: form.type,
            company: form.company || null,
            location: form.location || null,
            apply_url: form.apply_url || null,
          })
          .eq("id", editingPost.id);
        if (error) throw error;
        toast({ title: "Updated", description: "Post updated successfully" });
      } else {
        const { error } = await supabase.from("careers_posts").insert({
          title: form.title.trim(),
          description: form.description.trim(),
          type: form.type,
          company: form.company || null,
          location: form.location || null,
          apply_url: form.apply_url || null,
          posted_by: user.id,
        });
        if (error) throw error;
        toast({ title: "Created", description: "Post created successfully" });
      }
      resetForm();
      fetchPosts();
    } catch (err) {
      console.error("Error saving careers post:", err);
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (post: CareerPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      description: post.description,
      type: post.type,
      company: post.company || "",
      location: post.location || "",
      apply_url: post.apply_url || "",
    });
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      const { error } = await supabase
        .from("careers_posts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Post deleted" });
      fetchPosts();
    } catch (err) {
      console.error("Error deleting careers post:", err);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Careers</h2>
        <Button onClick={() => setFormOpen(true)}>New</Button>
      </div>

      {formOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingPost ? "Edit Post" : "Create Post"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Select
                value={form.type}
                onValueChange={(value: CareerType) =>
                  setForm({ ...form, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job">Job</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="guideline">Guideline</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Company (optional)"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
              <Input
                placeholder="Location (optional)"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <Input
                placeholder="Apply URL (optional)"
                value={form.apply_url}
                onChange={(e) =>
                  setForm({ ...form, apply_url: e.target.value })
                }
              />
            </div>
            <Textarea
              placeholder="Description"
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateOrUpdate} disabled={saving}>
                {editingPost ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={activeType}
        onValueChange={(v) => setActiveType(v as CareerType)}
      >
        <TabsList>
          <TabsTrigger value="job">Jobs</TabsTrigger>
          <TabsTrigger value="internship">Internships</TabsTrigger>
          <TabsTrigger value="guideline">Guidelines</TabsTrigger>
          <TabsTrigger value="discussion">Discussions</TabsTrigger>
        </TabsList>
        <TabsContent value="job" />
        <TabsContent value="internship" />
        <TabsContent value="guideline" />
        <TabsContent value="discussion" />
      </Tabs>

      <div className="mt-4 grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="py-10 text-center">Loading...</CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              No posts found
            </CardContent>
          </Card>
        ) : (
          filtered.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {post.type}
                      </Badge>
                      {post.company ? <Badge>{post.company}</Badge> : null}
                      {post.location ? (
                        <Badge variant="outline">{post.location}</Badge>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {post.description}
                    </p>
                    {post.apply_url ? (
                      <a
                        href={post.apply_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        Apply/Details
                      </a>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(post)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>
    </Layout>
  );
};

export default Careers;
