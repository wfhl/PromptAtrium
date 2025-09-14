import { Home, Library, Plus, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface MobileFloatingDockProps {
  currentPage?: string;
}

export default function MobileFloatingDock({ currentPage }: MobileFloatingDockProps) {
  const [, navigate] = useLocation();

  const items = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Library, label: "Library", path: "/library" },
    { icon: Plus, label: "Create", path: "/new-prompt-generator" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 pb-safe z-50">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                isActive
                  ? "text-purple-500 bg-purple-500/10"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}