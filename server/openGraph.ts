import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { pool } from "./db";

// User agents for social media crawlers
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'facebookcatalog',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'discord',
  'whatsapp',
  'telegrambot',
  'skypeuripreview',
  'pinterest',
  'tumblr',
  'redditbot',
  'applebot',        // Apple Messages
  'imessagebot',     // iMessage
  'googlebot',       // Google
  'bingbot',         // Bing
  'duckduckbot',     // DuckDuckGo
  'baiduspider',     // Baidu
  'yandexbot',       // Yandex
  'viberbot',        // Viber
  'kakaotalk-scrap', // KakaoTalk
  'line-poker'       // Line messenger
];

// Check if the request is from a social media crawler
function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(crawler => ua.includes(crawler));
}

// Helper to get the correct base URL
function getBaseUrl(req?: Request): string {
  // Try to get from request headers first (most reliable in production)
  if (req) {
    const host = req.headers.host || req.hostname;
    if (host && host.includes('promptatrium')) {
      const protocol = req.protocol || 'https';
      return `${protocol}://${host}`;
    }
  }
  
  // For production deployments on Replit
  if (process.env.REPLIT_DEPLOYMENT_ID || process.env.NODE_ENV === 'production') {
    // Check if we have REPLIT_DOMAINS environment variable (set by Replit deployment)
    if (process.env.REPLIT_DOMAINS) {
      const domains = process.env.REPLIT_DOMAINS.split(',');
      // Return the custom domain if it includes promptatrium
      const customDomain = domains.find(d => d.includes('promptatrium'));
      if (customDomain) {
        return `https://${customDomain}`;
      }
      // Otherwise use the first domain
      return `https://${domains[0]}`;
    }
    // If no REPLIT_DOMAINS, return the known production URL
    return 'https://promptatrium.replit.app';
  }
  
  // For development environment (Replit dev domain)
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  
  // Default fallback to production URL
  return 'https://promptatrium.replit.app';
}

