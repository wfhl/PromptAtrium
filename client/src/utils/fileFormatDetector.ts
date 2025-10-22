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
  
  // Normalize content
  const normalizedContent = content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with exactly 2
    .trim();
  
  // First, check for numbered list format (e.g., "1. Title" or "1) Title")
  const numberedPattern = /^\s*\d+[\.\)]\s+/gm;
  const hasNumberedList = numberedPattern.test(normalizedContent);
  
  if (hasNumberedList) {
    // Split by numbered items
    const parts = normalizedContent.split(/^\s*\d+[\.\)]\s+/gm);
    const numberLines = normalizedContent.match(/^\s*\d+[\.\)]\s+.*/gm) || [];
    
    // Skip the first empty part if it exists
    const startIndex = parts[0].trim() === '' ? 1 : 0;
    
    for (let i = startIndex; i < parts.length && (i - startIndex) < numberLines.length; i++) {
      const numberLine = numberLines[i - startIndex];
      const content = parts[i].trim();
      
      if (numberLine && content) {
        // Extract title from the numbered line
        const title = numberLine.replace(/^\s*\d+[\.\)]\s+/, '').trim();
        
        // Check if content starts with the title (title and content on same line)
        if (content.startsWith(title)) {
          const actualContent = content.substring(title.length).trim();
          if (actualContent) {
            prompts.push({
              name: title || `Prompt ${prompts.length + 1}`,
              promptContent: actualContent
            });
          } else {
            // Title only, use title as both name and content
            prompts.push({
              name: title || `Prompt ${prompts.length + 1}`,
              promptContent: title
            });
          }
        } else {
          // Title and content are separate
          prompts.push({
            name: title || `Prompt ${prompts.length + 1}`,
            promptContent: content
          });
        }
      }
    }
    
    if (prompts.length > 0) {
      return prompts;
    }
  }
  
  // Try different delimiters for prompt separation
  const delimiters = [
    /^---+$/m, // Horizontal lines
    /^===+$/m, // Double lines
    /^\*\*\*+$/m, // Asterisks
    /^#{2,}/m, // Markdown headers
    /^Prompt \d+:/im, // Numbered prompts with "Prompt" prefix
  ];
  
  let sections: string[] = [normalizedContent];
  
  // Try to split by delimiters
  for (const delimiter of delimiters) {
    if (delimiter.test(normalizedContent)) {
      sections = normalizedContent.split(delimiter).filter(s => s.trim().length > 20);
      break;
    }
  }
  
  // If no clear sections, try double line break (paragraph) separation
  if (sections.length === 1) {
    sections = normalizedContent.split(/\n\s*\n/).filter(s => s.trim().length > 20);
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
      // Title criteria: shorter than 100 chars, doesn't end with punctuation, starts with capital
      const firstLine = lines[0].trim();
      const looksLikeTitle = firstLine.length > 0 && 
                            firstLine.length < 100 && 
                            !firstLine.endsWith('.') && 
                            !firstLine.endsWith('!') &&
                            !firstLine.endsWith('?') &&
                            /^[A-Z]/.test(firstLine);
      
      if (lines.length >= 2 && looksLikeTitle) {
        // Use first line as title, rest as content
        name = firstLine;
        promptContent = lines.slice(1).join('\n').trim();
      } else {
        // Generate name from first few words
        const words = trimmed.split(/\s+/);
        const firstWords = words.slice(0, 5).join(' ');
        name = firstWords.length > 50 ? 
          `${firstWords.substring(0, 50)}...` : 
          (words.length > 5 ? `${firstWords}...` : firstWords);
      }
      
      if (!name) {
        name = `Prompt ${index + 1}`;
      }
      
      // Only add if we have actual content
      if (promptContent && promptContent.length > 0) {
        prompts.push({
          name,
          promptContent: promptContent
        });
      }
    }
  });
  
  return prompts;
}