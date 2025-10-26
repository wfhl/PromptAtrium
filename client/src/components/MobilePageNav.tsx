import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Users, Wrench, ShoppingBag } from "lucide-react";

export function MobilePageNav() {
  const [location] = useLocation();
  const isLibraryPage = location === "/library";
  const isCommunityPage = location === "/community";
  const isToolsPage = location === "/tools";
  const isMarketplacePage = location.startsWith("/marketplace");

  return (
    <>
      {/* Extended blur effect below nav */}
      <div className="block lg:hidden fixed left-0 right-0 bottom-0 z-40 h-6 bg-background/95 dark:bg-background/95 backdrop-blur-sm pointer-events-none" />

      <div className="block border-transparent lg:hidden fixed left-0 right-0 bottom-0 z-50 bg-background/95 dark:bg-background/95 backdrop-blur-sm border-t border-border p-2 pb-safe mobile-nav-fixed">
        <div className="flex gap-1 max-w-screen-xl mx-auto">
          <Link href="/library" className="flex-1">
            <Button 
              variant="outline"
              className={`w-full relative group px-2 py-2 h-auto ${isLibraryPage ? 'button-gradient-library hover:color-white' : 'bg-gray-900/70 hover:bg-white/5'}`}
              data-testid="button-my-prompts"
            >
              <div className="flex flex-col items-center gap-0.5">
                <FileText className={`h-4 w-4 text-white transition-all ${!isLibraryPage ? 'group-hover:scale-110 group-hover:brightness-150' : ''}`} />
                <span className={`text-[10px] ${!isLibraryPage ? 'nav-gradient-library' : ''}`}>Prompts</span>
              </div>
              {isLibraryPage && (
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </Button>
          </Link>
          
          <Link href="/marketplace" className="flex-1">
            <Button 
              variant="outline"
              className={`w-full relative group px-2 py-2 h-auto ${isMarketplacePage ? 'button-gradient-marketplace hover:color-white' : 'bg-gray-900/70 hover:bg-white/5'}`}
              data-testid="button-marketplace"
            >
              <div className="flex flex-col items-center gap-0.5">
                <ShoppingBag className={`h-4 w-4 text-white transition-all ${!isMarketplacePage ? 'group-hover:scale-110 group-hover:brightness-150' : ''}`} />
                <span className={`text-[10px] ${!isMarketplacePage ? 'nav-gradient-marketplace' : ''}`}>Market</span>
              </div>
              {isMarketplacePage && (
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </Button>
          </Link>
          
          <Link href="/tools" className="flex-1">
            <Button 
              variant="outline"
              className={`w-full relative group px-2 py-2 h-auto ${isToolsPage ? 'button-gradient-tools hover:color-white' : 'bg-gray-900/70 hover:bg-white/5'}`}
              data-testid="button-tools"
            >
              <div className="flex flex-col items-center gap-0.5">
                <Wrench className={`h-4 w-4 text-white transition-all ${!isToolsPage ? 'group-hover:scale-110 group-hover:brightness-150' : ''}`} />
                <span className={`text-[10px] ${!isToolsPage ? 'nav-gradient-tools' : ''}`}>Tools</span>
              </div>
              {isToolsPage && (
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </Button>
          </Link>
          
          <Link href="/community" className="flex-1">
            <Button 
              variant="outline"
              className={`w-full relative group px-2 py-2 h-auto ${isCommunityPage ? 'button-gradient-community hover:color-white' : 'bg-gray-900/70 hover:bg-white/5'}`}
              data-testid="button-community-prompts"
            >
              <div className="flex flex-col items-center gap-0.5">
                <Users className={`h-4 w-4 text-white transition-all ${!isCommunityPage ? 'group-hover:scale-110 group-hover:brightness-150' : ''}`} />
                <span className={`text-[10px] ${!isCommunityPage ? 'nav-gradient-community' : ''}`}>Community</span>
              </div>
              {isCommunityPage && (
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}