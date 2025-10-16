import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface NotificationBellProps {
  onClick: () => void;
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={onClick}
      data-testid="button-notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount && unreadCount.count > 0 && (
        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-[9px] text-white font-medium">
            {unreadCount.count > 99 ? "99+" : unreadCount.count}
          </span>
        </div>
      )}
    </Button>
  );
}