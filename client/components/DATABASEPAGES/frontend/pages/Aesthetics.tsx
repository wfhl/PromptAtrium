import React, { useState, useEffect } from "react";
import DataPage, { DataPageConfig } from "../components/DataPage";
import { Badge } from "../components/ui/Badge";
import { FavoriteButton } from "../components/ui/FavoriteButton";
import { Button } from "../components/ui/Button";
import { Share2, Paintbrush } from "lucide-react";

// Type definitions
interface Aesthetic {
  id: number;
  name: string;
  description: string;
  era?: string | null;
  categories?: string[] | null;
  tags?: string[] | null;
  visualElements?: string[] | null;
  colorPalette?: string[] | null;
  moodKeywords?: string[] | null;
  inspirationSources?: string[] | null;
  relatedAesthetics?: string[] | null;
  mediaExamples?: any;
  imageUrls?: string[] | null;
  popularity?: number;
  isVerified?: boolean;
  submittedBy?: string;
  userVotes?: number;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function Aesthetics() {
  const config: DataPageConfig<Aesthetic> = {
    title: "Aesthetics Database",
    apiEndpoint: "/api/system-data/aesthetics",
    favoriteItemType: "aesthetics",
    defaultViewMode: "minicard",
    enabledViewModes: ["spreadsheet", "minicard", "largecards", "listview"],

    // Spreadsheet configuration
    spreadsheetConfig: {
      title: "Aesthetics Database",
      apiEndpoint: "/api/system-data/aesthetics",
      headers: [
        "name",
        "description",
        "era",
        "categories",
        "tags",
        "visualElements",
        "colorPalette",
        "moodKeywords",
      ],
      defaultItem: {
        name: "",
        description: "",
        era: "",
        categories: [],
        tags: [],
        visualElements: [],
        colorPalette: [],
        moodKeywords: [],
        inspirationSources: [],
        relatedAesthetics: [],
        popularity: 0,
        isVerified: false,
        submittedBy: "",
        userVotes: 0,
        featured: false,
      },
      favoriteItemType: "aesthetics",
      renderCell: (item, field, isEditMode, onChange) => {
        if (!isEditMode) {
          const value = item[field as keyof Aesthetic];
          if (Array.isArray(value)) {
            return <div className="p-0.5">{value.join(", ")}</div>;
          }
          return <div className="p-0.5">{value?.toString() || ""}</div>;
        }

        return (
          <input
            type="text"
            value={item[field as keyof Aesthetic]?.toString() || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-background border-none p-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        );
      },
      validateItem: (item) => {
        if (!item.name) {
          return "Name is required";
        }
        return null;
      },
    },

    // MiniCard configuration
    miniCardConfig: {
      title: "Aesthetics Database",
      apiEndpoint: "/api/system-data/aesthetics",
      favoriteItemType: "aesthetics",
      searchFields: ["name", "description"],
      categoryField: "categories",
      alphabetField: "name",
      renderCard: (aesthetic) => ({
        id: aesthetic.id,
        title: aesthetic.name || "Untitled Aesthetic",
        description: aesthetic.description || "No description available",
        categories: aesthetic.categories || null,
        tags: aesthetic.tags || null,
        era: aesthetic.era || null,
        colorClass: "bg-gray-900/50",
        expandedContent: () => (
          <div className="space-y-4">
            {/* Categories */}
            {aesthetic.categories && aesthetic.categories.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">
                  Categories
                </h4>
                <div className="flex flex-wrap gap-1">
                  {aesthetic.categories.map((category, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Description</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                {aesthetic.description || "No description available"}
              </p>
            </div>

            {/* Tags */}
            {aesthetic.tags && aesthetic.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {aesthetic.tags.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-gray-800/50 text-gray-400 border border-gray-600"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Era information */}
            {aesthetic.era && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Era</h4>
                <Badge
                  variant="secondary"
                  className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30"
                >
                  {aesthetic.era}
                </Badge>
              </div>
            )}

            {/* Visual elements */}
            {aesthetic.visualElements &&
              aesthetic.visualElements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">
                    Visual Elements
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {aesthetic.visualElements.map((element, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs bg-green-500/20 text-green-300 border border-green-500/30"
                      >
                        {element}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Color palette */}
            {aesthetic.colorPalette && aesthetic.colorPalette.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">
                  Color Palette
                </h4>
                <div className="flex flex-wrap gap-1">
                  {aesthetic.colorPalette.map((color, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                    >
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Mood keywords */}
            {aesthetic.moodKeywords && aesthetic.moodKeywords.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Mood</h4>
                <div className="flex flex-wrap gap-1">
                  {aesthetic.moodKeywords.map((mood, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-pink-500/20 text-pink-300 border border-pink-500/30"
                    >
                      {mood}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        ),
      }),
    },

    // LargeCard configuration
    largeCardConfig: {
      title: "Aesthetics Database",
      apiEndpoint: "/api/system-data/aesthetics",
      favoriteItemType: "aesthetics",
      searchFields: [
        "name",
        "description",
        "era",
        "categories",
        "tags",
        "visualElements",
        "colorPalette",
        "moodKeywords",
      ],
      categoryField: "era",
      alphabetField: "name",
      renderLargeCard: (aesthetic) => ({
        id: aesthetic.id,
        title: aesthetic.name || "Untitled Aesthetic",
        description: aesthetic.description || "No description available",
        categories: aesthetic.categories || null,
        tags: aesthetic.tags || null,
        era: aesthetic.era || null,
        colorClass: "bg-gray-900/50",
        icon: <Paintbrush className="h-5 w-5" />,
        metadata: {
          Era: aesthetic.era || "Unspecified",
          Popularity: aesthetic.popularity
            ? `${aesthetic.popularity}/10`
            : "Not rated",
          Verified: aesthetic.isVerified ? "Yes" : "No",
          "Submitted By": aesthetic.submittedBy || "Anonymous",
        },
        actions: (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        ),
        content: (
          <div className="space-y-3">
            {aesthetic.visualElements &&
              aesthetic.visualElements.length > 0 && (
                <div>
                  <span className="text-xs text-gray-400">
                    Visual Elements:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aesthetic.visualElements.slice(0, 3).map((element, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs bg-green-500/20 text-green-300"
                      >
                        {element}
                      </Badge>
                    ))}
                    {aesthetic.visualElements.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{aesthetic.visualElements.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            {aesthetic.colorPalette && aesthetic.colorPalette.length > 0 && (
              <div>
                <span className="text-xs text-gray-400">Colors:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {aesthetic.colorPalette.slice(0, 4).map((color, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-yellow-500/20 text-yellow-300"
                    >
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ),
      }),
    },

    // ListView configuration
    listViewConfig: {
      title: "Aesthetics Database",
      apiEndpoint: "/api/system-data/aesthetics",
      favoriteItemType: "aesthetics",
      searchFields: [
        "name",
        "description",
        "era",
        "categories",
        "tags",
        "visualElements",
        "colorPalette",
        "moodKeywords",
      ],
      categoryField: "era",
      alphabetField: "name",
      renderListItem: (aesthetic) => ({
        id: aesthetic.id,
        title: aesthetic.name || "Untitled Aesthetic",
        description: aesthetic.description || "No description available",
        categories: aesthetic.categories || null,
        tags: aesthetic.tags || null,
        era: aesthetic.era || aesthetic.featured ? "Featured" : null,
        metadata: {
          Era: aesthetic.era || "Unspecified",
          "Visual Elements": aesthetic.visualElements
            ? aesthetic.visualElements.join(", ")
            : "None specified",
          "Color Palette": aesthetic.colorPalette
            ? aesthetic.colorPalette.join(", ")
            : "Not defined",
          Mood: aesthetic.moodKeywords
            ? aesthetic.moodKeywords.join(", ")
            : "Not specified",
          Popularity: aesthetic.popularity
            ? `${aesthetic.popularity}/10`
            : "Not rated",
          "Submitted By": aesthetic.submittedBy || "Anonymous",
        },
        actions: (
          <div className="flex gap-2">
            <FavoriteButton
              itemId={aesthetic.id}
              itemType="aesthetics"
              size="sm"
            />
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        ),
      }),
    },
  };

  return (
    <div className="min-h-screen p-4">
      <DataPage config={config} />
    </div>
  );
}