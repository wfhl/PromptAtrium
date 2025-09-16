import React, { useState, useEffect } from "react";
import { Grid, List, Table, Grid3X3, LayoutGrid } from "lucide-react";
import { Button } from "./ui/Button";
import { useToast } from "../utils/useToast";
import DatabaseSpreadsheet, { SpreadsheetConfig } from "./ui/DatabaseSpreadsheet";
import MiniCardView from "./ui/MiniCardView";
import LargeCardView from "./ui/LargeCardView";
import ListView from "./ui/ListView";
import { FavoritesDisplay } from "./ui/FavoritesDisplay";

// View mode types
export type ViewMode = 'spreadsheet' | 'minicard' | 'largecards' | 'listview' | 'custom';

// Generic data item interface
interface DataItem {
  id: number;
  name?: string;
  [key: string]: any;
}

// Configuration for MiniCard view
export interface MiniCardConfig<T> {
  title: string;
  apiEndpoint: string;
  favoriteItemType: string;
  renderCard: (item: T) => {
    id: number;
    title: string;
    description: string;
    categories?: string[] | null;
    tags?: string[] | null;
    era?: string | null;
    colorClass?: string;
    expandedContent: () => React.ReactElement;
  };
  searchFields?: (keyof T)[];
  categoryField?: keyof T;
  alphabetField?: keyof T;
}

// Configuration for LargeCard view
export interface LargeCardConfig<T> {
  title: string;
  apiEndpoint: string;
  favoriteItemType: string;
  renderLargeCard: (item: T) => {
    id: number;
    title: string;
    description: string;
    categories?: string[] | null;
    tags?: string[] | null;
    era?: string | null;
    colorClass?: string;
    icon?: React.ReactNode;
    metadata?: { [key: string]: any };
    actions?: React.ReactNode;
    content?: React.ReactNode;
  };
  searchFields?: (keyof T)[];
  categoryField?: keyof T;
  alphabetField?: keyof T;
}

// Configuration for ListView
export interface ListViewConfig<T> {
  title: string;
  apiEndpoint: string;
  favoriteItemType: string;
  searchPlaceholder?: string;
  categoryLabel?: string;
  renderListItem: (item: T) => {
    id: number;
    title: string;
    description: string;
    categories?: string[] | null;
    tags?: string[] | null;
    era?: string | null;
    metadata?: { [key: string]: any };
    actions?: React.ReactNode;
  };
  searchFields?: (keyof T)[];
  categoryField?: keyof T;
  alphabetField?: keyof T;
}

// Main DataPage configuration
export interface DataPageConfig<T extends DataItem> {
  title: string;
  apiEndpoint: string;
  favoriteItemType: string;
  defaultViewMode?: ViewMode;
  enabledViewModes?: ViewMode[];
  
  // Spreadsheet configuration
  spreadsheetConfig: SpreadsheetConfig<T>;
  
  // MiniCard configuration
  miniCardConfig: MiniCardConfig<T>;
  
  // LargeCard configuration (optional)
  largeCardConfig?: LargeCardConfig<T>;
  
  // ListView configuration (optional)
  listViewConfig?: ListViewConfig<T>;
  
  // Custom component (optional)
  customComponent?: React.ComponentType<{ config: DataPageConfig<T> }>;
}

interface DataPageProps<T extends DataItem> {
  config: DataPageConfig<T>;
}

export default function DataPage<T extends DataItem>({ config }: DataPageProps<T>) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>(config.defaultViewMode || 'spreadsheet');
  const [showFavorites, setShowFavorites] = useState(false);
  const enabledViewModes = config.enabledViewModes || ['spreadsheet', 'minicard'];

  // Ensure the default view mode is in the enabled list
  useEffect(() => {
    if (!enabledViewModes.includes(viewMode)) {
      setViewMode(enabledViewModes[0]);
    }
  }, [viewMode, enabledViewModes]);

  const viewButtons = [
    { mode: 'spreadsheet' as ViewMode, icon: Table, label: 'Spreadsheet' },
    { mode: 'minicard' as ViewMode, icon: Grid3X3, label: 'Mini Cards' },
    { mode: 'largecards' as ViewMode, icon: LayoutGrid, label: 'Large Cards' },
    { mode: 'listview' as ViewMode, icon: List, label: 'List View' },
  ];

  const renderView = () => {
    switch (viewMode) {
      case 'spreadsheet':
        return <DatabaseSpreadsheet config={config.spreadsheetConfig} />;
      
      case 'minicard':
        return <MiniCardView config={config.miniCardConfig} />;
      
      case 'largecards':
        if (config.largeCardConfig) {
          return <LargeCardView config={config.largeCardConfig} />;
        }
        // Fallback to minicard if large card config not provided
        return <MiniCardView config={config.miniCardConfig} />;
      
      case 'listview':
        if (config.listViewConfig) {
          return <ListView config={config.listViewConfig} />;
        }
        // Fallback to minicard if list view config not provided
        return <MiniCardView config={config.miniCardConfig} />;
      
      case 'custom':
        if (config.customComponent) {
          const CustomComponent = config.customComponent;
          return <CustomComponent config={config} />;
        }
        // Fallback to spreadsheet if custom component not provided
        return <DatabaseSpreadsheet config={config.spreadsheetConfig} />;
      
      default:
        return <DatabaseSpreadsheet config={config.spreadsheetConfig} />;
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    toast({
      title: "View mode changed",
      description: `Switched to ${mode} view`,
    });
  };

  return (
    <div className="space-y-4">
      {/* View Mode Selector */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{config.title}</h2>
        <div className="flex gap-2">
          {viewButtons
            .filter(btn => enabledViewModes.includes(btn.mode))
            .map(({ mode, icon: Icon, label }) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewModeChange(mode)}
                title={label}
                className="px-3"
              >
                <Icon className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">{label}</span>
              </Button>
            ))}
        </div>
      </div>

      {/* Favorites Section - Only show if not in spreadsheet mode */}
      {viewMode !== 'spreadsheet' && (
        <FavoritesDisplay
          favoriteItemType={config.favoriteItemType}
          renderFavoriteItem={(item) => {
            // Use the appropriate renderer based on current view mode
            if (viewMode === 'minicard' && config.miniCardConfig) {
              const cardData = config.miniCardConfig.renderCard(item);
              return {
                id: cardData.id,
                title: cardData.title,
                description: cardData.description,
                categories: cardData.categories,
              };
            } else if (viewMode === 'largecards' && config.largeCardConfig) {
              const cardData = config.largeCardConfig.renderLargeCard(item);
              return {
                id: cardData.id,
                title: cardData.title,
                description: cardData.description,
                categories: cardData.categories,
                actions: cardData.actions,
              };
            } else if (viewMode === 'listview' && config.listViewConfig) {
              return config.listViewConfig.renderListItem(item);
            }
            // Default fallback
            return {
              id: item.id,
              title: item.name || 'Untitled',
              description: '',
            };
          }}
        />
      )}

      {/* Main Content Area */}
      <div className="w-full">
        {renderView()}
      </div>
    </div>
  );
}