// Custom Renderers Example
// This example shows how to create custom cell and card renderers

import React from 'react';
import DataPage, { DataPageConfig } from '../frontend/components/DataPage';
import { Button } from '../frontend/components/ui/Button';
import { Badge } from '../frontend/components/ui/Badge';
import { Select } from '../frontend/components/ui/Select';
import { Switch } from '../frontend/components/ui/Switch';
import { 
  Star, 
  Edit, 
  Trash, 
  Eye, 
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

// Example data interface
interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  due_date: string;
  tags: string[];
  attachments: string[];
  completion_percentage: number;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

// Custom Status Badge Component
function StatusBadge({ status }: { status: Task['status'] }) {
  const statusConfig = {
    pending: { color: 'bg-gray-500', icon: AlertCircle, label: 'Pending' },
    in_progress: { color: 'bg-blue-500', icon: AlertCircle, label: 'In Progress' },
    completed: { color: 'bg-green-500', icon: CheckCircle, label: 'Completed' },
    cancelled: { color: 'bg-red-500', icon: XCircle, label: 'Cancelled' }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </div>
  );
}

// Custom Priority Indicator
function PriorityIndicator({ priority }: { priority: Task['priority'] }) {
  const colors = {
    low: 'text-gray-400',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-500'
  };
  
  return (
    <div className={`flex items-center gap-1 ${colors[priority]}`}>
      {priority === 'critical' && <AlertCircle className="h-4 w-4" />}
      <span className="text-sm font-medium capitalize">{priority}</span>
    </div>
  );
}

// Custom Progress Bar Component
function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-500 h-2 rounded-full transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Task Management Database with Custom Renderers
export function TaskManagementDatabase() {
  const config: DataPageConfig<Task> = {
    title: "Task Management",
    apiEndpoint: "/api/tasks",
    favoriteItemType: "tasks",
    defaultViewMode: "minicard",
    enabledViewModes: ["spreadsheet", "minicard", "largecards", "listview"],
    
    // Spreadsheet with custom cell renderers
    spreadsheetConfig: {
      title: "Task Management",
      apiEndpoint: "/api/tasks",
      headers: ["title", "status", "priority", "assignee", "due_date", "completion_percentage", "is_flagged"],
      defaultItem: {
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        assignee: "",
        due_date: new Date().toISOString().split('T')[0],
        tags: [],
        attachments: [],
        completion_percentage: 0,
        is_flagged: false
      },
      
      // Custom cell renderer for different field types
      renderCell: (item, field, isEditMode, onChange) => {
        switch (field) {
          case 'status':
            return isEditMode ? (
              <Select
                value={item.status}
                onChange={(e) => onChange(e.target.value)}
                className="w-full"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            ) : (
              <StatusBadge status={item.status} />
            );
          
          case 'priority':
            return isEditMode ? (
              <Select
                value={item.priority}
                onChange={(e) => onChange(e.target.value)}
                className="w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            ) : (
              <PriorityIndicator priority={item.priority} />
            );
          
          case 'completion_percentage':
            return isEditMode ? (
              <input
                type="range"
                min="0"
                max="100"
                value={item.completion_percentage}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full"
              />
            ) : (
              <div className="flex items-center gap-2">
                <ProgressBar percentage={item.completion_percentage} />
                <span className="text-xs">{item.completion_percentage}%</span>
              </div>
            );
          
          case 'is_flagged':
            return (
              <Switch
                checked={item.is_flagged}
                onCheckedChange={onChange}
                disabled={!isEditMode}
              />
            );
          
          case 'due_date':
            return (
              <input
                type="date"
                value={item.due_date}
                onChange={(e) => onChange(e.target.value)}
                disabled={!isEditMode}
                className={`bg-transparent ${
                  new Date(item.due_date) < new Date() ? 'text-red-500' : ''
                }`}
              />
            );
          
          default:
            return (
              <input
                type="text"
                value={item[field] || ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={!isEditMode}
                className="w-full bg-transparent"
              />
            );
        }
      },
      
      validateItem: (item) => {
        if (!item.title) return "Task title is required";
        if (!item.assignee) return "Assignee is required";
        return null;
      },
      
      favoriteItemType: "tasks",
      categoryField: "status",
      searchFields: ["title", "description", "assignee"]
    },
    
    // Mini Card with custom card renderer
    miniCardConfig: {
      title: "Task Management",
      apiEndpoint: "/api/tasks",
      favoriteItemType: "tasks",
      searchFields: ["title", "description", "assignee"],
      categoryField: "status",
      
      renderCard: (task) => ({
        id: task.id,
        title: task.title,
        description: task.assignee,
        categories: [task.status],
        tags: task.tags,
        colorClass: task.priority === 'critical' ? 'border-red-500' :
                   task.priority === 'high' ? 'border-orange-500' :
                   task.is_flagged ? 'border-yellow-500' : '',
        
        expandedContent: () => (
          <div className="space-y-4">
            {/* Status and Priority */}
            <div className="flex justify-between items-center">
              <StatusBadge status={task.status} />
              <PriorityIndicator priority={task.priority} />
            </div>
            
            {/* Description */}
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-gray-600">{task.description}</p>
            </div>
            
            {/* Progress */}
            <div>
              <h4 className="font-semibold mb-2">Progress</h4>
              <div className="flex items-center gap-2">
                <ProgressBar percentage={task.completion_percentage} />
                <span className="text-sm">{task.completion_percentage}%</span>
              </div>
            </div>
            
            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Assignee:</strong> {task.assignee}
              </div>
              <div>
                <strong>Due Date:</strong> {new Date(task.due_date).toLocaleDateString()}
              </div>
            </div>
            
            {/* Tags */}
            {task.tags.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Attachments */}
            {task.attachments.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Attachments</h4>
                <div className="space-y-1">
                  {task.attachments.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Download className="h-4 w-4" />
                      <span>{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </div>
          </div>
        )
      })
    },
    
    // Large Card with rich content
    largeCardConfig: {
      title: "Task Management",
      apiEndpoint: "/api/tasks",
      favoriteItemType: "tasks",
      searchFields: ["title", "description", "assignee"],
      categoryField: "status",
      
      renderLargeCard: (task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        categories: [task.status],
        tags: task.tags,
        icon: task.is_flagged ? <Star className="h-5 w-5 text-yellow-500 fill-current" /> : null,
        
        metadata: {
          "Assignee": task.assignee,
          "Due Date": new Date(task.due_date).toLocaleDateString(),
          "Created": new Date(task.created_at).toLocaleDateString(),
          "Progress": `${task.completion_percentage}%`
        },
        
        content: (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <StatusBadge status={task.status} />
              <PriorityIndicator priority={task.priority} />
            </div>
            <ProgressBar percentage={task.completion_percentage} />
          </div>
        ),
        
        actions: (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )
      })
    },
    
    // List View with expandable details
    listViewConfig: {
      title: "Task Management",
      apiEndpoint: "/api/tasks",
      favoriteItemType: "tasks",
      searchFields: ["title", "description", "assignee"],
      categoryField: "status",
      
      renderListItem: (task) => ({
        id: task.id,
        title: task.title,
        description: `Assigned to ${task.assignee} - Due ${new Date(task.due_date).toLocaleDateString()}`,
        categories: [task.status],
        tags: task.tags,
        
        metadata: {
          "Status": <StatusBadge status={task.status} />,
          "Priority": <PriorityIndicator priority={task.priority} />,
          "Progress": (
            <div className="flex items-center gap-2 w-32">
              <ProgressBar percentage={task.completion_percentage} />
              <span className="text-xs">{task.completion_percentage}%</span>
            </div>
          )
        },
        
        actions: (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost">
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )
      })
    }
  };
  
  return <DataPage config={config} />;
}