// Generate Open Graph HTML for a prompt
function generateOpenGraphHTML(prompt: any, req?: Request): string {
  const title = prompt?.name || 'AI Prompt';
  const description = prompt?.description || 'Discover and share AI prompts';
  
  // Get the base URL for the application
  const baseUrl = getBaseUrl(req);
  
  // Handle image URL - ensure it's absolute
  let imageUrl = `${baseUrl}/atrium-square-icon.png`; // Default app icon with full URL
  
  // Check if prompt has example images
  if (prompt?.exampleImagesUrl && Array.isArray(prompt.exampleImagesUrl) && prompt.exampleImagesUrl.length > 0) {
    const firstImage = prompt.exampleImagesUrl[0];
    if (firstImage && firstImage.trim() !== '') {
      try {
        // Log the original image URL for debugging
        console.log('[Open Graph] Original image URL:', firstImage);
        
        // If the image URL is already an absolute URL (http/https)
        if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
          imageUrl = firstImage;
        } 
        // If it includes Google Cloud Storage domain without protocol
        else if (firstImage.includes('storage.googleapis.com') || firstImage.includes('googleusercontent.com')) {
          imageUrl = `https://${firstImage}`;
        }
        // For development storage paths - these are already properly formatted
        else if (firstImage.includes('/api/dev-storage/')) {
          // These paths come as /api/dev-storage/uploads/{id} or similar
          imageUrl = `${baseUrl}${firstImage.startsWith('/') ? firstImage : '/' + firstImage}`;
        }
        // If it's an /objects/ path (object storage path)
        else if (firstImage.startsWith('/objects/')) {
          // For object storage, we need to serve through the proper endpoint
          // Extract just the path after /objects/
          const objectPath = firstImage.substring('/objects/'.length);
          imageUrl = `${baseUrl}/api/objects/serve/${objectPath}`;
        }
        // If it starts with / (absolute path on our server)
        else if (firstImage.startsWith('/')) {
          imageUrl = `${baseUrl}${firstImage}`;
        }
        // Otherwise assume it's a relative path or object storage key
        else {
          // This could be an object storage key  
          imageUrl = `${baseUrl}/api/objects/serve/${firstImage}`;
        }
        
        console.log('[Open Graph] Processed image URL:', imageUrl);
        console.log('[Open Graph] Using base URL:', baseUrl);
        
        // Additional validation - make sure the URL is properly formed
        if (!imageUrl.includes('://')) {
          console.error('[Open Graph] Invalid URL generated:', imageUrl);
          imageUrl = `${baseUrl}/atrium-square-icon.png`;
        }
      } catch (error) {
        console.error('[Open Graph] Error processing image URL:', error);
        // Fall back to default app icon on error
        imageUrl = `${baseUrl}/atrium-square-icon.png`;
      }
    }
  }
  
  // Log for debugging with more detail
  console.log('[Open Graph] Base URL:', baseUrl);
  console.log('[Open Graph] Generated Image URL:', imageUrl);
  console.log('[Open Graph] Prompt example images:', prompt?.exampleImagesUrl);
  
  const author = prompt?.user?.username || prompt?.user?.firstName || 'Anonymous';
  
  // Escape HTML entities in text content
  const escapeHtml = (text: string) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(title)} | PromptAtrium</title>
  <meta name="title" content="${escapeHtml(title)} | PromptAtrium">
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Essential Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${baseUrl}/prompt/${prompt?.id}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  <meta property="og:site_name" content="PromptAtrium">
  <meta property="og:locale" content="en_US">
  <meta property="article:author" content="${escapeHtml(author)}">
  ${prompt?.createdAt ? `<meta property="article:published_time" content="${prompt.createdAt}">` : ''}
  ${prompt?.updatedAt ? `<meta property="article:modified_time" content="${prompt.updatedAt}">` : ''}
  ${prompt?.tags && prompt.tags.length > 0 ? prompt.tags.map((tag: string) => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join('\n  ') : ''}
  
  <!-- Twitter Card tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@promptatrium">
  <meta name="twitter:url" content="${baseUrl}/prompt/${prompt?.id}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  <meta name="twitter:image:alt" content="${escapeHtml(title)}">
  
  <!-- Additional SEO -->
  <link rel="canonical" href="${baseUrl}/prompt/${prompt?.id}">
  
  <!-- Redirect for non-crawlers if JavaScript is enabled -->
  <script>
    // Redirect to the actual app for regular browsers
    if (!window.location.pathname.includes('_meta')) {
      window.location.replace(window.location.href);
    }
  </script>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <p>By ${escapeHtml(author)}</p>
  ${prompt?.promptContent ? `<pre>${escapeHtml(prompt.promptContent)}</pre>` : ''}
  ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(title)}">` : ''}
  <p><a href="/">View on PromptAtrium</a></p>
