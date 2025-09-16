import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { Button } from "./Button";
import { useToast } from "../../utils/useToast";
import { 
  Save, 
  FileSpreadsheet, 
  Plus,
  Minus,
  Trash, 
  Upload,
  ArrowUpDown,
  Eye,
  Pencil,
  KeyRound,
  Unlock,
  Download,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";
import { Label } from "./Label";
import { Switch } from "./Switch";
import { Dialog } from "./Dialog";
import { FavoriteButton } from "./FavoriteButton";
import { UnifiedFilters } from "./UnifiedFilters";

// Configuration interface for the spreadsheet
export interface SpreadsheetConfig<T> {
  title: string;
  apiEndpoint: string;
  headers: string[];
  defaultItem: Omit<T, 'id' | 'created_at' | 'updated_at'>;
  renderCell?: (item: T, field: string, isEditMode: boolean, onChange: (value: any) => void) => React.ReactNode;
  validateItem?: (item: Partial<T>) => string | null;
  favoriteItemType: string; // For favorites API
  categoryField?: string;
  searchFields?: string[];
  alphabetField?: string;
  searchPlaceholder?: string;
  categoryLabel?: string;
}

// Generic database item interface
interface DatabaseItem {
  id: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface DatabaseSpreadsheetProps<T extends DatabaseItem> {
  config: SpreadsheetConfig<T>;
}

export default function DatabaseSpreadsheet<T extends DatabaseItem>({ config }: DatabaseSpreadsheetProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [filteredData, setFilteredData] = useState<T[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [rowHeight, setRowHeight] = useState(40);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch data from API
  useEffect(() => {
    fetchData();
  }, [config.apiEndpoint]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(config.apiEndpoint);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
      setFilteredData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...data];

    // Search filter
    if (searchTerm && config.searchFields) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        config.searchFields!.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(searchLower);
        })
      );
    }

    // Category filter
    if (selectedCategory && config.categoryField) {
      filtered = filtered.filter(item => item[config.categoryField!] === selectedCategory);
    }

    // Alphabet filter
    if (selectedLetter && config.alphabetField) {
      filtered = filtered.filter(item => {
        const value = item[config.alphabetField!];
        return value && value.toString().toUpperCase().startsWith(selectedLetter);
      });
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.tags || !Array.isArray(item.tags)) return false;
        return selectedTags.every(tag => item.tags.includes(tag));
      });
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredData(filtered);
  }, [data, searchTerm, selectedCategory, selectedLetter, selectedTags, sortConfig, config]);

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Handle cell edit
  const handleCellEdit = (rowIndex: number, field: string, value: any) => {
    const newData = [...filteredData];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    setFilteredData(newData);
    setUnsavedChanges(true);
  };

  // Add new row
  const handleAddRow = () => {
    const newItem = {
      ...config.defaultItem,
      id: Date.now(), // Temporary ID
    } as T;
    
    setFilteredData([...filteredData, newItem]);
    setUnsavedChanges(true);
  };

  // Delete selected rows
  const handleDeleteRows = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "No selection",
        description: "Please select rows to delete",
        variant: "destructive"
      });
      return;
    }

    const idsToDelete = Array.from(selectedRows);
    
    try {
      // Send delete requests
      await Promise.all(
        idsToDelete.map(id => 
          fetch(`${config.apiEndpoint}/${id}`, { method: 'DELETE' })
        )
      );

      setFilteredData(filteredData.filter(item => !selectedRows.has(item.id)));
      setSelectedRows(new Set());
      toast({
        title: "Success",
        description: `Deleted ${idsToDelete.length} items`,
      });
    } catch (error) {
      console.error('Error deleting items:', error);
      toast({
        title: "Error",
        description: "Failed to delete items",
        variant: "destructive"
      });
    }
  };

  // Save changes
  const handleSave = async () => {
    try {
      // Validate all items
      for (const item of filteredData) {
        if (config.validateItem) {
          const error = config.validateItem(item);
          if (error) {
            toast({
              title: "Validation Error",
              description: error,
              variant: "destructive"
            });
            return;
          }
        }
      }

      // Save to API
      const response = await fetch(config.apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filteredData),
      });

      if (!response.ok) throw new Error('Failed to save data');

      setUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Data saved successfully",
      });
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: "Failed to save data",
        variant: "destructive"
      });
    }
  };

  // Export to Excel
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.title);
    XLSX.writeFile(wb, `${config.title.replace(/\s+/g, '_')}.xlsx`);
    
    toast({
      title: "Success",
      description: "Data exported to Excel",
    });
  };

  // Import from Excel
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as T[];
      
      setFilteredData(jsonData);
      setUnsavedChanges(true);
      
      toast({
        title: "Success",
        description: `Imported ${jsonData.length} items`,
      });
    };
    reader.readAsArrayBuffer(file);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (!isEditMode) {
      setShowPasswordDialog(true);
    } else {
      setIsEditMode(false);
    }
  };

  // Handle password submission
  const handlePasswordSubmit = () => {
    // Simple password check (in production, this should be server-side)
    if (password === "admin") {
      setIsEditMode(true);
      setShowPasswordDialog(false);
      setPassword("");
      setPasswordError(false);
    } else {
      setPasswordError(true);
      toast({
        title: "Error",
        description: "Incorrect password",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={toggleEditMode}
            variant={isEditMode ? "default" : "outline"}
            size="sm"
          >
            {isEditMode ? <Unlock className="h-4 w-4 mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
            {isEditMode ? "Edit Mode" : "View Mode"}
          </Button>

          {isEditMode && (
            <>
              <Button onClick={handleAddRow} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
              <Button 
                onClick={handleDeleteRows} 
                size="sm" 
                variant="destructive"
                disabled={selectedRows.size === 0}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button 
                onClick={handleSave} 
                size="sm" 
                variant="default"
                disabled={!unsavedChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label htmlFor="import-file">
            <Button size="sm" variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
          </label>
          <input
            id="import-file"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {/* Filters */}
      <UnifiedFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedLetter={selectedLetter}
        onLetterChange={setSelectedLetter}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        categories={[]} // You would extract these from data
        tags={[]} // You would extract these from data
        onClearFilters={() => {
          setSearchTerm("");
          setSelectedCategory(null);
          setSelectedLetter(null);
          setSelectedTags([]);
        }}
      />

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {isEditMode && (
                <th className="p-2 text-left">
                  <Checkbox
                    checked={selectedRows.size === filteredData.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRows(new Set(filteredData.map(item => item.id)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </th>
              )}
              <th className="p-2 text-left">Favorite</th>
              {config.headers.map(header => (
                <th 
                  key={header}
                  className="p-2 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort(header)}
                >
                  <div className="flex items-center gap-1">
                    {header}
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={config.headers.length + 2} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={config.headers.length + 2} className="p-4 text-center">
                  No data available
                </td>
              </tr>
            ) : (
              filteredData.map((item, rowIndex) => (
                <tr 
                  key={item.id}
                  className="border-t hover:bg-gray-50 dark:hover:bg-gray-800"
                  style={{ height: rowHeight }}
                >
                  {isEditMode && (
                    <td className="p-2">
                      <Checkbox
                        checked={selectedRows.has(item.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedRows);
                          if (checked) {
                            newSelected.add(item.id);
                          } else {
                            newSelected.delete(item.id);
                          }
                          setSelectedRows(newSelected);
                        }}
                      />
                    </td>
                  )}
                  <td className="p-2">
                    <FavoriteButton
                      itemId={item.id}
                      itemType={config.favoriteItemType}
                      size="sm"
                    />
                  </td>
                  {config.headers.map(header => (
                    <td key={header} className="p-2">
                      {config.renderCell ? (
                        config.renderCell(
                          item, 
                          header, 
                          isEditMode,
                          (value) => handleCellEdit(rowIndex, header, value)
                        )
                      ) : (
                        <input
                          type="text"
                          value={item[header]?.toString() || ""}
                          onChange={(e) => handleCellEdit(rowIndex, header, e.target.value)}
                          disabled={!isEditMode}
                          className="w-full bg-transparent border-none p-1 focus:outline-none focus:ring-1 focus:ring-primary disabled:text-gray-600"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Password Dialog */}
      {showPasswordDialog && (
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Enter Admin Password</h2>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={passwordError ? "border-red-500" : ""}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-2">Incorrect password</p>
            )}
            <div className="flex gap-2 mt-4">
              <Button onClick={handlePasswordSubmit}>Submit</Button>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}