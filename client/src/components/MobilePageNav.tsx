import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Users } from "lucide-react";

export function MobilePageNav() {
  const [location] = useLocation();
  const isLibraryPage = location === "/library";
  const isCommunityPage = location === "/community";

  return (
    <div className="block lg:hidden fixed left-0 right-0 z-50 bg-background/95 dark:bg-background/95 backdrop-blur-sm border-t border-border p-3" style={{ bottom: "0.5rem", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex gap-2 max-w-screen-xl mx-auto">
        <Link href="/library" className="flex-1">
         
          
          
          <Button 
            variant="outline"
            className={`w-full relative group ${isLibraryPage ? 'button-gradient-library hover:color-white' : 'bg-transparent hover:bg-white/5'}`}
            data-testid="button-my-prompts"
          >
            <FileText className={`h-4 w-4 mr-2 text-white transition-all ${!isLibraryPage ? 'group-hover:scale-110 group-hover:brightness-150' : ''}`} />
            <span className={!isLibraryPage ? 'nav-gradient-library' : ''}>My Prompts</span>
            {isLibraryPage && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
            )}
          </Button>
        </Link>
        <Link href="/community" className="flex-1">
       
          
          
          
          <Button 
            variant="outline"
            className={`w-full relative group ${isCommunityPage ? 'button-gradient-community hover:color-white' : 'bg-transparent hover:bg-white/5'}`}
            data-testid="button-community-prompts"
          >
            <Users className={`h-4 w-4 mr-2 text-white transition-all ${!isCommunityPage ? 'group-hover:scale-110 group-hover:brightness-150' : ''}`} />
            <span className={!isCommunityPage ? 'nav-gradient-community' : ''}>Community Prompts</span>
            {isCommunityPage && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
            )}
          </Button>
        </Link>
      </div>
    </div>
  );
}