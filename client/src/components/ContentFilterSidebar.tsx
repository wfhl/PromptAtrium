import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  ChevronDown,
  Calendar as CalendarIcon,
  X,
  Filter,
  RotateCcw,
  Lock,
  Users,
  Globe,
  Search,
  Check,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface FilterState {
  visibility: string[];
  dateRange: { start: Date | null; end: Date | null };
  authors: string[];
  tags: string[];
}

interface ContentFilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearAll: () => void;
  subCommunityId: string;
  isAdmin?: boolean;
}

export function ContentFilterSidebar({
  filters,
  onFiltersChange,
  onClearAll,
  subCommunityId,
  isAdmin = false,
}: ContentFilterSidebarProps) {
  const [searchAuthor, setSearchAuthor] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const [openSections, setOpenSections] = useState({
    visibility: true,
    date: false,
    authors: false,
    tags: false,
  });

  // Fetch available authors in the sub-community
  const { data: authorsData = [] } = useQuery<User[]>({
    queryKey: [`/api/sub-communities/${subCommunityId}/content-authors`],
    enabled: !!subCommunityId,
  });

  // Fetch available tags
  const { data: tagsData = [] } = useQuery<string[]>({
    queryKey: [`/api/sub-communities/${subCommunityId}/content-tags`],
    enabled: !!subCommunityId,
  });

  // Filter authors based on search
  const filteredAuthors = authorsData.filter((author) => {
    const name = `${author.firstName || ""} ${author.lastName || ""} ${
      author.username || ""
    }`.toLowerCase();
    return name.includes(searchAuthor.toLowerCase());
  });

  // Filter tags based on search
  const filteredTags = tagsData.filter((tag) =>
    tag.toLowerCase().includes(searchTag.toLowerCase())
  );

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleVisibilityChange = (value: string, checked: boolean) => {
    const newVisibility = checked
      ? [...filters.visibility, value]
      : filters.visibility.filter((v) => v !== value);
    onFiltersChange({ ...filters, visibility: newVisibility });
  };

  const handleAuthorChange = (authorId: string, checked: boolean) => {
    const newAuthors = checked
      ? [...filters.authors, authorId]
      : filters.authors.filter((a) => a !== authorId);
    onFiltersChange({ ...filters, authors: newAuthors });
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    const newTags = checked
      ? [...filters.tags, tag]
      : filters.tags.filter((t) => t !== tag);
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleDateRangeChange = (type: "start" | "end", date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [type]: date || null,
      },
    });
  };

  const clearDateRange = () => {
    onFiltersChange({
      ...filters,
      dateRange: { start: null, end: null },
    });
  };

  const activeFilterCount =
    filters.visibility.length +
    filters.authors.length +
    filters.tags.length +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0);

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              data-testid="button-clear-all-filters"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visibility Filter */}
        <Collapsible
          open={openSections.visibility}
          onOpenChange={() => toggleSection("visibility")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent rounded-md p-2 -ml-2">
            <Label className="text-sm font-medium cursor-pointer">
              Visibility
              {filters.visibility.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.visibility.length}
                </Badge>
              )}
            </Label>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                openSections.visibility && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visibility-public"
                  checked={filters.visibility.includes("public")}
                  onCheckedChange={(checked) =>
                    handleVisibilityChange("public", !!checked)
                  }
                  data-testid="checkbox-visibility-public"
                />
                <Label
                  htmlFor="visibility-public"
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <Globe className="h-3 w-3" />
                  Public
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visibility-parent"
                  checked={filters.visibility.includes("parent_community")}
                  onCheckedChange={(checked) =>
                    handleVisibilityChange("parent_community", !!checked)
                  }
                  data-testid="checkbox-visibility-parent"
                />
                <Label
                  htmlFor="visibility-parent"
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <Users className="h-3 w-3" />
                  Parent Community
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visibility-private"
                  checked={filters.visibility.includes("private")}
                  onCheckedChange={(checked) =>
                    handleVisibilityChange("private", !!checked)
                  }
                  data-testid="checkbox-visibility-private"
                />
                <Label
                  htmlFor="visibility-private"
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <Lock className="h-3 w-3" />
                  Members Only
                </Label>
              </div>
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visibility-admin"
                    checked={filters.visibility.includes("admin")}
                    onCheckedChange={(checked) =>
                      handleVisibilityChange("admin", !!checked)
                    }
                    data-testid="checkbox-visibility-admin"
                  />
                  <Label
                    htmlFor="visibility-admin"
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <Lock className="h-3 w-3 text-orange-500" />
                    Admins Only
                  </Label>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Date Range Filter */}
        <Collapsible
          open={openSections.date}
          onOpenChange={() => toggleSection("date")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent rounded-md p-2 -ml-2">
            <Label className="text-sm font-medium cursor-pointer">
              Date Range
              {(filters.dateRange.start || filters.dateRange.end) && (
                <Badge variant="secondary" className="ml-2">
                  1
                </Badge>
              )}
            </Label>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                openSections.date && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-date-start"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.start
                        ? format(filters.dateRange.start, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.start || undefined}
                      onSelect={(date) => handleDateRangeChange("start", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-date-end"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.end
                        ? format(filters.dateRange.end, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.end || undefined}
                      onSelect={(date) => handleDateRangeChange("end", date)}
                      initialFocus
                      disabled={(date) =>
                        filters.dateRange.start
                          ? date < filters.dateRange.start
                          : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {(filters.dateRange.start || filters.dateRange.end) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={clearDateRange}
                  data-testid="button-clear-date"
                >
                  Clear Date Range
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Author Filter */}
        <Collapsible
          open={openSections.authors}
          onOpenChange={() => toggleSection("authors")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent rounded-md p-2 -ml-2">
            <Label className="text-sm font-medium cursor-pointer">
              Authors
              {filters.authors.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.authors.length}
                </Badge>
              )}
            </Label>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                openSections.authors && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search authors..."
                value={searchAuthor}
                onChange={(e) => setSearchAuthor(e.target.value)}
                className="pl-8"
                data-testid="input-search-authors"
              />
            </div>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {filteredAuthors.length > 0 ? (
                  filteredAuthors.map((author) => {
                    const authorName = author.username || 
                      `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
                      "Unknown";
                    return (
                      <div key={author.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`author-${author.id}`}
                          checked={filters.authors.includes(author.id)}
                          onCheckedChange={(checked) =>
                            handleAuthorChange(author.id, !!checked)
                          }
                          data-testid={`checkbox-author-${author.id}`}
                        />
                        <Label
                          htmlFor={`author-${author.id}`}
                          className="text-sm font-normal cursor-pointer truncate"
                        >
                          {authorName}
                        </Label>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No authors found
                  </p>
                )}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Tags Filter */}
        <Collapsible
          open={openSections.tags}
          onOpenChange={() => toggleSection("tags")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent rounded-md p-2 -ml-2">
            <Label className="text-sm font-medium cursor-pointer">
              Tags
              {filters.tags.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.tags.length}
                </Badge>
              )}
            </Label>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                openSections.tags && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="pl-8"
                data-testid="input-search-tags"
              />
            </div>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={filters.tags.includes(tag)}
                        onCheckedChange={(checked) =>
                          handleTagChange(tag, !!checked)
                        }
                        data-testid={`checkbox-tag-${tag}`}
                      />
                      <Label
                        htmlFor={`tag-${tag}`}
                        className="text-sm font-normal cursor-pointer flex items-center gap-1"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tags found
                  </p>
                )}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {/* Apply Button (optional - filters apply immediately) */}
        {activeFilterCount > 0 && (
          <>
            <Separator />
            <Button
              variant="outline"
              className="w-full"
              onClick={onClearAll}
              data-testid="button-clear-filters-bottom"
            >
              Clear All Filters
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}