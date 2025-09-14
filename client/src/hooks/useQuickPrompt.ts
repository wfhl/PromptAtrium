import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ElitePromptGenerator } from '@/lib/prompt-generator/ElitePromptGenerator';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { ElitePromptOptions, GeneratedPrompt } from '@/lib/prompt-generator/types';

interface QuickPromptTemplate {
  id: string;
  name: string;
  description?: string;
  baseOptions: Partial<ElitePromptOptions>;
  popularity?: number;
}

interface QuickPromptOptions {
  subject?: string;
  template?: string;
  artform?: string;
  photoType?: string;
  style?: string;
  mood?: string;
  lighting?: string;
  composition?: string;
}

export function useQuickPrompt() {
  const { toast } = useToast();
  const [generator] = useState(() => new ElitePromptGenerator());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [recentPrompts, setRecentPrompts] = useState<GeneratedPrompt[]>([]);

  // Popular templates for quick access
  const popularTemplates: QuickPromptTemplate[] = [
    {
      id: 'standard',
      name: 'Standard',
      description: 'Balanced prompt structure',
      baseOptions: {}
    },
    {
      id: 'cinematic',
      name: 'Cinematic',
      description: 'Film-like quality',
      baseOptions: {
        photoType: 'cinematic shot',
        lighting: 'dramatic lighting',
        composition: 'rule of thirds'
      }
    },
    {
      id: 'portrait',
      name: 'Portrait',
      description: 'Character focused',
      baseOptions: {
        photoType: 'portrait photography',
        composition: 'centered composition',
        lighting: 'soft lighting'
      }
    },
    {
      id: 'artistic',
      name: 'Artistic',
      description: 'Creative and stylized',
      baseOptions: {
        artform: 'digital art',
        style: 'artistic',
        mood: 'creative'
      }
    },
    {
      id: 'landscape',
      name: 'Landscape',
      description: 'Environment and scenery',
      baseOptions: {
        photoType: 'landscape photography',
        composition: 'wide angle',
        lighting: 'natural lighting'
      }
    },
    {
      id: 'photorealistic',
      name: 'Photorealistic',
      description: 'Ultra-realistic quality',
      baseOptions: {
        photoType: 'photorealistic',
        style: 'highly detailed',
        qualityPresets: ['high_quality']
      }
    }
  ];

  // Quick component options for easy selection
  const quickComponents = {
    artforms: [
      'Photography',
      'Digital Art',
      'Oil Painting',
      'Watercolor',
      '3D Render',
      'Illustration',
      'Concept Art',
      'Anime Style'
    ],
    photoTypes: [
      'Portrait',
      'Landscape',
      'Close-up',
      'Wide Angle',
      'Macro',
      'Aerial View',
      'Street Photography',
      'Fashion Photography'
    ],
    styles: [
      'Realistic',
      'Artistic',
      'Minimalist',
      'Vibrant',
      'Dark',
      'Vintage',
      'Modern',
      'Futuristic'
    ],
    moods: [
      'Dramatic',
      'Peaceful',
      'Mysterious',
      'Energetic',
      'Romantic',
      'Melancholic',
      'Joyful',
      'Epic'
    ],
    lighting: [
      'Natural Light',
      'Golden Hour',
      'Studio Lighting',
      'Dramatic Lighting',
      'Soft Lighting',
      'Neon Lights',
      'Backlit',
      'Low Key'
    ],
    composition: [
      'Centered',
      'Rule of Thirds',
      'Symmetrical',
      'Dynamic Angle',
      'Close-up',
      'Wide Shot',
      'Dutch Angle',
      'Birds Eye View'
    ]
  };

  // Generate prompt with simplified options
  const generateQuickPrompt = useCallback((options: QuickPromptOptions) => {
    setIsGenerating(true);
    
    try {
      // Get selected template
      const template = popularTemplates.find(t => t.id === options.template) || popularTemplates[0];
      
      // Merge template options with user options
      const generationOptions: ElitePromptOptions = {
        ...template.baseOptions,
        subject: options.subject,
        artform: options.artform,
        photoType: options.photoType,
        style: options.style,
        mood: options.mood,
        lighting: options.lighting,
        composition: options.composition
      };

      // Generate the prompt
      const result = generator.generate(generationOptions);
      
      setGeneratedPrompt(result);
      
      // Add to recent prompts (keep last 5)
      setRecentPrompts(prev => [result, ...prev].slice(0, 5));
      
      // Save to history (async, non-blocking)
      saveToHistory(result, options);
      
      return result;
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate prompt. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [generator, toast]);

  // Save prompt to history
  const saveToHistory = async (prompt: GeneratedPrompt, options: QuickPromptOptions) => {
    try {
      await apiRequest('POST', '/api/prompt-history', {
        prompt: prompt.original,
        negativePrompt: prompt.negativePrompt,
        metadata: {
          source: 'quick_prompt',
          template: options.template,
          options
        }
      });
    } catch (error) {
      // Silent fail - don't interrupt user experience
      console.error('Failed to save to history:', error);
    }
  };

  // Copy prompt to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Prompt copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Clear generated prompt
  const clearPrompt = useCallback(() => {
    setGeneratedPrompt(null);
  }, []);

  // Get template by ID
  const getTemplate = useCallback((templateId: string) => {
    return popularTemplates.find(t => t.id === templateId);
  }, []);

  return {
    // State
    isGenerating,
    generatedPrompt,
    recentPrompts,
    
    // Data
    popularTemplates,
    quickComponents,
    
    // Actions
    generateQuickPrompt,
    copyToClipboard,
    clearPrompt,
    getTemplate
  };
}