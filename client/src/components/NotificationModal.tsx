import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Heart, GitFork, UserPlus, Check, X, Bookmark, Star, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Notification } from "@shared/schema";

interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "follow":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "like":
      return <Heart className="h-4 w-4 fill-red-500 text-red-500" />;
    case "fork":
      return <GitFork className="h-4 w-4 text-purple-500" />;
    case "approval": // For featured prompts
      return <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />;
    case "image_contribution":
      return <Image className="h-4 w-4 text-cyan-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

export function NotificationModal({ open, onOpenChange }: NotificationModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: open,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", "/api/notifications/read-all");
      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      queryClient.refetchQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        description: "All notifications marked as read",
      });
    },
    onError: (error) => {
      console.error("Error marking notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    },
  });

  // Don't auto-mark as read - let user click "Mark all as read" button

  const renderNotificationMessage = (notification: Notification) => {
    const message = notification.message;
    
    // First, check if there's a username at the beginning that should be linked
    // Pattern matches: "Username liked...", "Username started following...", "Username forked...", etc.
    const usernameMatch = message.match(/^([^\s]+)\s+(liked|started following|forked|contributed|approved|commented|mentioned|created|joined)/);
    
    if (usernameMatch && notification.relatedUserId && (notification as any).relatedUser) {
      const username = usernameMatch[1];
      const restOfMessage = message.substring(username.length);
      
      // Split the rest of the message to find prompt names in quotes
      const parts = restOfMessage.split(/([""].*?[""])/g);
      
      return (
        <>
          {/* Render the clickable username */}
          <Link 
            href={`/user/${(notification as any).relatedUser.username || username}`}
            className="font-semibold text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              onOpenChange(false);
            }}
          >
            {username}
          </Link>
          
          {/* Render the rest of the message with clickable prompt names */}
          {parts.map((part, index) => {
            // Check if this part is a quoted prompt name
            if (part.match(/^[""].*[""]$/)) {
              const promptName = part.slice(1, -1); // Remove quotes
              if (notification.relatedPromptId) {
                return (
                  <Link 
                    key={index}
                    href={`/prompt/${notification.relatedPromptId}`}
                    className="font-semibold text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      onOpenChange(false);
                    }}
                  >
                    "{promptName}"
                  </Link>
                );
              }
              return <span key={index} className="font-semibold">"{promptName}"</span>;
            }
            return <span key={index}>{part}</span>;
          })}
        </>
      );
    }
    
    // Fallback to original parsing if no username match at the beginning
    // Parse message to find prompt names in quotes and make them clickable
    const parts = message.split(/([""].*?[""])/g);
    
    return parts.map((part, index) => {
      // Check if this part is a quoted prompt name
      if (part.match(/^[""].*[""]$/)) {
        const promptName = part.slice(1, -1); // Remove quotes
        if (notification.relatedPromptId) {
          return (
            <Link 
              key={index}
              href={`/prompt/${notification.relatedPromptId}`}
              className="font-semibold text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                onOpenChange(false);
              }}
            >
              "{promptName}"
            </Link>
          );
        }
        return <span key={index} className="font-semibold">"{promptName}"</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="modal-notifications">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                data-testid="button-mark-all-read"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <Separator />

        <ScrollArea className="h-[500px] pr-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading notifications...</div>
            </div>
          )}

          {!isLoading && notifications && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                You'll be notified when someone interacts with your prompts
              </p>
            </div>
          )}

          {!isLoading && notifications && notifications.length > 0 && (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-secondary/50 ${
                    !notification.isRead ? "bg-secondary/20" : ""
                  }`}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? "font-semibold" : ""}`}>
                      {renderNotificationMessage(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : 'Recently'}
                    </p>
                  </div>

                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-primary rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending}
          data-testid="button-mark-all-read"
        >
          <Check className="h-4 w-4 mr-1" />
          Mark all as read
        </Button>
      </DialogContent>
    </Dialog>
  );
}