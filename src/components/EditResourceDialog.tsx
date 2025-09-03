import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useResources } from "@/hooks/useDatabase2";
import type { Resource } from "@/lib/supabase";

const categories = [
  "Academic",
  "Research",
  "Laboratory",
  "Software",
  "Career",
  "Creative",
  "Reference",
  "Past Papers",
  "Project",
];

const subjects = [
  "Computer Science",
  "Programming",
  "Data Structures",
  "Algorithms",
  "Database Systems",
  "Software Engineering",
  "Computer Networks",
  "Artificial Intelligence",
  "Machine Learning",
  "Web Development",
  "Mobile Development",
  "Mathematics",
  "Statistics",
  "Physics",
  "Chemistry",
  "Economics",
  "Finance",
  "Marketing",
  "Management",
  "English",
  "General Studies",
];

const formSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  category: z.string().min(1, "Please select a category"),
  subject: z.string().optional(),
  course_code: z.string().max(20, "Course code too long").optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
  resource_link: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Resource link is required"),
});

type FormData = z.infer<typeof formSchema>;

interface EditResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource | null;
  onEditSuccess?: () => void;
}

export default function EditResourceDialog({
  open,
  onOpenChange,
  resource,
  onEditSuccess,
}: EditResourceDialogProps) {
  const [currentTag, setCurrentTag] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { updateResource } = useResources();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      subject: "",
      course_code: "",
      tags: [],
      resource_link: "",
    },
  });

  const resourceLink = form.watch("resource_link");
  const tags = form.watch("tags") || [];

  // Update form when resource changes
  useEffect(() => {
    if (resource) {
      form.reset({
        title: resource.title || "",
        description: resource.description || "",
        category: resource.category || "",
        subject: resource.subject || "",
        course_code: resource.course_code || "",
        tags: resource.tags || [],
        resource_link: resource.file_type?.startsWith("http")
          ? resource.file_type
          : "",
      });
    }
  }, [resource, form]);

  const addTag = () => {
    if (
      currentTag.trim() &&
      !tags.includes(currentTag.trim()) &&
      tags.length < 10
    ) {
      form.setValue("tags", [...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const onSubmit = async (data: FormData) => {
    if (!resource) return;

    try {
      setIsUpdating(true);

      await updateResource(resource.id, {
        title: data.title,
        description: data.description,
        category: data.category,
        subject: data.subject,
        course_code: data.course_code,
        tags: data.tags,
        resource_link: data.resource_link,
      });

      toast({
        title: "Success!",
        description: "Resource updated successfully.",
      });

      onOpenChange(false);
      onEditSuccess?.();
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update resource. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setCurrentTag("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>
            Update the resource information and link.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Resource Link Input */}
            <FormField
              control={form.control}
              name="resource_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Link *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/resource"
                      {...field}
                      type="url"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the URL link to your educational resource (e.g.,
                    Google Drive, Dropbox, YouTube, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Link Preview */}
            {resourceLink && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <ExternalLink className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Resource Link</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {resourceLink}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Resource title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the resource"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Course Code */}
            <FormField
              control={form.control}
              name="course_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CS101, MATH201" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-3">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Resource"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
