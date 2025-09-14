// Custom Database Page Example
// This example shows how to create a custom database page using the DataPage component

import React from 'react';
import DataPage, { DataPageConfig } from '../frontend/components/DataPage';
import { Button } from '../frontend/components/ui/Button';
import { Badge } from '../frontend/components/ui/Badge';
import { Select } from '../frontend/components/ui/Select';

// Define your data interface
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  description: string;
  tags: string[];
  image_url?: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// Example 1: Simple Product Database
export function ProductDatabase() {
  const config: DataPageConfig<Product> = {
    title: "Product Inventory",
    apiEndpoint: "/api/products",
    favoriteItemType: "products",
    defaultViewMode: "minicard",
    enabledViewModes: ["spreadsheet", "minicard", "largecards", "listview"],
    
    // Spreadsheet configuration
    spreadsheetConfig: {
      title: "Product Inventory",
      apiEndpoint: "/api/products",
      headers: ["name", "price", "category", "stock", "is_featured"],
      defaultItem: {
        name: "",
        price: 0,
        category: "Electronics",
        stock: 0,
        description: "",
        tags: [],
        is_featured: false
      },
      renderCell: (item, field, isEditMode, onChange) => {
        // Custom cell renderers for specific fields
        if (field === "is_featured") {
          return (
            <input
              type="checkbox"
              checked={item[field]}
              onChange={(e) => onChange(e.target.checked)}
              disabled={!isEditMode}
            />
          );
        }
        if (field === "category") {
          return (
            <Select
              value={item[field]}
              onChange={(e) => onChange(e.target.value)}
              disabled={!isEditMode}
            >
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Food">Food</option>
            </Select>
          );
        }
        if (field === "price") {
          return (
            <input
              type="number"
              value={item[field]}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              disabled={!isEditMode}
              className="w-full"
              step="0.01"
            />
          );
        }
        // Default text input for other fields
        return (
          <input
            type="text"
            value={item[field] || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={!isEditMode}
            className="w-full"
          />
        );
      },
      validateItem: (item) => {
        if (!item.name) return "Product name is required";
        if (item.price < 0) return "Price cannot be negative";
        if (item.stock < 0) return "Stock cannot be negative";
        return null;
      },
      favoriteItemType: "products",
      categoryField: "category",
      searchFields: ["name", "description"],
      alphabetField: "name"
    },
    
    // Mini Card configuration
    miniCardConfig: {
      title: "Product Inventory",
      apiEndpoint: "/api/products",
      favoriteItemType: "products",
      searchFields: ["name", "description", "category"],
      categoryField: "category",
      alphabetField: "name",
      renderCard: (product) => ({
        id: product.id,
        title: product.name,
        description: `$${product.price.toFixed(2)} - ${product.stock} in stock`,
        categories: [product.category],
        tags: product.tags,
        colorClass: product.stock === 0 ? "border-red-500" : 
                   product.stock < 10 ? "border-yellow-500" : 
                   "border-green-500",
        expandedContent: () => (
          <div className="space-y-4">
            {product.image_url && (
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-48 object-cover rounded"
              />
            )}
            <div>
              <h4 className="font-semibold">Description</h4>
              <p className="text-gray-600">{product.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Price:</strong> ${product.price.toFixed(2)}
              </div>
              <div>
                <strong>Stock:</strong> {product.stock}
              </div>
              <div>
                <strong>Category:</strong> {product.category}
              </div>
              <div>
                <strong>Featured:</strong> {product.is_featured ? "Yes" : "No"}
              </div>
            </div>
            {product.tags.length > 0 && (
              <div>
                <strong>Tags:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })
    },
    
    // Large Card configuration
    largeCardConfig: {
      title: "Product Inventory",
      apiEndpoint: "/api/products",
      favoriteItemType: "products",
      searchFields: ["name", "description", "category"],
      categoryField: "category",
      renderLargeCard: (product) => ({
        id: product.id,
        title: product.name,
        description: product.description,
        categories: [product.category],
        tags: product.tags,
        colorClass: product.is_featured ? "border-blue-500" : "",
        metadata: {
          "Price": `$${product.price.toFixed(2)}`,
          "Stock": product.stock,
          "SKU": `PRD-${product.id.toString().padStart(5, '0')}`,
          "Last Updated": new Date(product.updated_at).toLocaleDateString()
        },
        actions: (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Edit
            </Button>
            <Button size="sm">
              Order More
            </Button>
          </div>
        ),
        content: product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-32 object-cover rounded"
          />
        ) : null
      })
    },
    
    // List View configuration
    listViewConfig: {
      title: "Product Inventory",
      apiEndpoint: "/api/products",
      favoriteItemType: "products",
      searchPlaceholder: "Search products...",
      categoryLabel: "Category",
      searchFields: ["name", "description"],
      categoryField: "category",
      renderListItem: (product) => ({
        id: product.id,
        title: product.name,
        description: `$${product.price.toFixed(2)} - ${product.description}`,
        categories: [product.category],
        tags: product.tags,
        metadata: {
          "Stock": product.stock,
          "Status": product.stock === 0 ? "Out of Stock" : 
                   product.stock < 10 ? "Low Stock" : "In Stock"
        },
        actions: (
          <Button size="sm" variant="ghost">
            View Details
          </Button>
        )
      })
    }
  };
  
  return <DataPage config={config} />;
}

// Example 2: Employee Directory Database
interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  hire_date: string;
  salary: number;
  phone: string;
  is_active: boolean;
}

export function EmployeeDirectory() {
  const config: DataPageConfig<Employee> = {
    title: "Employee Directory",
    apiEndpoint: "/api/employees",
    favoriteItemType: "employees",
    defaultViewMode: "listview",
    enabledViewModes: ["spreadsheet", "listview", "minicard"],
    
    spreadsheetConfig: {
      title: "Employee Directory",
      apiEndpoint: "/api/employees",
      headers: ["name", "email", "department", "role", "hire_date", "is_active"],
      defaultItem: {
        name: "",
        email: "",
        department: "",
        role: "",
        hire_date: new Date().toISOString().split('T')[0],
        salary: 0,
        phone: "",
        is_active: true
      },
      favoriteItemType: "employees",
      validateItem: (item) => {
        if (!item.name) return "Employee name is required";
        if (!item.email || !item.email.includes('@')) return "Valid email is required";
        return null;
      },
      searchFields: ["name", "email", "department", "role"],
      categoryField: "department"
    },
    
    miniCardConfig: {
      title: "Employee Directory",
      apiEndpoint: "/api/employees",
      favoriteItemType: "employees",
      searchFields: ["name", "email", "department"],
      categoryField: "department",
      renderCard: (employee) => ({
        id: employee.id,
        title: employee.name,
        description: `${employee.role} - ${employee.department}`,
        categories: [employee.department],
        colorClass: employee.is_active ? "" : "opacity-50",
        expandedContent: () => (
          <div className="space-y-2">
            <p><strong>Email:</strong> {employee.email}</p>
            <p><strong>Phone:</strong> {employee.phone}</p>
            <p><strong>Hire Date:</strong> {new Date(employee.hire_date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {employee.is_active ? "Active" : "Inactive"}</p>
          </div>
        )
      })
    },
    
    listViewConfig: {
      title: "Employee Directory",
      apiEndpoint: "/api/employees",
      favoriteItemType: "employees",
      searchFields: ["name", "email", "department"],
      categoryField: "department",
      renderListItem: (employee) => ({
        id: employee.id,
        title: employee.name,
        description: employee.email,
        categories: [employee.department],
        metadata: {
          "Role": employee.role,
          "Phone": employee.phone,
          "Status": employee.is_active ? "Active" : "Inactive"
        },
        actions: (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost">Email</Button>
            <Button size="sm" variant="ghost">Call</Button>
          </div>
        )
      })
    }
  };
  
  return <DataPage config={config} />;
}