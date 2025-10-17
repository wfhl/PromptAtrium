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
  subcategory: string;
  website: string;
  pricing: string;
  features: string;
}

export default function AIServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  const { data: services = [], isLoading } = useQuery<AIService[]>({
    queryKey: ["/api/ai-services"],
  });

  // Get unique categories from Column A
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      services.map(s => s.category).filter(cat => cat && cat.trim() !== '')
    );
    return ["all", ...Array.from(uniqueCategories).sort()];
  }, [services]);

  // Get subcategories (Column F) for the selected category only
  const subcategories = useMemo(() => {
    if (selectedCategory === "all") return [];
    
    const categoryServices = services.filter(s => s.category === selectedCategory);
    const uniqueSubcategories = new Set(
      categoryServices
        .map(s => s.subcategory)
        .filter(sub => sub && sub.trim() !== '')
    );
    return ["all", ...Array.from(uniqueSubcategories).sort()];
  }, [services, selectedCategory]);

  // Reset subcategory when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory("all");
  };

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.features.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.subcategory.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
      const matchesSubcategory = selectedSubcategory === "all" || service.subcategory === selectedSubcategory;
      
      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [services, searchQuery, selectedCategory, selectedSubcategory]);

  // Group services by subcategory for organized display
  const groupedServices = useMemo(() => {
    const groups: Record<string, AIService[]> = {};
    filteredServices.forEach(service => {
      const subcategory = service.subcategory || 'Other';
      if (!groups[subcategory]) {
        groups[subcategory] = [];
      }
      groups[subcategory].push(service);
    });
    return groups;
  }, [filteredServices]);

  const getCategoryColor = (text: string) => {
    const colors: Record<string, string> = {
      "3D": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Audio": "bg-green-500/20 text-green-400 border-green-500/30",
      "Code": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "Image": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Image Gen": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Image Gen API": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      "Image / Fine-tuning": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      "Marketing AI Tools": "bg-pink-500/20 text-pink-400 border-pink-500/30",
      "Model APIs / Inference": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      "Model Hosting / API": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      "Models / Datasets / Inference": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      "Video": "bg-rose-500/20 text-rose-400 border-rose-500/30",
      "Text Generation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "Phone Calls": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      "Prompt Library / Search": "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
      "Prompt Manager": "bg-violet-500/20 text-violet-400 border-violet-500/30",
      "Upscaler / Enhancer": "bg-sky-500/20 text-sky-400 border-sky-500/30",
      "Custom Model Training": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "Generative Media API": "bg-teal-500/20 text-teal-400 border-teal-500/30",
      "Model / Image Gen": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "NVIDIA Platform Extensions": "bg-lime-500/20 text-lime-400 border-lime-500/30",
      "Video / Avatars": "bg-rose-500/20 text-rose-400 border-rose-500/30",
      "Video / Avatars / Lip-sync": "bg-rose-500/20 text-rose-400 border-rose-500/30",
      "Video / Editing": "bg-pink-500/20 text-pink-400 border-pink-500/30",
      "Video (Research/Access)": "bg-red-500/20 text-red-400 border-red-500/30",
      "Voice FX": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "Other": "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[text] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getSubcategoryColor = (subcategory: string) => {
    // Use same color mapping for consistency between filter pills and category badges
    return getCategoryColor(subcategory);
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

        {/* Two-Tier Filters */}
        <div className="space-y-3 mb-6">
          {/* First Row: Categories (Column A) */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer transition-all text-xs px-3 py-1.5 ${
                  selectedCategory === category
                    ? getCategoryColor(category)
                    : "bg-gray-900/30 text-gray-400 border-gray-700 hover:bg-gray-800/50"
                }`}
                onClick={() => handleCategoryChange(category)}
                data-testid={`filter-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category === "all" ? "All Categories" : category}
              </Badge>
            ))}
          </div>
          
          {/* Second Row: Subcategories (Column F) - Only shown when a category is selected */}
          {subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-purple-500/30">
              {subcategories.map((subcategory) => (
                <Badge
                  key={subcategory}
                  variant={selectedSubcategory === subcategory ? "default" : "outline"}
                  className={`cursor-pointer transition-all text-xs px-3 py-1.5 ${
                    selectedSubcategory === subcategory
                      ? getSubcategoryColor(subcategory)
                      : "bg-gray-900/30 text-gray-400 border-gray-700 hover:bg-gray-800/50"
                  }`}
                  onClick={() => setSelectedSubcategory(subcategory)}
                  data-testid={`filter-subcategory-${subcategory.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {subcategory === "all" ? "All Subcategories" : subcategory}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Services Grid - Organized by Subcategory */}
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
          <div className="space-y-12">
            {Object.entries(groupedServices).sort(([a], [b]) => a.localeCompare(b)).map(([subcategory, subcategoryServices]) => (
              <div key={subcategory} className="space-y-4">
                {/* Subcategory Header */}
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className={`${getSubcategoryColor(subcategory)} text-sm px-4 py-1.5`}
                  >
                    {subcategory}
                  </Badge>
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent"></div>
                </div>
                
                {/* Services Grid for this Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {subcategoryServices.map((service, index) => (
                    <Card 
                      key={`${subcategory}-${index}`}
                      className="bg-gray-900/30 border-gray-800 hover:border-purple-500/50 transition-all group"
                      data-testid={`card-service-${subcategory}-${index}`}
                    >
                      <CardHeader className="p-3">
                        <div className="flex items-start justify-between mb-1.5">
                          <CardTitle className="text-sm text-gray-100 group-hover:text-purple-400 transition-colors leading-tight">
                            {service.name}
                          </CardTitle>
                          {service.category && (
                            <Badge 
                              variant="outline" 
                              className={`${getCategoryColor(service.category)} text-[10px] flex-shrink-0 ml-2 px-1.5 py-0.5`}
                              data-testid={`badge-category-${index}`}
                            >
                              {service.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 leading-snug line-clamp-2">
                          {service.description}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-2 p-3 pt-0">
                        {service.features && (
                          <div className="flex items-start gap-1.5">
                            <Zap className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-300 line-clamp-2 leading-snug">
                              {service.features}
                            </p>
                          </div>
                        )}
                        
                        {service.pricing && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-gray-300">{service.pricing}</span>
                          </div>
                        )}

                        {service.website && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 h-7 text-xs"
                            onClick={() => window.open(service.website, '_blank')}
                            data-testid={`button-visit-${index}`}
                          >
                            <ExternalLink className="h-3 w-3 mr-1.5" />
                            Visit Website
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
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
