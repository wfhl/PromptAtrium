import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

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
  'redditbot'
];

// Check if the request is from a social media crawler
function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(crawler => ua.includes(crawler));
}

// Generate Open Graph HTML for a prompt
function generateOpenGraphHTML(prompt: any): string {
  const title = prompt?.name || 'AI Prompt';
  const description = prompt?.description || 'Discover and share AI prompts';
  
  // Get the base URL for the application
  const baseUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` 
    : 'https://promptatrium.com';
  
  // Handle image URL - ensure it's absolute
  let imageUrl = `${baseUrl}/atrium-square-icon.png`; // Default app icon with full URL
  
  // Check if prompt has example images
  if (prompt?.exampleImagesUrl && Array.isArray(prompt.exampleImagesUrl) && prompt.exampleImagesUrl.length > 0) {
    const firstImage = prompt.exampleImagesUrl[0];
    if (firstImage) {
      // If the image URL is already an absolute URL (http/https)
      if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
        imageUrl = firstImage;
      } 
      // If it includes Google Cloud Storage domain without protocol
      else if (firstImage.includes('storage.googleapis.com') || firstImage.includes('googleusercontent.com')) {
        imageUrl = `https://${firstImage}`;
      }
      // If it's an /objects/ path (object storage path)
      else if (firstImage.startsWith('/objects/') || firstImage.includes('/objects/')) {
        // Use the serve endpoint for object storage
        imageUrl = `${baseUrl}/api/objects/serve/${encodeURIComponent(firstImage)}`;
      }
      // If it starts with / (absolute path on our server)
      else if (firstImage.startsWith('/')) {
        imageUrl = `${baseUrl}${firstImage}`;
      }
      // Otherwise assume it's a relative path
      else {
        // This could be an object storage key
        imageUrl = `${baseUrl}/api/objects/serve/${encodeURIComponent(firstImage)}`;
      }
    }
  }
  
  // Log for debugging
  console.log('Open Graph Image URL:', imageUrl);
  console.log('Prompt example images:', prompt?.exampleImagesUrl);
  
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
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${baseUrl}/prompt/${prompt?.id}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:site_name" content="PromptAtrium">
  <meta property="article:author" content="${escapeHtml(author)}">
  ${prompt?.createdAt ? `<meta property="article:published_time" content="${prompt.createdAt}">` : ''}
  ${prompt?.updatedAt ? `<meta property="article:modified_time" content="${prompt.updatedAt}">` : ''}
  ${prompt?.tags && prompt.tags.length > 0 ? prompt.tags.map((tag: string) => `<meta property="article:tag" content="${escapeHtml(tag)}">`).join('\n  ') : ''}
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${baseUrl}/prompt/${prompt?.id}">
  <meta property="twitter:title" content="${escapeHtml(title)}">
  <meta property="twitter:description" content="${escapeHtml(description)}">
  <meta property="twitter:image" content="${imageUrl}">
  
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
    
    try {
      const promptId = req.params.id;
      
      // Fetch prompt with user information
      const prompt = await storage.getPromptWithUser(promptId);
      
      if (!prompt) {
        // If prompt not found, still serve basic Open Graph tags
        const html = generateOpenGraphHTML({
          name: 'Prompt Not Found',
          description: 'The requested prompt could not be found.',
          id: promptId
        });
        return res.status(404).send(html);
      }
      
      // Generate and send Open Graph HTML
      const html = generateOpenGraphHTML(prompt);
      res.send(html);
    } catch (error) {
      console.error('Error generating Open Graph tags:', error);
      // Fallback to regular app on error
      next();
    }
  });
  
  // Handle homepage for crawlers
  app.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.headers['user-agent'];
    
    if (!isCrawler(userAgent)) {
      return next();
    }
    
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
  <meta property="og:url" content="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'https://promptatrium.com'}">
  <meta property="og:title" content="PromptAtrium - AI Prompt Discovery & Sharing Platform">
  <meta property="og:description" content="Discover, create, and share AI prompts for various generators. Join our community of AI enthusiasts and unlock the potential of generative AI.">
  <meta property="og:image" content="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'https://promptatrium.com'}/atrium-square-icon.png">
  <meta property="og:site_name" content="PromptAtrium">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'https://promptatrium.com'}">
  <meta property="twitter:title" content="PromptAtrium - AI Prompt Discovery & Sharing Platform">
  <meta property="twitter:description" content="Discover, create, and share AI prompts for various generators. Join our community of AI enthusiasts and unlock the potential of generative AI.">
  <meta property="twitter:image" content="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'https://promptatrium.com'}/atrium-square-icon.png">
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