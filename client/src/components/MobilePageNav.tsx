import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Users } from "lucide-react";

export function MobilePageNav() {
  const [location] = useLocation();
  const isLibraryPage = location === "/library";
  const isCommunityPage = location === "/community";

  return (
    <div className="block md:hidden mb-3">
      <div className="flex gap-2">
        <Link href="/library" className="flex-1">
          <Button 
            variant="outline"
            className={`w-full relative ${isLibraryPage ? '' : 'nav-gradient-library'}`}
            data-testid="button-my-prompts"
          >
            <FileText className="h-4 w-4 mr-2" />
            My Prompts
            {isLibraryPage && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
            )}
          </Button>
        </Link>
        <Link href="/community" className="flex-1">
          <Button 
            variant="outline"
            className={`w-full relative ${isCommunityPage ? '' : 'nav-gradient-community'}`}
            data-testid="button-community-prompts"
          >
            <Users className="h-4 w-4 mr-2" />
            Community Prompts
            {isCommunityPage && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
            )}
          </Button>
        </Link>
      </div>
    </div>
  );
}