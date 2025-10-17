import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, Sparkles, DollarSign, Zap } from "lucide-react";

interface AIService {
  name: string;
  description: string;
  category: string;
  website: string;
  pricing: string;
  features: string;
}

export default function AIServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: services = [], isLoading } = useQuery<AIService[]>({
    queryKey: ["/api/ai-services"],
  });

  const categories = useMemo(() => {
    const uniqueCategories = new Set(services.map(s => s.category).filter(Boolean));
    return ["all", ...Array.from(uniqueCategories)];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.features.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Image Generation": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Text Generation": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Video": "bg-pink-500/20 text-pink-400 border-pink-500/30",
      "Audio": "bg-green-500/20 text-green-400 border-green-500/30",
      "Code": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "Research": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      "Design": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    };
    return colors[category] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-7xl pb-24 lg:pb-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <Sparkles className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                AI Services Directory
              </h1>
              <p className="text-gray-400">Discover and explore powerful AI tools and services</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search AI services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900/50 border-gray-800 text-gray-200 placeholder:text-gray-500"
              data-testid="input-search-services"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`cursor-pointer transition-all text-xs px-3 py-1.5 ${
                selectedCategory === category
                  ? "bg-purple-500 text-white border-purple-500"
                  : "bg-gray-900/30 text-gray-400 border-gray-700 hover:bg-gray-800/50"
              }`}
              onClick={() => setSelectedCategory(category)}
              data-testid={`filter-${category.toLowerCase()}`}
            >
              {category === "all" ? "All Categories" : category}
            </Badge>
          ))}
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-gray-900/30 border-gray-800 animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-800 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-800 rounded"></div>
                    <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <Card className="bg-gray-900/30 border-gray-800">
            <CardContent className="p-12 text-center">
              <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No services found</h3>
              <p className="text-gray-500">
                {searchQuery ? `No services match "${searchQuery}"` : "No AI services available"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => (
              <Card 
                key={index} 
                className="bg-gray-900/30 border-gray-800 hover:border-purple-500/50 transition-all group"
                data-testid={`card-service-${index}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl text-gray-100 group-hover:text-purple-400 transition-colors">
                      {service.name}
                    </CardTitle>
                    {service.category && (
                      <Badge 
                        variant="outline" 
                        className={`${getCategoryColor(service.category)} text-xs`}
                        data-testid={`badge-category-${index}`}
                      >
                        {service.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {service.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {service.features && (
                    <div className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-300">
                        {service.features}
                      </p>
                    </div>
                  )}
                  
                  {service.pricing && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-300">{service.pricing}</span>
                    </div>
                  )}

                  {service.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                      onClick={() => window.open(service.website, '_blank')}
                      data-testid={`button-visit-${index}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Website
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <CardContent className="p-6">
              <p className="text-sm text-gray-400">
                This directory is automatically synced with our curated list of AI services. 
                New services are added regularly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
