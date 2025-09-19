# Quick Prompter Technical Integration Guide
## Complete API Documentation for External Application Integration

### Table of Contents
1. [System Overview](#system-overview)
2. [Frontend User Interface](#frontend-user-interface)
3. [User Input Handling](#user-input-handling)
4. [Result Display and Rendering](#result-display-and-rendering)
5. [Custom Vision Server Integration](#custom-vision-server-integration)
6. [Vision Analysis Pipeline](#vision-analysis-pipeline)
7. [LLM Enhancement Pipeline](#llm-enhancement-pipeline)
8. [Complete API Reference](#complete-api-reference)
9. [Implementation Examples](#implementation-examples)
10. [Error Handling](#error-handling)
11. [Configuration Requirements](#configuration-requirements)

---

## System Overview

The Quick Prompter operates as a sophisticated two-stage AI pipeline:
- **Stage 1**: Vision Analysis (Image → Descriptive Text)
- **Stage 2**: Prompt Enhancement (Text → Enhanced AI Prompt)

### Core Architecture
```
User Input → Vision Analysis → Caption Generation → LLM Enhancement → Final Prompt
     ↓              ↓                    ↓                  ↓              ↓
   Image      Custom Vision/      Text Caption      Template +        Enhanced
             JoyCaption/GPT-4o                      LLM Processing     Output
```

---

## Complete Step-by-Step Workflow

### Phase 1: User Input Collection

#### Step 1: Page Load and Initialization
```typescript
// 1.1 Component mounts and initializes state
const [subject, setSubject] = useState("");
const [character, setCharacter] = useState("");
const [template, setTemplate] = useState("");
const [generatedPrompt, setGeneratedPrompt] = useState("");

// 1.2 Load JSON prompt data for random suggestions
useEffect(() => {
  fetch('/data/jsonprompthelper.json')
    .then(response => response.json())
    .then(data => setJsonPromptData(data));
}, []);

// 1.3 Fetch character presets from database
const { data: characterPresets } = useQuery({
  queryKey: ['/api/system-data/character-presets']
});

// 1.4 Fetch template options from database
const { data: dbRuleTemplates } = useQuery({
  queryKey: ['/api/system-data/prompt-templates']
});

// 1.5 Restore previous template selection from localStorage
useEffect(() => {
  const savedTemplate = localStorage.getItem('quickPrompt-selectedTemplate');
  if (savedTemplate) setTemplate(savedTemplate);
}, []);
```

#### Step 2: User Provides Input
```typescript
// Option A: Text Subject Input
// User types: "A majestic mountain landscape at sunset"
setSubject(e.target.value);

// Option B: Random Subject Selection
// User clicks sparkle button → selects category → gets random prompt
handleJsonPromptSelection('nature_scenes');
// Sets subject to: "misty forest with ancient trees and golden sunlight"

// Option C: Image Upload
// User selects image file
handleImageUpload(event);
// → File converted to base64 data URL
// → Preview displayed in UI
// → Image stored as: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
```

#### Step 3: Optional Character Selection
```typescript
// User selects from dropdown
setCharacter("character-preset-123"); // Database preset
// OR
setCharacter("custom-character"); // Custom description
setCustomCharacterInput("A warrior princess with flowing red hair");
```

#### Step 4: Template Selection
```typescript
// User selects enhancement template
setTemplate("photo_master_v1");
// Template contains master_prompt for LLM instructions
```

### Phase 2: Processing Initiation

#### Step 5: User Clicks Generate Button
```typescript
<Button onClick={handleGeneratePrompt} disabled={isGenerating}>
  {isGenerating ? (
    <><Loader2 className="animate-spin" /> Generating...</>
  ) : (
    <><Sparkles /> Generate Prompt</>
  )}
</Button>
```

#### Step 6: Validation and UI State Update
```typescript
const handleGeneratePrompt = async () => {
  // 6.1 Validate input
  if (!subject && !uploadedImage) {
    toast({ title: "Input required", variant: "destructive" });
    return;
  }
  
  // 6.2 Update UI states
  setIsGenerating(true);
  setProgressVisible(true);
  setProcessingStage('Initializing...');
  
  // 6.3 Hide previous results
  setShowGeneratedSection(false);
  setShowImageAnalysis(false);
```

### Phase 3: Vision Analysis (If Image Provided)

#### Step 7: Image Processing
```typescript
if (uploadedImage && imagePreview) {
  // 7.1 Update progress indicator
  setProcessingStage('🔍 Analyzing image with vision model...');
  
  // 7.2 Prepare vision API request
  const visionRequestPayload = {
    image: imagePreview, // base64 data URL
    model: 'custom-vision', // or 'joy-caption', 'gpt-4o'
    captionStyle: 'Descriptive',
    captionLength: 'medium',
    customPrompt: 'Analyze this image for AI generation...'
  };
  
  // 7.3 Make API call to vision service
  const captionResponse = await fetch('/api/caption/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(visionRequestPayload)
  });
```

#### Step 8: Vision Service Processing (Backend)
```typescript
// 8.1 Server receives request at /api/caption/generate
// Extract base64 image and create temp file
const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));

// 8.2 Try Custom Vision Server first
if (modelName === 'custom-vision') {
  try {
    // 8.2.1 Call Florence-2 server at localhost:7860
    const formData = new FormData();
    formData.append('file', imageBuffer);
    formData.append('prompt', options.prompt);
    
    const response = await axios.post(
      'http://localhost:7860/analyze',
      formData,
      { timeout: 30000 }
    );
    
    // 8.2.2 Florence-2 returns detailed caption
    return {
      caption: "A serene mountain landscape with snow-capped peaks...",
      confidence: 0.95,
      model: 'Florence-2'
    };
  } catch (error) {
    // 8.2.3 If custom vision fails, fall back to next service
    console.log('Custom Vision offline, trying JoyCaption...');
  }
}

// 8.3 Try JoyCaption as primary/fallback
try {
  const joyCaptionResult = await analyzeImageWithJoyCaption(tempFilePath, {
    captionStyle: 'Descriptive',
    captionLength: 'medium'
  });
  // Returns unrestricted image analysis
} catch {
  // 8.4 Final fallback to GPT-4o Vision
  const gpt4Result = await analyzeWithGPT4Vision(imageData);
}
```

#### Step 9: Vision Response Processing
```typescript
// 9.1 Receive vision analysis response
const captionData = await captionResponse.json();
/*
Response structure:
{
  caption: "A dramatic mountain landscape featuring snow-capped peaks...",
  metadata: {
    model: "Florence-2",
    timestamp: "2024-01-15T10:30:00Z",
    serverOnline: true
  },
  debugReport: [...]
}
*/

// 9.2 Clean and store the caption
let imageCaption = captionData.caption;
imageCaption = imageCaption
  .replace(/I'm unable to identify[^.]+\./g, '')
  .replace(/the visual elements[:\s]*/gi, '')
  .trim();

// 9.3 Update state with image analysis
setImageAnalysisResponse(imageCaption);
effectiveSubject = imageCaption; // Use as subject for enhancement
```

### Phase 4: Prompt Enhancement

#### Step 10: Build Base Prompt
```typescript
// 10.1 Start with subject (from text or image analysis)
let basePrompt = effectiveSubject;
// "A dramatic mountain landscape with snow-capped peaks..."

// 10.2 Add character if selected
if (character && character !== 'no-character') {
  const selectedCharacter = characterPresets.find(p => p.id === character);
  basePrompt = `${selectedCharacter.name}, ${basePrompt}`;
  // "Warrior Princess Elena, A dramatic mountain landscape..."
}

// 10.3 Get selected template details
const selectedTemplate = dbRuleTemplates.find(t => t.id === template);
// Contains master_prompt with enhancement instructions
```

#### Step 11: LLM Enhancement Request
```typescript
// 11.1 Update progress
setProcessingStage('🎨 Applying Photography Master formatting...');

// 11.2 Prepare enhancement request
const enhancementRequest = {
  prompt: basePrompt,
  llmProvider: selectedTemplate.llm_provider, // 'openai'
  llmModel: selectedTemplate.llm_model, // 'gpt-4o'
  useHappyTalk: selectedTemplate.use_happy_talk,
  compressPrompt: selectedTemplate.compress_prompt,
  compressionLevel: selectedTemplate.compression_level,
  customBasePrompt: selectedTemplate.master_prompt, // Template instructions
  templateId: selectedTemplate.id,
  subject: subject, // Original subject for replacements
  character: characterData // Character for replacements
};

// 11.3 Call enhancement API
const response = await fetch('/api/enhance-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(enhancementRequest)
});
```

#### Step 12: LLM Processing (Backend)
```typescript
// 12.1 Server receives enhancement request
export async function enhancePromptWithLLM(request) {
  // 12.2 Select template type
  let templateType = 'custom'; // Using database master_prompt
  
  // 12.3 Build system prompt
  let systemPrompt = request.customBasePrompt + 
    "\n\nOriginal prompt:\n" + request.prompt + 
    "\n\nEnhanced prompt:";
  
  // 12.4 Add character/subject instructions
  if (request.character) {
    systemPrompt += `\nReplace generic characters with: ${request.character}`;
  }
  
  // 12.5 Call OpenAI API
  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: request.prompt }
    ],
    max_tokens: 2000,
    temperature: 0.7
  });
  
  // 12.6 Clean and return enhanced prompt
  return cleanLLMResponse(completion.choices[0].message.content);
}
```

#### Step 13: Enhancement Response
```typescript
// 13.1 Receive enhanced prompt
const result = await response.json();
/*
{
  enhancedPrompt: "Cinematic wide-angle shot, Warrior Princess Elena standing 
    majestically on a snow-capped mountain peak at golden hour, dramatic 
    lighting with god rays piercing through clouds, shot on RED camera with 
    anamorphic lens, f/2.8, ISO 100, hyperrealistic detail, epic scale 
    composition following rule of thirds, color graded with teal and orange 
    split-toning, 8K resolution, photorealistic rendering",
  diagnostics: {
    modelUsed: "gpt-4o",
    responseTime: 1234,
    templateSource: "database"
  }
}
*/

// 13.2 Update state with enhanced prompt
setGeneratedPrompt(result.enhancedPrompt);
```

### Phase 5: Result Display

#### Step 14: Update UI with Results
```typescript
// 14.1 Hide progress indicators
setIsGenerating(false);
setProgressVisible(false);
setProcessingStage('');

// 14.2 Show generated prompt section
setShowGeneratedSection(true);

// 14.3 Display generated prompt in textarea
<Textarea
  value={generatedPrompt}
  onChange={(e) => setGeneratedPrompt(e.target.value)}
  className="min-h-[200px] bg-gray-800/50"
/>

// 14.4 Show image analysis if image was used
if (imageAnalysisResponse) {
  setShowImageAnalysis(true);
  // Displays the vision model's caption in collapsible card
}

// 14.5 Enable action buttons
// Copy, Share, Save buttons become active
```

#### Step 15: User Actions with Results
```typescript
// 15.1 Copy to Clipboard
const handleCopyPrompt = () => {
  navigator.clipboard.writeText(generatedPrompt);
  toast({ title: "Copied to clipboard" });
};

// 15.2 Share to Library
const handleShare = () => {
  setShareModalOpen(true);
  // Opens modal to share to public/private library
};

// 15.3 Save to Personal Library
const handleSave = async () => {
  await apiRequest('/api/saved-prompts', 'POST', {
    prompt: generatedPrompt,
    title: `Enhanced prompt - ${new Date().toLocaleDateString()}`,
    tags: ['ai-generated'],
    category_id: selectedCategory
  });
};

// 15.4 Edit Prompt
// User can directly edit the generated prompt in textarea
// Changes are reflected in real-time
```

### Phase 6: Additional Features

#### Step 16: Social Media Caption (Optional)
```typescript
if (uploadedImage) {
  // 16.1 User clicks caption dropdown
  handleGenerateSocialCaption('professional');
  
  // 16.2 Call GPT-4o with tone-specific prompt
  const response = await fetch('/api/caption/generate', {
    body: JSON.stringify({
      image: imagePreview,
      model: 'gpt-4o',
      customPrompt: tonePrompts['professional']
    })
  });
  
  // 16.3 Display formatted social caption
  setSocialMediaCaption(response.caption);
  setShowSocialCaption(true);
}
```

#### Step 17: Debug Report (Developer Mode)
```typescript
// 17.1 Aggregate debug information
const debugReport = [
  {
    stage: 'Vision Analysis',
    model: 'Florence-2',
    timestamp: '2024-01-15T10:30:00Z',
    captionLength: 245,
    serverStatus: 'online'
  },
  {
    stage: 'LLM Enhancement',
    model: 'gpt-4o',
    responseTime: 1234,
    templateUsed: 'photo_master_v1'
  }
];

// 17.2 Display in collapsible debug panel
setShowDebugReport(true);
```

### Complete Data Flow Summary

```
1. USER INPUT
   ├─ Text: "mountain landscape"
   ├─ Image: photo.jpg → base64
   ├─ Character: "Warrior Princess"
   └─ Template: "Photography Master"
           ↓
2. VISION ANALYSIS (if image)
   ├─ Try: Custom Vision Server (Florence-2)
   ├─ Fallback: JoyCaption Service
   └─ Final Fallback: GPT-4o Vision
           ↓
   Returns: "Dramatic mountain peaks with snow..."
           ↓
3. PROMPT BUILDING
   ├─ Base: vision caption OR user text
   ├─ Add: character prefix
   └─ Prepare: template master prompt
           ↓
4. LLM ENHANCEMENT
   ├─ Provider: OpenAI
   ├─ Model: GPT-4o
   ├─ System Prompt: Template instructions
   └─ User Prompt: Base prompt
           ↓
   Returns: "Cinematic wide-angle shot..."
           ↓
5. DISPLAY RESULTS
   ├─ Show: Enhanced prompt (editable)
   ├─ Show: Image analysis (if used)
   ├─ Enable: Copy/Share/Save actions
   └─ Optional: Social captions, debug info
```

---

## Frontend User Interface

### Component Structure (React/TypeScript)

```typescript
// Main component: QuickPromptPlay.tsx
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
```

### UI Layout Structure

The Quick Prompter UI is organized in a **two-column grid layout**:

**Left Column - Input Controls:**
1. Subject text field with sparkle button for random prompts
2. Image upload section (optional)
3. Character selection dropdown
4. Template selection dropdown
5. Generate button with loading states

**Right Column - Results Display:**
1. Generated prompt textarea
2. Action buttons (Copy, Share, Save)
3. Image analysis display (when image uploaded)
4. Social media captions (optional)
5. Debug report (collapsible)

---

## User Input Handling

### 1. Subject Text Input

```typescript
// State management for text input
const [subject, setSubject] = useState("");
const [sparklePopoverOpen, setSparklePopoverOpen] = useState(false);
const [jsonPromptData, setJsonPromptData] = useState<{[key: string]: string[]} | null>(null);

// Subject input with random prompt helper
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <Label htmlFor="subject" className="text-sm text-gray-400">Subject</Label>
    {jsonPromptData && (
      <Popover open={sparklePopoverOpen} onOpenChange={setSparklePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-800/50"
          >
            <Sparkles className="h-4 w-4 text-pink-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          {/* Random prompt categories */}
          {Object.keys(jsonPromptData).map((category) => (
            <Button
              key={category}
              onClick={() => handleJsonPromptSelection(category)}
            >
              {category.replace(/_/g, ' ')}
              <span className="text-xs">
                {jsonPromptData[category]?.length || 0} prompts
              </span>
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    )}
  </div>
  <Input
    id="subject"
    placeholder="Try clicking on the pink sparkles for random inspiration?"
    value={subject}
    onChange={(e) => setSubject(e.target.value)}
    className="bg-gray-800/50 border-gray-700"
  />
</div>

// Random prompt selection handler
const handleJsonPromptSelection = (category: string) => {
  if (!jsonPromptData || !jsonPromptData[category]) return;
  
  const prompts = jsonPromptData[category];
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  setSubject(randomPrompt);
  setSparklePopoverOpen(false);
  
  toast({
    title: "Subject filled",
    description: `Random prompt from "${category.replace(/_/g, ' ')}" category`,
  });
};
```

### 2. Image Upload Handling

```typescript
// State for image handling
const [uploadedImage, setUploadedImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);

// Image upload handler
const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file && file.type.startsWith('image/')) {
    setUploadedImage(file);
    
    // Clear previous analysis
    setImageAnalysisResponse('');
    setShowImageAnalysis(false);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

// Image upload UI component
<div className="space-y-2">
  <Label className="text-sm text-gray-400">Image (Optional)</Label>
  <div className="flex items-center gap-2">
    {!imagePreview ? (
      <div className="flex-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="flex items-center justify-center gap-2 px-3 py-2 
                   bg-gradient-to-br from-purple-700/50 to-purple-900/50 
                   border border-gray-700 rounded-md cursor-pointer 
                   hover:bg-gray-800/70 transition-colors"
        >
          <ImageIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-400/70">Upload Image</span>
        </label>
      </div>
    ) : (
      <div className="flex items-center gap-2 flex-1">
        <div className="relative h-10 w-10 rounded overflow-hidden border border-gray-700">
          <img 
            src={imagePreview} 
            alt="Uploaded" 
            className="h-full w-full object-cover"
          />
        </div>
        <span className="text-sm text-gray-400 truncate flex-1">
          Image uploaded
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveImage}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4 text-gray-400" />
        </Button>
      </div>
    )}
  </div>
</div>
```

### 3. Character Selection

```typescript
// Character state and data fetching
const [character, setCharacter] = useState("");
const [showCustomCharacterInput, setShowCustomCharacterInput] = useState(false);
const [customCharacterInput, setCustomCharacterInput] = useState("");

// Fetch character presets from database
const { data: characterPresets = [] } = useQuery({
  queryKey: ['/api/system-data/character-presets'],
  select: (data: any[]) => {
    return data
      .map(preset => ({
        id: preset.id.toString(),
        name: preset.name,
        description: `${preset.gender || 'Character'} - ${preset.role || preset.description}`,
        isFavorite: preset.is_favorite || false,
        isCustom: true
      }))
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
      });
  }
});

// Character selection UI
<div className="space-y-2">
  <Label className="text-sm text-gray-400">Character (Optional)</Label>
  <Select value={character} onValueChange={handleCharacterChange}>
    <SelectTrigger className="bg-gray-800/50 border-gray-700">
      <SelectValue placeholder="Select character" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="no-character">No Character</SelectItem>
      {characterPresets.map((preset) => (
        <SelectItem key={preset.id} value={preset.id}>
          {preset.isFavorite && "⭐ "}{preset.name}
        </SelectItem>
      ))}
      <SelectItem value="custom-character">
        <Plus className="h-4 w-4 inline mr-2" />
        Custom Character
      </SelectItem>
    </SelectContent>
  </Select>
  
  {showCustomCharacterInput && (
    <div className="flex gap-2">
      <Input
        placeholder="Describe your custom character..."
        value={customCharacterInput}
        onChange={(e) => setCustomCharacterInput(e.target.value)}
        className="bg-gray-800/50 border-gray-700"
      />
      <Button onClick={handleSaveCustomCharacter} size="sm">
        <Save className="h-4 w-4" />
      </Button>
    </div>
  )}
</div>
```

### 4. Template Selection

```typescript
// Template state and persistence
const [template, setTemplate] = useState("");

// Fetch templates from database
const { data: dbRuleTemplates = [] } = useQuery({
  queryKey: ['/api/system-data/prompt-templates'],
  select: (data: any[]) => {
    return data.map(template => ({
      id: template.id,
      template_id: template.template_id,
      name: template.name,
      description: template.template || template.description,
      template_type: template.template_type,
      master_prompt: template.master_prompt,
      llm_provider: template.llm_provider,
      llm_model: template.llm_model,
      use_happy_talk: template.use_happy_talk,
      compress_prompt: template.compress_prompt,
      compression_level: template.compression_level,
      icon: getTemplateIcon(template.template_type, template.name)
    }));
  }
});

// Template selection with persistence
const handleTemplateChange = (value: string) => {
  setTemplate(value);
  localStorage.setItem('quickPrompt-selectedTemplate', value);
};

// Template selection UI
<div className="space-y-2">
  <Label className="text-sm text-gray-400">Style Template</Label>
  <Select value={template} onValueChange={handleTemplateChange}>
    <SelectTrigger className="bg-gray-800/50 border-gray-700">
      <SelectValue placeholder="Select template" />
    </SelectTrigger>
    <SelectContent>
      {dbRuleTemplates.map((tmpl) => (
        <SelectItem key={tmpl.id} value={tmpl.id.toString()}>
          <tmpl.icon className="h-4 w-4 inline mr-2" />
          {tmpl.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

---

## Result Display and Rendering

### 1. Generated Prompt Display

```typescript
// State for generated content
const [generatedPrompt, setGeneratedPrompt] = useState("");
const [showGeneratedSection, setShowGeneratedSection] = useState(false);
const [isGenerating, setIsGenerating] = useState(false);
const [processingStage, setProcessingStage] = useState<string>('');
const [progressVisible, setProgressVisible] = useState<boolean>(false);

// Generated prompt display component
{generatedPrompt && (
  <Card className="bg-gray-900/50 border-gray-800">
    <CardContent className="p-4">
      <div className="space-y-3">
        {/* Header with action buttons */}
        <div className="flex items-center justify-between">
          <Label className="text-sm text-gray-400">Generated Prompt</Label>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyPrompt}
              className="h-8 px-2 hover:bg-gray-800/50"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShareModalOpen(true)}
              className="h-8 px-2 hover:bg-gray-800/50"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveToLibrary}
              className="h-8 px-2 hover:bg-gray-800/50"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
        
        {/* Generated prompt text area */}
        <Textarea
          value={generatedPrompt}
          onChange={(e) => setGeneratedPrompt(e.target.value)}
          className="min-h-[200px] bg-gray-800/50 border-gray-700 
                     text-gray-200 resize-y"
          placeholder="Your enhanced prompt will appear here..."
        />
        
        {/* Character count */}
        <div className="text-xs text-gray-500 text-right">
          {generatedPrompt.length} characters
        </div>
      </div>
    </CardContent>
  </Card>
)}

// Copy to clipboard handler
const handleCopyPrompt = () => {
  if (!generatedPrompt) return;
  navigator.clipboard.writeText(generatedPrompt);
  toast({
    title: "Copied to clipboard",
    description: "Prompt has been copied successfully",
  });
};
```

### 2. Progress and Loading States

```typescript
// Progress display during generation
{progressVisible && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card className="w-96 bg-gray-900 border-gray-800">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Animated spinner */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 
                          border-b-2 border-purple-500"></div>
          </div>
          
          {/* Processing stage text */}
          <div className="text-center">
            <p className="text-gray-300 font-medium">
              {processingStage || 'Processing...'}
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 
                          h-2 rounded-full animate-pulse" 
                 style={{width: '60%'}}></div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)}

// Processing stages shown to user
const stages = [
  '🔍 Analyzing image with vision model...',
  '🎨 Applying Photography Master formatting...',
  '✨ Enhancing with AI...',
  '🔄 Using fallback: Joy-Caption Beta',
  '📝 Finalizing prompt...'
];
```

### 3. Image Analysis Display

```typescript
// State for image analysis
const [imageAnalysisResponse, setImageAnalysisResponse] = useState<string>('');
const [showImageAnalysis, setShowImageAnalysis] = useState(false);

// Image analysis display component
{showImageAnalysis && imageAnalysisResponse && (
  <Card className="bg-gray-900/50 border-gray-800">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-blue-400" />
          <CardTitle className="text-sm">Image Analysis</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowImageAnalysis(false)}
          className="h-6 w-6 p-0"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="bg-gray-800/50 rounded p-3">
        <p className="text-sm text-gray-300 leading-relaxed">
          {imageAnalysisResponse}
        </p>
      </div>
    </CardContent>
  </Card>
)}
```

### 4. Debug Report Display

```typescript
// State for debug information
const [debugReport, setDebugReport] = useState<any[]>([]);
const [showDebugReport, setShowDebugReport] = useState(false);

// Debug report display component
{showDebugReport && debugReport.length > 0 && (
  <Card className="bg-gray-900/50 border-gray-800">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm text-gray-400">Debug Report</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDebugReport(false)}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {debugReport.map((entry, idx) => (
          <div key={idx} className="bg-gray-800/30 rounded p-2">
            <div className="text-xs text-gray-500">
              {entry.timestamp} - {entry.stage}
            </div>
            <div className="text-sm text-gray-300 mt-1">
              Model: {entry.model}
              {entry.captionLength && ` | Length: ${entry.captionLength}`}
              {entry.serverStatus && ` | Status: ${entry.serverStatus}`}
            </div>
            {entry.error && (
              <div className="text-xs text-red-400 mt-1">
                Error: {entry.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

### 5. Social Media Caption Display

```typescript
// State for social media captions
const [socialMediaCaption, setSocialMediaCaption] = useState<string>('');
const [showSocialCaption, setShowSocialCaption] = useState(false);

// Social media caption display
{showSocialCaption && socialMediaCaption && (
  <Card className="bg-gray-900/50 border-gray-800">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-300">
            Social Media Caption
          </span>
          <Badge variant="secondary" className="text-xs">
            Ready to share
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigator.clipboard.writeText(socialMediaCaption)}
          className="h-8 px-2"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <div className="bg-gray-800/50 rounded-lg p-3">
        <p className="text-sm text-gray-200 whitespace-pre-wrap">
          {socialMediaCaption}
        </p>
      </div>
    </CardContent>
  </Card>
)}
```

### 6. Share Modal Component

```typescript
// Share to library modal
<ShareToLibraryModal
  isOpen={shareModalOpen}
  onClose={() => setShareModalOpen(false)}
  promptData={{
    prompt: generatedPrompt,
    title: `Enhanced prompt - ${new Date().toLocaleDateString()}`,
    tags: ['ai-generated', 'enhanced'],
    category: template ? dbRuleTemplates.find(t => t.id.toString() === template)?.template_type : 'general'
  }}
  onSave={(data) => {
    if (data.saveToPersonal) {
      enhancedSaveToUserLibraryMutation.mutate(data);
    }
    if (data.shareToPublic) {
      shareToPublicLibraryMutation.mutate(data);
    }
  }}
  categories={promptCategories}
/>
```

### 7. Toast Notifications

```typescript
// Success notification with action
toast({
  title: "Prompt saved to your library!",
  description: "Click below to view your saved prompt",
  action: (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => window.location.href = '/prompt-library'}
      className="ml-2"
    >
      View in Library
    </Button>
  )
});

// Error notification
toast({
  title: "Generation failed",
  description: "Unable to generate prompt. Please try again.",
  variant: "destructive",
});

// Info notification (no toast shown for cleaner UX)
// Previously showed toasts for every action, now silent for better UX
```

### Complete UI State Management

```typescript
// Main generation handler that orchestrates the entire flow
const handleGeneratePrompt = async () => {
  // Validation
  if (!subject && !uploadedImage) {
    toast({
      title: "Input required",
      description: "Please enter a subject or upload an image",
      variant: "destructive",
    });
    return;
  }

  // Start processing UI
  setIsGenerating(true);
  setProgressVisible(true);
  setShowGeneratedSection(false);
  
  try {
    let effectiveSubject = subject;
    
    // Stage 1: Image Analysis (if image provided)
    if (uploadedImage && imagePreview) {
      setProcessingStage('🔍 Analyzing image with vision model...');
      
      const visionResponse = await fetch('/api/caption/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imagePreview,
          model: selectedVisionModel,
          captionStyle: 'Descriptive'
        })
      });
      
      const captionData = await visionResponse.json();
      setImageAnalysisResponse(captionData.caption);
      effectiveSubject = captionData.caption;
    }
    
    // Stage 2: Prompt Enhancement
    setProcessingStage('🎨 Applying template formatting...');
    
    const enhanceResponse = await fetch('/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: effectiveSubject,
        llmProvider: selectedTemplate.llm_provider,
        llmModel: selectedTemplate.llm_model,
        customBasePrompt: selectedTemplate.master_prompt,
        templateId: selectedTemplate.id
      })
    });
    
    const result = await enhanceResponse.json();
    
    // Display results
    setGeneratedPrompt(result.enhancedPrompt);
    setShowGeneratedSection(true);
    if (imageAnalysisResponse) {
      setShowImageAnalysis(true);
    }
    
  } catch (error) {
    console.error('Generation error:', error);
    toast({
      title: "Generation failed",
      description: "Unable to generate prompt. Please try again.",
      variant: "destructive",
    });
  } finally {
    // Reset UI states
    setIsGenerating(false);
    setProgressVisible(false);
    setProcessingStage('');
  }
};
```

---

## Custom Vision Server Integration

### Server Configuration
The custom vision server runs Florence-2 model locally for unrestricted image analysis.

**Server Details:**
- **Host**: `localhost` or `127.0.0.1`
- **Port**: `7860`
- **Protocol**: `HTTP`
- **Endpoint**: `/analyze`
- **Model**: Florence-2 (Microsoft's vision-language model)

### Custom Vision API Call Implementation

```typescript
// File: server/services/customVisionService.ts

import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const CUSTOM_VISION_SERVER_URL = process.env.CUSTOM_VISION_SERVER_URL || 'http://127.0.0.1:7860';

export async function analyzeImageWithCustomVision(
  imagePath: string,
  options: { prompt?: string } = {}
): Promise<VisionAnalysisResult> {
  console.log('🔍 Calling Custom Vision Server (Florence-2)');
  
  try {
    // Read the image file
    const imageBuffer = await fs.promises.readFile(imagePath);
    
    // Create form data with image
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    });
    
    // Add optional prompt
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }
    
    // Make request to custom vision server
    const response = await axios.post(
      `${CUSTOM_VISION_SERVER_URL}/analyze`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json'
        },
        timeout: 30000, // 30 second timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    // Parse Florence-2 response
    const { caption, confidence, details } = response.data;
    
    return {
      caption: caption || 'No caption generated',
      model: 'Florence-2 (Custom Vision Server)',
      timestamp: new Date().toISOString(),
      metadata: {
        serverUrl: CUSTOM_VISION_SERVER_URL,
        confidence: confidence || 0,
        details: details || {},
        serverOnline: true,
        responseTime: response.headers['x-response-time'] || 'N/A'
      }
    };
    
  } catch (error: any) {
    console.error('Custom Vision Server error:', error.message);
    
    // Check if server is offline
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Custom Vision Server is offline at ' + CUSTOM_VISION_SERVER_URL);
    }
    
    throw new Error(`Custom Vision analysis failed: ${error.message}`);
  }
}

// Health check function for custom vision server
export async function testCustomVisionServer(): Promise<boolean> {
  try {
    const response = await axios.get(`${CUSTOM_VISION_SERVER_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch {
    return false;
  }
}
```

### Custom Vision Server Response Format

```json
{
  "caption": "A detailed description of the image content generated by Florence-2",
  "confidence": 0.95,
  "details": {
    "objects": ["person", "car", "building"],
    "scene": "urban street",
    "attributes": {
      "lighting": "daylight",
      "weather": "clear",
      "composition": "wide angle"
    },
    "text_detected": ["STOP", "Main St"],
    "dominant_colors": ["#4A90E2", "#F5A623", "#7B7B7B"]
  },
  "processing_time_ms": 1250,
  "model_version": "florence-2-large"
}
```

### Setting Up Your Own Custom Vision Server

To replicate the custom vision server:

```python
# requirements.txt
flask==3.0.0
transformers==4.35.0
torch==2.1.0
torchvision==0.16.0
pillow==10.1.0
numpy==1.24.3

# server.py
from flask import Flask, request, jsonify
from transformers import AutoModelForVision2Seq, AutoProcessor
from PIL import Image
import torch
import io

app = Flask(__name__)

# Load Florence-2 model
model = AutoModelForVision2Seq.from_pretrained("microsoft/Florence-2-large")
processor = AutoProcessor.from_pretrained("microsoft/Florence-2-large")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

@app.route('/analyze', methods=['POST'])
def analyze_image():
    try:
        # Get image from request
        image_file = request.files['file']
        image = Image.open(io.BytesIO(image_file.read())).convert('RGB')
        
        # Optional prompt
        prompt = request.form.get('prompt', 'Describe this image in detail')
        
        # Process with Florence-2
        inputs = processor(text=prompt, images=image, return_tensors="pt").to(device)
        
        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=500)
        
        caption = processor.decode(outputs[0], skip_special_tokens=True)
        
        return jsonify({
            'caption': caption,
            'confidence': 0.95,
            'details': {
                'model': 'Florence-2',
                'device': str(device)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model': 'Florence-2'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)
```

---

## Vision Analysis Pipeline

### Primary Vision Service Call Flow

```typescript
// Frontend API call
const visionRequest = {
  image: base64DataURL,  // "data:image/jpeg;base64,..."
  model: 'custom-vision' | 'joy-caption' | 'gpt-4o' | 'gemini-2.5-pro',
  captionStyle: 'Descriptive' | 'Casual' | 'Art Critic' | 'Stable Diffusion Prompt',
  captionLength: 'short' | 'medium' | 'long',
  customPrompt: 'Optional custom analysis prompt',
  nameInput: 'Optional name to replace "person" in captions',
  extraOptions: ['artistic', 'technical', 'detailed']
};

// API endpoint
POST /api/caption/generate
Content-Type: application/json
Body: visionRequest

// Response format
{
  "id": "1234567890",
  "caption": "Detailed description of the image",
  "suggestedPrompt": "Enhanced prompt for AI generation",
  "detectedElements": ["person", "landscape", "sunset"],
  "dominantColors": ["#FF6B35", "#4ECDC4"],
  "styleClassification": ["photographic", "natural lighting"],
  "metadata": {
    "model": "Custom Vision Server (Florence-2)",
    "timestamp": "2024-01-15T10:30:00Z",
    "captionType": "Descriptive",
    "serverOnline": true,
    "fallbackUsed": false
  },
  "debugReport": [
    {
      "stage": "Custom Vision Analysis",
      "timestamp": "2024-01-15T10:30:00Z",
      "model": "Florence-2",
      "serverStatus": "online",
      "captionLength": 245
    }
  ]
}
```

### Fallback Chain Implementation

```javascript
// Complete fallback chain with all services
async function analyzeImageWithFallback(imagePath, options) {
  const services = [
    {
      name: 'Custom Vision Server',
      fn: () => analyzeImageWithCustomVision(imagePath, options),
      timeout: 30000
    },
    {
      name: 'JoyCaption Service',
      fn: () => analyzeImageWithJoyCaption(imagePath, options),
      timeout: 45000
    },
    {
      name: 'Florence-2 Hugging Face',
      fn: () => analyzeImageWithFlorence(imagePath, options),
      timeout: 30000
    },
    {
      name: 'GPT-4 Vision',
      fn: () => analyzeImageWithGPT4Vision(imagePath, options),
      timeout: 60000
    }
  ];
  
  let lastError = null;
  
  for (const service of services) {
    try {
      console.log(`Attempting ${service.name}...`);
      
      const result = await Promise.race([
        service.fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), service.timeout)
        )
      ]);
      
      if (result && result.caption) {
        console.log(`✅ Success with ${service.name}`);
        return {
          ...result,
          metadata: {
            ...result.metadata,
            serviceUsed: service.name,
            attemptNumber: services.indexOf(service) + 1
          }
        };
      }
    } catch (error) {
      console.warn(`${service.name} failed:`, error.message);
      lastError = error;
      continue;
    }
  }
  
  throw new Error(`All vision services failed. Last error: ${lastError?.message}`);
}
```

---

## LLM Enhancement Pipeline

### Enhancement Request Structure

```typescript
interface EnhancementRequest {
  prompt: string;                    // Base prompt to enhance
  llmProvider: 'openai' | 'anthropic' | 'gemini' | 'local';
  llmModel: string;                  // Specific model like 'gpt-4o'
  useHappyTalk: boolean;            // Use enthusiastic tone
  compressPrompt: boolean;          // Compress the prompt
  compressionLevel: number;         // 1-10 compression scale
  customBasePrompt?: string;        // Template master prompt from database
  templateId?: string;              // Database template ID
  subject?: string;                 // Original subject for replacements
  character?: string;               // Character data for replacements
  debugReport?: any[];             // Vision analysis debug info
}

// API Call
POST /api/enhance-prompt
Content-Type: application/json
Body: EnhancementRequest

// Response
{
  "originalPrompt": "Original input prompt",
  "enhancedPrompt": "Professionally enhanced prompt with artistic details...",
  "historyId": "enhancement_1234567890_abc123",
  "diagnostics": {
    "apiProvider": "openai",
    "modelUsed": "gpt-4o",
    "fallbackUsed": false,
    "templateSource": "database",
    "responseTime": 1234,
    "timestamp": "2024-01-15T10:30:00Z",
    "dbConnectionStatus": "connected",
    "llmParams": {
      "provider": "openai",
      "model": "gpt-4o",
      "useHappyTalk": true,
      "compressPrompt": false,
      "compressionLevel": 5,
      "masterPromptLength": 2500
    }
  }
}
```

### Template Master Prompts

```typescript
// Database template structure
interface PromptTemplate {
  id: number;
  template_id: string;              // e.g., 'photo_master_v1'
  name: string;                     // Display name
  template_type: string;            // Category
  master_prompt: string;            // The actual enhancement instructions
  llm_provider: string;             // Preferred LLM provider
  llm_model: string;               // Preferred model
  use_happy_talk: boolean;
  compress_prompt: boolean;
  compression_level: number;
}

// Example master prompt from database
const photoMasterPrompt = `
You are a professional photography prompt engineer. Transform the given prompt into a highly detailed, 
technical photography description that includes:

1. Camera specifications (lens, aperture, ISO, shutter speed)
2. Lighting setup (natural/artificial, direction, quality, color temperature)
3. Composition rules (rule of thirds, leading lines, framing)
4. Post-processing style (color grading, contrast, saturation)
5. Mood and atmosphere
6. Subject details and positioning

Original prompt: {prompt}

Enhanced photography prompt:
`;
```

---

## Complete API Reference

### Vision Analysis Endpoints

#### 1. Caption Generation
```http
POST /api/caption/generate
```

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "model": "custom-vision",
  "captionStyle": "Descriptive",
  "captionLength": "medium",
  "customPrompt": "Analyze this architectural photograph",
  "nameInput": "John Doe",
  "extraOptions": ["technical", "artistic"]
}
```

**Response:**
```json
{
  "id": "1705320600000",
  "caption": "A modern architectural masterpiece featuring...",
  "suggestedPrompt": "Contemporary glass and steel building...",
  "metadata": {
    "model": "Florence-2",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Model List
```http
GET /api/caption/models
```

**Response:**
```json
[
  {
    "id": "custom-vision",
    "name": "Custom Vision Server (Florence-2)",
    "description": "Local Florence-2 server for unrestricted analysis",
    "provider": "Microsoft/Local",
    "capabilities": ["captioning", "object_detection", "ocr", "unrestricted"]
  },
  {
    "id": "joy-caption-beta-one",
    "name": "JoyCaption Beta One",
    "description": "Unrestricted vision analysis model",
    "provider": "Gradio/HuggingFace",
    "capabilities": ["captioning", "artistic_analysis", "unrestricted"]
  }
]
```

### LLM Enhancement Endpoints

#### 1. Prompt Enhancement
```http
POST /api/enhance-prompt
```

**Request Body:**
```json
{
  "prompt": "A sunset over the ocean",
  "llmProvider": "openai",
  "llmModel": "gpt-4o",
  "useHappyTalk": true,
  "compressPrompt": false,
  "compressionLevel": 5,
  "customBasePrompt": "Transform this into a cinematic scene...",
  "templateId": "cinematic_director_v1"
}
```

#### 2. Template Retrieval
```http
GET /api/enhanced-rule-templates
```

**Response:**
```json
[
  {
    "id": 1,
    "template_id": "photo_master_v1",
    "name": "Photography Master",
    "template_type": "photography",
    "master_prompt": "...",
    "llm_provider": "openai",
    "llm_model": "gpt-4o"
  }
]
```

---

## Implementation Examples

### Complete Integration Example

```javascript
class QuickPrompterIntegration {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://localhost:5000';
    this.customVisionUrl = config.customVisionUrl || 'http://localhost:7860';
    this.apiKey = config.apiKey;
  }
  
  async generateEnhancedPrompt(imageFile, options = {}) {
    try {
      // Step 1: Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Step 2: Analyze image with vision service
      const visionResult = await this.analyzeImage(base64Image, {
        model: options.preferredModel || 'custom-vision',
        captionStyle: options.style || 'Descriptive',
        captionLength: options.length || 'medium'
      });
      
      // Step 3: Enhance the caption with LLM
      const enhancedResult = await this.enhancePrompt(visionResult.caption, {
        template: options.template || 'photo_master_v1',
        llmProvider: options.llmProvider || 'openai',
        llmModel: options.llmModel || 'gpt-4o'
      });
      
      return {
        originalCaption: visionResult.caption,
        enhancedPrompt: enhancedResult.enhancedPrompt,
        metadata: {
          visionModel: visionResult.metadata.model,
          llmModel: enhancedResult.diagnostics.modelUsed,
          totalProcessingTime: visionResult.processingTime + enhancedResult.processingTime
        }
      };
      
    } catch (error) {
      console.error('Prompt generation failed:', error);
      throw error;
    }
  }
  
  async analyzeImage(base64Image, options) {
    const response = await fetch(`${this.baseUrl}/api/caption/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        image: base64Image,
        model: options.model,
        captionStyle: options.captionStyle,
        captionLength: options.captionLength
      })
    });
    
    if (!response.ok) {
      throw new Error(`Vision analysis failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async enhancePrompt(prompt, options) {
    // First, get the template
    const templates = await this.getTemplates();
    const template = templates.find(t => t.template_id === options.template);
    
    if (!template) {
      throw new Error(`Template not found: ${options.template}`);
    }
    
    const response = await fetch(`${this.baseUrl}/api/enhance-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        prompt: prompt,
        llmProvider: options.llmProvider,
        llmModel: options.llmModel,
        customBasePrompt: template.master_prompt,
        templateId: template.id.toString(),
        useHappyTalk: template.use_happy_talk,
        compressPrompt: template.compress_prompt,
        compressionLevel: template.compression_level
      })
    });
    
    if (!response.ok) {
      throw new Error(`Prompt enhancement failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getTemplates() {
    const response = await fetch(`${this.baseUrl}/api/enhanced-rule-templates`);
    return response.json();
  }
  
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
  
  // Direct custom vision server call
  async callCustomVisionDirectly(imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('prompt', 'Analyze this image in detail');
    
    const response = await fetch(`${this.customVisionUrl}/analyze`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Custom vision server error');
    }
    
    return response.json();
  }
}

// Usage
const prompter = new QuickPrompterIntegration({
  baseUrl: 'http://localhost:5000',
  customVisionUrl: 'http://localhost:7860',
  apiKey: 'your-api-key'
});

const imageFile = document.getElementById('imageInput').files[0];
const result = await prompter.generateEnhancedPrompt(imageFile, {
  preferredModel: 'custom-vision',
  style: 'Artistic',
  template: 'artistic_vision_v1',
  llmProvider: 'openai',
  llmModel: 'gpt-4o'
});

console.log('Enhanced prompt:', result.enhancedPrompt);
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Service unavailable",
  "details": {
    "service": "Custom Vision Server",
    "originalError": "ECONNREFUSED",
    "fallbackAttempted": true,
    "fallbackService": "JoyCaption",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Handling Different Error Types

```javascript
class ErrorHandler {
  static async handleVisionError(error, imagePath, options) {
    const errorMap = {
      'ECONNREFUSED': 'Custom Vision Server is offline',
      'ETIMEDOUT': 'Request timeout - server may be overloaded',
      'ENOTFOUND': 'Server URL is incorrect',
      '401': 'Authentication failed - check API keys',
      '413': 'Image too large - maximum 10MB',
      '415': 'Unsupported image format',
      '429': 'Rate limit exceeded',
      '500': 'Internal server error',
      '503': 'Service temporarily unavailable'
    };
    
    const errorCode = error.code || error.response?.status;
    const message = errorMap[errorCode] || 'Unknown error occurred';
    
    // Log error for debugging
    console.error(`Vision Error [${errorCode}]:`, message);
    
    // Attempt fallback
    if (options.allowFallback) {
      console.log('Attempting fallback service...');
      return this.tryFallbackService(imagePath, options);
    }
    
    throw new Error(message);
  }
  
  static async tryFallbackService(imagePath, options) {
    // Fallback order: Custom Vision → JoyCaption → Florence → GPT-4
    const fallbacks = [
      'joy-caption',
      'florence-2',
      'gpt-4o'
    ];
    
    for (const model of fallbacks) {
      try {
        return await analyzeImage(imagePath, { ...options, model });
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('All fallback services failed');
  }
}
```

---

## Configuration Requirements

### Environment Variables

```bash
# Required for Custom Vision Server
CUSTOM_VISION_SERVER_URL=http://localhost:7860

# Required for GPT-4 Vision
OPENAI_API_KEY=sk-...

# Required for Gemini Vision
GEMINI_API_KEY=...

# Required for Hugging Face models
HF_API_KEY=hf_...

# Optional for other providers
ANTHROPIC_API_KEY=...
LLAMA_API_KEY=...
MISTRAL_API_KEY=...

# Server configuration
PORT=5000
NODE_ENV=development
```

### Database Schema for Templates

```sql
CREATE TABLE prompt_templates (
  id SERIAL PRIMARY KEY,
  template_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(100),
  master_prompt TEXT NOT NULL,
  llm_provider VARCHAR(50) DEFAULT 'openai',
  llm_model VARCHAR(100) DEFAULT 'gpt-4o',
  use_happy_talk BOOLEAN DEFAULT false,
  compress_prompt BOOLEAN DEFAULT false,
  compression_level INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert example templates
INSERT INTO prompt_templates (template_id, name, template_type, master_prompt, llm_provider, llm_model)
VALUES 
  ('photo_master_v1', 'Photography Master', 'photography', 
   'Transform the following into a professional photography prompt...', 
   'openai', 'gpt-4o'),
  
  ('artistic_vision_v1', 'Artistic Vision', 'artistic',
   'Create an artistic interpretation of the following...', 
   'openai', 'gpt-4o'),
  
  ('cinematic_director_v1', 'Cinematic Director', 'cinematic',
   'Direct this scene as a cinematic masterpiece...', 
   'openai', 'gpt-4o');
```

### Docker Compose Setup

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - CUSTOM_VISION_SERVER_URL=http://custom-vision:7860
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://user:password@db:5432/quickprompt
    depends_on:
      - db
      - custom-vision
  
  custom-vision:
    build: ./custom-vision-server
    ports:
      - "7860:7860"
    volumes:
      - ./models:/app/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
  
  db:
    image: postgres:16
    environment:
      - POSTGRES_DB=quickprompt
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Testing the Integration

### Test Script

```javascript
// test-integration.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testQuickPrompter() {
  const testImage = fs.readFileSync(path.join(__dirname, 'test-image.jpg'));
  const base64Image = `data:image/jpeg;base64,${testImage.toString('base64')}`;
  
  console.log('Testing Custom Vision Server...');
  try {
    const visionResponse = await axios.post('http://localhost:5000/api/caption/generate', {
      image: base64Image,
      model: 'custom-vision',
      captionStyle: 'Descriptive',
      captionLength: 'medium'
    });
    
    console.log('✅ Vision Analysis Success:');
    console.log('Caption:', visionResponse.data.caption);
    console.log('Model:', visionResponse.data.metadata.model);
    
    console.log('\nTesting LLM Enhancement...');
    const enhanceResponse = await axios.post('http://localhost:5000/api/enhance-prompt', {
      prompt: visionResponse.data.caption,
      llmProvider: 'openai',
      llmModel: 'gpt-4o',
      useHappyTalk: true,
      compressPrompt: false,
      compressionLevel: 5
    });
    
    console.log('✅ Enhancement Success:');
    console.log('Enhanced:', enhanceResponse.data.enhancedPrompt);
    console.log('Model Used:', enhanceResponse.data.diagnostics.modelUsed);
    
  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data || error.message);
  }
}

testQuickPrompter();
```

### Health Check Endpoints

```javascript
// Health check for custom vision server
GET http://localhost:7860/health

// Response
{
  "status": "healthy",
  "model": "Florence-2",
  "device": "cuda",
  "memory_usage": "2.3GB",
  "uptime": "24h 35m"
}

// Health check for main API
GET http://localhost:5000/health

// Response
{
  "status": "healthy",
  "services": {
    "custom_vision": true,
    "openai": true,
    "database": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Performance Metrics

### Expected Response Times

| Service | Average Time | Max Time | Success Rate |
|---------|-------------|----------|--------------|
| Custom Vision Server | 1.2s | 3s | 98% |
| JoyCaption | 2.5s | 5s | 95% |
| Florence-2 HF | 3s | 7s | 92% |
| GPT-4 Vision | 4s | 10s | 99% |
| LLM Enhancement | 1.5s | 4s | 99% |
| Complete Pipeline | 4-8s | 15s | 96% |

### Rate Limits

- Custom Vision Server: Unlimited (local)
- JoyCaption: 100 requests/minute
- GPT-4 Vision: 500 requests/minute
- LLM Enhancement: 3000 requests/minute

---

## Security Considerations

1. **API Key Management**: Store keys in environment variables, never in code
2. **Input Validation**: Maximum image size 10MB, supported formats: JPEG, PNG, WebP
3. **Rate Limiting**: Implement per-user rate limiting
4. **CORS Configuration**: Restrict to trusted domains
5. **Error Messages**: Never expose internal server details in production

---

This document provides complete technical details for integrating with the Quick Prompter system. The custom vision server integration allows for unrestricted image analysis using Florence-2, with automatic fallback to other services if needed. The two-stage pipeline ensures high-quality prompt generation suitable for any AI image generation system.