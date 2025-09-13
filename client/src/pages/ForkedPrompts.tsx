import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { PromptCard } from "@/components/PromptCard";
import { GitBranch, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Prompt } from "@shared/schema";

export default function ForkedPrompts() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch forked prompts
  const { data: forkedPrompts = [], isLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts/forked"],
  });

  // Filter prompts based on search query
  const filteredPrompts = forkedPrompts.filter(prompt => {
    const query = searchQuery.toLowerCase();
    return (
      prompt.name.toLowerCase().includes(query) ||
      prompt.description?.toLowerCase().includes(query) ||
      prompt.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="container mx-auto px-2 py-2 sm:px-3 sm:py-3 md:px-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <GitBranch className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              Forked Prompts
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              All the prompts you've forked and customized
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search forked prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border rounded-md"
              data-testid="input-search-forked"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading your forked prompts...</p>
        </div>
      ) : filteredPrompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              showActions={true}
              allowInlineEdit={true}
            />
          ))}
        </div>
      ) : searchQuery ? (
        <Card>
          <CardContent className="p-8 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No forked prompts match your search.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              You haven't forked any prompts yet.
            </p>
            <Link href="/community">
              <Button data-testid="button-explore-community">
                Explore Community Prompts
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}