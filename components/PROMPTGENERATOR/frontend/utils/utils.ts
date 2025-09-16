/**
 * Utility functions for the Prompt Generator
 */

/**
 * Utility function to convert string array to dropdown option format
 */
export function optionsArrayToDropdownFormat(options: string[]) {
  if (!options || !Array.isArray(options)) return [];
  return options.map(option => ({
    label: option,
    value: option
  }));
}

/**
 * Map of category names to their display labels
 */
export const categoryDisplayLabels: Record<string, string> = {
  architecture: "Architecture",
  art: "Art",
  brands: "Brands",
  cinematic: "Cinematic",
  fashion: "Fashion",
  feelings: "Feelings",
  foods: "Foods",
  geography: "Geography",
  human: "Human",
  interaction: "Interaction",
  keywords: "Keywords",
  objects: "Objects",
  people: "People",
  plots: "Plots",
  scene: "Scene",
  science: "Science",
  stuff: "Stuff",
  time: "Time",
  typography: "Typography",
  vehicle: "Vehicle",
  videogame: "Videogame",
  // For form field names
  architectureOptions: "Architecture",
  artOptions: "Art",
  brandsOptions: "Brands",
  cinematicOptions: "Cinematic",
  fashionOptions: "Fashion",
  feelingsOptions: "Feelings",
  foodsOptions: "Foods",
  geographyOptions: "Geography",
  humanOptions: "Human",
  interactionOptions: "Interaction",
  keywordsOptions: "Keywords",
  objectsOptions: "Objects",
  peopleOptions: "People",
  plotsOptions: "Plots",
  sceneOptions: "Scene",
  scienceOptions: "Science",
  stuffOptions: "Stuff",
  timeOptions: "Time",
  typographyOptions: "Typography",
  vehicleOptions: "Vehicle",
  videogameOptions: "Videogame"
};

/**
 * Converts nested detailed option values to a flat string for the prompt generator
 */
export function nestedDetailedOptionsToString(categoryValues: Record<string, string>): string {
  if (!categoryValues) return "";
  
  return Object.entries(categoryValues)
    .filter(([_, value]) => value && value !== "" && value !== "none")
    .map(([_, value]) => value)
    .join(", ");
}

/**
 * Prepares all nested detailed options for the prompt generator
 */
export function prepareDetailedOptionsForPrompt(
  detailedOptions: Record<string, Record<string, string>>
): Record<string, string> {
  if (!detailedOptions) return {};
  
  const result: Record<string, string> = {};
  
  // Process each category
  Object.entries(detailedOptions).forEach(([category, subCategoryValues]) => {
    result[`${category}Options`] = nestedDetailedOptionsToString(subCategoryValues);
  });
  
  return result;
}

/**
 * Classname utility - simplified version of clsx
 */
export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  
  return classes.join(' ');
}

/**
 * Format date to localized string
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  
  const clonedObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Parse JSON safely
 */
export function parseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get value from localStorage safely
 */
export function getFromStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Set value to localStorage safely
 */
export function setToStorage(key: string, value: any): void {
  if (!isBrowser()) return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

/**
 * Remove value from localStorage
 */
export function removeFromStorage(key: string): void {
  if (!isBrowser()) return;
  
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to remove from localStorage:', e);
  }
}