</body>
</html>`;
}

// Open Graph middleware
export function setupOpenGraph(app: Express) {
  // Handle prompt detail pages for crawlers
  app.get('/prompt/:id', async (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.headers['user-agent'];
    
    // Only serve Open Graph HTML to crawlers
    if (!isCrawler(userAgent)) {
      return next();
    }
    
    const promptId = req.params.id;
    console.log(`[Open Graph] Crawler detected for prompt ${promptId}, user-agent: ${userAgent}`);
    
    try {
      // Check database connection first
      let dbAvailable = false;
      try {
        // Quick connection test with short timeout
        const testQuery = pool.query('SELECT 1', [], { queryTimeout: 1000 });
        await Promise.race([
          testQuery,
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB test timeout')), 1500))
        ]);
        dbAvailable = true;
        console.log('[Open Graph] Database connection successful');
      } catch (dbErr) {
        console.error('[Open Graph] Database connection failed:', dbErr.message);
      }
      
      if (!dbAvailable) {
        console.log('[Open Graph] Skipping database fetch due to connection issue');
        throw new Error('Database unavailable');
      }
      
      // Add timeout to prevent hanging in production
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      );
      
      // Try to fetch prompt with timeout
      const prompt = await Promise.race([
        storage.getPromptWithUser(promptId),
        timeoutPromise
      ]).catch(err => {
        console.error('[Open Graph] Database error:', err.message);
        return null;
      });
      
      if (!prompt) {
        console.log(`[Open Graph] Prompt ${promptId} not found or database unavailable`);
        // Serve fallback Open Graph tags with app icon
        const baseUrl = getBaseUrl(req);
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>AI Prompt | PromptAtrium</title>
  <meta name="title" content="AI Prompt | PromptAtrium">
  <meta name="description" content="Discover and share AI prompts for various generators. Join our community of AI enthusiasts.">
  
  <!-- Essential Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${baseUrl}/prompt/${promptId}">
  <meta property="og:title" content="AI Prompt">
  <meta property="og:description" content="Discover and share AI prompts for various generators. Join our community of AI enthusiasts.">
  <meta property="og:image" content="${baseUrl}/atrium-square-icon.png">
  <meta property="og:image:secure_url" content="${baseUrl}/atrium-square-icon.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:image:alt" content="PromptAtrium">
  <meta property="og:site_name" content="PromptAtrium">
  
  <!-- Twitter Card tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${baseUrl}/prompt/${promptId}">
  <meta name="twitter:title" content="AI Prompt">
  <meta name="twitter:description" content="Discover and share AI prompts for various generators.">
  <meta name="twitter:image" content="${baseUrl}/atrium-square-icon.png">
</head>
<body>
  <h1>PromptAtrium</h1>
  <p>Loading prompt...</p>
</body>
</html>`;
        return res.send(html);
      }
      
      console.log(`[Open Graph] Successfully fetched prompt ${promptId}: ${prompt.name}`);
      // Generate and send Open Graph HTML
      const html = generateOpenGraphHTML(prompt, req);
      res.send(html);
    } catch (error) {
      console.error('[Open Graph] Unexpected error:', error);
      // Serve minimal fallback instead of passing to next()
      const baseUrl = getBaseUrl(req);
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="PromptAtrium">
  <meta property="og:description" content="AI Prompt Discovery Platform">
  <meta property="og:image" content="${baseUrl}/atrium-square-icon.png">
  <meta property="og:url" content="${baseUrl}/prompt/${promptId}">
</head>
<body>
  <h1>PromptAtrium</h1>
</body>
</html>`;
      res.send(html);
    }
  });
  
  // Handle homepage for crawlers
  app.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.headers['user-agent'];
    
    if (!isCrawler(userAgent)) {
      return next();
    }
    
    // Get the base URL using the helper function
    const baseUrl = getBaseUrl(req);
    console.log('[Open Graph] Homepage crawler detected, user-agent:', userAgent);
    console.log('[Open Graph] Homepage - Base URL:', baseUrl);
    
    // Generate homepage Open Graph tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>PromptAtrium - AI Prompt Discovery & Sharing Platform</title>
  <meta name="title" content="PromptAtrium - AI Prompt Discovery & Sharing Platform">
  <meta name="description" content="Discover, create, and share AI prompts for various generators. Join our community of AI enthusiasts and unlock the potential of generative AI.">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${baseUrl}">
  <meta property="og:title" content="PromptAtrium - AI Prompt Discovery & Sharing Platform">
  <meta property="og:description" content="Discover, create, and share AI prompts for various generators. Join our community of AI enthusiasts and unlock the potential of generative AI.">
  <meta property="og:image" content="${baseUrl}/atrium-square-icon.png">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:site_name" content="PromptAtrium">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${baseUrl}">
  <meta property="twitter:title" content="PromptAtrium - AI Prompt Discovery & Sharing Platform">
  <meta property="twitter:description" content="Discover, create, and share AI prompts for various generators. Join our community of AI enthusiasts and unlock the potential of generative AI.">
  <meta property="twitter:image" content="${baseUrl}/atrium-square-icon.png">
</head>
<body>
  <h1>PromptAtrium</h1>
  <p>Discover, create, and share AI prompts for various generators.</p>
  <p><a href="/">Visit PromptAtrium</a></p>
</body>
</html>`;
    
    res.send(html);
  });
}