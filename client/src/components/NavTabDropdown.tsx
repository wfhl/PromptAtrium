import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Wrench, Users, ShoppingBag, ChevronRight, Sparkles, TrendingUp, Clock, Heart, FileSearch, FolderPlus, RatioIcon, BookOpen, Plus, FileUp } from 'lucide-react';

interface TabOption {
  label: string;
  tab: string;
  icon?: React.ComponentType<any>;
}

interface NavTabDropdownProps {
  page: 'library' | 'tools' | 'community' | 'marketplace';
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLElement>;
}

const PAGE_CONFIGS = {
  library: {
    path: '/library',
    icon: FileText,
    title: 'Prompts',
    tabs: [
      { label: 'My Prompts', tab: 'prompts' },
      { label: 'Bookmarks', tab: 'bookmarked' },
      { label: 'Collections', tab: 'collections' },
      { label: 'Archive', tab: 'archive' }
    ]
  },
  tools: {
    path: '/tools',
    icon: Wrench,
    title: 'Tools',
    tabs: [
      { label: 'Add Prompt', tab: 'add-prompt', icon: Plus },
      { label: 'Generate Prompt', tab: 'quick-prompter', icon: Sparkles },
      { label: 'Import Prompts', tab: 'import', icon: FileUp },
      { label: 'Metadata Extract', tab: 'metadata-analyzer', icon: FileSearch },
      { label: 'Collections', tab: 'collections', icon: FolderPlus },
      { label: 'Aspect Ratio Calc', tab: 'aspect-ratio-calculator', icon: RatioIcon },
      { label: 'Wordsmith Codex', tab: 'codex', icon: BookOpen },
      { label: 'Prompting Guides', tab: 'prompting-guides', icon: BookOpen },
    ]
  },
  community: {
    path: '/community',
    icon: Users,
    title: 'Community',
    tabs: [
      { label: 'Featured Prompts', tab: 'prompts&sub=featured', icon: Sparkles },
      { label: 'All Prompts', tab: 'prompts&sub=all' },
      { label: 'Trending Prompts', tab: 'prompts&sub=trending', icon: TrendingUp },
      { label: 'Recent Prompts', tab: 'prompts&sub=recent', icon: Clock },
      { label: 'Collections', tab: 'collections' },
      { label: 'Following', tab: 'followed', icon: Heart }
    ]
  },
  marketplace: {
    path: '/marketplace',
    icon: ShoppingBag,
    title: 'Marketplace',
    tabs: [] // Marketplace uses filters, not tabs
  }
};

export function NavTabDropdown({ page, isOpen, onClose, buttonRef }: NavTabDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ bottom: number; left: number; width: number }>({
    bottom: 0,
    left: 0,
    width: 0
  });
  const [, setLocation] = useLocation();

  const config = PAGE_CONFIGS[page];
  const Icon = config.icon;

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      setPosition({
        bottom: viewportHeight - rect.top + 8, // 8px gap above button
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      };

      // Add delay to prevent immediate close on touch devices
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isOpen, onClose, buttonRef]);

  // Don't render dropdown for pages without tabs
  if (config.tabs.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/20 lg:hidden"
            onClick={onClose}
          />
          
          {/* Dropdown */}
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed z-[70] lg:hidden"
            style={{
              bottom: `${position.bottom}px`,
              left: `${position.left}px`,
              width: `${Math.max(position.width, 180)}px`,
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur-lg rounded-lg shadow-xl border border-gray-800 overflow-hidden select-none">
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 bg-gray-800/50">
                <Icon className="h-4 w-4 text-white/80" />
                <span className="text-sm font-medium text-white">{config.title} - Quick Jump</span>
              </div>
              
              {/* Tab Options */}
              <div className="py-1 max-h-[60vh] overflow-y-auto">
                {config.tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  
                  // Generate the appropriate href based on the page type
                  let href = '';
                  if (page === 'tools') {
                    // Tools have specific routing patterns
                    switch (tab.tab) {
                      case 'add-prompt':
                        href = '/library?action=new-prompt';
                        break;
                      case 'quick-prompter':
                        href = '/tools/quick-prompter';
                        break;
                      case 'import':
                        href = '/library?action=import';
                        break;
                      case 'metadata-analyzer':
                        href = '/tools/metadata-analyzer';
                        break;
                      case 'collections':
                        href = '/collections';
                        break;
                      case 'aspect-ratio-calculator':
                        href = '/tools/aspect-ratio-calculator';
                        break;
                      case 'codex':
                        href = '/codex';
                        break;
                      case 'prompting-guides':
                        href = '/prompting-guides';
                        break;
                      default:
                        href = '/tools';
                    }
                  } else {
                    // Other pages use tab parameters
                    href = `${config.path}?tab=${tab.tab}`;
                  }
                  
                  return (
                    <div
                      key={tab.tab}
                      onClick={() => {
                        // For community page prompts sub-tabs, save to localStorage
                        if (page === 'community' && tab.tab.startsWith('prompts&sub=')) {
                          const subTab = tab.tab.split('sub=')[1];
                          localStorage.setItem('community-prompts-sub-tab', subTab);
                        }
                        // For library tabs, save to localStorage
                        if (page === 'library' && tab.tab) {
                          localStorage.setItem('library-active-tab', tab.tab);
                        }
                        
                        // Check if we're navigating within the same page (just changing tabs)
                        const currentPath = window.location.pathname;
                        const targetPath = href.split('?')[0];
                        
                        if (currentPath === targetPath) {
                          // Same page, different tab - force a refresh to trigger tab change
                          window.location.href = href;
                        } else {
                          // Different page - use client-side routing
                          setLocation(href);
                        }
                        
                        // Close dropdown immediately
                        onClose();
                      }}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        {TabIcon && <TabIcon className="h-3 w-3 text-white/60 group-hover:text-white/80" />}
                        <span className="text-sm text-white/90 group-hover:text-white">
                          {tab.label}
                        </span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-white/40 group-hover:text-white/60" />
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}