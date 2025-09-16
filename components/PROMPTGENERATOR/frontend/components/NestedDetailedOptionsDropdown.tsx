import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Define types for our nested structure
export interface OptionItem {
  label: string;
  value: string;
}

export interface SubCategoryOption {
  name: string;
  label: string;
  options: OptionItem[];
}

export interface CategoryOption {
  name: string;
  label: string;
  subCategories: SubCategoryOption[];
}

interface NestedDetailedOptionsSelectorProps {
  subCategory: SubCategoryOption;
  value: string;
  onChange: (subCategoryName: string, value: string) => void;
  placeholder?: string;
  isMultiSelectMode?: boolean;
}

// Component for a single sub-category dropdown
function NestedDetailedOptionsSelector({
  subCategory,
  value,
  onChange,
  placeholder = "None",
  isMultiSelectMode = false,
}: NestedDetailedOptionsSelectorProps) {
  // For multi-select mode, we need to handle arrays
  // Update selected values when value prop changes (for synchronization)
  const [selectedValues, setSelectedValues] = useState<string[]>(
    value ? (value.includes(',') ? value.split(',').map(v => v.trim()) : [value]) : []
  );
  
  // State for custom entry input
  const [customValue, setCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Update selected values when the parent value changes
  useEffect(() => {
    if (value) {
      setSelectedValues(value.includes(',') ? value.split(',').map(v => v.trim()) : [value]);
    } else {
      setSelectedValues([]);
    }
  }, [value]);

  // MultiSelect handler
  const handleMultiSelectChange = (optionValue: string) => {
    let newValues: string[];
    
    // Special handling for 'none' option
    if (optionValue === 'none') {
      newValues = [];
      setShowCustomInput(false);
    } else if (optionValue === '__custom__') {
      // Show custom input field
      setShowCustomInput(true);
      return; // Don't update selected values yet
    } else if (selectedValues.includes(optionValue)) {
      // If already selected, remove it
      newValues = selectedValues.filter(v => v !== optionValue);
    } else {
      // If not selected, add it
      newValues = [...selectedValues, optionValue];
    }
    
    setSelectedValues(newValues);
    
    // Join the values and update the parent
    const joinedValue = newValues.length > 0 ? newValues.join(', ') : '';
    onChange(subCategory.name, joinedValue);
  };

  // Handle custom value submission
  const handleCustomValueSubmit = () => {
    if (customValue.trim()) {
      const newValues = [...selectedValues, customValue.trim()];
      setSelectedValues(newValues);
      onChange(subCategory.name, newValues.join(', '));
      setCustomValue('');
      setShowCustomInput(false);
    }
  };

  if (isMultiSelectMode) {
    return (
      <div className="space-y-1 mb-3">
        <Label htmlFor={`sub-category-${subCategory.name}`} className="text-sm font-medium">
          {subCategory.label}
        </Label>
        <div className="relative w-full">
          {/* Selected options display as pills */}
          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedValues.map((val) => {
                const option = subCategory.options.find(opt => opt.value === val);
                return (
                  <div key={val} className="flex items-center bg-blue-900/50 text-white text-xs px-2 py-1 rounded-full">
                    {option?.label || val}
                    <button 
                      type="button" 
                      className="ml-1 text-white/70 hover:text-white"
                      onClick={() => handleMultiSelectChange(val)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Dropdown for multi-select */}
          <div className="bg-gray-900 border border-gray-800 rounded-md">
            <div className="p-1">
              <button
                type="button"
                onClick={() => handleMultiSelectChange('none')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800"
              >
                None
              </button>
              <button
                type="button"
                onClick={() => handleMultiSelectChange('__custom__')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800"
              >
                Custom Entry
              </button>
              {subCategory.options.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => handleMultiSelectChange(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-800 flex items-center justify-between
                    ${selectedValues.includes(option.value) ? "bg-purple-600/25 text-white" : "text-gray-300"}`}
                >
                  <span>{option.label}</span>
                  {selectedValues.includes(option.value) && <div className="text-purple-400">✓</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Custom input field for multi-select mode */}
        {showCustomInput && (
          <div className="mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md">
            <Label className="text-sm font-medium mb-2 block">Enter custom value:</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Type your custom value..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleCustomValueSubmit()}
              />
              <Button 
                onClick={handleCustomValueSubmit}
                disabled={!customValue.trim()}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Add
              </Button>
              <Button 
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomValue('');
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    // Single-select mode (original)
    return (
      <div className="space-y-1 mb-3">
        <Label htmlFor={`sub-category-${subCategory.name}`} className="text-sm font-medium">
          {subCategory.label}
        </Label>
        <Select
          value={value === '__custom__' ? '' : (value || "")}
          onValueChange={(newValue) => {
            if (newValue === '__custom__') {
              setShowCustomInput(true);
            } else {
              setShowCustomInput(false);
              onChange(subCategory.name, newValue);
            }
          }}
        >
          <SelectTrigger id={`sub-category-${subCategory.name}`} className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="__custom__">Custom Entry</SelectItem>
              {subCategory.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        
        {/* Custom input field for single-select mode */}
        {showCustomInput && (
          <div className="mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md">
            <Label className="text-sm font-medium mb-2 block">Enter custom value:</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Type your custom value..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleCustomValueSubmit()}
              />
              <Button 
                onClick={() => {
                  if (customValue.trim()) {
                    onChange(subCategory.name, customValue.trim());
                    setCustomValue('');
                    setShowCustomInput(false);
                  }
                }}
                disabled={!customValue.trim()}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Set
              </Button>
              <Button 
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomValue('');
                  onChange(subCategory.name, '');
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

interface NestedDetailedOptionsProps {
  categoryName: string;
  categoryLabel: string;
  subCategories: SubCategoryOption[];
  values: Record<string, string>;
  onChange: (subCategoryName: string, value: string) => void;
  isMultiSelectMode?: boolean;
}

// Component for a single main category with its sub-categories
export function NestedDetailedOptions({
  categoryName,
  categoryLabel,
  subCategories,
  values,
  onChange,
  isMultiSelectMode = false,
}: NestedDetailedOptionsProps) {
  const hasSelectedValues = Object.values(values).some(value => value && value !== "" && value !== "none");
  const selectedCount = Object.values(values).filter(value => value && value !== "" && value !== "none").length;

  return (
    <AccordionItem value={categoryName} className="border border-border rounded-md mb-2">
      <AccordionTrigger className="px-4 py-2 hover:no-underline">
        <div className="flex justify-between items-center w-full">
          <span className="font-medium text-left">{categoryLabel}</span>
          {hasSelectedValues && (
            <Badge variant="outline" className="ml-2">
              {selectedCount}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-2">
        {subCategories.map((subCategory) => (
          <NestedDetailedOptionsSelector
            key={subCategory.name}
            subCategory={subCategory}
            value={values[subCategory.name] || ""}
            onChange={onChange}
            placeholder="None"
            isMultiSelectMode={isMultiSelectMode}
          />
        ))}
        
        <div className="mt-4">
          <Textarea
            value={Object.entries(values)
              .filter(([_, value]) => value && value !== "" && value !== "none")
              .map(([key, value]) => {
                const subCat = subCategories.find(sc => sc.name === key);
                return subCat ? `${subCat.label}: ${value}` : "";
              })
              .filter(Boolean)
              .join(", ")}
            readOnly
            placeholder="Selected options will appear here"
            className="resize-none min-h-[60px] bg-gray-900/50"
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

interface NestedDetailedOptionsSectionProps {
  categories: CategoryOption[];
  values: Record<string, Record<string, string>>;
  onChangeValue: (categoryName: string, subCategoryName: string, value: string) => void;
  isMultiSelectMode?: boolean;
}

// Main component that renders all categories with their sub-categories
export function NestedDetailedOptionsSection({
  categories,
  values,
  onChangeValue,
  isMultiSelectMode = false,
}: NestedDetailedOptionsSectionProps) {
  return (
    <Accordion type="multiple" className="space-y-2">
      {categories.map((category) => (
        <NestedDetailedOptions
          key={category.name}
          categoryName={category.name}
          categoryLabel={category.label}
          subCategories={category.subCategories}
          values={values[category.name] || {}}
          isMultiSelectMode={isMultiSelectMode}
          onChange={(subCategoryName, value) => 
            onChangeValue(category.name, subCategoryName, value)
          }
        />
      ))}
    </Accordion>
  );
}