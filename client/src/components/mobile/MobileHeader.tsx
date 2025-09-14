import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface MobileHeaderProps {
  pageName?: string;
  onMenuClick?: () => void;
  showBack?: boolean;
}

export default function MobileHeader({ pageName = "Page", onMenuClick, showBack = true }: MobileHeaderProps) {
  const [, navigate] = useLocation();

  return (
    <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold">{pageName}</h1>
        </div>
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-8 w-8"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}