import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../frontend/hooks/use-toast';
import { Button } from '../../frontend/components/ui/button';
import { CheckCircle2, Circle, Plus } from 'lucide-react';

const queryClient = new QueryClient();

/**
 * Todo List Example
 * 
 * Specialized todo list implementation using the Notes package
 * with todo-specific features:
 * - Interactive checkboxes
 * - Progress tracking
 * - Due dates
 * - Priority levels
 * - Recurring tasks
 * - Subtasks
 */
export default function TodoApp() {
  const [todos, setTodos] = useState([
    {
      id: 1,
      title: 'Complete project documentation',
      completed: false,
      priority: 'high',
      dueDate: '2024-01-15',
      subtasks: [
        { id: 11, title: 'Write README', completed: true },
        { id: 12, title: 'API documentation', completed: false },
        { id: 13, title: 'User guide', completed: false },
      ],
    },
    {
      id: 2,
      title: 'Review pull requests',
      completed: false,
      priority: 'medium',
      dueDate: '2024-01-10',
      subtasks: [],
    },
    {
      id: 3,
      title: 'Update dependencies',
      completed: true,
      priority: 'low',
      dueDate: '2024-01-08',
      subtasks: [],
    },
  ]);

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const toggleSubtask = (todoId: number, subtaskId: number) => {
    setTodos(todos.map(todo => {
      if (todo.id === todoId) {
        return {
          ...todo,
          subtasks: todo.subtasks.map(subtask =>
            subtask.id === subtaskId 
              ? { ...subtask, completed: !subtask.completed }
              : subtask
          ),
        };
      }
      return todo;
    }));
  };

  const getProgress = (todo: any) => {
    if (todo.subtasks.length === 0) return todo.completed ? 100 : 0;
    const completed = todo.subtasks.filter((st: any) => st.completed).length;
    return Math.round((completed / todo.subtasks.length) * 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
              <p className="text-gray-600 mt-2">
                {todos.filter(t => !t.completed).length} active, {todos.filter(t => t.completed).length} completed
              </p>
            </div>

            {/* Add new todo */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new task..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>
            </div>

            {/* Todo list */}
            <div className="space-y-4">
              {todos.map(todo => (
                <div
                  key={todo.id}
                  className={`bg-white rounded-lg shadow p-4 ${
                    todo.completed ? 'opacity-75' : ''
                  }`}
                >
                  {/* Main todo */}
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className="mt-1"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {todo.title}
                      </h3>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(todo.priority)}`}>
                          {todo.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          Due: {new Date(todo.dueDate).toLocaleDateString()}
                        </span>
                        {todo.subtasks.length > 0 && (
                          <span className="text-xs text-gray-500">
                            Progress: {getProgress(todo)}%
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {todo.subtasks.length > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${getProgress(todo)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Subtasks */}
                      {todo.subtasks.length > 0 && (
                        <div className="mt-4 ml-2 space-y-2">
                          {todo.subtasks.map(subtask => (
                            <div key={subtask.id} className="flex items-center gap-2">
                              <button
                                onClick={() => toggleSubtask(todo.id, subtask.id)}
                              >
                                {subtask.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Circle className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                              <span className={`text-sm ${
                                subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'
                              }`}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ToastProvider>
    </QueryClientProvider>
  );
}