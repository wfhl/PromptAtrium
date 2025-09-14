import React, { useState } from 'react';
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailedOptionsDropdownProps {
  categoryName: string;
  categoryLabel: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DetailedOptionsDropdown({
  categoryName,
  categoryLabel,
  options,
  value,
  onChange,
  placeholder = "Select option",
}: DetailedOptionsDropdownProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  
  // Parse the current value into an array of selected items
  const currentSelections = value ? value.split(", ").filter(Boolean) : [];
  
  const handleSelect = (optionValue: string) => {
    if (optionValue && !currentSelections.includes(optionValue)) {
      const newValue = [...currentSelections, optionValue].join(", ");
      onChange(newValue);
      setSelectedOption("");
    }
  };
  
  const handleRemove = (optionToRemove: string) => {
    const newSelections = currentSelections.filter(item => item !== optionToRemove);
    onChange(newSelections.join(", "));
  };
  
  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor={`detailed-${categoryName}`}>{categoryLabel}</Label>
        
        <Select
          value={selectedOption}
          onValueChange={(value) => {
            setSelectedOption(value);
            handleSelect(value);
          }}
        >
          <SelectTrigger id={`detailed-${categoryName}`} className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{categoryLabel}</SelectLabel>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {currentSelections.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {currentSelections.map((item) => (
            <Badge 
              key={item} 
              variant="secondary" 
              className="flex items-center gap-1 px-2 py-1"
            >
              {item}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleRemove(item)}
              />
            </Badge>
          ))}
        </div>
      )}
      
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Manual edit ${categoryLabel.toLowerCase()} options`}
        className="resize-none min-h-16 mt-2"
      />
    </div>
  );
}

interface DetailedOptionsCategoryProps {
  categoryName: string;
  categoryLabel: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DetailedOptionsCategory({
  categoryName,
  categoryLabel,
  options,
  value,
  onChange,
  placeholder,
}: DetailedOptionsCategoryProps) {
  return (
    <AccordionItem value={categoryName} className="border border-border rounded-md mb-2">
      <AccordionTrigger className="px-4 py-2 hover:no-underline">
        <div className="flex justify-between items-center w-full">
          <span className="font-medium">{categoryLabel}</span>
          {value && (
            <Badge variant="outline" className="ml-2">
              {value.split(", ").filter(Boolean).length}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-2">
        <DetailedOptionsDropdown
          categoryName={categoryName}
          categoryLabel={categoryLabel}
          options={options}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

interface DetailedOptionsSectionProps {
  categories: {
    name: string;
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }[];
}

export function DetailedOptionsSection({ categories }: DetailedOptionsSectionProps) {
  return (
    <Accordion type="multiple" className="space-y-2">
      {categories.map((category) => (
        <DetailedOptionsCategory
          key={category.name}
          categoryName={category.name}
          categoryLabel={category.label}
          options={category.options}
          value={category.value}
          onChange={category.onChange}
          placeholder={category.placeholder}
        />
      ))}
    </Accordion>
  );
}