import { toast } from "@/hooks/use-toast";
import { RuleTemplate } from "@/components/prompt-builder/ElitePromptGenerator";

export interface PromptTemplate {
  id: number;
  name: string;
  template: string;
  template_type: string; // "pipeline", "longform", "custom1", "custom2", "custom3"
  is_default: boolean;
  description?: string;
  format_template?: string;
  usage_rules?: string;
  user_id?: number;
  master_prompt?: string;
  llm_provider?: string;
  llm_model?: string;
  created_at?: Date;
  updated_at?: Date;
  use_happy_talk?: boolean;
  compress_prompt?: boolean;
  compression_level?: number;
  // Additional fields used in the code
  template_id?: string;
  category?: string;
  // Added for emergency fallback templates
  isEmergencyFallback?: boolean;
}

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<PromptTemplate[]> {
  try {
    const response = await fetch('/api/templates');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch templates');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching templates:', error);
    toast({
      title: 'Error fetching templates',
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: 'destructive',
    });
    return [];
  }
}

/**
 * Get templates by type
 */
export async function getTemplatesByType(type: string): Promise<PromptTemplate[]> {
  try {
    const response = await fetch(`/api/templates/type/${type}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch templates by type');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching templates of type ${type}:`, error);
    toast({
      title: 'Error fetching templates',
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: 'destructive',
    });
    return [];
  }
}

/**
 * Get default template by type
 * Will attempt to fall back to emergency fallback if normal retrieval fails
 */
export async function getDefaultTemplateByType(type: string): Promise<PromptTemplate | null> {
  try {
    console.log(`Fetching default template for type: ${type}`);
    let response = await fetch(`/api/templates/default/${type}`);
    
    // Check if we need to use emergency fallback
    let isEmergencyFallback = false;
    
    if (response.status === 404) {
      // No default template found is a normal condition
      console.log(`No default template found for type: ${type} in database (404)`);
      return null;
    }
    
    // If response is not ok, try the emergency fallback route
    if (!response.ok) {
      console.warn(`Error response when fetching template: ${response.status}. Trying emergency fallback...`);
      
      try {
        // Use the emergency fallback route that bypasses database
        const fallbackResponse = await fetch(`/api/templates/fallback/${type}`);
        
        if (fallbackResponse.ok) {
          console.log(`Successfully retrieved emergency fallback template for type: ${type}`);
          response = fallbackResponse;
          isEmergencyFallback = true;
        } else {
          console.error(`Emergency fallback also failed for type: ${type} with status: ${fallbackResponse.status}`);
          // Continue with the original error
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch default template');
        }
      } catch (fallbackError) {
        console.error(`Error using emergency template fallback for ${type}:`, fallbackError);
        // Fall through to original error
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch template even with fallback');
      }
    }
    
    const template = await response.json();
    
    // Add a flag to indicate if this was from the emergency fallback route
    if (isEmergencyFallback) {
      template.isEmergencyFallback = true;
    }
    
    console.log(`Successfully retrieved template for type: ${type}`, {
      id: template.id,
      name: template.name,
      has_master_prompt: !!template.master_prompt,
      master_prompt_length: template.master_prompt ? template.master_prompt.length : 0,
      source: isEmergencyFallback ? 'emergency_fallback' : 'standard'
    });
    
    // Ensure template has a valid master_prompt
    if (!template.master_prompt || template.master_prompt.trim() === '') {
      console.warn(`Warning: Template for ${type} has empty master_prompt`);
    }
    
    return template;
  } catch (error) {
    console.error(`Error fetching default template for type ${type}:`, error);
    
    // Only show toast in UI if not running on server (SSR scenario)
    if (typeof window !== 'undefined') {
      toast({
        title: 'Error fetching default template',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
    
    return null;
  }
}

/**
 * Create a new template
 * 
 * If there is already a default template of this type, it will replace it
 * instead of creating a new one.
 */
export async function createTemplate(template: Omit<PromptTemplate, 'id'>): Promise<PromptTemplate | null> {
  try {
    // Log the template creation attempt
    console.log(`Attempting to create template of type: ${template.template_type}`, {
      template_id: template.template_id,
      name: template.name,
      is_default: template.is_default
    });
    
    // First, check if a default template exists for this type
    const existingTemplate = await getDefaultTemplateByType(template.template_type);
    
    // Ensure template_id is set if not provided
    const templateToSend = {
      ...template,
      // Generate a template_id using timestamp if not provided
      template_id: template.template_id || `${template.template_type}_${Date.now()}`,
      // Ensure category is set
      category: template.category || 'general'
    };
    
    if (existingTemplate && existingTemplate.id !== 0) {
      console.log(`Found existing template for ${template.template_type} with ID ${existingTemplate.id}, updating instead of creating`);
      // Update existing template instead of creating a new one
      return await updateTemplate(existingTemplate.id, templateToSend);
    }
    
    // If no existing template or template ID is 0 (fallback), create a new one
    console.log(`Creating new template for type: ${template.template_type}`);
    
    // Ensure all required fields are present
    const finalTemplate = {
      ...templateToSend,
      // Ensure necessary fields are set with defaults if not provided
      is_default: templateToSend.is_default === undefined ? true : templateToSend.is_default,
      master_prompt: templateToSend.master_prompt || templateToSend.template || '',
      user_id: templateToSend.user_id || 1 // Using numeric ID for database compatibility
    };
    
    console.log('Final template payload to create:', finalTemplate);
    
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(finalTemplate)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create template');
    }
    
    const createdTemplate = await response.json();
    console.log(`Successfully created template with ID: ${createdTemplate.id}`, {
      name: createdTemplate.name,
      type: createdTemplate.template_type
    });
    
    return createdTemplate;
  } catch (error) {
    console.error('Error creating template:', error);
    toast({
      title: 'Error creating template',
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: 'destructive',
    });
    return null;
  }
}

/**
 * Update an existing template
 */
export async function updateTemplate(id: number, template: Partial<Omit<PromptTemplate, 'id'>>): Promise<PromptTemplate | null> {
  try {
    // If ID is 0 or invalid, we should create a new template instead of updating
    if (id === 0) {
      console.log(`Cannot update template with ID 0. Creating new template instead.`);
      return createTemplate(template as any);
    }
    
    // Ensure all required fields are set with appropriate values
    const templateToSend = { 
      ...template,
      // Ensure we have a template_id if needed
      template_id: template.template_id || (template.template_type ? `${template.template_type}_${Date.now()}` : undefined),
      // Ensure category is set if not provided
      category: template.category || (template.template_type ? 'general' : undefined),
      // Ensure we have a user_id
      user_id: template.user_id ?? 1, // Using numeric ID for database compatibility
      // Ensure is_default is set properly for template updates
      is_default: template.is_default === undefined ? true : template.is_default,
      // Ensure master_prompt is available
      master_prompt: template.master_prompt || template.template || ''
    };
    
    console.log(`Updating template with ID ${id} with payload:`, templateToSend);

    const response = await fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateToSend)
    });
    
    if (response.status === 404) {
      // If template is not found (404), create a new one instead
      console.log(`Template with ID ${id} not found. Creating new template.`);
      return createTemplate(template as any);
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update template');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating template ${id}:`, error);
    toast({
      title: 'Error updating template',
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: 'destructive',
    });
    return null;
  }
}

