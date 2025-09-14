// Utilities for detecting and handling various file formats

export interface FileAnalysis {
  format: 'csv' | 'json' | 'jsonl' | 'yaml' | 'text' | 'unknown';
  structure: 'tabular' | 'nested' | 'list' | 'unstructured';
  confidence: number;
  suggestedParser: string;
}

export function detectFileFormat(content: string, filename: string): FileAnalysis {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  // Try to detect based on content if extension is unclear
  const trimmed = content.trim();
  
  // JSON detection
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed);
      return {
        format: 'json',
        structure: 'nested',
        confidence: 1.0,
        suggestedParser: 'json'
      };
    } catch {}
  }
  
  // JSON Lines detection
  if (trimmed.includes('}\n{') || trimmed.includes('}\r\n{')) {
    const lines = trimmed.split(/\r?\n/);
    let validJsonLines = 0;
    for (const line of lines.slice(0, 5)) {
      try {
        if (line.trim()) {
          JSON.parse(line);
          validJsonLines++;
        }
      } catch {}
    }
    if (validJsonLines >= 2) {
      return {
        format: 'jsonl',
        structure: 'list',
        confidence: 0.9,
        suggestedParser: 'jsonl'
      };
    }
  }
  
  // Array JSON detection
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      JSON.parse(trimmed);
      return {
        format: 'json',
        structure: 'list',
        confidence: 1.0,
        suggestedParser: 'json-array'
      };
    } catch {}
  }
  
  // CSV/TSV detection
  const lines = trimmed.split(/\r?\n/).filter(l => l.trim());
  if (lines.length >= 2) {
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : 
                     firstLine.includes(',') ? ',' : 
                     firstLine.includes('|') ? '|' : null;
    
    if (delimiter) {
      const firstFields = firstLine.split(delimiter).length;
      const secondFields = lines[1].split(delimiter).length;
      
      if (firstFields === secondFields && firstFields > 1) {
        return {
          format: 'csv',
          structure: 'tabular',
          confidence: 0.9,
          suggestedParser: 'csv'
        };
      }
    }
  }
  
  // YAML detection
  if (lines.some(l => l.includes(': ') || l.startsWith('- '))) {
    const yamlIndicators = [
      /^---/, // YAML document start
      /^\s*-\s+/, // List item
      /^\s*\w+:\s*/, // Key-value pair
      /^\s*#/, // Comment
    ];
    
    const matchCount = yamlIndicators.reduce((count, pattern) => 
      count + lines.filter(l => pattern.test(l)).length, 0
    );
    
    if (matchCount >= 3) {
      return {
        format: 'yaml',
        structure: 'nested',
        confidence: 0.7,
        suggestedParser: 'yaml'
      };
    }
  }
  
  // Default to text if can't determine
  return {
    format: extension === 'txt' ? 'text' : 'unknown',
    structure: 'unstructured',
    confidence: 0.5,
    suggestedParser: 'text'
  };
}

// Parse JSON array or object containing prompts
export function parseJsonPrompts(content: string): any[] {
  try {
    const parsed = JSON.parse(content);
    
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (typeof parsed === 'object') {
      // Try to find an array property
      const arrayKeys = Object.keys(parsed).filter(k => Array.isArray(parsed[k]));
      if (arrayKeys.length > 0) {
        // Return the first array found
        return parsed[arrayKeys[0]];
      }
      // If no array, wrap single object in array
      return [parsed];
    }
  } catch (error) {
    console.error('Failed to parse JSON:', error);
  }
  return [];
}

// Parse JSONL (newline-delimited JSON)
export function parseJsonLines(content: string): any[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const results: any[] = [];
  
  for (const line of lines) {
    try {
      if (line.trim()) {
        results.push(JSON.parse(line));
      }
    } catch (error) {
      console.error('Failed to parse JSON line:', line, error);
    }
  }
  
  return results;
}

// Extract prompts from unstructured text
export function extractPromptsFromText(content: string): Array<{
  promptContent: string;
  name: string;
}> {
  const prompts: Array<{ promptContent: string; name: string }> = [];
  
  // Try different delimiters for prompt separation
  const delimiters = [
    /^---+$/m, // Horizontal lines
    /^===+$/m, // Double lines
    /^\*\*\*+$/m, // Asterisks
    /^#{2,}/m, // Markdown headers
    /^Prompt \d+:/im, // Numbered prompts
    /^\d+\.\s+/m, // Numbered list
  ];
  
  let sections: string[] = [content];
  
  // Try to split by delimiters
  for (const delimiter of delimiters) {
    if (delimiter.test(content)) {
      sections = content.split(delimiter).filter(s => s.trim().length > 20);
      break;
    }
  }
  
  // If no clear sections, try paragraph separation
  if (sections.length === 1) {
    sections = content.split(/\n\s*\n/).filter(s => s.trim().length > 20);
  }
  
  // Process each section as a potential prompt
  sections.forEach((section, index) => {
    const trimmed = section.trim();
    if (trimmed) {
      // Try to extract a title from the first line
      const lines = trimmed.split('\n');
      let name = '';
      let promptContent = trimmed;
      
      // Check if first line looks like a title
      if (lines[0].length < 100 && !lines[0].includes('.')) {
        name = lines[0].trim();
        promptContent = lines.slice(1).join('\n').trim();
      } else {
        // Generate name from first few words
        const firstWords = trimmed.split(/\s+/).slice(0, 5).join(' ');
        name = firstWords.length > 50 ? 
          `${firstWords.substring(0, 50)}...` : 
          `${firstWords}...`;
      }
      
      if (!name) {
        name = `Prompt ${index + 1}`;
      }
      
      prompts.push({
        name,
        promptContent: promptContent || trimmed
      });
    }
  });
  
  return prompts;
}