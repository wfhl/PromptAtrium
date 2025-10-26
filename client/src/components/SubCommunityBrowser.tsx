import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronRight, 
  ChevronDown, 
  Users, 
  Shield, 
  FolderTree, 
  AlertCircle,
  Folder,
  FolderOpen,
  User
} from "lucide-react";
import type { Community, UserCommunity } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface SubCommunityBrowserProps {
  onSelectCommunity?: (communityId: string) => void;
  selectedCommunityId?: string;
  showMembershipIndicators?: boolean;
  className?: string;
}

interface CommunityNode extends Community {
  children: CommunityNode[];
  userRole?: "member" | "admin" | null;
  memberCount?: number;
}

export function SubCommunityBrowser({
  onSelectCommunity,
  selectedCommunityId,
  showMembershipIndicators = true,
  className = ""
}: SubCommunityBrowserProps) {
  const { user } = useAuth();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch all communities
  const { data: communities = [], isLoading, error } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  // Fetch user memberships for both communities and sub-communities
  const { data: userMemberships = [] } = useQuery<UserCommunity[]>({
    queryKey: ["/api/user/communities"],
    enabled: !!user && showMembershipIndicators,
  });

  const { data: userSubMemberships = [] } = useQuery<UserCommunity[]>({
    queryKey: ["/api/user/sub-communities"],
    enabled: !!user && showMembershipIndicators,
  });

  // Build hierarchical tree structure
  const communityTree = useMemo(() => {
    const nodeMap = new Map<string, CommunityNode>();
    const rootNodes: CommunityNode[] = [];

    // First pass: create all nodes
    communities.forEach(comm => {
      const membership = userMemberships.find(m => m.communityId === comm.id) ||
                       userSubMemberships.find(m => m.subCommunityId === comm.id);
      
      const node: CommunityNode = {
        ...comm,
        children: [],
        userRole: membership?.role || null,
        memberCount: 0 // This would ideally come from the API
      };
      nodeMap.set(comm.id, node);
    });

    // Second pass: build hierarchy
    communities.forEach(comm => {
      const node = nodeMap.get(comm.id)!;
      if (comm.parentCommunityId) {
        const parent = nodeMap.get(comm.parentCommunityId);
        if (parent) {
          parent.children.push(node);
        } else {
          // Orphaned sub-community, add to root
          rootNodes.push(node);
        }
      } else {
        // Root community
        rootNodes.push(node);
      }
    });

    // Sort children by name
    const sortNodes = (nodes: CommunityNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach(node => sortNodes(node.children));
    };
    sortNodes(rootNodes);

    return rootNodes;
  }, [communities, userMemberships, userSubMemberships]);

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderCommunityNode = (node: CommunityNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedCommunityId === node.id;

    return (
      <div key={node.id} data-testid={`community-node-${node.id}`}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-accent rounded-lg cursor-pointer transition-colors ${
            isSelected ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
              data-testid={`toggle-expand-${node.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {!hasChildren && (
            <div className="w-5" />
          )}

          <Link 
            href={`/${node.parentCommunityId ? 'sub-community' : 'community'}/${node.id}`}
            onClick={(e) => {
              e.preventDefault();
              onSelectCommunity?.(node.id);
            }}
            className="flex items-center gap-2 flex-1"
          >
            <div className="flex items-center gap-2 flex-1">
              {/* Icon */}
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Folder className="h-4 w-4 text-muted-foreground" />
                )
              ) : (
                <Users className="h-4 w-4 text-muted-foreground" />
              )}

              {/* Community Avatar */}
              <Avatar className="h-6 w-6">
                {node.imageUrl ? (
                  <AvatarImage src={node.imageUrl} />
                ) : (
                  <AvatarFallback className={`text-xs ${
                    node.parentCommunityId 
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-600' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}>
                    {node.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Name */}
              <span 
                className="flex-1 text-sm font-medium"
                data-testid={`text-community-name-${node.id}`}
              >
                {node.name}
              </span>

              {/* Badges */}
              <div className="flex items-center gap-1">
                {showMembershipIndicators && node.userRole === "admin" && (
                  <Badge variant="secondary" className="text-xs h-5">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
                {showMembershipIndicators && node.userRole === "member" && (
                  <Badge variant="outline" className="text-xs h-5">
                    <User className="h-3 w-3 mr-1" />
                    Member
                  </Badge>
                )}
                {node.memberCount !== undefined && node.memberCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {node.memberCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <CollapsibleContent>
            {node.children.map(child => renderCommunityNode(child, depth + 1))}
          </CollapsibleContent>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Community Browser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Community Browser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load communities. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="sub-community-browser">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderTree className="h-5 w-5" />
          Community Browser
          {communityTree.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({communities.length} total)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {communityTree.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderTree className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm">No communities available</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {communityTree.map(node => renderCommunityNode(node))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}