import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Flag,
  AlertTriangle,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Ban,
  Trash2,
  Shield,
  FileText,
  Image,
  Link,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterAvatar?: string;
  reportedUserId?: string;
  reportedUserName?: string;
  reportedUserAvatar?: string;
  contentId: string;
  contentType: "prompt" | "comment" | "user" | "image";
  contentSnippet: string;
  reason: string;
  category: "spam" | "harassment" | "inappropriate" | "copyright" | "other";
  description: string;
  evidence?: string[];
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolution?: {
    action: string;
    note: string;
    moderator: string;
    timestamp: Date;
  };
}

interface ReportStats {
  total: number;
  pending: number;
  reviewing: number;
  resolved: number;
  avgResolutionTime: string;
  topReasons: Array<{ reason: string; count: number }>;
}

export default function ReportsQueue() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [resolution, setResolution] = useState({
    action: "",
    note: "",
  });

  // Fetch reports
  const { data: reports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports", statusFilter, categoryFilter, priorityFilter],
  });

  // Fetch stats
  const { data: stats } = useQuery<ReportStats>({
    queryKey: ["/api/admin/reports/stats"],
  });

  // Process report mutation
  const processReport = useMutation({
    mutationFn: async (params: { 
      reportId: string; 
      action: string; 
      note: string 
    }) => {
      return await apiRequest("POST", `/api/admin/reports/${params.reportId}/process`, {
        action: params.action,
        note: params.note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports/stats"] });
      setReviewModalOpen(false);
      setSelectedReport(null);
      toast({
        title: "Success",
        description: "Report processed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process report",
        variant: "destructive",
      });
    },
  });

  // Assign report mutation
  const assignReport = useMutation({
    mutationFn: async (params: { reportId: string; assignTo: string }) => {
      return await apiRequest("POST", `/api/admin/reports/${params.reportId}/assign`, {
        assignTo: params.assignTo,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: "Success",
        description: "Report assigned successfully",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "spam":
        return <MessageSquare className="h-4 w-4" />;
      case "harassment":
        return <AlertTriangle className="h-4 w-4" />;
      case "inappropriate":
        return <Flag className="h-4 w-4" />;
      case "copyright":
        return <FileText className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "prompt":
        return <FileText className="h-4 w-4" />;
      case "comment":
        return <MessageSquare className="h-4 w-4" />;
      case "user":
        return <User className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      default:
        return <Link className="h-4 w-4" />;
    }
  };

  const filteredReports = reports?.filter(report => {
    const searchMatch = searchTerm === "" ||
      report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviewing</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reviewing}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResolutionTime}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Reports Queue</CardTitle>
              <CardDescription>
                Review and process user reports and complaints
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] })}
              data-testid="button-refresh-reports"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-reports"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-category">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="inappropriate">Inappropriate</SelectItem>
                <SelectItem value="copyright">Copyright</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[120px]" data-testid="select-priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredReports?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports?.map((report) => (
                    <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${getPriorityColor(report.priority)} text-white`}
                        >
                          {report.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={report.reporterAvatar} />
                            <AvatarFallback>{report.reporterName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{report.reporterName}</div>
                            <div className="text-xs text-muted-foreground">ID: {report.reporterId.slice(0, 8)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.reportedUserName ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={report.reportedUserAvatar} />
                              <AvatarFallback>{report.reportedUserName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{report.reportedUserName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getCategoryIcon(report.category)}
                          <span className="capitalize">{report.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getContentTypeIcon(report.contentType)}
                          <div>
                            <div className="text-sm capitalize">{report.contentType}</div>
                            <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {report.contentSnippet}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            report.status === "resolved" ? "default" :
                            report.status === "reviewing" ? "secondary" :
                            report.status === "dismissed" ? "outline" :
                            "destructive"
                          }
                        >
                          {report.status}
                        </Badge>
                        {report.assignedTo && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Assigned to: {report.assignedTo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(report.createdAt), "MMM d")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(report.createdAt), "HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setReviewModalOpen(true);
                          }}
                          data-testid={`button-review-${report.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              Review the report details and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              {/* Report Details */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Reporter</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedReport.reporterAvatar} />
                        <AvatarFallback>{selectedReport.reporterName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{selectedReport.reporterName}</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedReport.reporterId}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedReport.reportedUserName && (
                    <div>
                      <Label className="text-muted-foreground">Reported User</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedReport.reportedUserAvatar} />
                          <AvatarFallback>{selectedReport.reportedUserName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{selectedReport.reportedUserName}</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedReport.reportedUserId}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {getCategoryIcon(selectedReport.category)}
                      <span className="capitalize">{selectedReport.category}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Priority</Label>
                    <Badge
                      variant="secondary"
                      className={`${getPriorityColor(selectedReport.priority)} text-white mt-1`}
                    >
                      {selectedReport.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant="secondary" className="mt-1">
                      {selectedReport.status}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-muted-foreground">Reason</Label>
                  <p className="mt-1 font-medium">{selectedReport.reason}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1 text-sm">{selectedReport.description}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Content</Label>
                  <div className="mt-1 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getContentTypeIcon(selectedReport.contentType)}
                      <span className="text-sm font-medium capitalize">
                        {selectedReport.contentType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ID: {selectedReport.contentId}
                      </span>
                    </div>
                    <p className="text-sm">{selectedReport.contentSnippet}</p>
                  </div>
                </div>

                {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Evidence</Label>
                    <div className="mt-1 space-y-2">
                      {selectedReport.evidence.map((item, index) => (
                        <div key={index} className="p-2 bg-muted rounded text-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReport.resolution && (
                  <div>
                    <Label className="text-muted-foreground">Previous Resolution</Label>
                    <div className="mt-1 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium">Action:</span> {selectedReport.resolution.action}
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-medium">Note:</span> {selectedReport.resolution.note}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        By {selectedReport.resolution.moderator} on{" "}
                        {format(new Date(selectedReport.resolution.timestamp), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Action Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="action">Action</Label>
                  <Select
                    value={resolution.action}
                    onValueChange={(value) => setResolution({ ...resolution, action: value })}
                  >
                    <SelectTrigger id="action" data-testid="select-action">
                      <SelectValue placeholder="Select action..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warn">Warn User</SelectItem>
                      <SelectItem value="delete">Delete Content</SelectItem>
                      <SelectItem value="suspend">Suspend User</SelectItem>
                      <SelectItem value="ban">Ban User</SelectItem>
                      <SelectItem value="dismiss">Dismiss Report</SelectItem>
                      <SelectItem value="escalate">Escalate to Higher Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="note">Resolution Note</Label>
                  <Textarea
                    id="note"
                    value={resolution.note}
                    onChange={(e) => setResolution({ ...resolution, note: e.target.value })}
                    placeholder="Provide details about your decision..."
                    rows={3}
                    data-testid="textarea-resolution-note"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedReport && resolution.action) {
                  processReport.mutate({
                    reportId: selectedReport.id,
                    action: resolution.action,
                    note: resolution.note,
                  });
                }
              }}
              disabled={!resolution.action || processReport.isPending}
              data-testid="button-process-report"
            >
              {processReport.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Process Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}