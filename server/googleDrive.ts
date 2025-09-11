import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Request, Response } from 'express';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? 'https://promptatrium.replit.app/api/auth/google/callback'
  : `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`;

// Create OAuth2 client
export function createOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

// Generate auth URL for user consent
export function getAuthUrl(state?: string): string {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: state || '',
    prompt: 'consent'
  });
}

// Exchange authorization code for tokens
export async function getTokens(code: string): Promise<any> {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Save file to Google Drive
export async function saveToGoogleDrive(
  accessToken: string,
  fileName: string,
  fileContent: string,
  mimeType: string = 'application/json'
): Promise<{ id: string; webViewLink: string }> {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  // Create PromptAtrium folder if it doesn't exist
  const folderName = 'PromptAtrium';
  let folderId: string | undefined;
  
  try {
    // Check if folder exists
    const folderResponse = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });
    
    if (folderResponse.data.files && folderResponse.data.files.length > 0) {
      folderId = folderResponse.data.files[0].id!;
    } else {
      // Create folder
      const createFolderResponse = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      folderId = createFolderResponse.data.id!;
    }
  } catch (error) {
    console.error('Error creating/finding folder:', error);
    // Continue without folder
  }
  
  // Upload file
  const fileMetadata: any = {
    name: fileName,
  };
  
  if (folderId) {
    fileMetadata.parents = [folderId];
  }
  
  const media = {
    mimeType: mimeType,
    body: fileContent
  };
  
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink'
  });
  
  return {
    id: response.data.id!,
    webViewLink: response.data.webViewLink!
  };
}

// Refresh access token if needed
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials.access_token!;
}