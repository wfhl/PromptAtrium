import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface DetailedOption {
  value: string;
  label: string;
}

export interface SubCategory {
  name: string;
  label: string;
  options: DetailedOption[];
}

export interface CategoryOption {
  name: string;
  label: string;
  subCategories: SubCategory[];
}

interface NestedDetailedOptionsSectionProps {
  categories: CategoryOption[];
  values: Record<string, Record<string, string>>;
  onChange: (categoryName: string, subCategoryName: string, value: string) => void;
}

export function NestedDetailedOptionsSection({
  categories,
  values,
  onChange
}: NestedDetailedOptionsSectionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubCategory = (key: string) => {
    const newExpanded = new Set(expandedSubCategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubCategories(newExpanded);
  };

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div key={category.name} className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleCategory(category.name)}
            className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 flex items-center justify-between text-sm"
          >
            <span className="font-medium">{category.label}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expandedCategories.has(category.name) && "rotate-180"
              )}
            />
          </button>
          
          {expandedCategories.has(category.name) && (
            <div className="p-2 space-y-2 bg-gray-900/50">
              {category.subCategories.map((subCategory) => {
                const subKey = `${category.name}-${subCategory.name}`;
                return (
                  <div key={subKey} className="border border-gray-800 rounded">
                    <button
                      type="button"
                      onClick={() => toggleSubCategory(subKey)}
                      className="w-full px-2 py-1 bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-between text-xs"
                    >
                      <span>{subCategory.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform",
                          expandedSubCategories.has(subKey) && "rotate-180"
                        )}
                      />
                    </button>
                    
                    {expandedSubCategories.has(subKey) && (
                      <div className="p-2 grid grid-cols-2 gap-1">
                        {subCategory.options.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center space-x-1 text-xs cursor-pointer hover:bg-gray-800/30 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={values[category.name]?.[subCategory.name] === option.value}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  onChange(category.name, subCategory.name, option.value);
                                } else {
                                  onChange(category.name, subCategory.name, "");
                                }
                              }}
                              className="rounded border-gray-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 bg-gray-800"
                            />
                            <span className="text-gray-300">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}