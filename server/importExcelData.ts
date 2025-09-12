import { readFileSync } from 'fs';
import { read, utils } from 'xlsx/xlsx.mjs';
import * as fs from 'fs';
import * as path from 'path';

// Function to parse Excel files and convert to JSON
export function parseExcelFile(filePath: string) {
  try {
    // Read the Excel file as buffer
    const buffer = readFileSync(filePath);
    const workbook = read(buffer);
    
    // Get all sheet names
    const sheetNames = workbook.SheetNames;
    console.log(`Found ${sheetNames.length} sheets:`, sheetNames);
    
    const allData: any = {};
    
    // Process each sheet
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with headers
      const jsonData = utils.sheet_to_json(worksheet, { 
        header: 1, // Use first row as headers
        defval: '', // Default value for empty cells
        blankrows: false // Skip blank rows
      });
      
      allData[sheetName] = jsonData;
      
      console.log(`Sheet "${sheetName}" has ${jsonData.length} rows`);
    });
    
    return allData;
  } catch (error) {
    console.error(`Error parsing Excel file: ${error}`);
    throw error;
  }
}

// Parse and analyze the prompt components file
export function analyzePromptComponents() {
  const filePath = path.join(process.cwd(), 'attached_assets/prompt_components_1757714561712.xlsx');
  console.log('\n=== Analyzing Prompt Components ===');
  
  const data = parseExcelFile(filePath);
  
  // Analyze structure of each sheet
  Object.entries(data).forEach(([sheetName, sheetData]: [string, any]) => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    
    if (Array.isArray(sheetData) && sheetData.length > 0) {
      // Get headers (first row)
      const headers = sheetData[0];
      console.log('Headers:', headers);
      console.log(`Total rows: ${sheetData.length - 1}`); // Minus header row
      
      // Show sample data (first few rows)
      console.log('Sample data (first 3 rows):');
      for (let i = 1; i < Math.min(4, sheetData.length); i++) {
        const row = sheetData[i];
        const rowObj: any = {};
        headers.forEach((header: string, index: number) => {
          if (header) rowObj[header] = row[index];
        });
        console.log(rowObj);
      }
    }
  });
  
  return data;
}

// Parse and analyze the aesthetics database file
export function analyzeAestheticsDatabase() {
  const filePath = path.join(process.cwd(), 'attached_assets/aesthetics_database_CLEANED (1)_1757714596783.xlsx');
  console.log('\n=== Analyzing Aesthetics Database ===');
  
  const data = parseExcelFile(filePath);
  
  // Analyze structure of each sheet
  Object.entries(data).forEach(([sheetName, sheetData]: [string, any]) => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    
    if (Array.isArray(sheetData) && sheetData.length > 0) {
      // Get headers (first row)
      const headers = sheetData[0];
      console.log('Headers:', headers);
      console.log(`Total rows: ${sheetData.length - 1}`); // Minus header row
      
      // Show sample data (first few rows)
      console.log('Sample data (first 3 rows):');
      for (let i = 1; i < Math.min(4, sheetData.length); i++) {
        const row = sheetData[i];
        const rowObj: any = {};
        headers.forEach((header: string, index: number) => {
          if (header) rowObj[header] = row[index];
        });
        console.log(rowObj);
      }
    }
  });
  
  return data;
}

// Convert sheet data to structured format
export function convertToStructuredData(sheetData: any[]) {
  if (!Array.isArray(sheetData) || sheetData.length < 2) {
    return [];
  }
  
  const headers = sheetData[0];
  const structuredData = [];
  
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    const rowObj: any = {};
    
    headers.forEach((header: string, index: number) => {
      if (header && row[index] !== undefined && row[index] !== '') {
        rowObj[header] = row[index];
      }
    });
    
    // Only add non-empty rows
    if (Object.keys(rowObj).length > 0) {
      structuredData.push(rowObj);
    }
  }
  
  return structuredData;
}

// Main function to analyze both files
export function analyzeAllExcelFiles() {
  try {
    const promptData = analyzePromptComponents();
    const aestheticsData = analyzeAestheticsDatabase();
    
    // Convert to structured format for easier import
    const structuredData: any = {
      promptComponents: {},
      aestheticsDatabase: {}
    };
    
    // Convert prompt components
    Object.entries(promptData).forEach(([sheetName, sheetData]: [string, any]) => {
      structuredData.promptComponents[sheetName] = convertToStructuredData(sheetData);
    });
    
    // Convert aesthetics database
    Object.entries(aestheticsData).forEach(([sheetName, sheetData]: [string, any]) => {
      structuredData.aestheticsDatabase[sheetName] = convertToStructuredData(sheetData);
    });
    
    // Save parsed data as JSON for inspection
    fs.writeFileSync(
      'prompt_components_data.json', 
      JSON.stringify(structuredData.promptComponents, null, 2)
    );
    
    fs.writeFileSync(
      'aesthetics_database_data.json', 
      JSON.stringify(structuredData.aestheticsDatabase, null, 2)
    );
    
    console.log('\n=== Data saved to JSON files ===');
    console.log('- prompt_components_data.json');
    console.log('- aesthetics_database_data.json');
    
    // Show summary statistics
    console.log('\n=== Summary Statistics ===');
    console.log('Prompt Components:');
    Object.entries(structuredData.promptComponents).forEach(([sheet, data]: [string, any]) => {
      console.log(`  ${sheet}: ${data.length} entries`);
    });
    
    console.log('\nAesthetics Database:');
    Object.entries(structuredData.aestheticsDatabase).forEach(([sheet, data]: [string, any]) => {
      console.log(`  ${sheet}: ${data.length} entries`);
    });
    
    return structuredData;
  } catch (error) {
    console.error('Error analyzing Excel files:', error);
    throw error;
  }
}

// Run if called directly
analyzeAllExcelFiles();