import React, { useState, useEffect } from "react";
import DataPage, { DataPageConfig } from "../components/DataPage";
import { Checkbox } from "../components/ui/Checkbox";
import { Badge } from "../components/ui/Badge";
import { FavoriteButton } from "../components/ui/FavoriteButton";
import { Button } from "../components/ui/Button";
import { Share2, Users } from "lucide-react";

// Define the CollaborationHub interface based on the database schema
interface CollaborationHub {
  id: number;
  name: string;
  "@"?: string | null;
  type: string | null;
  owner: string | null;
  status: string | null;
  requirements: string | null;
  quality_requirements: string | null;
  notes: string | null;
  within_elite: string | null;
  elite?: string | null;
  created_at?: string;
  updated_at?: string;
}

export default function CollaborationHubs() {
  const config: DataPageConfig<CollaborationHub> = {
    title: "Collaboration Hubs",
    apiEndpoint: "/api/system-data/collaboration-hubs",
    favoriteItemType: "collaboration_hubs",
    defaultViewMode: "spreadsheet",
    enabledViewModes: ["spreadsheet", "minicard", "largecards", "listview"],

    // Spreadsheet configuration
    spreadsheetConfig: {
      title: "Collaboration Hubs",
      apiEndpoint: "/api/system-data/collaboration-hubs",
      headers: ["name", "@", "type", "owner", "status", "requirements", "quality_requirements", "notes", "elite"],
      defaultItem: {
        name: "",
        "@": "",
        type: "",
        owner: "",
        status: "",
        requirements: "",
        quality_requirements: "",
        notes: "",
        within_elite: "No",
        elite: ""
      },
      favoriteItemType: "collaboration_hubs",
      renderCell: (item, field, isEditMode, onChange) => {
        if (field === "elite") {
          return (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={item.within_elite === "Yes"}
                onCheckedChange={(checked) => onChange(checked ? "Yes" : "No")}
                disabled={!isEditMode}
                className="h-4 w-4"
              />
            </div>
          );
        }

        if (!isEditMode) {
          return (
            <div className="p-0.5">
              {item[field as keyof CollaborationHub]?.toString() || ""}
            </div>
          );
        }

        return (
          <input
            type="text"
            value={item[field as keyof CollaborationHub]?.toString() || ""}
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
      }
    },

    // MiniCard configuration
    miniCardConfig: {
      title: "Collaboration Hubs",
      apiEndpoint: "/api/system-data/collaboration-hubs",
      favoriteItemType: "collaboration_hubs",
      searchFields: ["name", "@", "type", "owner", "status", "notes"],
      categoryField: "type",
      alphabetField: "name",
      renderCard: (hub) => ({
        id: hub.id,
        title: hub.name || "Untitled Hub",
        description: hub.notes || "No description available",
        categories: hub.type ? [hub.type] : null,
        tags: null,
        era: hub.status || null,
        colorClass: hub.within_elite === "Yes" ? "bg-purple-500/20" : "bg-blue-500/20",
        expandedContent: () => (
          <div className="space-y-4">
            {/* Hub details */}
            <div className="space-y-3">
              {hub["@"] && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-300">Contact</h4>
                  <p className="text-gray-400 text-sm">@{hub["@"]}</p>
                </div>
              )}

              {hub.owner && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-300">Owner</h4>
                  <p className="text-gray-400 text-sm">{hub.owner}</p>
                </div>
              )}

              {hub.type && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-300">Type</h4>
                  <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {hub.type}
                  </Badge>
                </div>
              )}

              {hub.status && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-300">Status</h4>
                  <Badge variant="outline" className="text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                    {hub.status}
                  </Badge>
                </div>
              )}

              {hub.requirements && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-300">Requirements</h4>
                  <p className="text-gray-400 text-sm">{hub.requirements}</p>
                </div>
              )}

              {hub.quality_requirements && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-300">Quality Requirements</h4>
                  <p className="text-gray-400 text-sm">{hub.quality_requirements}</p>
                </div>
              )}

              {hub.within_elite === "Yes" && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-300">Elite Status</h4>
                  <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <Users className="h-3 w-3 mr-1" />
                    Elite Member
                  </Badge>
                </div>
              )}
            </div>

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
        )
      })
    },

    // LargeCard configuration
    largeCardConfig: {
      title: "Collaboration Hubs",
      apiEndpoint: "/api/system-data/collaboration-hubs",
      favoriteItemType: "collaboration_hubs",
      searchFields: ["name", "@", "type", "owner", "status", "notes"],
      categoryField: "type",
      alphabetField: "name",
      renderLargeCard: (hub) => ({
        id: hub.id,
        title: hub.name || "Untitled Hub",
        description: hub.notes || "No description available",
        categories: hub.type ? [hub.type] : null,
        tags: [hub.owner, hub.status].filter(Boolean),
        era: hub.within_elite === "Yes" ? "Elite Member" : null,
        colorClass: hub.within_elite === "Yes" ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20" : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
        icon: <Users className="h-5 w-5" />,
        metadata: {
          "Contact": hub["@"] ? `@${hub["@"]}` : "Not provided",
          "Owner": hub.owner || "Unknown",
          "Status": hub.status || "Unknown"
        },
        actions: (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        ),
        content: (
          <div className="space-y-2">
            {hub.requirements && (
              <div>
                <span className="text-xs text-gray-400">Requirements:</span>
                <p className="text-xs text-gray-300">{hub.requirements}</p>
              </div>
            )}
            {hub.quality_requirements && (
              <div>
                <span className="text-xs text-gray-400">Quality Requirements:</span>
                <p className="text-xs text-gray-300">{hub.quality_requirements}</p>
              </div>
            )}
          </div>
        )
      })
    },

    // ListView configuration
    listViewConfig: {
      title: "Collaboration Hubs",
      apiEndpoint: "/api/system-data/collaboration-hubs",
      favoriteItemType: "collaboration_hubs",
      searchFields: ["name", "@", "type", "owner", "status", "notes"],
      categoryField: "type",
      alphabetField: "name",
      renderListItem: (hub) => ({
        id: hub.id,
        title: hub.name || "Untitled Hub",
        description: hub.notes || "No description available",
        categories: hub.type ? [hub.type] : null,
        tags: [hub.type, hub.status].filter(Boolean),
        era: hub.within_elite === "Yes" ? "Elite" : null,
        metadata: {
          "Type": hub.type || "Unknown",
          "Status": hub.status || "Unknown", 
          "Contact": hub["@"] ? `@${hub["@"]}` : "Not provided",
          "Owner": hub.owner || "Unknown",
          "Requirements": hub.requirements || "None specified",
          "Quality": hub.quality_requirements || "Standard"
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
        )
      })
    }
  };

  return (
    <div className="min-h-screen p-4">
      <DataPage config={config} />
    </div>
  );
}