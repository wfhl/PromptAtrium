import { 
  Home, 
  Library, 
  Sparkles, 
  Users, 
  FolderOpen,
  Settings,
  User,
  Heart,
  GitFork
} from "lucide-react";

interface PageConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
}

export function getMobilePageConfig(path: string): PageConfig {
  const configs: Record<string, PageConfig> = {
    '/': {
      label: 'Dashboard',
      icon: <Home className="h-8 w-8" />,
      color: '#8b5cf6'
    },
    '/library': {
      label: 'Library',
      icon: <Library className="h-8 w-8" />,
      color: '#3b82f6'
    },
    '/new-prompt-generator': {
      label: 'Prompt Generator',
      icon: <Sparkles className="h-8 w-8" />,
      color: '#ec4899'
    },
    '/prompt-generator': {
      label: 'Prompt Generator',
      icon: <Sparkles className="h-8 w-8" />,
      color: '#ec4899'
    },
    '/community': {
      label: 'Community',
      icon: <Users className="h-8 w-8" />,
      color: '#10b981'
    },
    '/collections': {
      label: 'Collections',
      icon: <FolderOpen className="h-8 w-8" />,
      color: '#f59e0b'
    },
    '/profile/settings': {
      label: 'Settings',
      icon: <Settings className="h-8 w-8" />,
      color: '#6b7280'
    },
    '/liked-prompts': {
      label: 'Liked Prompts',
      icon: <Heart className="h-8 w-8" />,
      color: '#ef4444'
    },
    '/forked-prompts': {
      label: 'Forked Prompts',
      icon: <GitFork className="h-8 w-8" />,
      color: '#06b6d4'
    }
  };

  return configs[path] || {
    label: 'Page',
    icon: <Home className="h-8 w-8" />,
    color: '#8b5cf6'
  };
}