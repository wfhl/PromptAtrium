import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Settings,
  Shield,
  Bell,
  Users,
  Globe,
  Lock,
  Eye,
  MessageSquare,
  AlertTriangle,
  Save,
  Plus,
  X,
  RefreshCw,
  Palette,
  FileText,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface CommunitySettingsData {
  id?: string;
  communityId?: string;
  general: {
    name: string;
    description: string;
    visibility: "public" | "private" | "invite-only";
    category: string;
    tags: string[];
    maxMembers: number;
    allowJoinRequests: boolean;
  };
  moderation: {
    autoModEnabled: boolean;
    profanityFilter: boolean;
    spamDetection: boolean;
    linkModeration: boolean;
    imageModeration: boolean;
    minimumAccountAge: number;
    minimumKarma: number;
    restrictedWords: string[];
    approvalRequired: boolean;
  };
  permissions: {
    canPost: "all" | "members" | "approved" | "moderators";
    canComment: "all" | "members" | "approved" | "moderators";
    canShare: "all" | "members" | "approved" | "moderators";
    canInvite: "all" | "members" | "approved" | "moderators";
    canReport: boolean;
    canAppeal: boolean;
  };
  notifications: {
    newMemberAlert: boolean;
    reportAlert: boolean;
    flaggedContentAlert: boolean;
    thresholdViolationAlert: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
  appearance: {
    theme: "default" | "dark" | "custom";
    primaryColor: string;
    bannerImage: string;
    logo: string;
    customCSS: string;
  };
  rules: Array<{
    id: string;
    title: string;
    description: string;
    severity: "info" | "warning" | "critical";
  }>;
}

interface CommunitySettingsProps {
  communityId?: string;
  isSuperAdmin?: boolean;
}

export default function CommunitySettings({ communityId, isSuperAdmin = true }: CommunitySettingsProps) {
  const { toast } = useToast();
  const [newTag, setNewTag] = useState("");
  const [newWord, setNewWord] = useState("");
  const [newRule, setNewRule] = useState({ title: "", description: "", severity: "info" as const });

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<CommunitySettingsData>({
    queryKey: communityId 
      ? ["/api/admin/community-settings", communityId]
      : ["/api/admin/settings"],
    enabled: true,
  });

  const [formData, setFormData] = useState<CommunitySettingsData>({
    general: {
      name: "",
      description: "",
      visibility: "public",
      category: "",
      tags: [],
      maxMembers: 10000,
      allowJoinRequests: true,
    },
    moderation: {
      autoModEnabled: true,
      profanityFilter: true,
      spamDetection: true,
      linkModeration: false,
      imageModeration: true,
      minimumAccountAge: 0,
      minimumKarma: 0,
      restrictedWords: [],
      approvalRequired: false,
    },
    permissions: {
      canPost: "members",
      canComment: "all",
      canShare: "all",
      canInvite: "members",
      canReport: true,
      canAppeal: true,
    },
    notifications: {
      newMemberAlert: true,
      reportAlert: true,
      flaggedContentAlert: true,
      thresholdViolationAlert: true,
      dailyDigest: false,
      weeklyReport: true,
    },
    appearance: {
      theme: "default",
      primaryColor: "#7C3AED",
      bannerImage: "",
      logo: "",
      customCSS: "",
    },
    rules: [],
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async (data: CommunitySettingsData) => {
      const endpoint = communityId 
        ? `/api/admin/community-settings/${communityId}`
        : `/api/admin/settings`;
      return await apiRequest("PUT", endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: communityId 
          ? ["/api/admin/community-settings", communityId]
          : ["/api/admin/settings"]
      });
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const addTag = () => {
    if (newTag && !formData.general.tags.includes(newTag)) {
      setFormData({
        ...formData,
        general: {
          ...formData.general,
          tags: [...formData.general.tags, newTag],
        },
      });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      general: {
        ...formData.general,
        tags: formData.general.tags.filter(t => t !== tag),
      },
    });
  };

  const addRestrictedWord = () => {
    if (newWord && !formData.moderation.restrictedWords.includes(newWord)) {
      setFormData({
        ...formData,
        moderation: {
          ...formData.moderation,
          restrictedWords: [...formData.moderation.restrictedWords, newWord],
        },
      });
      setNewWord("");
    }
  };

  const removeRestrictedWord = (word: string) => {
    setFormData({
      ...formData,
      moderation: {
        ...formData.moderation,
        restrictedWords: formData.moderation.restrictedWords.filter(w => w !== word),
      },
    });
  };

  const addRule = () => {
    if (newRule.title && newRule.description) {
      setFormData({
        ...formData,
        rules: [
          ...formData.rules,
          {
            id: Date.now().toString(),
            ...newRule,
          },
        ],
      });
      setNewRule({ title: "", description: "", severity: "info" });
    }
  };

  const removeRule = (id: string) => {
    setFormData({
      ...formData,
      rules: formData.rules.filter(r => r.id !== id),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {communityId ? "Community Settings" : "Platform Settings"}
              </CardTitle>
              <CardDescription>
                {communityId 
                  ? "Configure settings for this community"
                  : "Configure global platform settings"}
              </CardDescription>
            </div>
            <Button
              onClick={() => saveSettings.mutate(formData)}
              disabled={saveSettings.isPending}
              data-testid="button-save-settings"
            >
              {saveSettings.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">
                <Settings className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="moderation">
                <Shield className="h-4 w-4 mr-2" />
                Moderation
              </TabsTrigger>
              <TabsTrigger value="permissions">
                <Lock className="h-4 w-4 mr-2" />
                Permissions
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <Palette className="h-4 w-4 mr-2" />
                Appearance
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.general.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      general: { ...formData.general, name: e.target.value }
                    })}
                    placeholder="Community name"
                    data-testid="input-community-name"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.general.description}
                    onChange={(e) => setFormData({
                      ...formData,
                      general: { ...formData.general, description: e.target.value }
                    })}
                    placeholder="Community description"
                    rows={3}
                    data-testid="textarea-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select
                      value={formData.general.visibility}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        general: { ...formData.general, visibility: value }
                      })}
                    >
                      <SelectTrigger id="visibility" data-testid="select-visibility">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="invite-only">Invite Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="max-members">Max Members</Label>
                    <Input
                      id="max-members"
                      type="number"
                      value={formData.general.maxMembers}
                      onChange={(e) => setFormData({
                        ...formData,
                        general: { ...formData.general, maxMembers: parseInt(e.target.value) || 0 }
                      })}
                      data-testid="input-max-members"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      data-testid="input-add-tag"
                    />
                    <Button onClick={addTag} size="sm" data-testid="button-add-tag">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.general.tags.map(tag => (
                      <Badge key={tag} variant="secondary" data-testid={`badge-tag-${tag}`}>
                        {tag}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="join-requests">Allow Join Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to request to join the community
                    </p>
                  </div>
                  <Switch
                    id="join-requests"
                    checked={formData.general.allowJoinRequests}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      general: { ...formData.general, allowJoinRequests: checked }
                    })}
                    data-testid="switch-join-requests"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Moderation Settings */}
            <TabsContent value="moderation" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Moderation</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically detect and handle problematic content
                    </p>
                  </div>
                  <Switch
                    checked={formData.moderation.autoModEnabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      moderation: { ...formData.moderation, autoModEnabled: checked }
                    })}
                    data-testid="switch-auto-mod"
                  />
                </div>

                <Separator />

                {formData.moderation.autoModEnabled && (
                  <div className="space-y-4 pl-4">
                    <div className="flex items-center justify-between">
                      <Label>Profanity Filter</Label>
                      <Switch
                        checked={formData.moderation.profanityFilter}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          moderation: { ...formData.moderation, profanityFilter: checked }
                        })}
                        data-testid="switch-profanity"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Spam Detection</Label>
                      <Switch
                        checked={formData.moderation.spamDetection}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          moderation: { ...formData.moderation, spamDetection: checked }
                        })}
                        data-testid="switch-spam"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Link Moderation</Label>
                      <Switch
                        checked={formData.moderation.linkModeration}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          moderation: { ...formData.moderation, linkModeration: checked }
                        })}
                        data-testid="switch-links"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Image Moderation</Label>
                      <Switch
                        checked={formData.moderation.imageModeration}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          moderation: { ...formData.moderation, imageModeration: checked }
                        })}
                        data-testid="switch-images"
                      />
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Minimum Account Age (days)</Label>
                    <Input
                      type="number"
                      value={formData.moderation.minimumAccountAge}
                      onChange={(e) => setFormData({
                        ...formData,
                        moderation: { ...formData.moderation, minimumAccountAge: parseInt(e.target.value) || 0 }
                      })}
                      data-testid="input-min-age"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Minimum Karma</Label>
                    <Input
                      type="number"
                      value={formData.moderation.minimumKarma}
                      onChange={(e) => setFormData({
                        ...formData,
                        moderation: { ...formData.moderation, minimumKarma: parseInt(e.target.value) || 0 }
                      })}
                      data-testid="input-min-karma"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Restricted Words</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder="Add restricted word..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRestrictedWord())}
                      data-testid="input-add-word"
                    />
                    <Button onClick={addRestrictedWord} size="sm" data-testid="button-add-word">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.moderation.restrictedWords.map(word => (
                      <Badge key={word} variant="destructive" data-testid={`badge-word-${word}`}>
                        {word}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => removeRestrictedWord(word)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Permissions Settings */}
            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Who can post?</Label>
                    <Select
                      value={formData.permissions.canPost}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canPost: value }
                      })}
                    >
                      <SelectTrigger data-testid="select-can-post">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="members">Members Only</SelectItem>
                        <SelectItem value="approved">Approved Members</SelectItem>
                        <SelectItem value="moderators">Moderators Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Who can comment?</Label>
                    <Select
                      value={formData.permissions.canComment}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canComment: value }
                      })}
                    >
                      <SelectTrigger data-testid="select-can-comment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="members">Members Only</SelectItem>
                        <SelectItem value="approved">Approved Members</SelectItem>
                        <SelectItem value="moderators">Moderators Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Who can share?</Label>
                    <Select
                      value={formData.permissions.canShare}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canShare: value }
                      })}
                    >
                      <SelectTrigger data-testid="select-can-share">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="members">Members Only</SelectItem>
                        <SelectItem value="approved">Approved Members</SelectItem>
                        <SelectItem value="moderators">Moderators Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Who can invite?</Label>
                    <Select
                      value={formData.permissions.canInvite}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canInvite: value }
                      })}
                    >
                      <SelectTrigger data-testid="select-can-invite">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="members">Members Only</SelectItem>
                        <SelectItem value="approved">Approved Members</SelectItem>
                        <SelectItem value="moderators">Moderators Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Reporting</Label>
                      <p className="text-sm text-muted-foreground">
                        Users can report inappropriate content
                      </p>
                    </div>
                    <Switch
                      checked={formData.permissions.canReport}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canReport: checked }
                      })}
                      data-testid="switch-can-report"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Appeals</Label>
                      <p className="text-sm text-muted-foreground">
                        Users can appeal moderation decisions
                      </p>
                    </div>
                    <Switch
                      checked={formData.permissions.canAppeal}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, canAppeal: checked }
                      })}
                      data-testid="switch-can-appeal"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure which events trigger admin notifications
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Member Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new users join
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.newMemberAlert}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, newMemberAlert: checked }
                      })}
                      data-testid="switch-new-member-alert"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Report Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified of new user reports
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.reportAlert}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, reportAlert: checked }
                      })}
                      data-testid="switch-report-alert"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Flagged Content Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when content is auto-flagged
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.flaggedContentAlert}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, flaggedContentAlert: checked }
                      })}
                      data-testid="switch-flagged-alert"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Threshold Violation Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when limits are exceeded
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.thresholdViolationAlert}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, thresholdViolationAlert: checked }
                      })}
                      data-testid="switch-threshold-alert"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive daily summary of activity
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.dailyDigest}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, dailyDigest: checked }
                      })}
                      data-testid="switch-daily-digest"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Report</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly analytics report
                      </p>
                    </div>
                    <Switch
                      checked={formData.notifications.weeklyReport}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, weeklyReport: checked }
                      })}
                      data-testid="switch-weekly-report"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-4">
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Theme</Label>
                    <Select
                      value={formData.appearance.theme}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        appearance: { ...formData.appearance, theme: value }
                      })}
                    >
                      <SelectTrigger data-testid="select-theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={formData.appearance.primaryColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          appearance: { ...formData.appearance, primaryColor: e.target.value }
                        })}
                        className="w-20 h-10"
                        data-testid="input-primary-color"
                      />
                      <Input
                        value={formData.appearance.primaryColor}
                        onChange={(e) => setFormData({
                          ...formData,
                          appearance: { ...formData.appearance, primaryColor: e.target.value }
                        })}
                        placeholder="#7C3AED"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Banner Image URL</Label>
                    <Input
                      value={formData.appearance.bannerImage}
                      onChange={(e) => setFormData({
                        ...formData,
                        appearance: { ...formData.appearance, bannerImage: e.target.value }
                      })}
                      placeholder="https://example.com/banner.jpg"
                      data-testid="input-banner-url"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Logo URL</Label>
                    <Input
                      value={formData.appearance.logo}
                      onChange={(e) => setFormData({
                        ...formData,
                        appearance: { ...formData.appearance, logo: e.target.value }
                      })}
                      placeholder="https://example.com/logo.png"
                      data-testid="input-logo-url"
                    />
                  </div>

                  {formData.appearance.theme === "custom" && (
                    <div className="grid gap-2">
                      <Label>Custom CSS</Label>
                      <Textarea
                        value={formData.appearance.customCSS}
                        onChange={(e) => setFormData({
                          ...formData,
                          appearance: { ...formData.appearance, customCSS: e.target.value }
                        })}
                        placeholder="/* Add custom styles here */"
                        rows={6}
                        className="font-mono text-sm"
                        data-testid="textarea-custom-css"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Community Rules Section */}
          {communityId && (
            <div className="mt-6">
              <Separator className="mb-6" />
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Community Rules</h3>
                  <p className="text-sm text-muted-foreground">
                    Define rules that members must follow
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2">
                    <Input
                      value={newRule.title}
                      onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                      placeholder="Rule title..."
                      className="col-span-3"
                      data-testid="input-rule-title"
                    />
                    <Input
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                      placeholder="Rule description..."
                      className="col-span-6"
                      data-testid="input-rule-description"
                    />
                    <Select
                      value={newRule.severity}
                      onValueChange={(value: any) => setNewRule({ ...newRule, severity: value })}
                    >
                      <SelectTrigger className="col-span-2" data-testid="select-rule-severity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={addRule} 
                      size="sm" 
                      className="col-span-1"
                      data-testid="button-add-rule"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 mt-4">
                    {formData.rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`card-rule-${rule.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{rule.title}</span>
                            <Badge
                              variant={
                                rule.severity === "critical" ? "destructive" :
                                rule.severity === "warning" ? "secondary" :
                                "default"
                              }
                            >
                              {rule.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {rule.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(rule.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}