/**
 * Set a template as the default for its type
 */
export async function setDefaultTemplate(id: number, type: string): Promise<PromptTemplate | null> {
  try {
    const response = await fetch(`/api/templates/${id}/set-default`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set template as default');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error setting template ${id} as default:`, error);
    toast({
      title: 'Error setting default template',
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: 'destructive',
    });
    return null;
  }
}

/**
 * Convert database template to rule template format
 */
export function convertToRuleTemplate(dbTemplate: PromptTemplate): RuleTemplate {
  return {
    id: dbTemplate.template_type,
    name: dbTemplate.name,
    description: dbTemplate.description || '',
    template: dbTemplate.template,
    rules: dbTemplate.template,
    formatTemplate: dbTemplate.format_template || '',
    usageRules: dbTemplate.usage_rules || '',
    masterPrompt: dbTemplate.master_prompt,
    llmProvider: dbTemplate.llm_provider as any || 'openai',
    llmModel: dbTemplate.llm_model || 'gpt4',
    useHappyTalk: dbTemplate.use_happy_talk || false,
    compressPrompt: dbTemplate.compress_prompt || false,
    compressionLevel: dbTemplate.compression_level || 5
  };
}

/**
 * Convert rule template to database template format
 */
export function convertToDatabaseTemplate(ruleTemplate: RuleTemplate, templateType: string): Omit<PromptTemplate, 'id'> {
  return {
    name: ruleTemplate.name,
    template: ruleTemplate.template,
    template_type: templateType,
    template_id: `${templateType}_${Date.now()}`,
    category: 'general',
    is_default: false,
    description: ruleTemplate.description,
    format_template: ruleTemplate.formatTemplate,
    usage_rules: ruleTemplate.usageRules,
    master_prompt: ruleTemplate.masterPrompt,
    llm_provider: ruleTemplate.llmProvider,
    llm_model: ruleTemplate.llmModel,
    use_happy_talk: ruleTemplate.useHappyTalk,
    compress_prompt: ruleTemplate.compressPrompt,
    compression_level: ruleTemplate.compressionLevel,
    user_id: 1 // Add user_id for multi-tenant support (using numeric ID for database compatibility)
  };
}

/**
 * Directly get an emergency fallback template, bypassing the database
 * This is a last resort option for when database templates are completely unavailable
 */
export async function getEmergencyFallbackTemplate(type: string): Promise<PromptTemplate | null> {
  try {
    console.log(`Requesting EMERGENCY fallback template for type: ${type}`);
    const response = await fetch(`/api/templates/fallback/${type}`);
    
    if (!response.ok) {
      console.error(`Emergency fallback failed for type: ${type} with status: ${response.status}`);
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to fetch emergency fallback template');
    }
    
    const template = await response.json();
    template.isEmergencyFallback = true;
    
    console.log(`Successfully retrieved EMERGENCY fallback template for type: ${type}`, {
      id: template.id,
      name: template.name,
      source: template.source || 'emergency_fallback',
      master_prompt_length: template.master_prompt ? template.master_prompt.length : 0
    });
    
    return template;
  } catch (error) {
    console.error(`Error fetching emergency fallback template for type ${type}:`, error);
    
    // Only show toast in UI if not running on server (SSR scenario)
    if (typeof window !== 'undefined') {
      toast({
        title: 'Critical Template Error',
        description: 'Emergency fallback system failed. Please contact support.',
        variant: 'destructive',
      });
    }
    
    // Return an absolute minimal template as a last resort
    return {
      id: 0,
      name: `Critical Emergency Template for ${type}`,
      template: `Emergency template for ${type}`,
      template_type: type,
      template_id: `emergency_${type}_${Date.now()}`,
      is_default: true,
      master_prompt: `System: You are a fallback template for ${type} generation.`,
      category: 'general',
      isEmergencyFallback: true
    };
  }
}

/**
 * Save a template as the default for a specific template type
 * This will either update an existing default template or create a new one
 */
export async function saveDefaultTemplate(templateType: string, templateData: Partial<Omit<PromptTemplate, 'id'>>): Promise<PromptTemplate | null> {
  try {
    // First check if a default template exists for this type
    const existingTemplate = await getDefaultTemplateByType(templateType);
    
    // Prepare the template data with necessary fields
    const payload = {
      ...templateData,
      template_type: templateType,
      is_default: true,
      // Ensure we have a template_id and user_id
      template_id: `${templateType}_${Date.now()}`,
      user_id: 1 // Using numeric ID for database compatibility
    };
    
    let savedTemplate = null;
    
    // If we have an existing template with a valid ID (not 0), update it
    // Otherwise create a new template
    if (existingTemplate && existingTemplate.id !== 0) {
      console.log(`Updating existing template for ${templateType} with ID ${existingTemplate.id}`, payload);
      savedTemplate = await updateTemplate(existingTemplate.id, payload);
    } else {
      // Create a new template and mark it as default
      console.log(`Creating new template for ${templateType}`, payload);
      savedTemplate = await createTemplate({
        ...payload as any,
        is_default: true,
        name: templateData.name || `Default ${templateType} template`,
        template: templateData.template || ''
      });
    }
    
    // Show feedback about the saved template
    if (savedTemplate) {
      console.log(`Successfully saved template for ${templateType}:`, {
        id: savedTemplate.id,
        name: savedTemplate.name,
        template_type: savedTemplate.template_type,
        is_default: savedTemplate.is_default,
        user_id: savedTemplate.user_id,
        master_prompt_length: savedTemplate.master_prompt?.length || 0,
        content_snippet: savedTemplate.master_prompt ? savedTemplate.master_prompt.substring(0, 50) + '...' : 'No content'
      });
      
      // For debugging, log the full saved template object
      console.log(`Complete saved template object for ${templateType}:`, savedTemplate);
      
      toast({
        title: 'Template Saved',
        description: `${templateType} template saved successfully (ID: ${savedTemplate.id})`,
        duration: 3000,
      });
      
      return savedTemplate;
    } else {
      throw new Error(`Failed to save template for ${templateType}`);
    }
  } catch (error) {
    console.error(`Error saving default template for ${templateType}:`, error);
    toast({
      title: 'Error saving template',
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: 'destructive',
    });
    return null;
  }
}