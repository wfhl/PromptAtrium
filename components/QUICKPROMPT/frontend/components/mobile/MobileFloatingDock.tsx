import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { X, Home } from "lucide-react";
import { getMobilePageConfig } from "@/utils/pageConfig";

interface Tab {
  id: string;
  path: string;
  label: string;
}

interface MobileFloatingDockProps {
  className?: string;
  currentPage?: string;
}

export default function MobileFloatingDock({
  className = "",
  currentPage,
}: MobileFloatingDockProps) {
  const [location] = useLocation();
  const [tabs, setTabs] = useState<Tab[]>(() => {
    // Load tabs from localStorage on initial load
    try {
      const savedTabs = localStorage.getItem("mobileTabs");
      return savedTabs ? JSON.parse(savedTabs) : [];
    } catch {
      return [];
    }
  });

  // Get page configuration dynamically from our centralized system
  const getPageConfig = (path: string) => {
    const config = getMobilePageConfig(path);
    return {
      label: config.label,
      icon: config.icon,
      color: config.color,
    };
  };

  // Add new tab when location changes (except for dashboard)
  useEffect(() => {
    const activePage = currentPage || location;
    if (activePage !== "/") {
      setTabs((prevTabs) => {
        // Check if tab already exists
        const existingTab = prevTabs.find((tab) => tab.path === activePage);
        if (existingTab) return prevTabs;

        // Get configuration for this page
        const config = getPageConfig(activePage);

        // Add new tab
        const newTab: Tab = {
          id: Date.now().toString(),
          path: activePage,
          label: config.label,
        };
        const updatedTabs = [...prevTabs, newTab];

        // Save to localStorage
        localStorage.setItem("mobileTabs", JSON.stringify(updatedTabs));
        return updatedTabs;
      });
    }
  }, [location, currentPage]);

  // Save tabs to localStorage whenever tabs change
  useEffect(() => {
    localStorage.setItem("mobileTabs", JSON.stringify(tabs));
  }, [tabs]);

  const closeTab = (tabId: string) => {
    setTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== tabId));
  };

  return (
    <div className={`fixed top-3 right-3 z-50 ${className}`}>
      <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-gray-700 rounded-full px-1 py-1 flex items-center space-x-1 shadow-lg w-auto min-w-fit">
        {/* Dynamic tabs for other pages - on the left */}
        {tabs.map((tab) => {
          const config = getPageConfig(tab.path);
          return (
            <div key={tab.id} className="flex items-center">
              <Link href={tab.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 rounded-l-full p-0 hover:bg-gradient-to-br from-purple-600/10 to-blue-600/10 ${
                    (currentPage || location) === tab.path
                      ? "bg-gradient-to-br from-purple-600/10 to-blue-600/10 text-white"
                      : ""
                  }`}
                  style={
                    (currentPage || location) !== tab.path
                      ? { color: config.color }
                      : {}
                  }
                >
                  {config.icon}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => closeTab(tab.id)}
                className="h-7 w-5 p-0 rounded-r-full hover:bg-red-600 text-gray-400 hover:text-white"
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          );
        })}

        {/* Dashboard tab - always on the right */}
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 rounded-full p-0 hover:bg-gradient-to-br from-purple-600/10 to-blue-600/10 ${
              (currentPage || location) === "/"
                ? "bg-gradient-to-br from-purple-600/10 to-blue-600/10 text-white"
                : ""
            }`}
            style={
              (currentPage || location) !== "/" ? { color: "#60a5fa" } : {}
            }
          >
            <Home className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
