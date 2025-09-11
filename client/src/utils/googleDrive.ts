import { apiRequest } from "@/lib/queryClient";

// Google Drive token storage
const STORAGE_KEY = 'google_drive_tokens';

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
  token_type?: string;
}

// Store tokens in localStorage
export function storeGoogleTokens(tokens: GoogleTokens): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

// Get tokens from localStorage
export function getGoogleTokens(): GoogleTokens | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

// Clear stored tokens
export function clearGoogleTokens(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Open Google OAuth consent screen
export async function connectGoogleDrive(): Promise<GoogleTokens> {
  return new Promise((resolve, reject) => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const authWindow = window.open(
      '/api/auth/google',
      'google-auth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!authWindow) {
      reject(new Error('Failed to open authentication window'));
      return;
    }
    
    // Listen for auth success message
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'google-auth-success') {
        window.removeEventListener('message', handleMessage);
        const tokens = event.data.tokens;
        storeGoogleTokens(tokens);
        resolve(tokens);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Check if window was closed
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        reject(new Error('Authentication cancelled'));
      }
    }, 1000);
  });
}

// Save file to Google Drive
export async function saveToGoogleDrive(
  fileName: string,
  fileContent: string,
  mimeType: string = 'application/json'
): Promise<{ id: string; webViewLink: string }> {
  let tokens = getGoogleTokens();
  
  if (!tokens) {
    // Need to authenticate first
    tokens = await connectGoogleDrive();
  }
  
  try {
    const response = await apiRequest('POST', '/api/google-drive/save', {
      fileName,
      fileContent,
      mimeType,
      accessToken: tokens.access_token
    });
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    // Check if token expired
    if (error.status === 401) {
      // Try to refresh token if we have a refresh token
      if (tokens.refresh_token) {
        try {
          const refreshResponse = await apiRequest('POST', '/api/google-drive/refresh-token', {
            refreshToken: tokens.refresh_token
          });
          
          const { accessToken } = await refreshResponse.json();
          
          // Update stored tokens
          tokens.access_token = accessToken;
          storeGoogleTokens(tokens);
          
          // Retry the save
          const retryResponse = await apiRequest('POST', '/api/google-drive/save', {
            fileName,
            fileContent,
            mimeType,
            accessToken
          });
          
          return await retryResponse.json();
        } catch (refreshError) {
          // Refresh failed, need to re-authenticate
          clearGoogleTokens();
          tokens = await connectGoogleDrive();
          
          // Retry with new tokens
          const retryResponse = await apiRequest('POST', '/api/google-drive/save', {
            fileName,
            fileContent,
            mimeType,
            accessToken: tokens.access_token
          });
          
          return await retryResponse.json();
        }
      } else {
        // No refresh token, need to re-authenticate
        clearGoogleTokens();
        tokens = await connectGoogleDrive();
        
        // Retry with new tokens
        const retryResponse = await apiRequest('POST', '/api/google-drive/save', {
          fileName,
          fileContent,
          mimeType,
          accessToken: tokens.access_token
        });
        
        return await retryResponse.json();
      }
    }
    
    throw error;
  }
}

// Check if Google Drive is connected
export function isGoogleDriveConnected(): boolean {
  return !!getGoogleTokens();
}

// Disconnect Google Drive
export function disconnectGoogleDrive(): void {
  clearGoogleTokens();
}