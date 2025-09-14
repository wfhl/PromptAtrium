import React, { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Checkbox } from "../ui/Checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/Dialog";
import { Search, Plus, Save, Edit2, Trash2, Filter, Check } from "lucide-react";
import { useToast } from "../../utils/useToast";

// Interface for prompt component
interface PromptComponent {
  id: number;
  category: string;
  value: string;
  description?: string;
  is_default: boolean;
  order?: number;
}

export default function PromptComponentsEditor() {
  const [selectedCategory, setSelectedCategory] = useState<string>("default_tag");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingComponent, setEditingComponent] = useState<PromptComponent | null>(null);
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  const [newComponent, setNewComponent] = useState({
    category: "default_tag",
    value: "",
    description: "",
    is_default: false,
    order: 0,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [components, setComponents] = useState<PromptComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch components when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchComponents();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/system/prompt-components/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        if (data.includes("default_tag")) {
          setSelectedCategory("default_tag");
        } else if (data.length > 0) {
          setSelectedCategory(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const fetchComponents = async () => {
    setIsLoading(true);
    try {
      const endpoint = selectedCategory === "all" 
        ? "/api/system/prompt-components"
        : `/api/system/prompt-components/category/${selectedCategory}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setComponents(data);
      }
    } catch (error) {
      console.error("Error fetching components:", error);
      toast({
        title: "Error",
        description: "Failed to fetch components",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  // Filter components based on search query
  const filteredComponents = components.filter((component) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      component.value.toLowerCase().includes(searchLower) ||
      (component.description && component.description.toLowerCase().includes(searchLower)) ||
      (selectedCategory === "all" && component.category.toLowerCase().includes(searchLower))
    );
  });

  // Handle adding a new component
  const handleAddComponent = async () => {
    if (!newComponent.category || !newComponent.value) {
      toast({
        title: "Error",
        description: "Category and value are required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/prompt-components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComponent),
        credentials: "include"
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Component added successfully",
        });

        // Reset form and refresh data
        setNewComponent({
          category: "default_tag",
          value: "",
          description: "",
          is_default: false,
          order: 0,
        });
        setIsAddingComponent(false);
        fetchComponents();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add component",
        variant: "destructive",
      });
    }
  };

  // Handle updating a component
  const handleUpdateComponent = async () => {
    if (!editingComponent) return;

    try {
      const response = await fetch(`/api/prompt-components/${editingComponent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingComponent),
        credentials: "include"
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Component updated successfully",
        });

        setEditingComponent(null);
        fetchComponents();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update component",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a component
  const handleDeleteComponent = async (id: number) => {
    try {
      const response = await fetch(`/api/prompt-components/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Component deleted successfully",
        });

        fetchComponents();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete component",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <Button onClick={() => setIsAddingComponent(true)}>
            <Plus size={16} className="mr-2" /> Add Component
          </Button>
        </div>
      </div>

      {/* Add Component Dialog */}
      <Dialog open={isAddingComponent} onOpenChange={setIsAddingComponent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Component</DialogTitle>
            <DialogDescription>
              Create a new prompt component for your collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={newComponent.category}
                onChange={(e) => setNewComponent({ ...newComponent, category: e.target.value })}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Value</label>
              <Input
                placeholder="Component value"
                value={newComponent.value}
                onChange={(e) => setNewComponent({ ...newComponent, value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Component description"
                value={newComponent.description || ""}
                onChange={(e) => setNewComponent({ ...newComponent, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Input
                type="number"
                placeholder="Display order"
                value={newComponent.order.toString()}
                onChange={(e) => setNewComponent({ ...newComponent, order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={newComponent.is_default}
                onCheckedChange={(checked) => setNewComponent({ ...newComponent, is_default: checked as boolean })}
              />
              <label htmlFor="is_default" className="text-sm font-medium">
                Default Component
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingComponent(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComponent}>
              <Plus size={16} className="mr-2" /> Add Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Component Dialog */}
      {editingComponent && (
        <Dialog open={!!editingComponent} onOpenChange={(open) => !open && setEditingComponent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Component</DialogTitle>
              <DialogDescription>
                Update the details of this prompt component
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={editingComponent.category}
                  onChange={(e) => setEditingComponent({ ...editingComponent, category: e.target.value })}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Value</label>
                <Input
                  placeholder="Component value"
                  value={editingComponent.value}
                  onChange={(e) => setEditingComponent({ ...editingComponent, value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Component description"
                  value={editingComponent.description || ""}
                  onChange={(e) => setEditingComponent({ ...editingComponent, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Order</label>
                <Input
                  type="number"
                  placeholder="Display order"
                  value={editingComponent.order?.toString() || "0"}
                  onChange={(e) => setEditingComponent({ ...editingComponent, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_default"
                  checked={editingComponent.is_default}
                  onCheckedChange={(checked) => setEditingComponent({ ...editingComponent, is_default: checked as boolean })}
                />
                <label htmlFor="edit_is_default" className="text-sm font-medium">
                  Default Component
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingComponent(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateComponent}>
                <Save size={16} className="mr-2" /> Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Components Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              {selectedCategory === "all" && <TableHead>Category</TableHead>}
              <TableHead>Value</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={selectedCategory === "all" ? 5 : 4} className="text-center py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredComponents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectedCategory === "all" ? 5 : 4} className="text-center py-6 text-gray-400">
                  {searchQuery
                    ? "No components found matching your search"
                    : "No components found in this category"}
                </TableCell>
              </TableRow>
            ) : (
              filteredComponents.map((component, index) => (
                <TableRow key={component.id}>
                  <TableCell className="font-mono text-gray-400">
                    {component.order !== null && component.order !== undefined ? component.order : index}
                  </TableCell>
                  {selectedCategory === "all" && (
                    <TableCell className="font-medium text-gray-300">
                      {component.category}
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{component.value}</TableCell>
                  <TableCell className="text-gray-400 max-w-md truncate">
                    {component.description || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingComponent(component)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteComponent(component.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}