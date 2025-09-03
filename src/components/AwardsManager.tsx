import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Award, 
  Calendar,
  Building2,
  Trophy,
  Edit,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Award {
  id: string;
  title: string;
  description?: string;
  year?: number;
  category?: string;
  award_type?: string;
  issuer?: string;
  image_url?: string;
}

interface AwardsManagerProps {
  clubId: string;
  awards: Award[];
  onAwardsChange: (awards: Award[]) => void;
}

const AwardsManager: React.FC<AwardsManagerProps> = ({
  clubId,
  awards,
  onAwardsChange
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingAward, setEditingAward] = useState<string | null>(null);
  const [newAward, setNewAward] = useState<Partial<Award>>({
    title: "",
    description: "",
    year: new Date().getFullYear(),
    category: "",
    award_type: "",
    issuer: "",
    image_url: ""
  });

  const awardCategories = [
    "Academic", "Technical", "Sports", "Cultural", "Community Service", 
    "Innovation", "Leadership", "Research", "Other"
  ];

  const awardTypes = [
    "First Place", "Second Place", "Third Place", "Best Performance", 
    "Recognition", "Excellence", "Outstanding Achievement", "Special Mention", "Other"
  ];

  // Add new award
  const addAward = async () => {
    if (!newAward.title?.trim()) {
      toast({
        title: "Error",
        description: "Award title is required",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add awards",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Adding award with data:', {
        club_id: clubId,
        title: newAward.title.trim(),
        description: newAward.description?.trim() || null,
        year: newAward.year || null,
        category: newAward.category?.trim() || null,
        award_type: newAward.award_type?.trim() || null,
        issuer: newAward.issuer?.trim() || null,
        image_url: newAward.image_url?.trim() || null,
        created_by: user.id,
      });

      const { data, error } = await supabase
        .from('club_awards')
        .insert({
          club_id: clubId,
          title: newAward.title.trim(),
          description: newAward.description?.trim() || null,
          year: newAward.year || null,
          category: newAward.category?.trim() || null,
          award_type: newAward.award_type?.trim() || null,
          issuer: newAward.issuer?.trim() || null,
          image_url: newAward.image_url?.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding award:', error);
        toast({
          title: "Error",
          description: `Failed to add award: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      onAwardsChange([...awards, data]);
      setNewAward({
        title: "",
        description: "",
        year: new Date().getFullYear(),
        category: "",
        award_type: "",
        issuer: "",
        image_url: ""
      });
      
      toast({
        title: "Award Added",
        description: "Award has been added successfully",
      });
    } catch (error) {
      console.error('Error adding award:', error);
      toast({
        title: "Error",
        description: `Failed to add award: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Update award
  const updateAward = async (awardId: string, updatedAward: Partial<Award>) => {
    try {
      const { error } = await supabase
        .from('club_awards')
        .update({
          title: updatedAward.title?.trim(),
          description: updatedAward.description?.trim() || null,
          year: updatedAward.year || null,
          category: updatedAward.category?.trim() || null,
          award_type: updatedAward.award_type?.trim() || null,
          issuer: updatedAward.issuer?.trim() || null,
          image_url: updatedAward.image_url?.trim() || null,
        })
        .eq('id', awardId);

      if (error) {
        console.error('Error updating award:', error);
        toast({
          title: "Error",
          description: `Failed to update award: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      onAwardsChange(awards.map(award => 
        award.id === awardId ? { ...award, ...updatedAward } : award
      ));
      setEditingAward(null);
      
      toast({
        title: "Award Updated",
        description: "Award has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating award:', error);
      toast({
        title: "Error",
        description: `Failed to update award: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Delete award
  const deleteAward = async (awardId: string) => {
    try {
      const { error } = await supabase
        .from('club_awards')
        .delete()
        .eq('id', awardId);

      if (error) {
        console.error('Error deleting award:', error);
        toast({
          title: "Error",
          description: `Failed to delete award: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      onAwardsChange(awards.filter(award => award.id !== awardId));
      
      toast({
        title: "Award Deleted",
        description: "Award has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting award:', error);
      toast({
        title: "Error",
        description: `Failed to delete award: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Awards Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage club awards and achievements
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Award Form */}
        <Card className="border border-primary/20 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Award
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="award-title">Award Title *</Label>
                <Input
                  id="award-title"
                  placeholder="e.g., Best Computer Club Award"
                  value={newAward.title || ""}
                  onChange={(e) => setNewAward({ ...newAward, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="award-year">Year</Label>
                <Input
                  id="award-year"
                  type="number"
                  placeholder="2024"
                  value={newAward.year || ""}
                  onChange={(e) => setNewAward({ ...newAward, year: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="award-description">Description</Label>
              <Textarea
                id="award-description"
                placeholder="Describe the award and its significance..."
                value={newAward.description || ""}
                onChange={(e) => setNewAward({ ...newAward, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="award-category">Category</Label>
                <select
                  id="award-category"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  value={newAward.category || ""}
                  onChange={(e) => setNewAward({ ...newAward, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {awardCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="award-type">Award Type</Label>
                <select
                  id="award-type"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  value={newAward.award_type || ""}
                  onChange={(e) => setNewAward({ ...newAward, award_type: e.target.value })}
                >
                  <option value="">Select Type</option>
                  {awardTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="award-issuer">Issuer</Label>
                <Input
                  id="award-issuer"
                  placeholder="e.g., University Administration"
                  value={newAward.issuer || ""}
                  onChange={(e) => setNewAward({ ...newAward, issuer: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="award-image">Image URL (Optional)</Label>
              <Input
                id="award-image"
                placeholder="https://example.com/award-image.jpg"
                value={newAward.image_url || ""}
                onChange={(e) => setNewAward({ ...newAward, image_url: e.target.value })}
              />
            </div>

            <Button onClick={addAward} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Award
            </Button>
          </CardContent>
        </Card>

        {/* Awards List */}
        {awards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No awards added yet</p>
            <p className="text-sm">Add your first award to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Awards ({awards.length})</h3>
            {awards.map((award) => (
              <Card key={award.id} className="border border-border/50">
                <CardContent className="p-4">
                  {editingAward === award.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title *</Label>
                          <Input
                            value={award.title}
                            onChange={(e) => {
                              const updatedAward = { ...award, title: e.target.value };
                              onAwardsChange(awards.map(a => a.id === award.id ? updatedAward : a));
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Year</Label>
                          <Input
                            type="number"
                            value={award.year || ""}
                            onChange={(e) => {
                              const updatedAward = { ...award, year: parseInt(e.target.value) || undefined };
                              onAwardsChange(awards.map(a => a.id === award.id ? updatedAward : a));
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={award.description || ""}
                          onChange={(e) => {
                            const updatedAward = { ...award, description: e.target.value };
                            onAwardsChange(awards.map(a => a.id === award.id ? updatedAward : a));
                          }}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <select
                            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                            value={award.category || ""}
                            onChange={(e) => {
                              const updatedAward = { ...award, category: e.target.value };
                              onAwardsChange(awards.map(a => a.id === award.id ? updatedAward : a));
                            }}
                          >
                            <option value="">Select Category</option>
                            {awardCategories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Award Type</Label>
                          <select
                            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                            value={award.award_type || ""}
                            onChange={(e) => {
                              const updatedAward = { ...award, award_type: e.target.value };
                              onAwardsChange(awards.map(a => a.id === award.id ? updatedAward : a));
                            }}
                          >
                            <option value="">Select Type</option>
                            {awardTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Issuer</Label>
                          <Input
                            value={award.issuer || ""}
                            onChange={(e) => {
                              const updatedAward = { ...award, issuer: e.target.value };
                              onAwardsChange(awards.map(a => a.id === award.id ? updatedAward : a));
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => updateAward(award.id, award)}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingAward(null)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                            <Award className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{award.title}</h3>
                            {award.year && <Badge variant="secondary">{award.year}</Badge>}
                            {award.category && <Badge variant="outline">{award.category}</Badge>}
                          </div>
                          {award.description && (
                            <p className="text-muted-foreground text-sm mb-2">{award.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {award.award_type && (
                              <span className="flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                {award.award_type}
                              </span>
                            )}
                            {award.issuer && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {award.issuer}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAward(award.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAward(award.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AwardsManager;
