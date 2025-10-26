import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ChevronDown,
  UserMinus,
  Shield,
  UserCheck,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { useSubCommunityMembers } from "@/hooks/useSubCommunityMembers";
import { useToast } from "@/hooks/use-toast";
import type { MemberWithUser } from "@/hooks/useSubCommunityMembers";

interface BulkMemberActionsProps {
  members: MemberWithUser[];
  subCommunityId: string;
  currentUserId: string;
  onSelectionChange?: (selectedCount: number) => void;
}

type BulkAction = "promote" | "demote" | "remove";

export function BulkMemberActions({
  members,
  subCommunityId,
  currentUserId,
  onSelectionChange,
}: BulkMemberActionsProps) {
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);

  const { bulkRemoveMembers, bulkUpdateRoles } = useSubCommunityMembers({
    subCommunityId,
  });

  // Filter out current user from selectable members
  const selectableMembers = members.filter(m => m.userId !== currentUserId);

  // Update parent component when selection changes
  useEffect(() => {
    onSelectionChange?.(selectedMembers.size);
  }, [selectedMembers.size, onSelectionChange]);

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(new Set(selectableMembers.map(m => m.userId)));
    } else {
      setSelectedMembers(new Set());
    }
  };

  // Handle individual member selection
  const handleSelectMember = (userId: string, checked: boolean) => {
    const newSelection = new Set(selectedMembers);
    if (checked) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedMembers(newSelection);
  };

  // Check if all selectable members are selected
  const allSelected = selectableMembers.length > 0 && 
                      selectedMembers.size === selectableMembers.length;
  const someSelected = selectedMembers.size > 0 && 
                      selectedMembers.size < selectableMembers.length;

  // Get selected member details
  const getSelectedMemberDetails = () => {
    return members.filter(m => selectedMembers.has(m.userId));
  };

  // Determine available actions based on selected members
  const getAvailableActions = () => {
    const selectedMemberDetails = getSelectedMemberDetails();
    const hasAdmins = selectedMemberDetails.some(m => m.role === "admin");
    const hasMembers = selectedMemberDetails.some(m => m.role === "member");
    
    return {
      canPromote: hasMembers,
      canDemote: hasAdmins,
      canRemove: selectedMembers.size > 0,
    };
  };

  const { canPromote, canDemote, canRemove } = getAvailableActions();

  // Process bulk action
  const processBulkAction = async (action: BulkAction) => {
    setIsProcessing(true);
    setProgress(0);
    setProcessedCount(0);
    setFailedCount(0);
    setSuccessCount(0);

    const selectedUserIds = Array.from(selectedMembers);
    const totalCount = selectedUserIds.length;

    try {
      if (action === "remove") {
        // Process removals in batches
        for (let i = 0; i < selectedUserIds.length; i += 5) {
          const batch = selectedUserIds.slice(i, i + 5);
          try {
            await bulkRemoveMembers(batch);
            setSuccessCount(prev => prev + batch.length);
          } catch (error) {
            setFailedCount(prev => prev + batch.length);
          }
          setProcessedCount(i + batch.length);
          setProgress(((i + batch.length) / totalCount) * 100);
        }
      } else {
        // Process role updates
        const role = action === "promote" ? "admin" : "member";
        const relevantMembers = getSelectedMemberDetails().filter(m => 
          action === "promote" ? m.role === "member" : m.role === "admin"
        );
        const relevantUserIds = relevantMembers.map(m => m.userId);
        
        for (let i = 0; i < relevantUserIds.length; i += 5) {
          const batch = relevantUserIds.slice(i, i + 5);
          try {
            await bulkUpdateRoles(batch, role);
            setSuccessCount(prev => prev + batch.length);
          } catch (error) {
            setFailedCount(prev => prev + batch.length);
          }
          setProcessedCount(i + batch.length);
          setProgress(((i + batch.length) / relevantUserIds.length) * 100);
        }
      }

      // Show success toast
      if (successCount > 0) {
        toast({
          title: "Bulk action completed",
          description: `Successfully processed ${successCount} member(s)${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
        });
      } else {
        toast({
          title: "Bulk action failed",
          description: "Failed to process the selected members",
          variant: "destructive",
        });
      }

      // Reset selection after successful operation
      if (successCount > 0) {
        setSelectedMembers(new Set());
      }
    } catch (error: any) {
      toast({
        title: "Bulk action failed",
        description: error.message || "An error occurred during bulk operation",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
      setProgress(0);
    }
  };

  return (
    <>
      {/* Bulk Selection Bar */}
      <div 
        className="sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between"
        data-testid="bulk-member-actions"
      >
        <div className="flex items-center gap-4">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            disabled={selectableMembers.length === 0}
            data-testid="checkbox-select-all"
            className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
          />
          <span className="text-sm font-medium">
            {selectedMembers.size === 0 
              ? "Select members" 
              : `${selectedMembers.size} member${selectedMembers.size !== 1 ? "s" : ""} selected`
            }
          </span>
          {selectedMembers.size > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedMembers(new Set())}
              data-testid="button-clear-selection"
            >
              Clear
            </Button>
          )}
        </div>

        {selectedMembers.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {selectedMembers.size} selected
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  disabled={isProcessing}
                  data-testid="button-bulk-actions"
                >
                  Bulk Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canPromote && (
                  <DropdownMenuItem 
                    onClick={() => setConfirmAction("promote")}
                    disabled={isProcessing}
                    data-testid="menu-item-promote"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Promote to Admin
                  </DropdownMenuItem>
                )}
                {canDemote && (
                  <DropdownMenuItem 
                    onClick={() => setConfirmAction("demote")}
                    disabled={isProcessing}
                    data-testid="menu-item-demote"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Demote to Member
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setConfirmAction("remove")}
                  disabled={isProcessing}
                  className="text-destructive focus:text-destructive"
                  data-testid="menu-item-remove"
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Member Selection Checkboxes (to be rendered inline with member rows) */}
      <MemberSelectionProvider 
        selectedMembers={selectedMembers}
        onSelectMember={handleSelectMember}
        currentUserId={currentUserId}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "promote" && "Promote Selected Members?"}
              {confirmAction === "demote" && "Demote Selected Members?"}
              {confirmAction === "remove" && "Remove Selected Members?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>
                  {confirmAction === "promote" && 
                    `This will give admin privileges to ${selectedMembers.size} member(s). They will be able to manage other members and sub-community settings.`
                  }
                  {confirmAction === "demote" && 
                    `This will remove admin privileges from ${selectedMembers.size} member(s). They will become regular members.`
                  }
                  {confirmAction === "remove" && 
                    `This will remove ${selectedMembers.size} member(s) from the sub-community. They can rejoin later with a new invite.`
                  }
                </p>
                
                {/* Show affected members */}
                <div className="max-h-32 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">Affected members:</p>
                  <div className="space-y-1">
                    {getSelectedMemberDetails().slice(0, 5).map(member => {
                      const userName = `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim() || 
                                      member.user.username || 
                                      "Anonymous";
                      return (
                        <div key={member.userId} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>• {userName}</span>
                          {member.role === "admin" && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                        </div>
                      );
                    })}
                    {selectedMembers.size > 5 && (
                      <p className="text-sm text-muted-foreground">
                        ...and {selectedMembers.size - 5} more
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress indicator during processing */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processing...</span>
                      <span>{processedCount} / {selectedMembers.size}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    {successCount > 0 && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {successCount} succeeded
                      </p>
                    )}
                    {failedCount > 0 && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {failedCount} failed
                      </p>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmAction && processBulkAction(confirmAction)}
              disabled={isProcessing}
              className={confirmAction === "remove" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              data-testid={`button-confirm-${confirmAction}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {confirmAction === "promote" && "Promote Selected"}
                  {confirmAction === "demote" && "Demote Selected"}
                  {confirmAction === "remove" && "Remove Selected"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Context/component for member selection checkboxes
export function MemberSelectionProvider({
  selectedMembers,
  onSelectMember,
  currentUserId,
}: {
  selectedMembers: Set<string>;
  onSelectMember: (userId: string, checked: boolean) => void;
  currentUserId: string;
}) {
  // This component doesn't render anything directly.
  // Instead, it provides a way to render checkboxes inline with member rows.
  return null;
}

// Individual member selection checkbox component (to be used in member list/table rows)
export function MemberSelectionCheckbox({
  userId,
  selectedMembers,
  onSelectMember,
  currentUserId,
  disabled = false,
}: {
  userId: string;
  selectedMembers: Set<string>;
  onSelectMember: (userId: string, checked: boolean) => void;
  currentUserId: string;
  disabled?: boolean;
}) {
  const isCurrentUser = userId === currentUserId;
  const isSelected = selectedMembers.has(userId);

  if (isCurrentUser) {
    return null; // Don't show checkbox for current user
  }

  return (
    <Checkbox
      checked={isSelected}
      onCheckedChange={(checked) => onSelectMember(userId, checked as boolean)}
      disabled={disabled}
      data-testid={`checkbox-member-${userId}`}
      className="mr-2"
    />
  );
}