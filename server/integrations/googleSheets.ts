import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export interface AIService {
  name: string;
  description: string;
  category: string;
  website: string;
  pricing: string;
  features: string;
}

export async function fetchAIServices(): Promise<AIService[]> {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    const spreadsheetId = '1tfOk1b_ygQfKJlLCXOS2VYH1Y8AiAAodhvvMHmDIMtg';
    
    // Get spreadsheet metadata to find the first sheet's name
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    const firstSheet = metadata.data.sheets?.[0];
    if (!firstSheet?.properties?.title) {
      throw new Error('No sheets found in spreadsheet');
    }
    
    const sheetName = firstSheet.properties.title;
    console.log(`Using sheet: ${sheetName}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:F`,
    });

    const rows = response.data.values || [];
    console.log(`Fetched ${rows.length} AI services from Google Sheets`);
    
    return rows.map(row => ({
      name: row[0] || '',
      description: row[1] || '',
      category: row[2] || '',
      website: row[3] || '',
      pricing: row[4] || '',
      features: row[5] || '',
    }));
  } catch (error) {
    console.error('Error fetching AI services from Google Sheets:', error);
    throw error;
  }
}
