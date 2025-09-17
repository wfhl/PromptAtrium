import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code2, 
  Shield, 
  Database, 
  Server, 
  Activity, 
  Users, 
  BarChart3, 
  Settings,
  FileText,
  AlertTriangle,
  CheckCircle,
  Cpu,
  HardDrive,
  Globe
} from "lucide-react";
import type { User } from "@shared/schema";

interface SystemStats {
  totalUsers: number;
  totalPrompts: number;
  totalCommunities: number;
  totalCollections: number;
  recentActivities: number;
}

interface DebugInfo {
  version: string;
  environment: string;
  database: string;
  uptime: string;
  memory: string;
}

export default function DevPage() {
  const { user, isLoading: authLoading } = useAuth();
  const typedUser = user as User;

  // Check if user is developer
  if (!authLoading && (!user || typedUser.role !== "developer")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access this page. Developer access required.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Fetch system stats (mock data for now)
  const { data: systemStats } = useQuery<SystemStats>({
    queryKey: ["/api/dev/stats"],
    queryFn: async () => {
      // Mock data - replace with real API call later
      return {
        totalUsers: 245,
        totalPrompts: 1847,
        totalCommunities: 12,
        totalCollections: 89,
        recentActivities: 156
      };
    },
    enabled: !!user && typedUser.role === "developer"
  });

  // Mock debug info
  const debugInfo: DebugInfo = {
    version: "1.0.0",
    environment: "development",
    database: "PostgreSQL 15.0",
    uptime: "2d 14h 32m",
    memory: "512MB / 2GB"
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
          <Code2 className="h-8 w-8 text-cyan-400" />
          Developer Tools
        </h1>
        <p className="text-muted-foreground mt-2">
          System monitoring, debugging, and developer utilities
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">System</TabsTrigger>
          <TabsTrigger value="database" data-testid="tab-database">Database</TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* System Status */}
            <Card data-testid="card-system-status">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">Online</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>

            {/* Total Users */}
            <Card data-testid="card-total-users">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>

            {/* Total Prompts */}
            <Card data-testid="card-total-prompts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
                <FileText className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.totalPrompts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Created prompts
                </p>
              </CardContent>
            </Card>

            {/* Communities */}
            <Card data-testid="card-communities">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Communities</CardTitle>
                <Globe className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.totalCommunities || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active communities
                </p>
              </CardContent>
            </Card>

            {/* Collections */}
            <Card data-testid="card-collections">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collections</CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.totalCollections || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total collections
                </p>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card data-testid="card-recent-activity">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.recentActivities || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Information */}
            <Card data-testid="card-system-info">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Version:</span>
                  <Badge variant="secondary">{debugInfo.version}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Environment:</span>
                  <Badge variant="outline">{debugInfo.environment}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Database:</span>
                  <span className="text-sm text-muted-foreground">{debugInfo.database}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Uptime:</span>
                  <span className="text-sm text-muted-foreground">{debugInfo.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Memory:</span>
                  <span className="text-sm text-muted-foreground">{debugInfo.memory}</span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card data-testid="card-performance">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>23%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>45%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disk Usage</span>
                    <span>67%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          <Card data-testid="card-database-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Status
              </CardTitle>
              <CardDescription>
                Database connection and performance information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connection Status:</span>
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Size:</span>
                  <span className="text-sm text-muted-foreground">127.4 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Connections:</span>
                  <span className="text-sm text-muted-foreground">8/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Query Performance:</span>
                  <Badge variant="secondary">Good</Badge>
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    data-testid="button-run-diagnostics"
                    onClick={() => console.log("Running database diagnostics...")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Run Diagnostics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card data-testid="card-logs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Logs
              </CardTitle>
              <CardDescription>
                System and application logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <span className="text-green-600">[INFO]</span> 2025-09-17 01:34:15 - User authentication successful
                </div>
                <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <span className="text-blue-600">[DEBUG]</span> 2025-09-17 01:34:10 - Database query executed: SELECT * FROM prompts
                </div>
                <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <span className="text-green-600">[INFO]</span> 2025-09-17 01:34:05 - New prompt created: ID e2b5868d58
                </div>
                <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <span className="text-yellow-600">[WARN]</span> 2025-09-17 01:33:58 - Rate limit approached for user 40785157
                </div>
                <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <span className="text-green-600">[INFO]</span> 2025-09-17 01:33:45 - Server started successfully
                </div>
              </div>
              
              <div className="pt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid="button-refresh-logs"
                  onClick={() => console.log("Refreshing logs...")}
                >
                  Refresh
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid="button-download-logs"
                  onClick={() => console.log("Downloading logs...")}
                >
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}