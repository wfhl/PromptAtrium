import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Wand2 as Wand2Icon, Loader2 as Loader2Icon, Info as InfoIcon2 } from "lucide-react";
import { CustomTemplateSection } from "@/components/PromptGenerator/CustomTemplateSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import CopyButton from "@/components/CopyButton";
import { cn } from "@/lib/utils";
import EliteLogo from "@/components/EliteLogo";
import { enhancePromptWithLLM, LLMEnhancementResponse } from "@/services/llmService";
import { createTemplate, getDefaultTemplateByType, setDefaultTemplate, getTemplatesByType, saveDefaultTemplate } from "@/services/templateService";
import { DetailedOptionsSection } from "./DetailedOptionsDropdown";
import { 
  optionsArrayToDropdownFormat, 
  categoryDisplayLabels, 
  nestedDetailedOptionsToString,
  prepareDetailedOptionsForPrompt
} from "./utils";
import { NestedDetailedOptionsSection } from "./NestedDetailedOptionsDropdown";
import { DETAILED_OPTIONS_CATEGORIES } from "@/data/detailedOptionsData";
import EliteImageAnalyzer from "./EliteImageAnalyzer";
import { GenerationHistory } from "@/components/content/GenerationHistory";
import ModelInfo from "./ModelInfo";
import { useAdminMode } from "@/context/AdminModeContext";

// Import from our store instead of the service
import { PromptHistoryEntry, addPrompt, addEnhancedPrompt, getAllPrompts, clearAllPrompts } from "@/store/promptStore";

import {
  Heart,
  HeartOff,
  Download,
  Upload,
  Save,
  Trash2,
  X,
  Plus,
  ChevronsUpDown,
  ChevronDown,
  Info as InfoIcon,
  Settings,
  Sparkles,
  Zap,
  PenTool,
  ImagePlus,
  Lightbulb,
  Dice6 as Dices,
  History,
  Move,
  Grip,
  FileText,
  Edit,
  Edit2,
  Code,
  Eye,
  RefreshCw,
  HelpCircle,
  EyeOff,
  Wand2,
  Loader2,
  BrainCircuit,
  CheckSquare,
  CheckCircle2,
  Copy,
  Minus,
  PlusCircle,
  MinusCircle,
  ThumbsUp,
  Share2,
  MessageSquare,
  Search,
  Image,
  Puzzle,
  BookOpen,
  Bookmark,
  Library
} from "lucide-react";

// Import data and generator
import elitePromptGenerator, { ElitePromptOptions, GeneratedPrompt, SavedPreset, RuleTemplate, CharacterPreset } from "./ElitePromptGenerator";
import {
  ARTFORM,
  PHOTO_TYPE,
  FEMALE_BODY_TYPES,
  MALE_BODY_TYPES,
  FEMALE_DEFAULT_TAGS,
  MALE_DEFAULT_TAGS,
  ROLES,
  HAIRSTYLES,
  HAIR_COLORS,
  EYE_COLORS,
  MAKEUP_OPTIONS,
  SKIN_TONES,
  FEMALE_CLOTHING,
  MALE_CLOTHING,
  PLACE,
  LIGHTING,
  COMPOSITION,
  POSE,
  BACKGROUND,
  FEMALE_ADDITIONAL_DETAILS,
  MALE_ADDITIONAL_DETAILS,
  PHOTOGRAPHY_STYLES,
  DEVICE,
  PHOTOGRAPHER,
  ARTIST,
  DIGITAL_ARTFORM,
  PROMPT_TEMPLATES,
  CHARACTER_PRESETS,
  QUALITY_PRESETS,
  NEGATIVE_PROMPT_PRESETS,
  // New detailed options
  ARCHITECTURE_OPTIONS,
  ART_OPTIONS,
  BRANDS_OPTIONS,
  CINEMATIC_OPTIONS,
  FASHION_OPTIONS,
  FEELINGS_OPTIONS,
  FOODS_OPTIONS,
  GEOGRAPHY_OPTIONS,
  HUMAN_OPTIONS,
  INTERACTION_OPTIONS,
  KEYWORDS_OPTIONS,
  OBJECTS_OPTIONS,
  PEOPLE_OPTIONS,
  PLOTS_OPTIONS,
  SCENE_OPTIONS,
  SCIENCE_OPTIONS,
  STUFF_OPTIONS,
  TIME_OPTIONS,
  TYPOGRAPHY_OPTIONS,
  VEHICLE_OPTIONS,
  VIDEOGAME_OPTIONS
} from "@/data/fluxPromptData";

// Form schema for validation
const formSchema = z.object({
  custom: z.string().optional(),
  subject: z.string().optional(),
  gender: z.enum(['female', 'male']).default('female'),
  globalOption: z.enum(['Disabled', 'Random', 'No Figure Rand']).default('Disabled'),
  artform: z.string().optional(),
  photoType: z.string().optional(),
  bodyTypes: z.string().optional(),
  defaultTags: z.string().optional(),
  roles: z.string().optional(),
  hairstyles: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  makeup: z.string().optional(),
  skinTone: z.string().optional(),
  clothing: z.string().optional(),
  place: z.string().optional(),
  lighting: z.string().optional(),
  composition: z.string().optional(),
  pose: z.string().optional(),
  background: z.string().optional(),
  additionalDetails: z.string().optional(),
  loraDescription: z.string().optional(),
  photographyStyles: z.string().optional(),
  device: z.string().optional(),
  photographer: z.string().optional(),
  artist: z.string().optional(),
  digitalArtform: z.string().optional(),
  // New detailed options
  architectureOptions: z.string().optional(),
  artOptions: z.string().optional(),
  brandsOptions: z.string().optional(),
  cinematicOptions: z.string().optional(),
  fashionOptions: z.string().optional(),
  feelingsOptions: z.string().optional(),
  foodsOptions: z.string().optional(),
  geographyOptions: z.string().optional(),
  humanOptions: z.string().optional(),
  interactionOptions: z.string().optional(),
  keywordsOptions: z.string().optional(),
  objectsOptions: z.string().optional(),
  peopleOptions: z.string().optional(),
  plotsOptions: z.string().optional(),
  sceneOptions: z.string().optional(),
  scienceOptions: z.string().optional(),
  stuffOptions: z.string().optional(),
  timeOptions: z.string().optional(),
  typographyOptions: z.string().optional(),
  vehicleOptions: z.string().optional(),
  videogameOptions: z.string().optional(),
  // Additional parameters
  seed: z.number().optional(),
  template: z.string().default('standard'),
  qualityPresets: z.array(z.string()).default([]),
  aspectRatio: z.string().optional(),
  camera: z.string().optional(),
  negativePrompt: z.string().optional(),
  // Format options
  showStableDiffusion: z.boolean().default(true),
  showMidjourney: z.boolean().default(true),
  showFlux: z.boolean().default(true),
  showNarrative: z.boolean().default(true),
});

const presetFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  favorite: z.boolean().default(false),
});

const ruleTemplateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  template: z.string().min(1, "Template is required"),
  // Old field kept for backward compatibility
  rules: z.string().optional(),
  // New fields for complete template implementation
  usageRules: z.string().optional(),
  formatTemplate: z.string().optional(),
  // Add new fields for LLM settings
  masterPrompt: z.string().optional(),
  llmProvider: z.enum(['openai', 'anthropic', 'llama', 'grok', 'bluesky', 'mistral', 'local']).optional(),
  llmModel: z.string().optional(),
  useHappyTalk: z.boolean().optional(),
  compressPrompt: z.boolean().optional(),
  compressionLevel: z.number().min(1).max(10).optional()
});

const characterPresetFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  favorite: z.boolean().default(false),
});

type FormSchema = z.infer<typeof formSchema>;
type PresetFormSchema = z.infer<typeof presetFormSchema>;
type RuleTemplateFormSchema = z.infer<typeof ruleTemplateFormSchema>;
type CharacterPresetFormSchema = z.infer<typeof characterPresetFormSchema>;

interface SectionConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  visible: boolean;
}

export default function ElitePromptGeneratorUI() {
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [activeTab, setActiveTab] = useState<string>("form");
  // States for three separate tab groups
  const [formatTab, setFormatTab] = useState<string>("standard"); // Top row tabs (Standard, Stable Diffusion, Midjourney)
  const [viewTab, setViewTab] = useState<string>("enhanced"); // Third row tabs (Enhanced, Pipeline, Longform, Narrative)
  const [customTab, setCustomTab] = useState<string>("custom1"); // Second row tabs (Custom 1, Custom 2, Custom 3, Wildcard)
  
  // Use global admin mode context instead of local state
  const { isAdminMode } = useAdminMode();
  
  // Handler for format tab changes (top row)
  const handleFormatTabChange = (value: string) => {
    setFormatTab(value);
  };
  
  // Handler for view tab changes (third row)
  const handleViewTabChange = (value: string) => {
    setViewTab(value);
    
    // Special handling for longform, narrative and custom tabs if needed
    if (value === 'longform' || value === 'custom' || value === 'narrative') {
      // If there's no prompt generated yet, stay on the current tab
      if (!generatedPrompt?.original) {
        toast({
          title: "Generate a prompt first",
          description: "Please generate a prompt before viewing special format options",
          variant: "destructive"
        });
        // Fall back to enhanced tab if no prompt
        setViewTab('enhanced');
        return;
      }
    }
  };
  
  // Handler for custom tabs changes (second row)
  const handleCustomTabChange = (value: string) => {
    setCustomTab(value);
    
    // Special handling for wildcard tab if needed
    if (value === 'wildcard') {
      // If there's no prompt generated yet, stay on the current tab
      if (!generatedPrompt?.original) {
        toast({
          title: "Generate a prompt first",
          description: "Please generate a prompt before using the Wildcard format",
          variant: "destructive"
        });
        // Fall back to custom1 tab if no prompt
        setCustomTab('custom1');
        return;
      }
    }
  };
  
  // Helper function to determine if a template is in the second or third row
  const isSecondRowTemplate = (type: string) => {
    return type.startsWith('custom') || type === 'wildcard';
  };
  
  const isThirdRowTemplate = (type: string) => {
    return type === 'pipeline' || type === 'longform' || type === 'narrative';
  };
  
  // Function to get the loading state for a specific template type
  const getLoadingState = (type: string) => {
    if (isSecondRowTemplate(type)) {
      return secondRowLoading;
    } else if (isThirdRowTemplate(type)) {
      return thirdRowLoading;
    }
    return isEnhancing; // Fallback to general loading state
  };
  
  // Admin mode is now handled by the global AdminModeContext
  
  // We'll add the form watching useEffect after the form is defined
  const [activeDetailedTab, setActiveDetailedTab] = useState<string>("architecture");
  const [isGenerating, setIsGenerating] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<SavedPreset | null>(null);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [presetFilter, setPresetFilter] = useState<"all" | "favorites">("all");
  const [ruleTemplateModalOpen, setRuleTemplateModalOpen] = useState(false);
  const [selectedRuleTemplate, setSelectedRuleTemplate] = useState<RuleTemplate | null>(null);
  const [ruleTemplates, setRuleTemplates] = useState<RuleTemplate[]>([]);
  
  // Template state variables
  const [pipelineRuleTemplate, setPipelineRuleTemplate] = useState<RuleTemplate | null>(null);
  const [longformRuleTemplate, setLongformRuleTemplate] = useState<RuleTemplate | null>(null);
  const [narrativeRuleTemplate, setNarrativeRuleTemplate] = useState<RuleTemplate | null>(null);
  const [wildcardRuleTemplate, setWildcardRuleTemplate] = useState<RuleTemplate | null>(null);
  const [customRuleTemplates, setCustomRuleTemplates] = useState<(RuleTemplate | null)[]>([null, null, null]);
  
  // State for detailed options with nested subcategories
  const [detailedOptionValues, setDetailedOptionValues] = useState<Record<string, Record<string, string>>>({
    architecture: {},
    art: {},
    brands: {},
    cinematic: {},
    fashion: {},
    feelings: {},
    foods: {},
    geography: {},
    human: {},
    interaction: {},
    keywords: {},
    objects: {},
    people: {},
    plots: {},
    scene: {},
    science: {},
    stuff: {},
    time: {},
    typography: {},
    vehicle: {},
    videogame: {}
  });
  
  // Character preset state
  const [characterPresets, setCharacterPresets] = useState<CharacterPreset[]>([]);
  const [selectedCharacterPreset, setSelectedCharacterPreset] = useState<CharacterPreset | null>(null);
  const [characterPresetModalOpen, setCharacterPresetModalOpen] = useState(false);
  const [characterPresetFilter, setCharacterPresetFilter] = useState<"all" | "favorites">("all");
  
  // Custom template data state for persistence
  type CustomTemplateData = {
    name: string;
    masterPrompt: string;
    formatTemplate: string;
    usageRules: string;
    llmProvider: string;
    llmModel: string;
    useHappyTalk: boolean;
    compressPrompt: boolean;
    compressionLevel: number;
  };
  
  // Function to save a custom template by index to the database
  // State for tracking template saving status
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);
  
  const saveCustomTemplateByIndex = async (index: number) => {
    try {
      setIsSavingTemplate(true);
      const customId = `custom${index + 1}`;
      const nameInput = document.getElementById(`custom-name-${index}`) as HTMLInputElement;
      const promptInput = document.getElementById(`custom-master-prompt-${index}`) as HTMLTextAreaElement;
      const formatTemplateInput = document.getElementById(`custom-format-template-${index}`) as HTMLTextAreaElement;
      const usageRulesInput = document.getElementById(`custom-usage-rules-${index}`) as HTMLTextAreaElement;
      
      // Debugging - log the input element values
      console.log(`Custom ${index + 1} input elements:`, {
        nameInput: nameInput?.id,
        nameValue: nameInput?.value,
        promptInput: promptInput?.id, 
        promptValue: promptInput?.value?.substring(0, 50) + "...",
        formatInput: formatTemplateInput?.id,
        usageInput: usageRulesInput?.id
      });
      
      // Use default name if input is empty
      const defaultName = `Custom ${index + 1}`;
      const templateName = nameInput?.value || defaultName;
      
      // If no master prompt, show a warning but don't prevent saving (it will use default)
      if (!promptInput?.value) {
        toast({
          title: "Using Default Prompt",
          description: "No custom prompt provided, using default master prompt.",
          variant: "warning"
        });
      }
      
      // Get default master prompt if input is empty
      const defaultMasterPrompt = elitePromptGenerator.getDefaultMasterPrompt(customId);
      const masterPrompt = promptInput?.value || defaultMasterPrompt;
      
      // Get format template and usage rules from DOM directly
      const formatTemplate = formatTemplateInput?.value || "";
      const usageRules = usageRulesInput?.value || "";
      
      // Get additional template fields from existing data with defaults
      const templateData = customTemplateData[index] || {
        llmProvider: 'openai',
        llmModel: 'gpt4',
        formatTemplate: "",
        usageRules: "",
        useHappyTalk: false,
        compressPrompt: false,
        compressionLevel: 5
      };
      
      console.log(`Saving custom template ${index + 1} with values:`, {
        name: templateName,
        masterPrompt: masterPrompt.substring(0, 30) + "...",
        formatTemplate: formatTemplate.substring(0, 30) + "...",
        usageRules: usageRules.substring(0, 30) + "...",
        provider: templateData.llmProvider,
        model: templateData.llmModel
      });
      
      // Save to database using saveDefaultTemplate (proper way to persist templates)
      const savedTemplate = await saveDefaultTemplate(customId, {
        name: templateName,
        template: customId,
        template_type: customId,
        category: "custom",
        is_default: true,
        master_prompt: masterPrompt,
        format_template: formatTemplate,
        usage_rules: usageRules,
        llm_provider: templateData.llmProvider,
        llm_model: templateData.llmModel,
        use_happy_talk: templateData.useHappyTalk,
        compress_prompt: templateData.compressPrompt,
        compression_level: templateData.compressionLevel,
        user_id: 1 // Using numeric ID for database compatibility - get from session in production
      });
      
      // Only proceed with UI updates if the save was successful
      if (savedTemplate) {
        // Update the state with all current values including those from the DOM
        setCustomTemplateData(prev => {
          const newData = [...prev];
          newData[index] = {
            name: templateName,
            masterPrompt: masterPrompt,
            formatTemplate: formatTemplate,
            usageRules: usageRules,
            llmProvider: templateData.llmProvider,
            llmModel: templateData.llmModel,
            useHappyTalk: templateData.useHappyTalk,
            compressPrompt: templateData.compressPrompt,
            compressionLevel: templateData.compressionLevel
          };
          return newData;
        });
      
        // Update in-memory template
        elitePromptGenerator.updateRuleTemplate(customId, {
          name: templateName,
          description: `Custom template ${index + 1}`,
          masterPrompt: masterPrompt,
          formatTemplate: formatTemplate,
          usageRules: usageRules,
          llmProvider: templateData.llmProvider as any,
          llmModel: templateData.llmModel,
          useHappyTalk: templateData.useHappyTalk,
          compressPrompt: templateData.compressPrompt,
          compressionLevel: templateData.compressionLevel
        });
        
        // Update rule templates in state
        setRuleTemplates([...elitePromptGenerator.getRuleTemplates()]);
        
        toast({
          title: "Template Saved",
          description: `Custom template ${index + 1} has been saved successfully.`,
          variant: "default"
        });
        
        return true;
      } else {
        // The save operation returned null or undefined, indicating a failure
        throw new Error(`Database save operation failed for template ${customId}`);
      }
    } catch (error) {
      console.error(`Error saving custom template ${index + 1}:`, error);
      toast({
        title: "Save Failed",
        description: `Failed to save custom template ${index + 1} to the database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSavingTemplate(false);
    }
  };
  
  const [customTemplateData, setCustomTemplateData] = useState<CustomTemplateData[]>([
    { 
      name: "Custom 1", 
      masterPrompt: "", 
      formatTemplate: "", 
      usageRules: "", 
      llmProvider: "openai", 
      llmModel: "gpt4",
      useHappyTalk: false,
      compressPrompt: false,
      compressionLevel: 5
    },
    { 
      name: "Custom 2", 
      masterPrompt: "", 
      formatTemplate: "", 
      usageRules: "", 
      llmProvider: "openai", 
      llmModel: "gpt4",
      useHappyTalk: false,
      compressPrompt: false,
      compressionLevel: 5
    },
    { 
      name: "Custom 3", 
      masterPrompt: "", 
      formatTemplate: "", 
      usageRules: "", 
      llmProvider: "openai", 
      llmModel: "gpt4",
      useHappyTalk: false,
      compressPrompt: false,
      compressionLevel: 5
    }
  ]);
  
  // Load custom, narrative, and wildcard templates from database when component mounts
  useEffect(() => {
    const loadAllTemplates = async () => {
      try {
        // 1. Load templates for custom1, custom2, custom3
        const customTypes = ['custom1', 'custom2', 'custom3'];
        const loadedCustomTemplates = await Promise.all(
          customTypes.map(async (type, index) => {
            const template = await getDefaultTemplateByType(type);
            if (template && template.master_prompt) {
              console.log(`Loaded template for ${type}:`, template.name);
              return {
                name: template.name || `Custom ${index + 1}`,
                masterPrompt: template.master_prompt || '',
                formatTemplate: template.format_template || '',
                usageRules: template.usage_rules || '',
                llmProvider: template.llm_provider as any || 'openai',
                llmModel: template.llm_model || 'gpt4',
                useHappyTalk: template.use_happy_talk || false,
                compressPrompt: template.compress_prompt || false,
                compressionLevel: template.compression_level || 5
              };
            }
            // Return the default if no saved template
            return customTemplateData[index];
          })
        );
        
        // Update state with loaded custom templates
        setCustomTemplateData(loadedCustomTemplates);
        
        // 2. Load Narrative template
        const narrativeTemplate = await getDefaultTemplateByType('narrative');
        if (narrativeTemplate && narrativeTemplate.master_prompt) {
          console.log('Loaded narrative template:', narrativeTemplate.name);
          setNarrativeTemplateData({
            name: narrativeTemplate.name || 'Narrative',
            masterPrompt: narrativeTemplate.master_prompt || '',
            formatTemplate: narrativeTemplate.format_template || '',
            usageRules: narrativeTemplate.usage_rules || '',
            llmProvider: narrativeTemplate.llm_provider as any || 'openai',
            llmModel: narrativeTemplate.llm_model || 'gpt4',
            useHappyTalk: narrativeTemplate.use_happy_talk || false,
            compressPrompt: narrativeTemplate.compress_prompt || false,
            compressionLevel: narrativeTemplate.compression_level || 5
          });
        } else {
          console.log('Using default narrative template');
          // Use a default narrative template if none exists in database
          setNarrativeTemplateData({
            name: 'Narrative',
            masterPrompt: "Create a narrative, storytelling format of this prompt. Transform the list of attributes into flowing, descriptive prose that tells a story about the image.",
            formatTemplate: "",
            usageRules: "Use this template to create prompts with a storytelling structure.",
            llmProvider: "openai",
            llmModel: "gpt4",
            useHappyTalk: false,
            compressPrompt: false,
            compressionLevel: 5
          });
        }
        
        // 3. Load Wildcard template
        const wildcardTemplate = await getDefaultTemplateByType('wildcard');
        if (wildcardTemplate && wildcardTemplate.master_prompt) {
          console.log('Loaded wildcard template:', wildcardTemplate.name);
          setWildcardTemplateData({
            name: wildcardTemplate.name || 'Wildcard',
            masterPrompt: wildcardTemplate.master_prompt || '',
            formatTemplate: wildcardTemplate.format_template || '',
            usageRules: wildcardTemplate.usage_rules || '',
            llmProvider: wildcardTemplate.llm_provider as any || 'openai',
            llmModel: wildcardTemplate.llm_model || 'gpt4',
            useHappyTalk: wildcardTemplate.use_happy_talk || false,
            compressPrompt: wildcardTemplate.compress_prompt || false,
            compressionLevel: wildcardTemplate.compression_level || 5
          });
        } else {
          console.log('Using default wildcard template');
          // Use a default wildcard template if none exists in database
          setWildcardTemplateData({
            name: 'Wildcard',
            masterPrompt: "Create an experimental, creative version of this prompt with unexpected elements. Add surreal, unconventional, or surprising combinations while maintaining the core subject.",
            formatTemplate: "",
            usageRules: "Use this template to create experimental, surprising prompt variations.",
            llmProvider: "openai",
            llmModel: "gpt4",
            useHappyTalk: false,
            compressPrompt: false,
            compressionLevel: 5
          });
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        toast({
          title: 'Error Loading Templates',
          description: 'Failed to load saved templates. Default templates will be used.',
          variant: 'destructive'
        });
      }
    };
    
    loadAllTemplates();
  }, []);
  
  // Additional templates for Narrative and Wildcard
  const [narrativeTemplateData, setNarrativeTemplateData] = useState<CustomTemplateData>({ 
    name: "Narrative", 
    masterPrompt: "Create a narrative, storytelling format of this prompt. Transform the list of attributes into flowing, descriptive prose that tells a story about the image.", 
    formatTemplate: "", 
    usageRules: "", 
    llmProvider: "openai", 
    llmModel: "gpt4",
    useHappyTalk: false,
    compressPrompt: false,
    compressionLevel: 5
  });
  
  const [wildcardTemplateData, setWildcardTemplateData] = useState<CustomTemplateData>({ 
    name: "Wildcard", 
    masterPrompt: "Create an experimental, creative version of this prompt with unexpected elements. Add surreal, unconventional, or surprising combinations while maintaining the core subject.", 
    formatTemplate: "", 
    usageRules: "", 
    llmProvider: "openai", 
    llmModel: "gpt4",
    useHappyTalk: false,
    compressPrompt: false,
    compressionLevel: 5
  });
  
  // Track which template is being generated
  const [activeTemplateType, setActiveTemplateType] = useState<string>("");
  
  // LLM enhancement state
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [promptDiagnostics, setPromptDiagnostics] = useState<LLMEnhancementResponse['diagnostics'] | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  
  // Separate loading states for second and third row tabs
  const [secondRowLoading, setSecondRowLoading] = useState(false);
  const [thirdRowLoading, setThirdRowLoading] = useState(false);
  
  // For backward compatibility, mapped to both row loading states
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const [llmProvider, setLlmProvider] = useState<'openai' | 'anthropic' | 'llama' | 'grok' | 'bluesky' | 'mistral' | 'local'>('openai');
  const [llmModel, setLlmModel] = useState<string>('gpt4');
  const [useHappyTalk, setUseHappyTalk] = useState<boolean>(false);
  const [compressPrompt, setCompressPrompt] = useState<boolean>(false);
  const [compressionLevel, setCompressionLevel] = useState<number>(5);
  const [customBasePrompt, setCustomBasePrompt] = useState<string>('');
  const [promptHistory, setPromptHistory] = useState<PromptHistoryEntry[]>([]);
  const [promptHistoryOpen, setPromptHistoryOpen] = useState<boolean>(false);
  const [promptGenerationHistory, setPromptGenerationHistory] = useState<PromptHistoryEntry[]>([]); // For generation history
  const [originalOptions, setOriginalOptions] = useState<any>(null); // Store original options for history
  
  // Seed lock state
  const [isSeedLocked, setIsSeedLocked] = useState<boolean>(false);
  
  // State for API keys
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [anthropicApiKey, setAnthropicApiKey] = useState<string>("");
  const [llamaApiKey, setLlamaApiKey] = useState<string>("");
  const [grokApiKey, setGrokApiKey] = useState<string>("");
  const [blueskyApiKey, setBlueskyApiKey] = useState<string>("");
  const [mistralApiKey, setMistralApiKey] = useState<string>("");
  const [saveApiKeys, setSaveApiKeys] = useState<boolean>(true);
  
  const [sections, setSections] = useState<SectionConfig[]>([
    {
      id: "saved",
      title: "Global Presets",
      description: "Your custom prompt presets",
      icon: <Save className="w-5 h-5" />,
      visible: true
    },
    {
      id: "character",
      title: "Character Details",
      description: "Physical appearance and identity",
      icon: <PenTool className="w-5 h-5" />,
      visible: true
    },
    {
      id: "basic",
      title: "Basic Settings",
      description: "Core prompt parameters",
      icon: <Settings className="w-5 h-5" />,
      visible: true
    },
    {
      id: "scene",
      title: "Scene Settings",
      description: "Environment and composition",
      icon: <ImagePlus className="w-5 h-5" />,
      visible: true
    },
    {
      id: "style",
      title: "Style & Mood",
      description: "Artistic direction and aesthetics",
      icon: <Sparkles className="w-5 h-5" />,
      visible: true
    },
    {
      id: "detailed",
      title: "Detailed Options",
      description: "Additional specific categories",
      icon: <Lightbulb className="w-5 h-5" />,
      visible: true
    },
    {
      id: "advanced",
      title: "Advanced Options",
      description: "Technical parameters and rules",
      icon: <Zap className="w-5 h-5" />,
      visible: true
    }
  ]);

  // Initialize form with default values
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      custom: "",
      subject: "",
      gender: "female",
      globalOption: "Disabled",
      artform: "",
      photoType: "",
      bodyTypes: "",
      defaultTags: "",
      roles: "",
      hairstyles: "",
      hairColor: "",
      eyeColor: "",
      makeup: "",
      skinTone: "",
      clothing: "",
      place: "",
      lighting: "",
      composition: "",
      pose: "",
      background: "",
      additionalDetails: "",
      loraDescription: "",
      photographyStyles: "",
      device: "",
      photographer: "",
      artist: "",
      digitalArtform: "",
      // New detailed options
      architectureOptions: "",
      artOptions: "",
      brandsOptions: "",
      cinematicOptions: "",
      fashionOptions: "",
      feelingsOptions: "",
      foodsOptions: "",
      geographyOptions: "",
      humanOptions: "",
      interactionOptions: "",
      keywordsOptions: "",
      objectsOptions: "",
      peopleOptions: "",
      plotsOptions: "",
      sceneOptions: "",
      scienceOptions: "",
      stuffOptions: "",
      timeOptions: "",
      typographyOptions: "",
      vehicleOptions: "",
      videogameOptions: "",
      // Other parameters
      qualityPresets: [],
      template: "standard", // Use standard template which is known to work
      aspectRatio: "",
      camera: "",
      negativePrompt: NEGATIVE_PROMPT_PRESETS[0].prompt,
      // Format options
      showStableDiffusion: true,
      showMidjourney: true,
      showFlux: true,
      showNarrative: true,
    },
  });
  
  // Preset form
  const presetForm = useForm<PresetFormSchema>({
    resolver: zodResolver(presetFormSchema),
    defaultValues: {
      name: "",
      description: "",
      favorite: false
    }
  });
  
  // Rule template form
  const ruleTemplateForm = useForm<RuleTemplateFormSchema>({
    resolver: zodResolver(ruleTemplateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      template: "",
      rules: "",
      // New fields for all templates
      formatTemplate: "",
      usageRules: "",
      // LLM default settings
      masterPrompt: "",
      llmProvider: "openai" as 'openai' | 'anthropic' | 'llama' | 'grok' | 'bluesky' | 'mistral' | 'local',
      llmModel: "gpt4",
      useHappyTalk: false,
      compressPrompt: false,
      compressionLevel: 5
    }
  });
  
  // Character preset form
  const characterPresetForm = useForm<CharacterPresetFormSchema>({
    resolver: zodResolver(characterPresetFormSchema),
    defaultValues: {
      name: "",
      description: "",
      favorite: false
    }
  });

  // Watch for changes to the gender field to update gender-specific options
  const watchGender = form.watch("gender");
  
  // Load presets and templates on mount
  useEffect(() => {
    const presets = elitePromptGenerator.getAllPresets();
    setSavedPresets(presets);
    
    const templates = elitePromptGenerator.getRuleTemplates();
    setRuleTemplates(templates);
    
    // Find and set individual templates
    const pipeline = templates.find(t => t.id === "pipeline") || null;
    setPipelineRuleTemplate(pipeline);
    
    const longform = templates.find(t => t.id === "longform") || null;
    setLongformRuleTemplate(longform);
    
    const narrative = templates.find(t => t.id === "narrative") || null;
    setNarrativeRuleTemplate(narrative);
    
    const wildcard = templates.find(t => t.id === "wildcard") || null;
    setWildcardRuleTemplate(wildcard);
    
    // Find and set custom templates
    const custom1 = templates.find(t => t.id === "custom1") || null;
    const custom2 = templates.find(t => t.id === "custom2") || null;
    const custom3 = templates.find(t => t.id === "custom3") || null;
    setCustomRuleTemplates([custom1, custom2, custom3]);
    
    const charPresets = elitePromptGenerator.getAllCharacterPresets();
    setCharacterPresets(charPresets);
    
    // Load template data from the database
    const loadTemplates = async () => {
      try {
        // Load pipeline template
        console.log("Loading pipeline template from database...");
        const pipelineTemplate = await getDefaultTemplateByType("pipeline");
        
        // If database template exists AND has a master prompt, use it
        if (pipelineTemplate && pipelineTemplate.master_prompt && pipelineTemplate.master_prompt.trim() !== '') {
          console.log("Using pipeline template from database");
          // Update rule template with the master prompt
          elitePromptGenerator.updateRuleTemplate("pipeline", {
            masterPrompt: pipelineTemplate.master_prompt,
            llmProvider: pipelineTemplate.llm_provider as any,
            llmModel: pipelineTemplate.llm_model
          });
          
          // Update the LLM provider and model if available
          if (pipelineTemplate.llm_provider) {
            setLlmProvider(pipelineTemplate.llm_provider as any);
          }
          if (pipelineTemplate.llm_model) {
            setLlmModel(pipelineTemplate.llm_model);
          }
        } else {
          // No valid database template, ensure we're using the default
          console.log("Using built-in default pipeline template");
          
          // Get the default master prompt directly from ElitePromptGenerator
          const defaultPipelinePrompt = elitePromptGenerator.buildMasterPrompt("pipeline");
          
          // Update rule template with the default master prompt if it exists
          if (defaultPipelinePrompt) {
            elitePromptGenerator.updateRuleTemplate("pipeline", {
              masterPrompt: defaultPipelinePrompt,
              llmProvider: 'openai',
              llmModel: 'gpt4'
            });
            
            // Set default provider and model
            setLlmProvider('openai');
            setLlmModel('gpt4');
          }
        }
        
        // Load longform template
        console.log("Loading longform template from database...");
        const longformTemplate = await getDefaultTemplateByType("longform");
        
        // If database template exists AND has a master prompt, use it
        if (longformTemplate && longformTemplate.master_prompt && longformTemplate.master_prompt.trim() !== '') {
          console.log("Using longform template from database");
          // Update rule template with all fields
          elitePromptGenerator.updateRuleTemplate("longform", {
            masterPrompt: longformTemplate.master_prompt,
            formatTemplate: longformTemplate.format_template,
            usageRules: longformTemplate.usage_rules,
            llmProvider: longformTemplate.llm_provider as any,
            llmModel: longformTemplate.llm_model,
            useHappyTalk: longformTemplate.use_happy_talk,
            compressPrompt: longformTemplate.compress_prompt,
            compressionLevel: longformTemplate.compression_level
          });
        } else {
          // No valid database template, ensure we're using the default
          console.log("Using built-in default longform template");
          
          // Get the default master prompt directly from ElitePromptGenerator
          const defaultLongformPrompt = elitePromptGenerator.buildMasterPrompt("longform");
          
          // Update rule template with the default master prompt
          if (defaultLongformPrompt) {
            elitePromptGenerator.updateRuleTemplate("longform", {
              masterPrompt: defaultLongformPrompt,
              llmProvider: 'openai',
              llmModel: 'gpt4'
            });
          }
        }
        
        // Load custom templates (custom1, custom2, custom3)
        for (let i = 1; i <= 3; i++) {
          const customId = `custom${i}`;
          let defaultCustomPrompt: string | null = null;
          console.log(`Loading ${customId} template from database...`);
          const customTemplate = await getDefaultTemplateByType(customId);
          
          if (customTemplate && customTemplate.master_prompt && customTemplate.master_prompt.trim() !== '') {
            console.log(`Using ${customId} template from database:`, {
              name: customTemplate.name,
              provider: customTemplate.llm_provider,
              model: customTemplate.llm_model,
              masterPrompt: customTemplate.master_prompt?.substring(0, 50) + "..."
            });
            
            // Update the rule template if it exists or create one with all required fields
            elitePromptGenerator.updateRuleTemplate(customId, {
              name: customTemplate.name,
              masterPrompt: customTemplate.master_prompt,
              formatTemplate: customTemplate.format_template || "",
              usageRules: customTemplate.usage_rules || "",
              llmProvider: customTemplate.llm_provider as any,
              llmModel: customTemplate.llm_model,
              useHappyTalk: customTemplate.use_happy_talk || false,
              compressPrompt: customTemplate.compress_prompt || false,
              compressionLevel: customTemplate.compression_level || 5
            });
          } else {
            // No valid database template, ensure we're using the default
            console.log(`Using built-in default ${customId} template`);
            
            // Get the default master prompt directly from ElitePromptGenerator
            defaultCustomPrompt = elitePromptGenerator.buildMasterPrompt(customId);
            
            // Update rule template with the default master prompt
            if (defaultCustomPrompt) {
              elitePromptGenerator.updateRuleTemplate(customId, {
                name: `Custom Template ${i}`,
                masterPrompt: defaultCustomPrompt,
                llmProvider: 'openai',
                llmModel: 'gpt4'
              });
            }
          }
          
          // Store template data in component state to ensure it's available for rendering
          setCustomTemplateData(prev => {
            const newData = [...prev];
            newData[i-1] = {
              name: customTemplate?.name || `Custom Template ${i}`,
              masterPrompt: customTemplate?.master_prompt || defaultCustomPrompt || "",
              formatTemplate: customTemplate?.format_template || "",
              usageRules: customTemplate?.usage_rules || "",
              llmProvider: customTemplate?.llm_provider || "openai",
              llmModel: customTemplate?.llm_model || "gpt4",
              useHappyTalk: customTemplate?.use_happy_talk || false,
              compressPrompt: customTemplate?.compress_prompt || false,
              compressionLevel: customTemplate?.compression_level || 5
            };
            return newData;
          });
        }
        
        // Update rule templates state to reflect changes
        setRuleTemplates([...elitePromptGenerator.getRuleTemplates()]);
      } catch (error) {
        console.error("Error loading templates:", error);
      }
    };
    
    loadTemplates();
    
    // Load API keys from localStorage if they exist
    try {
      const savedOpenaiKey = localStorage.getItem('elite_openai_api_key');
      const savedAnthropicKey = localStorage.getItem('elite_anthropic_api_key');
      const savedLlamaKey = localStorage.getItem('elite_llama_api_key');
      const savedGrokKey = localStorage.getItem('elite_grok_api_key');
      const savedBlueskyKey = localStorage.getItem('elite_bluesky_api_key');
      const savedMistralKey = localStorage.getItem('elite_mistral_api_key');
      const savedSaveKeySetting = localStorage.getItem('elite_save_api_keys');
      
      if (savedOpenaiKey) setOpenaiApiKey(savedOpenaiKey);
      if (savedAnthropicKey) setAnthropicApiKey(savedAnthropicKey);
      if (savedLlamaKey) setLlamaApiKey(savedLlamaKey);
      if (savedGrokKey) setGrokApiKey(savedGrokKey);
      if (savedBlueskyKey) setBlueskyApiKey(savedBlueskyKey);
      if (savedMistralKey) setMistralApiKey(savedMistralKey);
      if (savedSaveKeySetting) setSaveApiKeys(savedSaveKeySetting === 'true');
    } catch (error) {
      console.error("Error loading API keys from localStorage:", error);
    }
  }, []);
  
  // Add form watching for state persistence, but don't trigger prompt generation
  useEffect(() => {
    // Watch all form values to maintain state between tab switches
    // But only log changes without triggering prompt generation
    const subscription = form.watch(() => {
      // Log only when debugging, disabled in production
      if (process.env.NODE_ENV !== 'production') {
        console.log("Form values updated - no prompt generation");
      }
      // Deliberately no prompt generation here
    });
    
    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Save API keys to localStorage whenever they change (if saveApiKeys is true)
  useEffect(() => {
    if (saveApiKeys) {
      // Save the keys
      saveApiKeysToLocalStorage();
    }
  }, [openaiApiKey, anthropicApiKey, llamaApiKey, grokApiKey, blueskyApiKey, mistralApiKey, saveApiKeys]);
  

  
  // Generate the prompt with two-stage process support
  const generatePrompt = async (values: FormSchema) => {
    setIsGenerating(true);
    setEnhancedPrompt(null); // Reset enhanced prompt
    
    try {
      // Process the nested detailed options - form already has the string values from inputs
      // but we're using them directly from the form fields (they're set as hidden inputs)
      
      // Prepare options for the generator
      const options: ElitePromptOptions = {
        ...values,
        // If seed is locked, use the provided seed value or generate a new one if empty
        // If seed is not locked, always generate a random seed
        seed: isSeedLocked 
              ? (values.seed || Math.floor(Math.random() * 10000000)) 
              : Math.floor(Math.random() * 10000000),
      };
      
      // Store original options for history
      setOriginalOptions({...options});
      
      // Set a default template if none is provided or if it's invalid
      if (!values.template || values.template === 'flux-standard') {
        options.template = 'standard';
      }
      
      // Check if this is a pipeline template
      const isPipelineTemplate = options.template && (
        options.template.includes('pipeline') || 
        options.template === 'custom' || 
        options.template === 'pipeline-standard' || 
        options.template === 'pipeline-custom'
      );
      
      // Generate the initial prompt
      const result = elitePromptGenerator.generatePrompt(options);
      
      // IMPORTANT: Always remove the pipeline field initially
      // This ensures we only show enhanced output in the Pipeline tab after user clicks button
      const { pipeline, ...otherFields } = result;
      
      // Now set the result without the pipeline field, but include the negative prompt
      setGeneratedPrompt({
        ...otherFields as GeneratedPrompt,
        negativePrompt: values.negativePrompt || NEGATIVE_PROMPT_PRESETS[0].prompt
      });
      
      // Always go to the standard tab first, user must click "Generate Pipeline Format" button
      setFormatTab('standard');
      setViewTab('enhanced');
      
      // Show initial success toast
      toast({
        title: "Prompt generated",
        description: "Your Elite prompt has been generated successfully.",
      });
      
      // We intentionally DON'T auto-start pipeline enhancement here.
      // User must explicitly click the "Generate Pipeline Format" button to start enhancement.
    } catch (error) {
      console.error("Error generating prompt:", error);
      // Try again with a default template
      try {
        const options: ElitePromptOptions = {
          ...values,
          template: 'standard', // Force to standard template
          seed: isSeedLocked 
                ? (values.seed || Math.floor(Math.random() * 10000000)) 
                : Math.floor(Math.random() * 10000000),
        };
        
        const result = elitePromptGenerator.generatePrompt(options);
        // Also remove pipeline field from fallback result
        const { pipeline, ...otherFields } = result;
        setGeneratedPrompt({
          ...otherFields as GeneratedPrompt,
          negativePrompt: values.negativePrompt || NEGATIVE_PROMPT_PRESETS[0].prompt
        });
        
        toast({
          title: "Prompt generated with fallback template",
          description: "Your prompt was generated with the standard template due to an issue with your selected template.",
        });
      } catch (fallbackError) {
        console.error("Fallback error generating prompt:", fallbackError);
        toast({
          title: "Error generating prompt",
          description: "There was an error generating your prompt. Please try again with different settings.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle form submission
  const onSubmit = (values: FormSchema) => {
    generatePrompt(values);
    // Removed setActiveTab("output") to prevent tab switching
  };
  
  // Load a saved preset
  const loadSavedPreset = (preset: SavedPreset) => {
    if (!preset || !preset.options) return;
    
    // Reset the form first
    form.reset();
    
    // Make a list of all form fields to ensure we capture every one
    const formFields = [
      "globalOption", "template", "gender", "custom", "subject", "artform", 
      "photoType", "bodyTypes", "defaultTags", "roles", "hairstyles", "hairColor",
      "eyeColor", "makeup", "skinTone", "clothing", "place", "lighting", "composition", 
      "pose", "background", "additionalDetails", "loraDescription", "photographyStyles", 
      "device", "photographer", "artist", "digitalArtform", "qualityPresets", 
      "aspectRatio", "camera",
      // New detailed options
      "architectureOptions", "artOptions", "brandsOptions", "cinematicOptions", 
      "fashionOptions", "feelingsOptions", "foodsOptions", "geographyOptions", 
      "humanOptions", "interactionOptions", "keywordsOptions", "objectsOptions", 
      "peopleOptions", "plotsOptions", "sceneOptions", "scienceOptions", 
      "stuffOptions", "timeOptions", "typographyOptions", "vehicleOptions", 
      "videogameOptions"
    ];
    
    // Apply explicit preset options, checking each field by name to ensure they're all set
    // We need to iterate through key-value pairs from preset.options instead
    // This avoids TypeScript errors when setting form values
    Object.entries(preset.options).forEach(([key, value]) => {
      if (value !== undefined && key !== 'seed' && formFields.includes(key)) {
        // Cast to any to bypass strict type checking since we know these fields exist
        form.setValue(key as any, value);
      }
    });
    
    // Force the form to be aware of the updates
    form.trigger();
    
    // Generate a new seed
    const newSeed = Math.floor(Math.random() * 10000000);
    form.setValue('seed', newSeed);
    
    // Set the selected preset
    setSelectedPreset(preset);
    
    toast({
      title: "Global Preset loaded",
      description: `The "${preset.name}" global preset has been loaded.`,
    });
    
    // Log for debugging
    console.log("Loaded global preset with values:", preset.options);
  };
  
  // Save the current form as a preset
  const savePreset = (formData: PresetFormSchema) => {
    const currentOptions = form.getValues();
    const newPreset = elitePromptGenerator.savePreset(
      formData.name,
      formData.description || "",
      currentOptions,
      formData.favorite
    );
    
    setSavedPresets(elitePromptGenerator.getAllPresets());
    setPresetModalOpen(false);
    presetForm.reset();
    
    toast({
      title: "Global Preset saved",
      description: `"${formData.name}" has been saved to your global presets.`,
    });
  };
  
  // Delete a preset
  const deletePreset = (id: string) => {
    if (elitePromptGenerator.deletePreset(id)) {
      setSavedPresets(elitePromptGenerator.getAllPresets());
      toast({
        title: "Global Preset deleted",
        description: "The global preset has been removed from your collection.",
      });
    }
  };
  
  // Toggle favorite status for a preset
  const togglePresetFavorite = (id: string) => {
    if (elitePromptGenerator.toggleFavorite(id)) {
      setSavedPresets(elitePromptGenerator.getAllPresets());
    }
  };
  
  // Update a rule template
  const updateRuleTemplate = (formData: RuleTemplateFormSchema) => {
    if (!selectedRuleTemplate) return;
    
    if (elitePromptGenerator.updateRuleTemplate(selectedRuleTemplate.id, {
      name: formData.name,
      description: formData.description || "",
      template: formData.template,
      // Include backward compatibility for rules
      rules: formData.rules || "",
      // Include new fields for full template implementation
      formatTemplate: formData.formatTemplate || formData.template || "",
      usageRules: formData.usageRules || formData.rules || "",
      // Include LLM settings
      masterPrompt: formData.masterPrompt || "",
      llmProvider: formData.llmProvider,
      llmModel: formData.llmModel || 'gpt4',
      useHappyTalk: formData.useHappyTalk !== undefined ? formData.useHappyTalk : false,
      compressPrompt: formData.compressPrompt !== undefined ? formData.compressPrompt : false,
      compressionLevel: formData.compressionLevel || 5
    })) {
      setRuleTemplates(elitePromptGenerator.getRuleTemplates());
      setRuleTemplateModalOpen(false);
      ruleTemplateForm.reset();
      
      // Determine which template type was updated
      const templateType = selectedRuleTemplate.id;
      
      // Save template to database
      saveTemplateToDatabase(templateType, formData);
      
      toast({
        title: "Template updated",
        description: `"${formData.name}" template has been updated with all required fields.`,
      });
    }
  };
  
  // Helper function to save template to database
  const saveTemplateToDatabase = async (templateType: string, formData: RuleTemplateFormSchema) => {
    try {
      setIsSavingTemplate(true);
      
      // Create payload with consistent field mapping
      const payload = {
        name: formData.name,
        description: formData.description || "",
        template: formData.template || "",
        template_type: templateType,  // Ensure the template_type is set correctly
        category: "template",         // Set the category to "template"
        is_default: true,             // Mark as default template for this type
        format_template: formData.formatTemplate || formData.template || "",
        usage_rules: formData.usageRules || formData.rules || "",
        master_prompt: formData.masterPrompt || "",
        llm_provider: formData.llmProvider || "openai",
        llm_model: formData.llmModel || "gpt4",
        use_happy_talk: formData.useHappyTalk,
        compress_prompt: formData.compressPrompt,
        compression_level: formData.compressionLevel || 5,
        user_id: 1 // Using numeric ID for database compatibility
      };
      
      // Save template to database as default template
      const savedTemplate = await saveDefaultTemplate(templateType, payload);
      
      if (!savedTemplate) {
        throw new Error(`Failed to save template "${templateType}"`);
      }
      
      console.log(`Template "${templateType}" saved to database:`, payload);
      
      // Show success toast notification
      toast({
        title: "Template Saved",
        description: `${templateType} template has been saved successfully.`,
        variant: "default"
      });
      
      // Update the custom template data state if it's a custom template
      if (templateType.startsWith('custom')) {
        // For custom templates, find the index (custom1=0, custom2=1, custom3=2)
        const index = parseInt(templateType.replace('custom', '')) - 1;
        if (index >= 0 && index < 3) {
          // Create a copy of the customTemplateData array
          const updatedTemplates = [...customTemplateData];
          // Update the template at the specific index
          updatedTemplates[index] = {
            name: formData.name,
            masterPrompt: formData.masterPrompt || "",
            formatTemplate: formData.formatTemplate || formData.template || "",
            usageRules: formData.usageRules || formData.rules || "",
            llmProvider: formData.llmProvider as any || "openai",
            llmModel: formData.llmModel || "gpt4", 
            useHappyTalk: formData.useHappyTalk !== undefined ? formData.useHappyTalk : false,
            compressPrompt: formData.compressPrompt !== undefined ? formData.compressPrompt : false,
            compressionLevel: formData.compressionLevel || 5
          };
          // Set the updated templates array
          setCustomTemplateData(updatedTemplates);
        }
      } 
      // Update narrative template data if applicable
      else if (templateType === 'narrative') {
        setNarrativeTemplateData({
          name: formData.name,
          masterPrompt: formData.masterPrompt || "",
          formatTemplate: formData.formatTemplate || formData.template || "",
          usageRules: formData.usageRules || formData.rules || "",
          llmProvider: formData.llmProvider as any || "openai",
          llmModel: formData.llmModel || "gpt4",
          useHappyTalk: formData.useHappyTalk !== undefined ? formData.useHappyTalk : false,
          compressPrompt: formData.compressPrompt !== undefined ? formData.compressPrompt : false,
          compressionLevel: formData.compressionLevel || 5
        });
      }
      // Update wildcard template data if applicable
      else if (templateType === 'wildcard') {
        setWildcardTemplateData({
          name: formData.name,
          masterPrompt: formData.masterPrompt || "",
          formatTemplate: formData.formatTemplate || formData.template || "",
          usageRules: formData.usageRules || formData.rules || "",
          llmProvider: formData.llmProvider as any || "openai",
          llmModel: formData.llmModel || "gpt4",
          useHappyTalk: formData.useHappyTalk !== undefined ? formData.useHappyTalk : true,
          compressPrompt: formData.compressPrompt !== undefined ? formData.compressPrompt : false,
          compressionLevel: formData.compressionLevel || 5
        });
      }
    } catch (error) {
      console.error(`Error saving ${templateType} template to database:`, error);
      toast({
        title: "Save Failed",
        description: `Failed to save ${templateType} template to the database: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSavingTemplate(false);
    }
  };
  
  // The duplicate saveCustomTemplateByIndex function has been removed
  // Using the implementation from the top of the file.
  
  // Load a character preset
  const loadCharacterPreset = (presetId: string) => {
    const preset = characterPresets.find(p => p.id === presetId) || CHARACTER_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    
    // Save current values that are not character-related
    const currentValues = form.getValues();
    
    // Set all character-related fields with explicit form.setValue calls
    form.setValue("gender", preset.gender as "female" | "male");
    form.setValue("bodyTypes", preset.bodyType);
    form.setValue("defaultTags", preset.defaultTag);
    form.setValue("roles", preset.role);
    form.setValue("hairstyles", preset.hairstyle);
    
    // Set the new character detail fields with fallbacks
    if ('hairColor' in preset) form.setValue("hairColor", preset.hairColor || "");
    else form.setValue("hairColor", "");
    
    if ('eyeColor' in preset) form.setValue("eyeColor", preset.eyeColor || "");
    else form.setValue("eyeColor", "");
    
    if ('makeup' in preset) form.setValue("makeup", preset.makeup || "");
    else form.setValue("makeup", "");
    
    if ('skinTone' in preset) form.setValue("skinTone", preset.skinTone || "");
    else form.setValue("skinTone", "");
    
    form.setValue("clothing", preset.clothing);
    form.setValue("additionalDetails", preset.additionalDetails);
    
    // Set loraDescription if it exists in the preset
    if (preset.loraDescription) {
      form.setValue("loraDescription", preset.loraDescription);
    }
    
    // Force the form to be aware of the updates
    form.trigger();
    
    toast({
      title: "Character preset loaded",
      description: `The ${preset.name} character preset has been loaded.`,
    });
    
    // Log for debugging
    console.log("Loaded character preset:", preset);
  };
  
  // Save current character settings as a preset
  const saveCurrentCharacterAsPreset = (formData: CharacterPresetFormSchema) => {
    const currentOptions = form.getValues();
    const newPreset = elitePromptGenerator.saveCurrentCharacterAsPreset(
      formData.name,
      formData.description || "",
      currentOptions,
      formData.favorite
    );
    
    setCharacterPresets(elitePromptGenerator.getAllCharacterPresets());
    setCharacterPresetModalOpen(false);
    characterPresetForm.reset();
    
    toast({
      title: "Character preset saved",
      description: `"${formData.name}" has been saved to your character presets.`,
    });
  };
  
  // Delete a character preset
  const deleteCharacterPreset = (id: string) => {
    if (elitePromptGenerator.deleteCharacterPreset(id)) {
      setCharacterPresets(elitePromptGenerator.getAllCharacterPresets());
      toast({
        title: "Character preset deleted",
        description: "The character preset has been removed from your collection.",
      });
    }
  };
  
  // Toggle favorite status for a character preset
  const toggleCharacterPresetFavorite = (id: string) => {
    if (elitePromptGenerator.toggleCharacterPresetFavorite(id)) {
      setCharacterPresets(elitePromptGenerator.getAllCharacterPresets());
    }
  };
  
  // Save API keys to localStorage
  const saveApiKeysToLocalStorage = () => {
    try {
      if (saveApiKeys) {
        localStorage.setItem('elite_openai_api_key', openaiApiKey);
        localStorage.setItem('elite_anthropic_api_key', anthropicApiKey);
        localStorage.setItem('elite_llama_api_key', llamaApiKey);
        localStorage.setItem('elite_grok_api_key', grokApiKey);
        localStorage.setItem('elite_bluesky_api_key', blueskyApiKey);
        localStorage.setItem('elite_mistral_api_key', mistralApiKey);
        localStorage.setItem('elite_save_api_keys', saveApiKeys.toString());
      } else {
        // If the user opted out of saving, remove any stored keys
        localStorage.removeItem('elite_openai_api_key');
        localStorage.removeItem('elite_anthropic_api_key');
        localStorage.removeItem('elite_llama_api_key');
        localStorage.removeItem('elite_grok_api_key');
        localStorage.removeItem('elite_bluesky_api_key');
        localStorage.removeItem('elite_mistral_api_key');
        localStorage.setItem('elite_save_api_keys', 'false');
      }
    } catch (error) {
      console.error("Error saving API keys to localStorage:", error);
    }
  };
  
  // History functions are now handled by the promptStore utilities
  
  // Load history items from the store
  useEffect(() => {
    const historyItems = getAllPrompts();
    setPromptGenerationHistory(historyItems);
  }, []);
  
  // Function to recall/apply a history entry
  const recallFromHistory = (entry: PromptHistoryEntry) => {
    try {
      if (!entry) return;
      
      // Different handling based on entry type (original or enhanced)
      const entryType = entry.type || 'original'; // Default to original for backward compat
      const promptText = entryType === 'enhanced' ? (entry.enhancedPrompt || '') : entry.prompt;
      
      toast({
        title: `Recalled ${entryType} prompt`,
        description: "Previous prompt loaded successfully",
      });
      
      // Set the prompt in the custom field
      form.setValue("custom", promptText);
      
      // Update view
      if (entryType === 'enhanced' && entry.enhancedPrompt) {
        setEnhancedPrompt(entry.enhancedPrompt);
        setActiveTab('results');
        setViewTab('enhanced');
      } else {
        setActiveTab('form');
      }
      
      // Restore generation options from history if available
      if (entry.options) {
        const options = entry.options;
        
        // Apply the options to the form
        Object.entries(options).forEach(([key, value]) => {
          if (key in form.getValues()) {
            try {
              // Use setValue with proper type casting to avoid TypeScript errors
              // We use "as any" here because we're dynamically accessing form fields
              form.setValue(key as any, value);
            } catch (error) {
              console.error(`Error setting form value for ${key}:`, error);
            }
          }
        });
        
        // Handle UI state properties
        if (options.useHappyTalk !== undefined) setUseHappyTalk(options.useHappyTalk);
        if (options.compressPrompt !== undefined) setCompressPrompt(options.compressPrompt);
        if (options.compressionLevel !== undefined) setCompressionLevel(options.compressionLevel);
      }
      
      // Set the corresponding template tab
      if (entry.templateUsed) {
        const isFormat = ["standard", "stableDiffusion", "midjourney", "flux", "outline"].includes(entry.templateUsed);
        const isView = ["enhanced", "pipeline", "longform", "custom1", "custom2", "custom3"].includes(entry.templateUsed);
        
        if (isFormat) {
          setFormatTab(entry.templateUsed);
        } else if (isView) {
          setViewTab(entry.templateUsed);
        }
      }
      
      // Generate the prompt to show the results
      setGeneratedPrompt({
        original: entry.prompt,
        enhanced: entry.enhancedPrompt || entry.prompt,
        stableDiffusion: entry.enhancedPrompt || entry.prompt,
        midjourney: entry.enhancedPrompt || entry.prompt,
        flux: entry.enhancedPrompt || entry.prompt,
        outline: entry.enhancedPrompt || entry.prompt,
        negative: form.getValues().negativePrompt || "",
      });
      
      // Set active tab to show results
      setActiveTab("results");
    } catch (error) {
      console.error("Error recalling from history:", error);
      toast({
        title: "Error recalling prompt",
        description: "Failed to load the prompt from history",
        variant: "destructive",
      });
    }
  };
  
  // Function to clear history
  const clearHistory = () => {
    clearAllPrompts(); // Use the new store function
    setPromptGenerationHistory([]); // Update local state
    toast({
      title: "History cleared",
      description: "All generation history has been cleared",
    });
  };
  
  // Load prompt history from store
  const loadPromptHistory = async () => {
    try {
      // Set the prompt history from promptStore
      const historyItems = getAllPrompts();
      setPromptGenerationHistory(historyItems);
      
      // Check for legacy history and migrate if needed
      const legacyHistory = localStorage.getItem('elite_prompt_generation_history');
      if (legacyHistory && historyItems.length === 0) {
        try {
          // Parse legacy history
          const parsedHistory = JSON.parse(legacyHistory);
          if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
            // Migrate legacy history
            console.log(`Migrating ${parsedHistory.length} legacy history items to new store`);
            parsedHistory.forEach(entry => {
              // Add as original prompt
              const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
              const originalEntry = addPrompt({
                id,
                timestamp: entry.timestamp || new Date().toISOString(),
                prompt: entry.prompt || '',
                options: entry.options || {},
                templateUsed: entry.templateUsed || 'standard',
                type: 'original'
              });
              
              // If it has an enhanced prompt, add it as a child
              if (entry.enhancedPrompt) {
                addEnhancedPrompt(
                  id,
                  entry.enhancedPrompt,
                  entry.templateUsed || 'enhanced'
                );
              }
            });
            
            // Remove legacy history after migration
            localStorage.removeItem('elite_prompt_generation_history');
            
            // Update state with migrated prompts
            setPromptGenerationHistory(getAllPrompts());
            
            toast({
              title: "History migrated",
              description: `${parsedHistory.length} prompt history entries have been migrated to the new format.`,
            });
          }
        } catch (migrationError) {
          console.error("Error migrating legacy history:", migrationError);
        }
      }
    } catch (error) {
      console.error("Error loading prompt history:", error);
    }
  };
  
  // Initialize prompt history
  useEffect(() => {
    loadPromptHistory();
    
    // Add event listener for the custom event from image analyzer
    const handleAnalyzedPrompt = (event: any) => {
      if (event.detail && event.detail.prompt) {
        // Set the custom prompt field
        form.setValue('custom', event.detail.prompt);
        
        // Show toast
        toast({
          title: "Prompt Imported from Image Analysis",
          description: "The analyzed prompt has been imported into the custom field.",
        });
        
        // Switch to form tab if on a different tab
        setActiveTab('form');
      }
    };
    
    // Add event listener for the "use-history-prompt" event (Send to Generator)
    const handleHistoryPrompt = (event: any) => {
      if (event.detail) {
        const entry = event.detail as PromptHistoryEntry;
        recallFromHistory(entry);
      }
    };
    
    // Add event listeners with type assertion
    document.addEventListener('use-analyzed-prompt', handleAnalyzedPrompt);
    document.addEventListener('use-history-prompt', handleHistoryPrompt);
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('use-analyzed-prompt', handleAnalyzedPrompt);
      document.removeEventListener('use-history-prompt', handleHistoryPrompt);
    };
  }, []);
  
  // Generate with custom template function (shared across all template types)
  const generateWithCustomTemplate = async (promptToEnhance: string, templateType: string, templateData?: any) => {
    if (!promptToEnhance) {
      toast({
        title: "No prompt to enhance",
        description: "Please generate a prompt first before enhancing.",
        variant: "destructive",
      });
      return null;
    }
    
    // Determine if this is a second or third row template
    const isSecondRowTemplate = templateType.startsWith('custom') || templateType === 'wildcard';
    const isThirdRowTemplate = templateType === 'pipeline' || templateType === 'longform' || templateType === 'narrative';
    
    // Set the appropriate loading state and explicitly set the other to false
    // This prevents both spinners from appearing simultaneously
    if (isSecondRowTemplate) {
      setSecondRowLoading(true);
      setThirdRowLoading(false);
    } else if (isThirdRowTemplate) {
      setThirdRowLoading(true);
      setSecondRowLoading(false);
    }
    
    // For backward compatibility
    setIsEnhancing(true);
    setActiveTemplateType(templateType);
    
    // Make sure we have a generatedPrompt with an original field
    // This is crucial for the CustomTemplateSection to work correctly
    if (!generatedPrompt) {
      setGeneratedPrompt({
        original: promptToEnhance,
        standard: promptToEnhance
      });
    } else if (!generatedPrompt.original) {
      setGeneratedPrompt(prev => ({
        ...prev, 
        original: promptToEnhance
      }));
    }
    
    // Find the appropriate template based on type
    let masterPromptToUse = '';
    let llmProvider = 'openai';
    let llmModel = 'gpt4';
    
    // Determine the template data source based on template type
    if (templateType === 'custom1' || templateType === 'custom2' || templateType === 'custom3') {
      const index = parseInt(templateType.replace('custom', '')) - 1;
      if (customTemplateData[index]) {
        masterPromptToUse = customTemplateData[index].masterPrompt;
        llmProvider = customTemplateData[index].llmProvider;
        llmModel = customTemplateData[index].llmModel;
      }
    } else if (templateType === 'narrative') {
      masterPromptToUse = narrativeTemplateData.masterPrompt;
      llmProvider = narrativeTemplateData.llmProvider;
      llmModel = narrativeTemplateData.llmModel;
    } else if (templateType === 'wildcard') {
      masterPromptToUse = wildcardTemplateData.masterPrompt;
      llmProvider = wildcardTemplateData.llmProvider;
      llmModel = wildcardTemplateData.llmModel;
    } else if (templateType === 'pipeline') {
      // Find the pipeline rule template from the rule templates array
      const pipelineRuleTemplate = ruleTemplates.find(t => t.id === 'pipeline');
      if (pipelineRuleTemplate) {
        masterPromptToUse = pipelineRuleTemplate.masterPrompt;
        llmProvider = 'openai';
        llmModel = 'gpt4';
      }
    } else if (templateType === 'longform') {
      // Find the longform rule template from the rule templates array
      const longformRuleTemplate = ruleTemplates.find(t => t.id === 'longform');
      if (longformRuleTemplate) {
        masterPromptToUse = longformRuleTemplate.masterPrompt;
        llmProvider = 'openai';
        llmModel = 'gpt4';
      }
    }
    
    // Display a toast only for user-initiated template generations
    toast({
      title: `Generating ${templateType} format`,
      description: `Using ${llmProvider} ${llmModel} to process your prompt...`,
      variant: "default"
    });
    
    // Call the enhancePromptWithLLMService with the template info
    return enhancePromptWithLLMService(promptToEnhance, templateType, masterPromptToUse);
  };
  
  // Enhance a prompt using LLM with enhanced error handling and status updates
  const enhancePromptWithLLMService = async (promptToEnhance: string, templateId?: string, masterPrompt?: string) => {
    if (!promptToEnhance) {
      toast({
        title: "No prompt to enhance",
        description: "Please generate a prompt first before enhancing.",
        variant: "destructive",
      });
      return null;
    }
    
    // Set general enhancing state but NOT row-specific states (those are handled in generateWithCustomTemplate)
    setIsEnhancing(true);
    
    // Only show toast for user-initiated enhancements (not automatic template processing)
    if (!templateId) {
      // Show status toast
      toast({
        title: "Enhancing prompt...",
        description: `Using ${llmProvider} ${llmModel} to enhance your prompt. This may take a few seconds.`,
        duration: 10000, // Longer duration since enhancement takes time
      });
    }
    
    try {
      // Set defaults for provider and model
      let usedProvider = llmProvider;
      let usedModel = llmModel;
      
      // Determine which custom base prompt to use based on the template
      let effectiveBasePrompt: string | undefined;
      
      // Enhanced debugging for template loading process
      console.log(`[TEMPLATE DEBUG] Enhancing with template: ${templateId || 'Standard'}`);
      
      // If a master prompt is explicitly provided, use it
      if (masterPrompt) {
        console.log(`[TEMPLATE DEBUG] Using explicitly provided master prompt: ${masterPrompt.substring(0, 50)}...`);
        effectiveBasePrompt = masterPrompt;
      } 
      // Otherwise try to get the template from the database
      else if (templateId) {
        try {
          // Try to get the default template for this type from the database
          console.log(`[TEMPLATE DEBUG] Attempting to load template from database for type: ${templateId}`);
          const dbTemplate = await getDefaultTemplateByType(templateId);
          
          console.log(`[TEMPLATE DEBUG] Database template retrieval result:`, dbTemplate ? 'Found' : 'Not found');
          if (dbTemplate) {
            console.log(`[TEMPLATE DEBUG] Template ID: ${dbTemplate.id}, Name: ${dbTemplate.name}, Has master_prompt: ${!!dbTemplate.master_prompt}`);
          }
          
          if (dbTemplate && dbTemplate.master_prompt) {
            console.log(`[TEMPLATE DEBUG] Using database template [${templateId}] master prompt: ${dbTemplate.master_prompt.substring(0, 50)}...`);
            effectiveBasePrompt = dbTemplate.master_prompt;
            
            // Use the template's provider and model if they're set
            if (dbTemplate.llm_provider) {
              console.log(`Using template's LLM provider: ${dbTemplate.llm_provider}`);
              // Cast to the allowed provider types
              usedProvider = dbTemplate.llm_provider as "openai" | "anthropic" | "llama" | "grok" | "bluesky" | "mistral" | "local";
            }
            
            if (dbTemplate.llm_model) {
              console.log(`Using template's LLM model: ${dbTemplate.llm_model}`);
              usedModel = dbTemplate.llm_model;
            }
          } else {
            // Fall back to in-memory templates if database template not found
            if (templateId === 'pipeline') {
              // For pipeline templates, find the pipeline template in ruleTemplates and use its master prompt
              const pipelineTemplate = ruleTemplates.find(t => t.id === 'pipeline');
              if (pipelineTemplate?.masterPrompt) {
                console.log(`Using Pipeline template master prompt: ${pipelineTemplate.masterPrompt.substring(0, 50)}...`);
                effectiveBasePrompt = pipelineTemplate.masterPrompt;
              } else {
                console.log('No pipeline template master prompt found, using default master prompt');
                effectiveBasePrompt = elitePromptGenerator.buildMasterPrompt("pipeline");
              }
            } else if (templateId === 'longform') {
              // For longform templates, find the longform template in ruleTemplates and use its master prompt
              const longformTemplate = ruleTemplates.find(t => t.id === 'longform');
              if (longformTemplate?.masterPrompt) {
                console.log(`Using Longform template master prompt: ${longformTemplate.masterPrompt.substring(0, 50)}...`);
                effectiveBasePrompt = longformTemplate.masterPrompt;
              } else {
                console.log('No longform template master prompt found, using default master prompt');
                effectiveBasePrompt = elitePromptGenerator.buildMasterPrompt("longform");
              }
            } else if (templateId.startsWith('custom')) {
              // For custom templates, find the specific template
              const template = ruleTemplates.find(t => t.id === templateId);
              if (template?.masterPrompt) {
                console.log(`Using ${templateId} template master prompt: ${template.masterPrompt.substring(0, 50)}...`);
                effectiveBasePrompt = template.masterPrompt;
              } else {
                console.log(`No master prompt found for ${templateId}, using default custom base prompt`);
                effectiveBasePrompt = elitePromptGenerator.buildMasterPrompt(templateId);
              }
            }
          }
        } catch (error) {
          console.error(`Error getting template from database for ${templateId}:`, error);
          // Fall back to in-memory templates
          if (templateId === 'pipeline') {
            // For pipeline templates, use buildMasterPrompt as a fallback
            console.log(`Error with pipeline template, falling back to default master prompt`);
            effectiveBasePrompt = elitePromptGenerator.buildMasterPrompt("pipeline");
          } else {
            // For other templates, try to find them in memory first
            const template = ruleTemplates.find(t => t.id === templateId);
            if (template?.masterPrompt) {
              console.log(`Using in-memory template [${templateId}] master prompt: ${template.masterPrompt.substring(0, 50)}...`);
              effectiveBasePrompt = template.masterPrompt;
            } else {
              console.log(`No template found for ${templateId}, using default master prompt`);
              effectiveBasePrompt = elitePromptGenerator.buildMasterPrompt(templateId || "standard");
            }
          }
        }
      } else {
        // For standard enhancement, use the UI-based custom base prompt
        console.log(`Using UI custom base prompt: ${customBasePrompt?.substring(0, 50) || 'none'}`);
        effectiveBasePrompt = customBasePrompt;
      }
      
      // If no effective base prompt was found by now, use the default one
      if (!effectiveBasePrompt) {
        effectiveBasePrompt = elitePromptGenerator.buildMasterPrompt("standard");
        console.log(`Using default master prompt: ${effectiveBasePrompt.substring(0, 50)}...`);
      }
      
      // Send the enhancement request with API keys if available
      const response = await enhancePromptWithLLM({
        prompt: promptToEnhance,
        llmProvider: usedProvider,
        llmModel: usedModel,
        useHappyTalk,
        compressPrompt,
        compressionLevel,
        customBasePrompt: effectiveBasePrompt,
        // Include API keys if available
        openaiApiKey: usedProvider === 'openai' && openaiApiKey ? openaiApiKey : undefined,
        anthropicApiKey: usedProvider === 'anthropic' && anthropicApiKey ? anthropicApiKey : undefined,
        llamaApiKey: usedProvider === 'llama' && llamaApiKey ? llamaApiKey : undefined,
        grokApiKey: usedProvider === 'grok' && grokApiKey ? grokApiKey : undefined,
        blueskyApiKey: usedProvider === 'bluesky' && blueskyApiKey ? blueskyApiKey : undefined,
        mistralApiKey: usedProvider === 'mistral' && mistralApiKey ? mistralApiKey : undefined
      });
      
      // Handle the response
      if (!response || !response.enhancedPrompt) {
        throw new Error("Received empty response from LLM service");
      }
      
      // Store diagnostics information if available
      if (response.diagnostics) {
        setPromptDiagnostics(response.diagnostics);
        // Keep diagnostics closed by default
        setShowDiagnostics(false);
      }
      
      // Process the response based on template type
      if (templateId) {
        // Template-specific enhancement
        
        // If this is a pipeline template, immediately update the pipeline field and switch tabs
        // This ensures the pipeline output is visible from the first enhancement
        if (templateId.includes('pipeline')) {
          console.log(`Immediately updating pipeline field with enhanced prompt`);
          
          // Update just the pipeline field first to ensure it's set
          setGeneratedPrompt(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              pipeline: response.enhancedPrompt
            };
          });
          
          // Switch to the pipeline output tab so user sees the result
          setViewTab('pipeline');
        } 
        // If this is a longform template, immediately update the longform field and switch tabs
        else if (templateId === 'longform') {
          console.log(`Immediately updating longform field with enhanced prompt`);
          
          // Update just the longform field first to ensure it's set
          setGeneratedPrompt(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              longform: response.enhancedPrompt
            };
          });
          
          // Switch to the longform output tab so user sees the result
          setViewTab('longform');
        }
        
        // Then update the template-specific enhanced prompt in the generated prompt state
        setGeneratedPrompt(prev => {
          if (!prev) return prev; // Return null if prev is null
          
          // Create update with the enhanced prompt in the appropriate template field
          const updates: Record<string, string> = {};
          
          // Update the specific template field
          updates[templateId] = response.enhancedPrompt;
          
          // Always include the original prompt to ensure proper UI rendering
          updates['original'] = promptToEnhance;
          
          // For pipeline templates, always ensure the main pipeline field is updated
          if (templateId.includes('pipeline')) {
            console.log(`Updated pipeline template: ${templateId} with enhanced prompt`);
            
            // Always update the main 'pipeline' field regardless of which pipeline variant was selected
            // This ensures the pipeline output is always available in the generatedPrompt.pipeline field
            updates['pipeline'] = response.enhancedPrompt;
          } 
          // For longform template, ensure the longform field is updated
          else if (templateId === 'longform') {
            console.log(`Updated longform template with enhanced prompt`);
            
            // Update the longform field
            updates['longform'] = response.enhancedPrompt;
          } 
          // For narrative template, ensure the narrative field is updated
          else if (templateId === 'narrative') {
            console.log(`Updated narrative template with enhanced prompt`);
            
            // Update the narrative field
            updates['narrative'] = response.enhancedPrompt;
          }
          // For wildcard template, ensure the wildcard field is updated
          else if (templateId === 'wildcard') {
            console.log(`Updated wildcard template with enhanced prompt`);
            
            // Update the wildcard field
            updates['wildcard'] = response.enhancedPrompt;
          }
          else {
            // For other templates (like enhanced), update only that specific template
            console.log(`Updated template: ${templateId} with enhanced prompt`);
          }
          
          return {
            ...prev,
            ...updates
          } as GeneratedPrompt; // Type assertion to ensure it matches the expected type
        });
        
        console.log(`Updated ${templateId} template with enhanced prompt using template-specific master prompt`);
        
        // Save to generation history using new prompt store
        const originalPromptId = Date.now().toString();
        
        // First add the original prompt
        const originalEntry = addPrompt({
          id: originalPromptId,
          timestamp: new Date().toISOString(),
          prompt: promptToEnhance,
          options: originalOptions,
          templateUsed: templateId,
          type: 'original'
        });
        
        // Then add the enhanced version with parent relationship
        addEnhancedPrompt(
          originalPromptId,
          response.enhancedPrompt,
          templateId
        );
        
        // Update local state
        setPromptGenerationHistory(getAllPrompts());
      } else {
        // Standard enhancement - update the enhanced prompt state
        setEnhancedPrompt(response.enhancedPrompt);
        
        // Save to generation history using new prompt store
        const originalPromptId = Date.now().toString();
        
        // First add the original prompt
        const originalEntry = addPrompt({
          id: originalPromptId,
          timestamp: new Date().toISOString(),
          prompt: promptToEnhance,
          options: originalOptions,
          templateUsed: "standard",
          type: 'original'
        });
        
        // Then add the enhanced version with parent relationship
        addEnhancedPrompt(
          originalPromptId,
          response.enhancedPrompt,
          "enhanced"
        );
        
        // Update local state
        setPromptGenerationHistory(getAllPrompts());
      }
      
      // Update history after successful enhancement
      await loadPromptHistory();
      
      // Show success toast only for user-initiated enhancements
      if (!templateId) {
        toast({
          title: "Prompt enhanced successfully",
          description: `Your prompt has been enhanced with ${llmProvider} ${llmModel}.`,
        });
      }
      
      return response.enhancedPrompt;
      
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      
      // Determine error type for better user feedback
      let errorMessage = "An unknown error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for specific error patterns
      if (errorMessage.includes("API key") || errorMessage.includes("authentication")) {
        errorMessage = `${llmProvider} API key missing or invalid. Please check your API settings.`;
      } else if (errorMessage.includes("timeout") || errorMessage.includes("ECONNREFUSED")) {
        errorMessage = `Connection to ${llmProvider} timed out. Please try again.`;
      } else if (errorMessage.includes("rate limit")) {
        errorMessage = `${llmProvider} rate limit exceeded. Please wait a moment and try again.`;
      }
      
      // Show error toast only for user-initiated enhancements
      if (!templateId) {
        toast({
          title: "Error enhancing prompt",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      return null;
    } finally {
      // Reset all loading states
      setSecondRowLoading(false);
      setThirdRowLoading(false);
      setIsEnhancing(false);
    }
  };
  
  // Export character presets to JSON
  const exportCharacterPresets = () => {
    const jsonData = elitePromptGenerator.exportCharacterPresets();
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "elite_character_presets.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Character presets exported",
      description: "Your character presets have been exported to a JSON file.",
    });
  };
  
  // Import character presets from JSON
  const importCharacterPresets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result as string;
      if (elitePromptGenerator.importCharacterPresets(contents)) {
        setCharacterPresets(elitePromptGenerator.getAllCharacterPresets());
        toast({
          title: "Character presets imported",
          description: "Your character presets have been imported successfully.",
        });
      } else {
        toast({
          title: "Import failed",
          description: "The file format is invalid or corrupted.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = "";
  };
  
  // Open the character preset modal
  const openCharacterPresetModal = (preset?: CharacterPreset) => {
    if (preset) {
      setSelectedCharacterPreset(preset);
      characterPresetForm.reset({
        name: preset.name,
        description: preset.description || "",
        favorite: preset.favorite
      });
    } else {
      setSelectedCharacterPreset(null);
      characterPresetForm.reset({
        name: "",
        description: "",
        favorite: false
      });
    }
    setCharacterPresetModalOpen(true);
  };
  
  // Load a negative prompt preset
  const loadNegativePreset = (presetId: string) => {
    const preset = NEGATIVE_PROMPT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    
    form.setValue("negativePrompt", preset.prompt);
    
    toast({
      title: "Negative preset loaded",
      description: `The ${preset.name} negative preset has been loaded.`,
    });
  };
  
  // Reset the form
  const resetForm = () => {
    form.reset();
    setGeneratedPrompt(null);
    toast({
      title: "Form reset",
      description: "All form fields have been reset to their default values.",
    });
  };
  
  // Reset all prompt generator fields
  const resetAllFields = () => {
    // Reset all fields except gender (keep current gender)
    const currentGender = form.getValues("gender");
    const currentTemplate = form.getValues("template");
    
    // Reset the form
    form.reset({
      custom: "",
      subject: "",
      gender: currentGender,
      globalOption: "Disabled",
      artform: "",
      photoType: "",
      bodyTypes: "",
      defaultTags: "",
      roles: "",
      hairstyles: "",
      hairColor: "",
      eyeColor: "",
      makeup: "",
      skinTone: "",
      clothing: "",
      place: "",
      lighting: "",
      composition: "",
      pose: "",
      background: "",
      additionalDetails: "",
      loraDescription: "",
      photographyStyles: "",
      device: "",
      photographer: "",
      artist: "",
      digitalArtform: "",
      // New detailed options - all reset to empty
      architectureOptions: "",
      artOptions: "",
      brandsOptions: "",
      cinematicOptions: "",
      fashionOptions: "",
      feelingsOptions: "",
      foodsOptions: "",
      geographyOptions: "",
      humanOptions: "",
      interactionOptions: "",
      keywordsOptions: "",
      objectsOptions: "",
      peopleOptions: "",
      plotsOptions: "",
      sceneOptions: "",
      scienceOptions: "",
      stuffOptions: "",
      timeOptions: "",
      typographyOptions: "",
      vehicleOptions: "",
      videogameOptions: "",
      // Keep selected template but reset quality presets
      template: currentTemplate,
      qualityPresets: [],
      aspectRatio: "",
      camera: "",
      negativePrompt: NEGATIVE_PROMPT_PRESETS[0].prompt,
    });
    
    // Force the form to be aware of the updates
    form.trigger();
    
    toast({
      title: "All fields reset",
      description: "All prompt settings have been reset to default values.",
    });
  };
  
  // Handle drag end for section reordering
  const handleSectionDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setSections(items);
  };
  
  // Toggle section visibility - should ONLY change visibility without triggering prompt generation
  const toggleSectionVisibility = (id: string) => {
    // Update sections state without triggering form submission
    setSections(sections.map(section => 
      section.id === id 
        ? { ...section, visible: !section.visible }
        : section
    ));
    
    // Make sure we stay in the form tab when toggling sections
    if (activeTab !== "form") {
      setActiveTab("form");
    }
  };
  
  // Open the preset modal
  const openPresetModal = (preset?: SavedPreset) => {
    if (preset) {
      setSelectedPreset(preset);
      presetForm.reset({
        name: preset.name,
        description: preset.description || "",
        favorite: preset.favorite
      });
    } else {
      setSelectedPreset(null);
      presetForm.reset({
        name: "",
        description: "",
        favorite: false
      });
    }
    setPresetModalOpen(true);
    
    // Prevent tab navigation when saving presets
    if (activeTab !== "form") {
      setActiveTab("form");
    }
  };
  
  // Open the rule template modal
  const openRuleTemplateModal = (template: RuleTemplate) => {
    setSelectedRuleTemplate(template);
    ruleTemplateForm.reset({
      name: template.name,
      description: template.description,
      template: template.template,
      // Keep old field for backward compatibility
      rules: template.rules,
      // Include new template fields with fallbacks
      formatTemplate: template.formatTemplate || "",
      usageRules: template.usageRules || template.rules || "",
      // Include LLM settings with fallbacks
      masterPrompt: template.masterPrompt || "",
      llmProvider: template.llmProvider || 'openai',
      llmModel: template.llmModel || 'gpt4',
      useHappyTalk: template.useHappyTalk !== undefined ? template.useHappyTalk : true,
      compressPrompt: template.compressPrompt !== undefined ? template.compressPrompt : false,
      compressionLevel: template.compressionLevel || 5
    });
    setRuleTemplateModalOpen(true);
  };
  
  // Regenerate with a new seed
  const regenerate = () => {
    const currentValues = form.getValues();
    currentValues.seed = Math.floor(Math.random() * 10000000);
    form.setValue("seed", currentValues.seed);
    generatePrompt(currentValues);
  };
  
  // Export presets to JSON
  const exportPresets = () => {
    const jsonData = elitePromptGenerator.exportPresets();
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "elite_prompt_presets.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Global Presets exported",
      description: "Your global presets have been exported to a JSON file.",
    });
  };
  
  // Import presets from JSON
  const importPresets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result as string;
      if (elitePromptGenerator.importPresets(contents)) {
        setSavedPresets(elitePromptGenerator.getAllPresets());
        toast({
          title: "Global Presets imported",
          description: "Your global presets have been imported successfully.",
        });
      } else {
        toast({
          title: "Import failed",
          description: "The file format is invalid or corrupted.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = "";
  };
  
  // Render a draggable section
  const renderSection = (section: SectionConfig, index: number) => {
    return (
      <Draggable key={section.id} draggableId={section.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="mb-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div {...provided.dragHandleProps} className="cursor-move">
                <Grip className="h-5 w-5 text-muted-foreground" />
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  // Prevent default action and stop propagation to prevent form submission
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSectionVisibility(section.id);
                }}
                className="p-1"
              >
                {section.visible ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <span className="font-medium text-sm">{section.title}</span>
            </div>
            
            {section.visible && (
              <div className="pl-8">
                {section.id === "basic" && (
                  <Card className="section-card bg-gray-950/50 border-gray-800 shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                        {section.icon}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="custom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom Text</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Add custom text to the beginning of your prompt"
                                  className="resize-none h-20"
                                  {...field}
                                />
                              </FormControl>

                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Main Subject</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the main subject of your image"
                                  className="resize-none h-20"
                                  {...field}
                                />
                              </FormControl>

                            </FormItem>
                          )}
                        />
                      </div>
                      
                      
                      <div className="space-y-2">
                        <FormLabel>Quality Presets</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {QUALITY_PRESETS.map((preset) => {
                            const isSelected = form.watch("qualityPresets")?.includes(preset);
                            return (
                              <Badge 
                                key={preset}
                                variant={isSelected ? "default" : "outline"}
                                className={cn(
                                  "cursor-pointer hover:opacity-80",
                                  isSelected && "bg-primary"
                                )}
                                onClick={(e) => {
                                  // Prevent default action and stop propagation to prevent form submission
                                  e.preventDefault();
                                  e.stopPropagation();
                                  
                                  const current = form.getValues("qualityPresets") || [];
                                  if (isSelected) {
                                    form.setValue(
                                      "qualityPresets",
                                      current.filter(item => item !== preset)
                                    );
                                  } else {
                                    form.setValue("qualityPresets", [...current, preset]);
                                  }
                                }}
                              >
                                {preset}
                              </Badge>
                            );
                          })}
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {section.id === "character" && (
                  <Card className="section-card bg-gray-950/50 border-gray-800 shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {section.icon}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Preset selection section */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium">Choose and Create to quickly populate character details</h3>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-1.5">
                          <div className="relative">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  className="w-full justify-between"
                                >
                                  <span>
                                    {selectedCharacterPreset ? selectedCharacterPreset.name : "Select a character preset"}
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[300px]">
                                <DropdownMenuItem
                                  onClick={() => openCharacterPresetModal()}
                                  className="cursor-pointer"
                                >
                                  <Save className="mr-2 h-4 w-4" />
                                  <span>Save Current as Preset...</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem
                                  onClick={() => document.getElementById('character-preset-import')?.click()}
                                  className="cursor-pointer"
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  <span>Import Preset...</span>
                                  <input
                                    type="file"
                                    id="character-preset-import"
                                    className="hidden"
                                    onChange={importCharacterPresets}
                                    accept=".json"
                                  />
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem
                                  onClick={exportCharacterPresets}
                                  className="cursor-pointer"
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  <span>Export All Presets</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                {characterPresets.length > 0 && (
                                  characterPresets.map((preset) => (
                                    <DropdownMenuItem
                                      key={`custom-${preset.id}`}
                                      className="cursor-pointer flex items-center justify-between group"
                                      onClick={() => loadCharacterPreset(preset.id)}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium preset-name-truncate" title={preset.name}>{preset.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {preset.gender}, {preset.role}
                                        </div>
                                      </div>
                                      <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const element = document.createElement("a");
                                            const file = new Blob([JSON.stringify([preset])], { type: "application/json" });
                                            element.href = URL.createObjectURL(file);
                                            element.download = `${preset.name.replace(/\s+/g, "_")}_preset.json`;
                                            document.body.appendChild(element);
                                            element.click();
                                            document.body.removeChild(element);
                                          }}
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Are you sure you want to delete this preset?")) {
                                              elitePromptGenerator.deleteCharacterPreset(preset.id);
                                              setCharacterPresets(elitePromptGenerator.getAllCharacterPresets());
                                              toast({
                                                title: "Character preset deleted",
                                                description: `The preset "${preset.name}" has been deleted.`,
                                              });
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </DropdownMenuItem>
                                  ))
                                )}
                                
                                {CHARACTER_PRESETS.map((preset) => (
                                  <DropdownMenuItem
                                    key={`included-${preset.id}`}
                                    className="cursor-pointer flex items-center justify-between group"
                                    onClick={() => loadCharacterPreset(preset.id)}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium flex items-center gap-2">
                                        <span className="preset-name-truncate" title={preset.name}>{preset.name}</span>
                                        <Badge variant="outline" className="text-xs px-1 flex-shrink-0">System</Badge>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {preset.gender}, {preset.role}
                                      </div>
                                    </div>
                                    <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const element = document.createElement("a");
                                          const file = new Blob([JSON.stringify([preset])], { type: "application/json" });
                                          element.href = URL.createObjectURL(file);
                                          element.download = `${preset.name.replace(/\s+/g, "_")}_preset.json`;
                                          document.body.appendChild(element);
                                          element.click();
                                          document.body.removeChild(element);
                                        }}
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                      
                      {/* Collapsible area for character details */}
                      <Collapsible defaultOpen={true} className="w-full">
                        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
                          <div className="flex items-center">
                            <ChevronDown className="mr-2 h-4 w-4" />
                            <span className="text-sm font-medium">Character Attributes</span>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="pt-2">
                            <div className="mb-3 flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  resetAllFields();
                                }}
                                className="flex items-center"
                              >
                                <RefreshCw className="mr-1 h-3 w-3" />
                                Reset
                              </Button>
                            </div>
                            
                            <Separator className="my-3" />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value || ""}
                                  className="flex gap-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="female" id="female" />
                                    <Label htmlFor="female">Female</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="male" id="male" />
                                    <Label htmlFor="male">Male</Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="bodyTypes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Body Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select body type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {(watchGender === "female" ? FEMALE_BODY_TYPES : MALE_BODY_TYPES).map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="defaultTags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Tags</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select default tags" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {(watchGender === "female" ? FEMALE_DEFAULT_TAGS : MALE_DEFAULT_TAGS).map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="hairColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hair Color</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select hair color" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {HAIR_COLORS.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="hairstyles"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hairstyle</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a hairstyle" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {HAIRSTYLES.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="eyeColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Eye Color</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select eye color" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {EYE_COLORS.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="makeup"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Makeup</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select makeup style" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {MAKEUP_OPTIONS.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="skinTone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Skin Tone</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select skin tone" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {SKIN_TONES.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="clothing"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Clothing</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select clothing" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {(watchGender === "female" ? FEMALE_CLOTHING : MALE_CLOTHING).map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="additionalDetails"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Details</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select additional details" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {(watchGender === "female" ? FEMALE_ADDITIONAL_DETAILS : MALE_ADDITIONAL_DETAILS).map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="roles"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role / Identity</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {ROLES.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="loraDescription"
                          render={({ field }) => (
                            <FormItem className="col-span-full">
                              <FormLabel className="flex items-center">
                                <span>LoRA-t (Manual Description)</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <a 
                                        href="https://docs.google.com/document/d/164CjqKN-qrcJeT7ho5B2byw5TeGz-__TIrT2ozE4294/edit?usp=sharing" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 ml-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <HelpCircle className="h-4 w-4" />
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View LoRA-t documentation</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter a custom LoRA-t description for your character"
                                  className="resize-none h-20"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide specific LoRA-t instructions for fine-tuned character generation
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                    </CardContent>
                  </Card>
                )}
                
                {section.id === "scene" && (
                  <Card className="section-card bg-gray-950/50 border-gray-800 shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                        {section.icon}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="place"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Setting / Location</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a location" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {PLACE.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="lighting"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lighting</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select lighting" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {LIGHTING.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="composition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Composition</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select composition" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {COMPOSITION.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="pose"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pose</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a pose" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {POSE.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="background"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Background</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a background" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="disabled">Disabled</SelectItem>
                                <SelectItem value="random">Random</SelectItem>
                                {BACKGROUND.map((item) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {section.id === "style" && (
                  <Card className="section-card bg-gray-950/50 border-gray-800 shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                        {section.icon}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="artform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Art Form</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select art form" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {ARTFORM.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="photoType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Photography Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select photo type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {PHOTO_TYPE.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="camera"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Camera Settings</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select camera settings" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="35mm lens">35mm Lens</SelectItem>
                                  <SelectItem value="85mm lens">85mm Lens</SelectItem>
                                  <SelectItem value="200mm lens">200mm Lens</SelectItem>
                                  <SelectItem value="f/1.8 aperture">f/1.8 Aperture</SelectItem>
                                  <SelectItem value="f/2.8 aperture">f/2.8 Aperture</SelectItem>
                                  <SelectItem value="shallow depth of field">Shallow DoF</SelectItem>
                                  <SelectItem value="bokeh">Bokeh</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Technical camera parameters
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="photographyStyles"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Photography Style</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a style" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {PHOTOGRAPHY_STYLES.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="device"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Camera / Device</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a device" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {DEVICE.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="photographer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Photographer</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a photographer" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {PHOTOGRAPHER.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="artist"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Artist / Style</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an artist" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                  <SelectItem value="random">Random</SelectItem>
                                  {ARTIST.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="digitalArtform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Digital Art Form</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a digital art form" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="disabled">Disabled</SelectItem>
                                <SelectItem value="random">Random</SelectItem>
                                {DIGITAL_ARTFORM.map((item) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {section.id === "detailed" && (
                  <Card className="section-card bg-gray-950/50 border-gray-800 shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                        {section.icon}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-gray-400 mb-2">
                        Select specific options from each subcategory to enhance your prompt
                      </div>
                      
                      {/* Use our new nested detailed options component */}
                      <NestedDetailedOptionsSection
                        categories={DETAILED_OPTIONS_CATEGORIES}
                        values={detailedOptionValues}
                        onChangeValue={(categoryName, subCategoryName, value) => {
                          // Update the nested state
                          setDetailedOptionValues(prev => ({
                            ...prev,
                            [categoryName]: {
                              ...prev[categoryName],
                              [subCategoryName]: value
                            }
                          }));
                          
                          // Also update the form value for the category
                          // This keeps backward compatibility with the existing form structure
                          const updatedValues = {
                            ...detailedOptionValues[categoryName],
                            [subCategoryName]: value
                          };
                          
                          // Convert nested values to string and update form
                          const valueString = Object.values(updatedValues)
                            .filter(val => val && val !== "" && val !== "none")
                            .join(", ");
                          
                          // Use type assertion to handle dynamic field names
                          const fieldName = `${categoryName}Options` as any;
                          form.setValue(fieldName, valueString);
                        }}
                      />
                      
                      {/* Hidden fields to store the combined values for form submission */}
                      {DETAILED_OPTIONS_CATEGORIES.map(category => {
                        // Create a string representation of selected options from the subcategory values
                        const optionsString = Object.values(detailedOptionValues[category.name] || {})
                          .filter(val => val && val !== "" && val !== "none")
                          .join(", ");
                          
                        return (
                          <input 
                            key={category.name}
                            type="hidden"
                            {...form.register(`${category.name}Options` as any)}
                            value={optionsString}
                          />
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
                {section.id === "advanced" && (
                  <Card className="section-card bg-gray-950/50 border-gray-800 shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                        {section.icon}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      
                      {/* Negative Prompt moved to Model Information section */}
                      
                      <div className="flex justify-start gap-2">
                        {ruleTemplates.map((template) => (
                          <Button
                            key={template.id}
                            variant="outline"
                            size="sm"
                            onClick={() => openRuleTemplateModal(template)}
                            className="text-xs"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {section.id === "saved" && (
                  <Card className="section-card bg-gray-950/50 border-gray-800 shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                        {section.icon}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="global-preset">Save and load complete prompt settings</Label>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setPresetFilter(presetFilter === "all" ? "favorites" : "all")}
                              title={presetFilter === "all" ? "Show favorites only" : "Show all presets"}
                            >
                              {presetFilter === "favorites" ? (
                                <Heart className="h-4 w-4 fill-primary text-primary" />
                              ) : (
                                <Heart className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="relative">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  className="w-full justify-between"
                                >
                                  <span>
                                    {selectedPreset ? selectedPreset.name : "Select a global preset"}
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[300px]">
                                <DropdownMenuItem
                                  onClick={() => openPresetModal()}
                                  className="cursor-pointer"
                                >
                                  <Save className="mr-2 h-4 w-4" />
                                  <span>Save Current as Preset...</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem
                                  onClick={() => document.getElementById('import-presets')?.click()}
                                  className="cursor-pointer"
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  <span>Import Preset...</span>
                                  <input
                                    type="file"
                                    id="import-presets"
                                    className="hidden"
                                    onChange={importPresets}
                                    accept=".json"
                                  />
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem
                                  onClick={exportPresets}
                                  className="cursor-pointer"
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  <span>Export All Presets</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                {savedPresets.length === 0 ? (
                                  <DropdownMenuItem disabled>
                                    <span className="text-muted-foreground">No presets available</span>
                                  </DropdownMenuItem>
                                ) : (
                                  <>
                                    {/* Display filtered presets */}
                                    {(presetFilter === "all" ? savedPresets : savedPresets.filter(p => p.favorite)).map((preset) => (
                                      <DropdownMenuItem
                                        key={preset.id}
                                        className="cursor-pointer flex items-center justify-between group"
                                        onClick={() => loadSavedPreset(preset)}
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium flex items-center gap-2">
                                            {preset.favorite && <Heart className="h-3 w-3 fill-primary text-primary flex-shrink-0" />}
                                            <span className="preset-name-truncate" title={preset.name}>{preset.name}</span>
                                          </div>
                                        </div>
                                        <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const element = document.createElement("a");
                                              const file = new Blob([JSON.stringify([preset])], { type: "application/json" });
                                              element.href = URL.createObjectURL(file);
                                              element.download = `${preset.name.replace(/\s+/g, "_")}_preset.json`;
                                              document.body.appendChild(element);
                                              element.click();
                                              document.body.removeChild(element);
                                            }}
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              togglePresetFavorite(preset.id);
                                            }}
                                          >
                                            {preset.favorite ? (
                                              <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
                                            ) : (
                                              <Heart className="h-3.5 w-3.5" />
                                            )}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm("Are you sure you want to delete this preset?")) {
                                                deletePreset(preset.id);
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </DropdownMenuItem>
                                    ))}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                      </div>
                      
                      {/* Save button removed as requested - save option in dropdown is sufficient */}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Admin Password Dialog */}
      {/* Admin dialog removed - using global admin mode context */}
      
      <div className="flex flex-col gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="form">Prompt Generator</TabsTrigger>
            <TabsTrigger value="output">Custom Settings</TabsTrigger>
            <TabsTrigger value="imageAnalysis">Image Analysis</TabsTrigger>
            <TabsTrigger value="longform">Prompt Library</TabsTrigger>
          </TabsList>
          
          <TabsContent value="form" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-1">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Prompt Settings
                          </h3>
                          <p className="text-sm text-gray-400">
                            Customize which sections appear and in what order
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={resetForm}
                          >
                            Reset
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSections(sections.map(s => ({ ...s, visible: true })))}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Show All
                          </Button>
                        </div>
                      </div>
                      <DragDropContext onDragEnd={handleSectionDragEnd}>
                        <Droppable droppableId="sections">
                          {(provided) => (
                            <div 
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-2"
                            >
                              {sections.map((section, index) => (
                                renderSection(section, index)
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                    

                  </form>
                </Form>
              </div>
              
              {/* Right column for generation controls and prompt display */}
              <div className="lg:col-span-1 space-y-6">
                {/* Generation Controls Card */}
                <Card className="border-gray-800 bg-gray-950/50 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Generation Controls</CardTitle>
                    <CardDescription className="text-gray-400">Configure how prompts are generated</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Controls for Generation Mode, Random Seed, and Aspect Ratio */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {/* Generation Mode */}
                      <div>
                        <div className="space-y-2">
                          <Label>Generation Mode</Label>
                          <Select 
                            onValueChange={(value) => form.setValue("globalOption", value as "Disabled" | "Random" | "No Figure Rand")}
                            value={form.watch("globalOption")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Disabled">Manual Selection</SelectItem>
                              <SelectItem value="Random">Full Random</SelectItem>
                              <SelectItem value="No Figure Rand">Random (Preserve Character)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            How random elements are selected
                          </p>
                        </div>
                      </div>
                      
                      {/* Seed */}
                      <div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>Seed</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsSeedLocked(!isSeedLocked);
                                if (!isSeedLocked) {
                                  // If we're locking, make sure there's a seed value
                                  if (!form.getValues("seed")) {
                                    const newSeed = Math.floor(Math.random() * 10000000);
                                    form.setValue("seed", newSeed);
                                  }
                                }
                              }}
                              className="h-7 w-7 p-0"
                            >
                              {isSeedLocked ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock">
                                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock-open">
                                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                </svg>
                              )}
                            </Button>
                          </div>
                          
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder={isSeedLocked ? "Enter seed value" : "Auto-generated"}
                              className="pr-12"
                              value={isSeedLocked ? form.getValues("seed") || "" : ""}
                              onChange={(e) => {
                                const value = e.target.valueAsNumber;
                                if (!isNaN(value)) {
                                  form.setValue("seed", value);
                                } else {
                                  form.setValue("seed", undefined);
                                }
                              }}
                              disabled={!isSeedLocked}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute right-0 top-0 h-full rounded-l-none w-10 p-0"
                              onClick={() => {
                                const newSeed = Math.floor(Math.random() * 10000000);
                                form.setValue("seed", newSeed);
                                // If we generate a new seed, also lock it
                                setIsSeedLocked(true);
                              }}
                            >
                              <Sparkles className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {isSeedLocked ? "Locked" : "Random"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Aspect Ratio */}
                      <div>
                        <div className="space-y-2">
                          <Label>Aspect Ratio</Label>
                          <Select 
                            onValueChange={(value) => form.setValue("aspectRatio", value)}
                            value={form.watch("aspectRatio") || ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select aspect ratio" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="disabled">Disabled</SelectItem>
                              <SelectItem value="1:1">1:1 Square</SelectItem>
                              <SelectItem value="3:2">3:2 Classic</SelectItem>
                              <SelectItem value="4:3">4:3 Standard</SelectItem>
                              <SelectItem value="16:9">16:9 Widescreen</SelectItem>
                              <SelectItem value="21:9">21:9 Ultrawide</SelectItem>
                              <SelectItem value="2:3">2:3 Portrait</SelectItem>
                              <SelectItem value="3:4">3:4 Portrait</SelectItem>
                              <SelectItem value="9:16">9:16 Mobile</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Width to height ratio
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Format toggle switches */}
                    <div className="mb-4">
                      <div className="flex justify-center gap-12">
                        <div className="flex flex-col items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Switch 
                                  id="showStableDiffusion"
                                  checked={form.watch("showStableDiffusion") !== false} 
                                  onCheckedChange={(checked) => form.setValue("showStableDiffusion", checked)}
                                  className={form.watch("showStableDiffusion") !== false ? "bg-blue-600 data-[state=checked]:bg-blue-600" : ""}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Toggle Stable Diffusion format</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="mt-2 text-xs text-gray-500">Stable Diffusion</div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Switch 
                                  id="showMidjourney"
                                  checked={form.watch("showMidjourney") !== false}
                                  onCheckedChange={(checked) => form.setValue("showMidjourney", checked)}
                                  className={form.watch("showMidjourney") !== false ? "bg-blue-600 data-[state=checked]:bg-blue-600" : ""}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Toggle Midjourney format</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="mt-2 text-xs text-gray-500">Midjourney</div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Switch 
                                  id="showFlux"
                                  checked={form.watch("showFlux") !== false}
                                  onCheckedChange={(checked) => form.setValue("showFlux", checked)}
                                  className={form.watch("showFlux") !== false ? "bg-blue-600 data-[state=checked]:bg-blue-600" : ""}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Toggle Flux format</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="mt-2 text-xs text-gray-500">Flux</div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Switch 
                                  id="showNarrative"
                                  checked={form.watch("showNarrative") !== false}
                                  onCheckedChange={(checked) => form.setValue("showNarrative", checked)}
                                  className={form.watch("showNarrative") !== false ? "bg-blue-600 data-[state=checked]:bg-blue-600" : ""}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Toggle Narrative format</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="mt-2 text-xs text-gray-500">Narrative</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Model Information Card */}
                <ModelInfo />
                
                {/* Generate Prompt Button */}
                <div className="text-center py-4">
                  <Button 
                    variant="default" 
                    size="lg"
                    onClick={(e) => {
                      // Prevent default action and stop propagation
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Execute the form submission handler without changing tabs
                      form.handleSubmit(onSubmit)(e);
                    }}
                    type="button" // Explicitly set type to button to prevent form submission
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent font-bold text-xl">
                      {isGenerating ? "Generating..." : "Generate Prompt"}
                    </span>
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                
                {/* Generated Prompt Card - Only shown when a prompt has been generated */}
                {generatedPrompt && (
                  <Card className="border-gray-800 bg-gray-950/50 shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Generated Prompt</CardTitle>
                        <div className="flex gap-1">
                          {/* Save as Note button - smaller size */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (generatedPrompt) {
                                // Create a title based on the prompt content
                                const promptWords = generatedPrompt.original.split(' ').slice(0, 6);
                                const noteTitle = promptWords.join(' ') + '...';
                                
                                // Create note content with all prompt data
                                const noteContent = `
# Elite Prompt Generator Export

## Positive Prompt
${generatedPrompt.original}

## Negative Prompt
${generatedPrompt.negativePrompt || form.getValues("negativePrompt") || "No negative prompt specified"}

## Additional Formats
- **Midjourney Format:** ${generatedPrompt.midjourney || "Not available"}
- **Stable Diffusion Format:** ${generatedPrompt.stableDiffusion || generatedPrompt.original || "Not available"}
${generatedPrompt.pipeline ? `\n## Pipeline Format\n${generatedPrompt.pipeline}\n` : ''}

## Generation Settings
- Template: ${form.getValues("template")}
- LLM Provider: ${form.getValues("llmProvider") || "Not specified"}
- LLM Model: ${form.getValues("llmModel") || "Not specified"}
- Seed: ${form.getValues("seed") || "Random"}
${form.getValues("useHappyTalk") ? "- Happy Talk: Enabled" : ""}
${form.getValues("compressPrompt") ? "- Compressed Prompt: Enabled" : ""}

Generated at: ${new Date().toLocaleString()}
                                `;
                                
                                // API call to create a note
                                fetch('/api/notes', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    title: noteTitle,
                                    content: noteContent,
                                    type: 'markdown',
                                    tags: ['ai-prompt', 'elite-generator'],
                                    folder: 'AI Prompts',
                                  }),
                                })
                                  .then(response => {
                                    if (!response.ok) {
                                      throw new Error('Failed to create note');
                                    }
                                    return response.json();
                                  })
                                  .then(() => {
                                    toast({
                                      title: "Saved as note",
                                      description: "Prompt has been saved to your notes.",
                                    });
                                  })
                                  .catch(error => {
                                    console.error('Error creating note:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to save prompt as note.",
                                      variant: "destructive",
                                    });
                                  });
                              }
                            }}
                            className="border-yellow-500 hover:bg-yellow-700/40 text-yellow-100 h-6 px-1.5 text-xs"
                          >
                            <Bookmark className="mr-1 h-3 w-3" />
                            Note
                          </Button>
                          
                          {/* Save to Library button - smaller size */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (generatedPrompt) {
                                // Get template name for title
                                const templateName = ruleTemplates.find(t => t.id === form.getValues("template"))?.name || "Custom";
                                const title = `Elite Prompt: ${templateName}`;
                                
                                // Store metadata about the generation process
                                const metadata = {
                                  template: form.getValues("template"),
                                  llmProvider: form.getValues("llmProvider"),
                                  llmModel: form.getValues("llmModel"),
                                  seed: form.getValues("seed"),
                                  useHappyTalk: form.getValues("useHappyTalk"),
                                  compressPrompt: form.getValues("compressPrompt"),
                                  params: form.getValues(),
                                  timestamp: new Date().toISOString()
                                };
                                
                                // Format the main positive prompt for display
                                const promptContent = generatedPrompt.original;
                                
                                // API call to create a prompt library entry
                                fetch('/api/prompt-library/entries', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    title: title,
                                    prompt: promptContent,
                                    negative_prompt: generatedPrompt.negativePrompt || form.getValues("negativePrompt") || "",
                                    description: "Generated with Elite Prompt Generator",
                                    tags: ['elite', 'generated', form.getValues("template") || "custom"],
                                    metadata: metadata,
                                    visibility: "public"
                                  }),
                                })
                                  .then(response => {
                                    if (!response.ok) {
                                      throw new Error('Failed to save to library');
                                    }
                                    return response.json();
                                  })
                                  .then(() => {
                                    toast({
                                      title: "Saved to library",
                                      description: "Prompt has been added to your prompt library.",
                                    });
                                  })
                                  .catch(error => {
                                    console.error('Error saving to library:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to save to prompt library.",
                                      variant: "destructive",
                                    });
                                  });
                              }
                            }}
                            className="border-purple-700 hover:bg-purple-900/40 text-purple-100 h-6 px-1.5 text-xs"
                          >
                            <Library className="mr-1 h-3 w-3" />
                            Library
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (generatedPrompt) {
                                // Create text content with all the prompt data
                                const textContent = `
ELITE PROMPT GENERATOR EXPORT
============================

POSITIVE PROMPT:
${generatedPrompt.original}

NEGATIVE PROMPT:
${generatedPrompt.negativePrompt || form.getValues("negativePrompt") || "No negative prompt specified"}

MIDJOURNEY FORMAT:
${generatedPrompt.midjourney || "Not available"}

STABLE DIFFUSION FORMAT:
${generatedPrompt.stableDiffusion || generatedPrompt.original || "Not available"}

${generatedPrompt.pipeline ? `PIPELINE FORMAT:
${generatedPrompt.pipeline}

` : ''}
GENERATION SETTINGS:
- Template: ${form.getValues("template")}
- LLM Provider: ${form.getValues("llmProvider") || "Not specified"}
- LLM Model: ${form.getValues("llmModel") || "Not specified"}
- Seed: ${form.getValues("seed") || "Random"}
${form.getValues("useHappyTalk") ? "- Happy Talk: Enabled" : ""}
${form.getValues("compressPrompt") ? "- Compressed Prompt: Enabled" : ""}

Generated at: ${new Date().toLocaleString()}
                                `;
                                
                                // Create a Blob with the text content
                                const blob = new Blob([textContent], { type: 'text/plain' });
                                
                                // Create a URL for the Blob
                                const url = URL.createObjectURL(blob);
                                
                                // Create a temporary <a> element to trigger download
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `elite-prompt-${new Date().getTime()}.txt`;
                                document.body.appendChild(a);
                                a.click();
                                
                                // Clean up
                                setTimeout(() => {
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }, 100);
                                
                                toast({
                                  title: "Downloaded",
                                  description: "Prompt has been downloaded as a text file.",
                                });
                              }
                            }}
                            className="border-blue-700 hover:bg-blue-900/40 text-blue-100 h-6 px-1.5 text-xs"
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-gray-400">
                        Your prompt will appear here after generation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* First row of tabs: Format tabs */}
                      <Tabs value={formatTab} onValueChange={handleFormatTabChange} className="w-full mb-4">
                        <TabsList className="flex space-x-1 bg-gray-900 p-1 border border-gray-800 rounded-md">
                          <TabsTrigger 
                            value="standard" 
                            className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-purple-900 data-[state=active]:text-white transition-all"
                          >
                            Standard
                          </TabsTrigger>
                          
                          {/* Only show Stable Diffusion tab if enabled */}
                          {form.watch("showStableDiffusion") && (
                            <TabsTrigger 
                              value="stable-diffusion" 
                              className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-purple-900 data-[state=active]:text-white transition-all"
                            >
                              Stable Diffusion
                            </TabsTrigger>
                          )}
                          
                          {/* Only show Midjourney tab if enabled */}
                          {form.watch("showMidjourney") && (
                            <TabsTrigger 
                              value="midjourney" 
                              className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-purple-900 data-[state=active]:text-white transition-all"
                            >
                              Midjourney
                            </TabsTrigger>
                          )}
                          
                          {/* Only show Flux tab if enabled */}
                          {form.watch("showFlux") && (
                            <TabsTrigger 
                              value="flux" 
                              className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-purple-900 data-[state=active]:text-white transition-all"
                            >
                              Flux
                            </TabsTrigger>
                          )}
                          
                          {/* Narrative tab has been moved to the third row */}
                        </TabsList>
                        
                        {/* Format tab content - renders the appropriate prompt format */}
                        <TabsContent value="standard" className="mt-4 relative">
                          <div className="rounded-md border border-gray-800 bg-gray-950/50 p-4 text-sm text-gray-300">
                            {generatedPrompt?.original}
                          </div>
                          <div className="absolute top-2 right-2">
                            <CopyButton textToCopy={generatedPrompt?.original || ""} />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="midjourney" className="mt-4 relative">
                          <div className="rounded-md border border-gray-800 bg-gray-950/50 p-4 text-sm text-gray-300">
                            {generatedPrompt?.midjourney}
                          </div>
                          <div className="absolute top-2 right-2">
                            <CopyButton textToCopy={generatedPrompt?.midjourney || ""} />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="stable-diffusion" className="mt-4 relative">
                          <div className="space-y-6">
                            {/* Positive prompt with green theme */}
                            <div className="rounded-md border border-green-600/40 bg-green-950/10 overflow-hidden">
                              <div className="bg-green-800/20 px-4 py-2 border-b border-green-600/30 flex justify-between items-center">
                                <h4 className="text-sm font-medium text-green-100 flex items-center">
                                  <Plus className="h-4 w-4 mr-2 text-green-400" />
                                  Positive Prompt
                                </h4>
                                <CopyButton textToCopy={generatedPrompt?.original || ""} />
                              </div>
                              <div className="p-4 text-sm text-gray-200">
                                {generatedPrompt?.original || "Generate a prompt first"}
                              </div>
                            </div>
                            
                            {/* Negative prompt with red theme */}
                            <div className="rounded-md border border-red-600/40 bg-red-950/10 overflow-hidden">
                              <div className="bg-red-800/20 px-4 py-2 border-b border-red-600/30 flex justify-between items-center">
                                <h4 className="text-sm font-medium text-red-100 flex items-center">
                                  <Minus className="h-4 w-4 mr-2 text-red-400" />
                                  Negative Prompt
                                </h4>
                                <CopyButton textToCopy={generatedPrompt?.negativePrompt || form.getValues("negativePrompt") || NEGATIVE_PROMPT_PRESETS[0].prompt} />
                              </div>
                              <div className="p-4 text-sm text-gray-200">
                                {generatedPrompt?.negativePrompt || form.getValues("negativePrompt") || NEGATIVE_PROMPT_PRESETS[0].prompt}
                              </div>
                            </div>
                            
                            {/* All-in-one copy button */}
                            <div className="flex justify-center mt-4">
                              <Button 
                                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md"
                                onClick={() => {
                                  if (generatedPrompt?.original) {
                                    const positivePrompt = generatedPrompt.original;
                                    const negativePrompt = generatedPrompt?.negativePrompt || form.getValues("negativePrompt") || NEGATIVE_PROMPT_PRESETS[0].prompt;
                                    const fullText = `Positive: ${positivePrompt}\n\nNegative: ${negativePrompt}`;
                                    navigator.clipboard.writeText(fullText);
                                    toast({
                                      title: "Both prompts copied",
                                      description: "Positive and negative prompts copied to clipboard",
                                    });
                                  }
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Both Prompts
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                        
                        {/* Flux tab content */}
                        <TabsContent value="flux" className="mt-4 relative">
                          <div className="rounded-md border border-purple-600/40 bg-purple-950/10 p-4 text-sm text-gray-300">
                            <h4 className="text-sm font-medium text-purple-200 mb-2">Flux Format:</h4>
                            <div className="whitespace-pre-wrap">
                              {generatedPrompt?.original ? (
                                `${generatedPrompt.original}\nSeed: ${form.getValues("seed") || "Random"}\nStyle: ${form.getValues("artform") || "Artistic"}`
                              ) : (
                                "Generate a prompt first"
                              )}
                            </div>
                          </div>
                          <div className="absolute top-2 right-2">
                            <CopyButton textToCopy={
                              generatedPrompt?.original ? (
                                `${generatedPrompt.original}\nSeed: ${form.getValues("seed") || "Random"}\nStyle: ${form.getValues("artform") || "Artistic"}`
                              ) : ""
                            } />
                          </div>
                        </TabsContent>
                        
                        {/* Outline tab content */}
                        {/* Narrative tab moved to 3rd row */}
                      </Tabs>
                      
                      {/* Space between tabs */}
                      
                      {/* Custom Templates Row */}
                      {generatedPrompt?.original && (
                        <div className="mt-4">
                          <Tabs value={customTab} onValueChange={handleCustomTabChange} className="w-full">
                            <TabsList className="flex space-x-1 bg-gray-900 p-1 border border-gray-800 rounded-md">
                              <TabsTrigger 
                                value="custom1" 
                                className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-amber-900 data-[state=active]:text-white transition-all"
                              >
                                {customTemplateData && customTemplateData[0]?.name ? customTemplateData[0].name : "Custom 1"}
                              </TabsTrigger>
                              <TabsTrigger 
                                value="custom2" 
                                className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-amber-900 data-[state=active]:text-white transition-all"
                              >
                                {customTemplateData && customTemplateData[1]?.name ? customTemplateData[1].name : "Custom 2"}
                              </TabsTrigger>
                              <TabsTrigger 
                                value="custom3" 
                                className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-amber-900 data-[state=active]:text-white transition-all"
                              >
                                {customTemplateData && customTemplateData[2]?.name ? customTemplateData[2].name : "Custom 3"}
                              </TabsTrigger>
                              <TabsTrigger 
                                value="wildcard" 
                                className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-amber-900 data-[state=active]:text-white transition-all"
                              >
                                {wildcardTemplateData?.name ? wildcardTemplateData.name : "Wildcard"}
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="custom1" className="mt-2">
                              <CustomTemplateSection 
                                templateId="custom1"
                                templateName={customTemplateData && customTemplateData[0]?.name ? customTemplateData[0].name : "Custom Template 1"}
                                description="This customizable template allows you to transform your prompt for specific models or workflows with tailored formatting."
                                isEnhancing={isEnhancing}
                                isLoading={secondRowLoading}
                                isCurrentTab={customTab === 'custom1'}
                                generatedContent={generatedPrompt?.custom1}
                                originalPrompt={generatedPrompt?.original}
                                llmProvider={llmProvider}
                                llmModel={llmModel}
                                templateData={customTemplateData && customTemplateData[0]}
                                isAdminMode={isAdminMode}
                                onSave={async (templateId, data) => {
                                  try {
                                    setIsSavingTemplate(true);
                                    // Get form values
                                    const templateName = data.name;
                                    const masterPrompt = data.masterPrompt;
                                    const formatTemplate = data.formatTemplate || "";
                                    const usageRules = data.usageRules || "";
                                    const customProvider = data.llmProvider || llmProvider;
                                    const customModel = data.llmModel || llmModel;
                                    const useHappyTalk = data.useHappyTalk || false;
                                    const compressPrompt = data.compressPrompt || false;
                                    const compressionLevel = data.compressionLevel || 5;
                                    const customId = templateId;

                                    // Save to database
                                    await saveTemplateToDatabase(customId, {
                                      name: templateName,
                                      description: `Custom template 1`,
                                      template: customId,
                                      formatTemplate: formatTemplate,
                                      usageRules: usageRules,
                                      rules: usageRules,
                                      masterPrompt: masterPrompt,
                                      llmProvider: customProvider,
                                      llmModel: customModel,
                                      useHappyTalk: useHappyTalk,
                                      compressPrompt: compressPrompt,
                                      compressionLevel: compressionLevel
                                    });
                                    
                                    // Update the customTemplateData state with the new values
                                    setCustomTemplateData(prev => {
                                      const newData = [...prev];
                                      if (!newData[0]) {
                                        newData[0] = { 
                                          name: templateName,
                                          masterPrompt: masterPrompt,
                                          formatTemplate: formatTemplate,
                                          usageRules: usageRules,
                                          llmProvider: customProvider, 
                                          llmModel: customModel,
                                          useHappyTalk: useHappyTalk,
                                          compressPrompt: compressPrompt,
                                          compressionLevel: compressionLevel
                                        };
                                      } else {
                                        newData[0] = {
                                          ...newData[0],
                                          name: templateName,
                                          masterPrompt: masterPrompt,
                                          formatTemplate: formatTemplate,
                                          usageRules: usageRules,
                                          llmProvider: customProvider,
                                          llmModel: customModel,
                                          useHappyTalk: useHappyTalk,
                                          compressPrompt: compressPrompt,
                                          compressionLevel: compressionLevel
                                        };
                                      }
                                      return newData;
                                    });
                                    
                                    toast({
                                      title: "Template Saved",
                                      description: `${templateName} template has been saved to the database.`,
                                    });
                                  } catch (error) {
                                    console.error("Error saving custom template 1:", error);
                                    toast({
                                      title: "Save Failed",
                                      description: `Failed to save custom template 1: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                      variant: "destructive"
                                    });
                                  } finally {
                                    setIsSavingTemplate(false);
                                  }
                                }}
                                promptDiagnostics={promptDiagnostics ? {
                                  provider: promptDiagnostics.apiProvider,
                                  model: promptDiagnostics.modelUsed,
                                  templateSource: promptDiagnostics.templateSource,
                                  timestamp: promptDiagnostics.timestamp,
                                  dbConnectionStatus: promptDiagnostics.dbConnectionStatus,
                                  responseTime: promptDiagnostics.responseTime,
                                  fallbackUsed: promptDiagnostics.fallbackUsed,
                                  masterPromptLength: promptDiagnostics.llmParams?.masterPromptLength,
                                  compressionLevel: promptDiagnostics.llmParams?.compressionLevel,
                                  useHappyTalk: promptDiagnostics.llmParams?.useHappyTalk,
                                  compressPrompt: promptDiagnostics.llmParams?.compressPrompt,
                                  errors: promptDiagnostics.errors
                                } : undefined}
                                colors={{
                                  border: 'amber',
                                  bg: 'amber',
                                  text: 'amber',
                                  buttonFrom: 'amber',
                                  buttonTo: 'orange'
                                }}
                                onGenerate={() => {
                                  if (customTemplateData && customTemplateData[0]?.masterPrompt) {
                                    // Set proper loading states
                                    setSecondRowLoading(true);
                                    setIsEnhancing(true);
                                    generateWithCustomTemplate(
                                      generatedPrompt!.original,
                                      'custom1',
                                      customTemplateData[0]
                                    );
                                  } else {
                                    toast({
                                      title: "Missing template data",
                                      description: "Please configure your custom template in admin settings first.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                onEditTemplate={(templateData) => {
                                  setSelectedRuleTemplate({
                                    id: 'custom1',
                                    name: 'Custom Template 1',
                                    type: 'custom1',
                                    rules: '',
                                    masterPrompt: customTemplateData && customTemplateData[0]?.masterPrompt || '',
                                    formatTemplate: customTemplateData && customTemplateData[0]?.formatTemplate || '',
                                    usageRules: customTemplateData && customTemplateData[0]?.usageRules || '',
                                  });
                                  setRuleTemplateModalOpen(true);
                                }}
                              />
                            </TabsContent>
                            
                            {/* CUSTOM 2 TAB */}
                            
                            <TabsContent value="custom2" className="mt-2">
                              <CustomTemplateSection 
                                templateId="custom2"
                                templateName={customTemplateData && customTemplateData[1]?.name ? customTemplateData[1].name : "Custom Template 2"}
                                description="This specialized template transforms your prompt with additional formatting options for specific models or workflows."
                                isEnhancing={isEnhancing}
                                isLoading={secondRowLoading}
                                isCurrentTab={customTab === 'custom2'}
                                generatedContent={generatedPrompt?.custom2}
                                originalPrompt={generatedPrompt?.original}
                                llmProvider={llmProvider}
                                llmModel={llmModel}
                                templateData={customTemplateData && customTemplateData[1]}
                                isAdminMode={isAdminMode}
                                onSave={async (templateId, data) => {
                                  try {
                                    setIsSavingTemplate(true);
                                    // Get form values
                                    const templateName = data.name;
                                    const masterPrompt = data.masterPrompt;
                                    const formatTemplate = data.formatTemplate || "";
                                    const usageRules = data.usageRules || "";
                                    const customProvider = data.llmProvider || llmProvider;
                                    const customModel = data.llmModel || llmModel;
                                    const useHappyTalk = data.useHappyTalk || false;
                                    const compressPrompt = data.compressPrompt || false;
                                    const compressionLevel = data.compressionLevel || 5;
                                    const customId = templateId;

                                    // Save to database
                                    await saveTemplateToDatabase(customId, {
                                      name: templateName,
                                      description: `Custom template 2`,
                                      template: customId,
                                      formatTemplate: formatTemplate,
                                      usageRules: usageRules,
                                      rules: usageRules,
                                      masterPrompt: masterPrompt,
                                      llmProvider: customProvider,
                                      llmModel: customModel,
                                      useHappyTalk: useHappyTalk,
                                      compressPrompt: compressPrompt,
                                      compressionLevel: compressionLevel
                                    });
                                    
                                    // Update the customTemplateData state with the new values
                                    setCustomTemplateData(prev => {
                                      const newData = [...prev];
                                      if (!newData[1]) {
                                        newData[1] = { 
                                          name: templateName,
                                          masterPrompt: masterPrompt,
                                          formatTemplate: formatTemplate,
                                          usageRules: usageRules,
                                          llmProvider: customProvider, 
                                          llmModel: customModel,
                                          useHappyTalk: useHappyTalk,
                                          compressPrompt: compressPrompt,
                                          compressionLevel: compressionLevel
                                        };
                                      } else {
                                        newData[1] = {
                                          ...newData[1],
                                          name: templateName,
                                          masterPrompt: masterPrompt,
                                          formatTemplate: formatTemplate,
                                          usageRules: usageRules,
                                          llmProvider: customProvider,
                                          llmModel: customModel,
                                          useHappyTalk: useHappyTalk,
                                          compressPrompt: compressPrompt,
                                          compressionLevel: compressionLevel
                                        };
                                      }
                                      return newData;
                                    });
                                    
                                    toast({
                                      title: "Template Saved",
                                      description: `${templateName} template has been saved to the database.`,
                                    });
                                  } catch (error) {
                                    console.error("Error saving custom template 2:", error);
                                    toast({
                                      title: "Save Failed",
                                      description: `Failed to save custom template 2: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                      variant: "destructive"
                                    });
                                  } finally {
                                    setIsSavingTemplate(false);
                                  }
                                }}
                                promptDiagnostics={promptDiagnostics ? {
                                  provider: promptDiagnostics.apiProvider,
                                  model: promptDiagnostics.modelUsed,
                                  templateSource: promptDiagnostics.templateSource,
                                  timestamp: promptDiagnostics.timestamp,
                                  dbConnectionStatus: promptDiagnostics.dbConnectionStatus,
                                  responseTime: promptDiagnostics.responseTime,
                                  fallbackUsed: promptDiagnostics.fallbackUsed,
                                  masterPromptLength: promptDiagnostics.llmParams?.masterPromptLength,
                                  compressionLevel: promptDiagnostics.llmParams?.compressionLevel,
                                  useHappyTalk: promptDiagnostics.llmParams?.useHappyTalk,
                                  compressPrompt: promptDiagnostics.llmParams?.compressPrompt,
                                  errors: promptDiagnostics.errors
                                } : undefined}
                                colors={{
                                  border: 'amber',
                                  bg: 'amber',
                                  text: 'amber',
                                  buttonFrom: 'amber',
                                  buttonTo: 'orange'
                                }}
                                onGenerate={() => {
                                  if (customTemplateData && customTemplateData[1]?.masterPrompt) {
                                    // Set proper loading states
                                    setSecondRowLoading(true);
                                    setIsEnhancing(true);
                                    generateWithCustomTemplate(
                                      generatedPrompt!.original,
                                      'custom2',
                                      customTemplateData[1]
                                    );
                                  } else {
                                    toast({
                                      title: "Missing template data",
                                      description: "Please configure your custom template in admin settings first.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                onEditTemplate={(templateData) => {
                                  setSelectedRuleTemplate({
                                    id: 'custom2',
                                    name: 'Custom Template 2',
                                    type: 'custom2',
                                    rules: '',
                                    masterPrompt: customTemplateData && customTemplateData[1]?.masterPrompt || '',
                                    formatTemplate: customTemplateData && customTemplateData[1]?.formatTemplate || '',
                                    usageRules: customTemplateData && customTemplateData[1]?.usageRules || '',
                                  });
                                  setRuleTemplateModalOpen(true);
                                }}
                              />
                            </TabsContent>
                            
                            <TabsContent value="custom3" className="mt-2">
                              <CustomTemplateSection 
                                templateId="custom3"
                                templateName={customTemplateData && customTemplateData[2]?.name ? customTemplateData[2].name : "Custom Template 3"}
                                description="This advanced template adds specialized parameters and formatting optimized for complex workflows and models."
                                isEnhancing={isEnhancing}
                                isLoading={secondRowLoading}
                                isCurrentTab={customTab === 'custom3'}
                                generatedContent={generatedPrompt?.custom3}
                                originalPrompt={generatedPrompt?.original}
                                llmProvider={llmProvider}
                                llmModel={llmModel}
                                templateData={customTemplateData && customTemplateData[2]}
                                isAdminMode={isAdminMode}
                                onSave={async (templateId, data) => {
                                  try {
                                    setIsSavingTemplate(true);
                                    // Get form values
                                    const templateName = data.name;
                                    const masterPrompt = data.masterPrompt;
                                    const formatTemplate = data.formatTemplate || "";
                                    const usageRules = data.usageRules || "";
                                    const customProvider = data.llmProvider || llmProvider;
                                    const customModel = data.llmModel || llmModel;
                                    const useHappyTalk = data.useHappyTalk || false;
                                    const compressPrompt = data.compressPrompt || false;
                                    const compressionLevel = data.compressionLevel || 5;
                                    const customId = templateId;

                                    // Save to database
                                    await saveTemplateToDatabase(customId, {
                                      name: templateName,
                                      description: `Custom template 3`,
                                      template: customId,
                                      formatTemplate: formatTemplate,
                                      usageRules: usageRules,
                                      rules: usageRules,
                                      masterPrompt: masterPrompt,
                                      llmProvider: customProvider,
                                      llmModel: customModel,
                                      useHappyTalk: useHappyTalk,
                                      compressPrompt: compressPrompt,
                                      compressionLevel: compressionLevel
                                    });
                                    
                                    // Update the customTemplateData state with the new values
                                    setCustomTemplateData(prev => {
                                      const newData = [...prev];
                                      if (!newData[2]) {
                                        newData[2] = { 
                                          name: templateName,
                                          masterPrompt: masterPrompt,
                                          formatTemplate: formatTemplate,
                                          usageRules: usageRules,
                                          llmProvider: customProvider, 
                                          llmModel: customModel,
                                          useHappyTalk: useHappyTalk,
                                          compressPrompt: compressPrompt,
                                          compressionLevel: compressionLevel
                                        };
                                      } else {
                                        newData[2] = {
                                          ...newData[2],
                                          name: templateName,
                                          masterPrompt: masterPrompt,
                                          formatTemplate: formatTemplate,
                                          usageRules: usageRules,
                                          llmProvider: customProvider,
                                          llmModel: customModel,
                                          useHappyTalk: useHappyTalk,
                                          compressPrompt: compressPrompt,
                                          compressionLevel: compressionLevel
                                        };
                                      }
                                      return newData;
                                    });
                                    
                                    toast({
                                      title: "Template Saved",
                                      description: `${templateName} template has been saved to the database.`,
                                    });
                                  } catch (error) {
                                    console.error("Error saving custom template 3:", error);
                                    toast({
                                      title: "Save Failed",
                                      description: `Failed to save custom template 3: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                      variant: "destructive"
                                    });
                                  } finally {
                                    setIsSavingTemplate(false);
                                  }
                                }}
                                promptDiagnostics={promptDiagnostics ? {
                                  provider: promptDiagnostics.apiProvider,
                                  model: promptDiagnostics.modelUsed,
                                  templateSource: promptDiagnostics.templateSource,
                                  timestamp: promptDiagnostics.timestamp,
                                  dbConnectionStatus: promptDiagnostics.dbConnectionStatus,
                                  responseTime: promptDiagnostics.responseTime,
                                  fallbackUsed: promptDiagnostics.fallbackUsed,
                                  masterPromptLength: promptDiagnostics.llmParams?.masterPromptLength,
                                  compressionLevel: promptDiagnostics.llmParams?.compressionLevel,
                                  useHappyTalk: promptDiagnostics.llmParams?.useHappyTalk,
                                  compressPrompt: promptDiagnostics.llmParams?.compressPrompt,
                                  errors: promptDiagnostics.errors
                                } : undefined}
                                colors={{
                                  border: 'amber',
                                  bg: 'amber',
                                  text: 'amber',
                                  buttonFrom: 'amber',
                                  buttonTo: 'orange'
                                }}
                                onGenerate={() => {
                                  if (customTemplateData && customTemplateData[2]?.masterPrompt) {
                                    // Set proper loading states
                                    setSecondRowLoading(true);
                                    setIsEnhancing(true);
                                    generateWithCustomTemplate(
                                      generatedPrompt!.original,
                                      'custom3',
                                      customTemplateData[2]
                                    );
                                  } else {
                                    toast({
                                      title: "Missing template data",
                                      description: "Please configure your custom template in admin settings first.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                onEditTemplate={(templateData) => {
                                  setSelectedRuleTemplate({
                                    id: 'custom3',
                                    name: 'Custom Template 3',
                                    type: 'custom3',
                                    rules: '',
                                    masterPrompt: customTemplateData && customTemplateData[2]?.masterPrompt || '',
                                    formatTemplate: customTemplateData && customTemplateData[2]?.formatTemplate || '',
                                    usageRules: customTemplateData && customTemplateData[2]?.usageRules || '',
                                  });
                                  setRuleTemplateModalOpen(true);
                                }}
                              />
                            </TabsContent>
                            
                            <TabsContent value="wildcard" className="mt-2">
                              <CustomTemplateSection 
                                templateId="wildcard"
                                templateName={wildcardTemplateData?.name ? wildcardTemplateData.name : "Wildcard Format"}
                                description="This highly flexible template adapts to any special use case with customizable rules and formatting."
                                isEnhancing={isEnhancing}
                                isLoading={secondRowLoading}
                                isCurrentTab={customTab === 'wildcard'}
                                generatedContent={generatedPrompt?.wildcard}
                                originalPrompt={generatedPrompt?.original}
                                llmProvider={llmProvider}
                                llmModel={llmModel}
                                templateData={wildcardTemplateData}
                                isAdminMode={isAdminMode}
                                promptDiagnostics={promptDiagnostics ? {
                                  provider: promptDiagnostics.apiProvider,
                                  model: promptDiagnostics.modelUsed,
                                  templateSource: promptDiagnostics.templateSource,
                                  timestamp: promptDiagnostics.timestamp,
                                  dbConnectionStatus: promptDiagnostics.dbConnectionStatus,
                                  responseTime: promptDiagnostics.responseTime,
                                  fallbackUsed: promptDiagnostics.fallbackUsed,
                                  masterPromptLength: promptDiagnostics.llmParams?.masterPromptLength,
                                  compressionLevel: promptDiagnostics.llmParams?.compressionLevel,
                                  useHappyTalk: promptDiagnostics.llmParams?.useHappyTalk,
                                  compressPrompt: promptDiagnostics.llmParams?.compressPrompt,
                                  errors: promptDiagnostics.errors
                                } : undefined}
                                colors={{
                                  border: 'amber',
                                  bg: 'amber',
                                  text: 'amber',
                                  buttonFrom: 'amber',
                                  buttonTo: 'orange'
                                }}
                                onGenerate={() => {
                                  if (wildcardTemplateData?.masterPrompt) {
                                    // Set both loading states
                                    setSecondRowLoading(true);
                                    setIsEnhancing(true);
                                    
                                    generateWithCustomTemplate(
                                      generatedPrompt!.original,
                                      'wildcard',
                                      wildcardTemplateData
                                    );
                                  } else {
                                    toast({
                                      title: "Missing template data",
                                      description: "Please configure the wildcard template in admin settings first.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                onEditTemplate={(templateData) => {
                                  setSelectedRuleTemplate({
                                    id: 'wildcard',
                                    name: 'Wildcard Format',
                                    type: 'wildcard',
                                    rules: '',
                                    masterPrompt: wildcardTemplateData.masterPrompt,
                                    formatTemplate: wildcardTemplateData.formatTemplate || '',
                                    usageRules: wildcardTemplateData.usageRules || '',
                                  });
                                  setRuleTemplateModalOpen(true);
                                }}
                              />
                            </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      
                      {/* Only show Enhanced by LLM row if there's a prompt */}
                      {generatedPrompt?.original && (
                        <div className="mt-6">
                          <Tabs value={viewTab} onValueChange={handleViewTabChange} className="w-full">
                            <TabsList className="flex space-x-1 bg-gray-900 p-1 border border-gray-800 rounded-md">
                              <TabsTrigger 
                                value="enhanced" 
                                className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-purple-900 data-[state=active]:text-white transition-all"
                              >
                                Enhanced by LLM
                              </TabsTrigger>
                              <TabsTrigger 
                                value="pipeline" 
                                className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-purple-900 data-[state=active]:text-white transition-all"
                              >
                                Pipeline
                              </TabsTrigger>
                              <TabsTrigger 
                                value="longform" 
                                className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-purple-900 data-[state=active]:text-white transition-all"
                              >
                                Longform
                              </TabsTrigger>
                              <TabsTrigger 
                                value="narrative" 
                                className="flex-1 py-2 px-4 rounded-sm font-medium text-gray-300 data-[state=active]:bg-purple-900 data-[state=active]:text-white transition-all"
                              >
                                Narrative
                              </TabsTrigger>
                              {/* The "Custom" tab has been replaced with "Narrative" as requested */}
                            </TabsList>
                        
                        <TabsContent value="standard" className="mt-4">
                          <div className="relative">
                            <div className="rounded-md border border-gray-800 bg-gray-950/50 p-4 text-sm text-gray-300">
                              {generatedPrompt.original}
                            </div>
                            <div className="absolute top-2 right-2">
                              <CopyButton textToCopy={generatedPrompt.original} />
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="midjourney" className="mt-4">
                          <div className="relative">
                            <div className="rounded-md border border-gray-800 bg-gray-950/50 p-4 text-sm text-gray-300">
                              {generatedPrompt.midjourney}
                            </div>
                            <div className="absolute top-2 right-2">
                              <CopyButton textToCopy={generatedPrompt.midjourney} />
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="stable-diffusion" className="mt-4">
                          <div className="space-y-6">
                            {/* Positive prompt with green theme */}
                            <div className="rounded-md border border-green-600/40 bg-green-950/10 overflow-hidden">
                              <div className="bg-green-800/20 px-4 py-2 border-b border-green-600/30 flex justify-between items-center">
                                <h4 className="text-sm font-medium text-green-100 flex items-center">
                                  <Plus className="h-4 w-4 mr-2 text-green-400" />
                                  Positive Prompt
                                </h4>
                                <CopyButton textToCopy={generatedPrompt?.original || ""} />
                              </div>
                              <div className="p-4 text-sm text-gray-200">
                                {generatedPrompt?.original || "Generate a prompt first"}
                              </div>
                            </div>
                            
                            {/* Negative prompt with red theme */}
                            <div className="rounded-md border border-red-600/40 bg-red-950/10 overflow-hidden">
                              <div className="bg-red-800/20 px-4 py-2 border-b border-red-600/30 flex justify-between items-center">
                                <h4 className="text-sm font-medium text-red-100 flex items-center">
                                  <Minus className="h-4 w-4 mr-2 text-red-400" />
                                  Negative Prompt
                                </h4>
                                <CopyButton textToCopy={generatedPrompt?.negativePrompt || form.getValues("negativePrompt") || NEGATIVE_PROMPT_PRESETS[0].prompt} />
                              </div>
                              <div className="p-4 text-sm text-gray-200">
                                {generatedPrompt?.negativePrompt || form.getValues("negativePrompt") || NEGATIVE_PROMPT_PRESETS[0].prompt}
                              </div>
                            </div>
                            
                            {/* All-in-one copy button */}
                            <div className="flex justify-center mt-4">
                              <Button 
                                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md"
                                onClick={() => {
                                  if (generatedPrompt?.original) {
                                    const positivePrompt = generatedPrompt.original;
                                    const negativePrompt = generatedPrompt?.negativePrompt || form.getValues("negativePrompt") || NEGATIVE_PROMPT_PRESETS[0].prompt;
                                    const fullText = `Positive: ${positivePrompt}\n\nNegative: ${negativePrompt}`;
                                    navigator.clipboard.writeText(fullText);
                                    toast({
                                      title: "Both prompts copied",
                                      description: "Positive and negative prompts copied to clipboard",
                                    });
                                  }
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Both Prompts
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="pipeline" className="mt-4">
                          {/* Pipeline Format - With 3 states: Loading, Generated Content, or Initial State with button */}
                          
                          {isEnhancing && viewTab === 'pipeline' ? (
                            // LOADING STATE
                            <div className="flex flex-col items-center justify-center py-12 border border-blue-800 rounded-md bg-blue-950/20">
                              <Loader2Icon className="h-8 w-8 animate-spin text-blue-400 mb-4" />
                              <p className="text-blue-200">Generating structured pipeline output...</p>
                              <p className="text-sm text-blue-300/70 mt-2">
                                Using {llmProvider} {llmModel} to create a formatted pipeline
                              </p>
                              <p className="text-xs text-blue-300/60 mt-4">
                                This may take a few seconds as the AI is structuring your prompt into the Pipeline format...
                              </p>
                            </div>
                          ) : generatedPrompt?.pipeline ? (
                            // GENERATED CONTENT STATE
                            <div className="space-y-4">
                              <div className="relative">
                                <div className="rounded-md border border-purple-900 bg-purple-950/20 p-4 text-sm text-gray-100">
                                  <pre className="whitespace-pre-wrap font-mono text-xs text-purple-100">{generatedPrompt.pipeline}</pre>
                                </div>
                                <div className="absolute top-2 right-2 flex space-x-2">
                                  <CopyButton textToCopy={generatedPrompt.pipeline} />
                                </div>
                              </div>
                              
                              {/* Diagnostics Card - Collapsed by default */}
                              {promptDiagnostics && (
                                <Card className="border border-blue-800 bg-blue-950/10">
                                  <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                      <CardTitle className="text-sm font-medium text-blue-200">
                                        <div className="flex items-center">
                                          <BrainCircuit className="h-4 w-4 mr-2" />
                                          Pipeline Diagnostics
                                        </div>
                                      </CardTitle>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-blue-300 hover:text-blue-200 hover:bg-blue-900/20"
                                        onClick={() => setShowDiagnostics(!showDiagnostics)}
                                      >
                                        {showDiagnostics ? (
                                          <>
                                            <MinusCircle className="h-4 w-4 mr-1" />
                                            <span className="text-xs">Hide Details</span>
                                          </>
                                        ) : (
                                          <>
                                            <PlusCircle className="h-4 w-4 mr-1" />
                                            <span className="text-xs">Show Details</span>
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    <CardDescription className="text-xs text-blue-300/70">
                                      Technical details about how this prompt was generated
                                    </CardDescription>
                                  </CardHeader>

                                  {showDiagnostics && (
                                    <CardContent className="pt-0 pb-3">
                                      <div className="space-y-3 text-xs">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <p className="font-semibold text-blue-200">API Information</p>
                                            <div className="grid grid-cols-2 gap-1 pl-2">
                                              <p className="text-blue-300/80">Provider:</p>
                                              <p className="text-blue-100">{promptDiagnostics.apiProvider || "-"}</p>
                                              <p className="text-blue-300/80">Model:</p>
                                              <p className="text-blue-100">{promptDiagnostics.modelUsed || "-"}</p>
                                              <p className="text-blue-300/80">Template Source:</p>
                                              <p className="text-blue-100">{promptDiagnostics.templateSource || "database"}</p>
                                              <p className="text-blue-300/80">Fallback Used:</p>
                                              <p className="text-blue-100">{promptDiagnostics.fallbackUsed ? "Yes" : "No"}</p>
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-1">
                                            <p className="font-semibold text-blue-200">Performance</p>
                                            <div className="grid grid-cols-2 gap-1 pl-2">
                                              <p className="text-blue-300/80">Response Time:</p>
                                              <p className="text-blue-100">{promptDiagnostics.responseTime ? `${(promptDiagnostics.responseTime/1000).toFixed(2)}s` : "-"}</p>
                                              <p className="text-blue-300/80">Timestamp:</p>
                                              <p className="text-blue-100">{promptDiagnostics.timestamp ? new Date(promptDiagnostics.timestamp).toLocaleString() : "-"}</p>
                                              <p className="text-blue-300/80">DB Status:</p>
                                              <p className="text-blue-100">
                                                {promptDiagnostics.dbConnectionStatus === 'connected' ? (
                                                  <span className="text-green-300">Connected</span>
                                                ) : promptDiagnostics.dbConnectionStatus === 'failed' ? (
                                                  <span className="text-red-300">Failed</span>
                                                ) : (
                                                  <span className="text-yellow-300">Unknown</span>
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {promptDiagnostics.llmParams && (
                                          <div className="space-y-1">
                                            <p className="font-semibold text-blue-200">LLM Parameters</p>
                                            <div className="grid grid-cols-4 gap-1 pl-2">
                                              <p className="text-blue-300/80">Use Happy Talk:</p>
                                              <p className="text-blue-100">{promptDiagnostics.llmParams.useHappyTalk ? "Yes" : "No"}</p>
                                              <p className="text-blue-300/80">Compress Prompt:</p>
                                              <p className="text-blue-100">{promptDiagnostics.llmParams.compressPrompt ? "Yes" : "No"}</p>
                                              <p className="text-blue-300/80">Compression Level:</p>
                                              <p className="text-blue-100">{promptDiagnostics.llmParams.compressionLevel}</p>
                                              <p className="text-blue-300/80">Master Prompt Length:</p>
                                              <p className="text-blue-100">{promptDiagnostics.llmParams.masterPromptLength || 0} chars</p>
                                              {promptDiagnostics.llmParams.tokenCount && (
                                                <>
                                                  <p className="text-blue-300/80">Token Count:</p>
                                                  <p className="text-blue-100">{promptDiagnostics.llmParams.tokenCount}</p>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {promptDiagnostics.errors && promptDiagnostics.errors.length > 0 && (
                                          <div className="space-y-1">
                                            <p className="font-semibold text-yellow-200">Errors / Warnings</p>
                                            <div className="pl-2 space-y-1">
                                              {promptDiagnostics.errors.map((error, i) => (
                                                <div key={i} className="p-1 text-yellow-100 bg-yellow-900/20 rounded">
                                                  <span className="font-medium">{error.type}: </span>
                                                  {error.message} <span className="text-xs italic">(Handled by: {error.handledBy})</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  )}
                                </Card>
                              )}
                              
                              {/* Regenerate button for Pipeline format */}
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (generatedPrompt?.original) {
                                      // Clear the pipeline field first to show loading state
                                      setGeneratedPrompt(prev => {
                                        if (!prev) return prev;
                                        const updatedPrompt = { ...prev };
                                        // Use delete to remove the property completely instead of setting to undefined
                                        delete updatedPrompt.pipeline;
                                        return updatedPrompt;
                                      });
                                      
                                      // Set enhancing state
                                      setIsEnhancing(true);
                                      setViewTab('pipeline');
                                      
                                      // Find the pipeline template
                                      const pipelineTemplate = ruleTemplates.find(t => t.id === 'pipeline');
                                      enhancePromptWithLLMService(
                                        generatedPrompt.original, 
                                        'pipeline',
                                        pipelineTemplate?.masterPrompt
                                      );
                                    }
                                  }}
                                >
                                  <Wand2Icon className="mr-2 h-5 w-5" />
                                  Generate Pipeline Format
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // INITIAL STATE - BUTTON ONLY
                            <div>
                              {generatedPrompt?.original ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-6">
                                  {/* Info block about pipeline format */}
                                  <div className="p-3 border border-blue-900 rounded-md bg-blue-950/20 max-w-md w-full">
                                    <h4 className="text-sm font-medium flex items-center text-blue-200">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <InfoIcon className="h-4 w-4 mr-2 cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="max-w-xs">
                                              Pipeline format organizes prompts into clear hierarchical sections 
                                              for pose, setting, appearance, clothing, accessories, and more.
                                              This structured approach helps AI models better understand and 
                                              generate consistent, high-quality images.
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      Pipeline Format
                                    </h4>
                                    <p className="text-xs mt-1 text-blue-300/80">
                                      This structured pipeline format is optimized for AI image generation with sections for pose/setting, appearance, materials, clothing, and accessories.
                                    </p>
                                  </div>
                                  
                                  {/* Gradient button styled like mockup */}
                                  <Button 
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full max-w-md text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                    size="lg"
                                    disabled={isEnhancing && viewTab === 'pipeline'}
                                    onClick={() => {
                                      // Set enhancing state before generating
                                      setIsEnhancing(true);
                                      
                                      // Find the pipeline template
                                      const pipelineTemplate = ruleTemplates.find(t => t.id === 'pipeline');
                                      if (pipelineTemplate) {
                                        enhancePromptWithLLMService(
                                          generatedPrompt.original, 
                                          'pipeline',
                                          pipelineTemplate.masterPrompt
                                        );
                                      } else {
                                        // Fallback if template isn't found
                                        enhancePromptWithLLMService(generatedPrompt.original, 'pipeline');
                                      }
                                    }}
                                  >
                                    <Wand2Icon className="mr-2 h-5 w-5" />
                                    Generate Pipeline Format
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <p className="text-sm text-gray-400">Generate a prompt first to create a Pipeline format</p>
                                </div>
                              )}
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="longform" className="mt-4">
                          {/* Longform Format - With 3 states: Loading, Generated Content, or Initial State with button */}
                          
                          {isEnhancing && viewTab === 'longform' ? (
                            // LOADING STATE
                            <div className="flex flex-col items-center justify-center py-12 border border-indigo-800 rounded-md bg-indigo-950/20">
                              <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-4" />
                              <p className="text-indigo-200">Generating longform narrative output...</p>
                              <p className="text-sm text-indigo-300/70 mt-2">
                                Using {llmProvider} {llmModel} to create a detailed longform narrative
                              </p>
                              <p className="text-xs text-indigo-300/60 mt-4">
                                This may take a few seconds as the AI is expanding your prompt into a detailed narrative format...
                              </p>
                            </div>
                          ) : generatedPrompt?.longform ? (
                            // GENERATED CONTENT STATE
                            <div className="space-y-4">
                              <div className="relative">
                                <div className="rounded-md border border-indigo-900 bg-indigo-950/20 p-4 text-sm text-gray-100">
                                  <pre className="whitespace-pre-wrap font-mono text-xs text-indigo-100">{generatedPrompt.longform}</pre>
                                </div>
                                <div className="absolute top-2 right-2 flex space-x-2">
                                  <CopyButton textToCopy={generatedPrompt.longform} />
                                </div>
                              </div>
                              
                              {/* Diagnostics Card for Longform - Collapsed by default */}
                              {promptDiagnostics && (
                                <Card className="border border-indigo-800 bg-indigo-950/10">
                                  <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                      <CardTitle className="text-sm font-medium text-indigo-200">
                                        <div className="flex items-center">
                                          <BrainCircuit className="h-4 w-4 mr-2" />
                                          Longform Diagnostics
                                        </div>
                                      </CardTitle>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/20"
                                        onClick={() => setShowDiagnostics(!showDiagnostics)}
                                      >
                                        {showDiagnostics ? (
                                          <>
                                            <Minus className="h-4 w-4 mr-1" />
                                            <span className="text-xs">Hide Details</span>
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="h-4 w-4 mr-1" />
                                            <span className="text-xs">Show Details</span>
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    <CardDescription className="text-xs text-indigo-300/70">
                                      Technical details about how this prompt was generated
                                    </CardDescription>
                                  </CardHeader>

                                  {showDiagnostics && (
                                    <CardContent className="pt-0 pb-3">
                                      <div className="space-y-3 text-xs">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <p className="font-semibold text-indigo-200">API Information</p>
                                            <div className="grid grid-cols-2 gap-1 pl-2">
                                              <p className="text-indigo-300/80">Provider:</p>
                                              <p className="text-indigo-100">{promptDiagnostics.apiProvider || "-"}</p>
                                              <p className="text-indigo-300/80">Model:</p>
                                              <p className="text-indigo-100">{promptDiagnostics.modelUsed || "-"}</p>
                                              <p className="text-indigo-300/80">Template Source:</p>
                                              <p className="text-indigo-100">{promptDiagnostics.templateSource || "database"}</p>
                                              <p className="text-indigo-300/80">Fallback Used:</p>
                                              <p className="text-indigo-100">{promptDiagnostics.fallbackUsed ? "Yes" : "No"}</p>
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-1">
                                            <p className="font-semibold text-indigo-200">Performance</p>
                                            <div className="grid grid-cols-2 gap-1 pl-2">
                                              <p className="text-indigo-300/80">Response Time:</p>
                                              <p className="text-indigo-100">{promptDiagnostics.responseTime ? `${(promptDiagnostics.responseTime/1000).toFixed(2)}s` : "-"}</p>
                                              <p className="text-indigo-300/80">Timestamp:</p>
                                              <p className="text-indigo-100">{promptDiagnostics.timestamp ? new Date(promptDiagnostics.timestamp).toLocaleString() : "-"}</p>
                                              <p className="text-indigo-300/80">DB Status:</p>
                                              <p className="text-indigo-100">
                                                {promptDiagnostics.dbConnectionStatus === 'connected' ? (
                                                  <span className="text-green-300">Connected</span>
                                                ) : promptDiagnostics.dbConnectionStatus === 'failed' ? (
                                                  <span className="text-red-300">Failed</span>
                                                ) : (
                                                  <span className="text-yellow-300">Unknown</span>
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {promptDiagnostics.llmParams && (
                                          <div className="space-y-1">
                                            <p className="font-semibold text-indigo-200">LLM Parameters</p>
                                            <div className="grid grid-cols-4 gap-1 pl-2">
                                              <p className="text-indigo-300/80">Use Happy Talk:</p>
                                              <p className="text-indigo-100">{promptDiagnostics.llmParams.useHappyTalk ? "Yes" : "No"}</p>
                                              <p className="text-indigo-300/80">Compress Prompt:</p>
                                              <p className="text-indigo-100">{promptDiagnostics.llmParams.compressPrompt ? "Yes" : "No"}</p>
                                              <p className="text-indigo-300/80">Compression Level:</p>
                                              <p className="text-indigo-100">{promptDiagnostics.llmParams.compressionLevel}</p>
                                              <p className="text-indigo-300/80">Master Prompt Length:</p>
                                              <p className="text-indigo-100">{promptDiagnostics.llmParams.masterPromptLength || 0} chars</p>
                                              {promptDiagnostics.llmParams.tokenCount && (
                                                <>
                                                  <p className="text-indigo-300/80">Token Count:</p>
                                                  <p className="text-indigo-100">{promptDiagnostics.llmParams.tokenCount}</p>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {promptDiagnostics.errors && promptDiagnostics.errors.length > 0 && (
                                          <div className="space-y-1">
                                            <p className="font-semibold text-yellow-200">Errors / Warnings</p>
                                            <div className="pl-2 space-y-1">
                                              {promptDiagnostics.errors.map((error, i) => (
                                                <div key={i} className="p-1 text-yellow-100 bg-yellow-900/20 rounded">
                                                  <span className="font-medium">{error.type}: </span>
                                                  {error.message} <span className="text-xs italic">(Handled by: {error.handledBy})</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  )}
                                </Card>
                              )}
                              
                              {/* Regenerate button for Longform format */}
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (generatedPrompt?.original) {
                                      // Clear the longform field first to show loading state
                                      setGeneratedPrompt(prev => {
                                        if (!prev) return prev;
                                        const updatedPrompt = { ...prev };
                                        // Use delete to remove the property completely instead of setting to undefined
                                        delete updatedPrompt.longform;
                                        return updatedPrompt;
                                      });
                                      
                                      // Set enhancing state
                                      setIsEnhancing(true);
                                      
                                      // Find the longform template
                                      const longformTemplate = ruleTemplates.find(t => t.id === 'longform');
                                      enhancePromptWithLLMService(
                                        generatedPrompt.original, 
                                        'longform',
                                        longformTemplate?.masterPrompt
                                      );
                                    }
                                  }}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Regenerate Longform
                                </Button>
                              </div>
                              
                              {/* Space for content spacing */}
                            </div>
                          ) : (
                            // INITIAL STATE WITH BUTTON
                            <div>
                              {generatedPrompt?.original ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-6">
                                  {/* Info block about longform format */}
                                  <div className="p-3 border border-indigo-900 rounded-md bg-indigo-950/20 max-w-md w-full">
                                    <h4 className="text-sm font-medium flex items-center text-indigo-200">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <InfoIcon className="h-4 w-4 mr-2 cursor-help" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="max-w-xs">
                                              Longform format expands your prompt into descriptive paragraphs 
                                              for more detailed narrative context. This allows for more nuanced 
                                              storytelling and comprehensive scene descriptions.
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      Longform Format
                                    </h4>
                                    <p className="text-xs mt-1 text-indigo-300/80">
                                      Transform your prompt into an expanded narrative with detailed descriptions and storytelling elements.
                                    </p>
                                  </div>
                                  
                                  {/* Gradient button styled like mockup */}
                                  <Button 
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 w-full max-w-md text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                    size="lg"
                                    onClick={() => {
                                      // Set enhancing state before generating
                                      setIsEnhancing(true);
                                      
                                      // Find the longform template
                                      const longformTemplate = ruleTemplates.find(t => t.id === 'longform');
                                      if (longformTemplate) {
                                        enhancePromptWithLLMService(
                                          generatedPrompt.original, 
                                          'longform',
                                          longformTemplate.masterPrompt
                                        );
                                      } else {
                                        // Fallback if template isn't found
                                        enhancePromptWithLLMService(generatedPrompt.original, 'longform');
                                      }
                                    }}
                                  >
                                    <Wand2 className="mr-2 h-5 w-5" />
                                    Generate Longform Format
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <p className="text-sm text-gray-400">Generate a prompt first to create a Longform format</p>
                                </div>
                              )}
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="narrative" className="mt-4">
                          <CustomTemplateSection 
                            templateId="narrative"
                            templateName="Narrative Format"
                            description="This specialized template transforms your prompt into a storytelling structure with emphasis on narrative elements."
                            isEnhancing={isEnhancing}
                            isLoading={thirdRowLoading}
                            isCurrentTab={viewTab === 'narrative'}
                            generatedContent={generatedPrompt?.narrative}
                            originalPrompt={generatedPrompt?.original}
                            llmProvider={llmProvider}
                            llmModel={llmModel}
                            templateData={narrativeTemplateData}
                            isAdminMode={isAdminMode}
                            promptDiagnostics={promptDiagnostics ? {
                              provider: promptDiagnostics.apiProvider,
                              model: promptDiagnostics.modelUsed,
                              templateSource: promptDiagnostics.templateSource,
                              timestamp: promptDiagnostics.timestamp,
                              dbConnectionStatus: promptDiagnostics.dbConnectionStatus,
                              responseTime: promptDiagnostics.responseTime,
                              fallbackUsed: promptDiagnostics.fallbackUsed,
                              masterPromptLength: promptDiagnostics.llmParams?.masterPromptLength,
                              compressionLevel: promptDiagnostics.llmParams?.compressionLevel,
                              useHappyTalk: promptDiagnostics.llmParams?.useHappyTalk,
                              compressPrompt: promptDiagnostics.llmParams?.compressPrompt,
                              errors: promptDiagnostics.errors
                            } : undefined}
                            colors={{
                              border: 'purple',
                              bg: 'purple',
                              text: 'purple',
                              buttonFrom: 'purple',
                              buttonTo: 'indigo'
                            }}
                            onGenerate={() => {
                              // Set both loading states
                              setThirdRowLoading(true);
                              setIsEnhancing(true);
                              
                              generateWithCustomTemplate(
                                generatedPrompt!.original,
                                'narrative',
                                narrativeTemplateData
                              );
                            }}
                            onEditTemplate={(templateData) => {
                              setSelectedRuleTemplate({
                                id: 'narrative',
                                name: 'Narrative Format',
                                type: 'narrative',
                                rules: '',
                                masterPrompt: narrativeTemplateData.masterPrompt,
                                formatTemplate: narrativeTemplateData.formatTemplate || '',
                                usageRules: narrativeTemplateData.usageRules || '',
                              });
                              setRuleTemplateModalOpen(true);
                            }}
                          />
                        </TabsContent>
                        
                        {ruleTemplates
                          .filter(template => template.id !== 'dalle' && template.id !== 'midjourney' && template.id !== 'standard')
                          .map(template => (
                            <TabsContent key={template.id} value={`template-${template.id}`} className="mt-4">
                              <div className="relative">
                                <div className="rounded-md border border-gray-800 bg-gray-950/50 p-4 text-sm text-gray-300">
                                  {generatedPrompt[template.id] || "Template output not available. Please regenerate."}
                                </div>
                                <div className="absolute top-2 right-2">
                                  <CopyButton textToCopy={generatedPrompt[template.id] || ""} />
                                </div>
                              </div>
                              {template.id.includes('pipeline') && (
                                <div className="mt-4">
                                  {!generatedPrompt[template.id] ? (
                                    <>
                                      <div className="p-4 border border-gray-800 rounded-md bg-gray-900/60 text-gray-200">
                                        <h4 className="font-medium text-white">Pipeline Template</h4>
                                        <p className="text-sm mt-1 text-gray-400">
                                          This template uses an LLM to enhance your prompt with specialized instructions.
                                        </p>
                                      </div>
                                      
                                      {/* Pipeline-specific LLM controls */}
                                      <div className="mt-4 p-4 border border-gray-800 rounded-md bg-gray-900/60">
                                        <h4 className="text-sm font-medium mb-2 text-white">Pipeline LLM Settings</h4>
                                        
                                        <div className="space-y-4">
                                          <div className="flex flex-col space-y-2">
                                            <Label htmlFor={`pipeline-llm-provider-${template.id}`}>LLM Provider</Label>
                                            <Select 
                                              value={llmProvider} 
                                              onValueChange={(value) => setLlmProvider(value as 'openai' | 'anthropic' | 'llama' | 'grok' | 'bluesky' | 'mistral' | 'local')}
                                            >
                                              <SelectTrigger id={`pipeline-llm-provider-${template.id}`}>
                                                <SelectValue placeholder="Select Provider" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="openai">OpenAI</SelectItem>
                                                <SelectItem value="anthropic">Anthropic</SelectItem>
                                                <SelectItem value="llama">Llama</SelectItem>
                                                <SelectItem value="mistral">Mistral</SelectItem>
                                                <SelectItem value="local">Local Model</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          
                                          <div className="flex flex-col space-y-2">
                                            <Label htmlFor={`pipeline-llm-model-${template.id}`}>LLM Model</Label>
                                            <Select 
                                              value={llmModel} 
                                              onValueChange={setLlmModel}
                                            >
                                              <SelectTrigger id={`pipeline-llm-model-${template.id}`}>
                                                <SelectValue placeholder="Select Model" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {llmProvider === 'openai' && (
                                                  <>
                                                    <SelectItem value="gpt35">GPT-3.5 Turbo</SelectItem>
                                                    <SelectItem value="gpt4">GPT-4</SelectItem>
                                                    <SelectItem value="gpt4o">GPT-4o</SelectItem>
                                                  </>
                                                )}
                                                {llmProvider === 'anthropic' && (
                                                  <>
                                                    <SelectItem value="claude2">Claude 2</SelectItem>
                                                    <SelectItem value="claude3haiku">Claude 3 Haiku</SelectItem>
                                                    <SelectItem value="claude3sonnet">Claude 3 Sonnet</SelectItem>
                                                    <SelectItem value="claude3opus">Claude 3 Opus</SelectItem>
                                                  </>
                                                )}
                                                {llmProvider === 'llama' && (
                                                  <>
                                                    <SelectItem value="llama3">Llama 3</SelectItem>
                                                    <SelectItem value="llama3-70b">Llama 3 70B</SelectItem>
                                                  </>
                                                )}
                                                {llmProvider === 'mistral' && (
                                                  <>
                                                    <SelectItem value="mistral-small">Mistral Small</SelectItem>
                                                    <SelectItem value="mistral-medium">Mistral Medium</SelectItem>
                                                    <SelectItem value="mistral-large">Mistral Large</SelectItem>
                                                  </>
                                                )}
                                                {llmProvider === 'local' && (
                                                  <>
                                                    <SelectItem value="llama3">Llama 3</SelectItem>
                                                    <SelectItem value="mistral">Mistral</SelectItem>
                                                  </>
                                                )}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          
                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              id={`happy-talk-${template.id}`}
                                              checked={useHappyTalk}
                                              onCheckedChange={setUseHappyTalk}
                                            />
                                            <Label htmlFor={`happy-talk-${template.id}`}>Use Happy Talk</Label>
                                          </div>
                                          
                                          <div className="mt-4 p-4 border border-blue-900 rounded-md bg-blue-950/60 text-blue-300">
                                            <h4 className="font-medium flex items-center text-blue-200">
                                              <InfoIcon className="h-4 w-4 mr-2" />
                                              Master Prompt Info
                                            </h4>
                                            <p className="text-sm mt-1">
                                              This template uses the master prompt defined in the Custom Settings tab. 
                                              To edit the master prompt, go to Custom Settings and edit the Pipeline Template.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <Button 
                                        onClick={() => {
                                          if (generatedPrompt?.original) {
                                            // Manually trigger the enhancement for this specific template
                                            toast({
                                              title: `Enhancing with ${template.name}`,
                                              description: `Using ${llmProvider} ${llmModel} to enhance your prompt...`,
                                            });
                                            
                                            // Find the selected template
                                            const selectedTemplate = ruleTemplates.find(t => t.id === template.id);
                                            
                                            // Use the template's settings if available
                                            if (selectedTemplate) {
                                              enhancePromptWithLLMService(
                                                generatedPrompt.original, 
                                                template.id,
                                                selectedTemplate.masterPrompt
                                              );
                                            } else {
                                              enhancePromptWithLLMService(generatedPrompt.original, template.id);
                                            }
                                          } else {
                                            toast({
                                              title: "No prompt to enhance",
                                              description: "Please generate a prompt first.",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                        className="mt-4 w-full"
                                        variant="default"
                                      >
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Generate with {template.name}
                                      </Button>
                                    </>
                                  ) : (
                                    <Button 
                                      onClick={() => {
                                        if (generatedPrompt?.original) {
                                          // Reset the generated prompt for this template
                                          setGeneratedPrompt(prev => {
                                            if (!prev) return prev;
                                            const updates = {...prev};
                                            delete updates[template.id];
                                            return updates;
                                          });
                                        }
                                      }}
                                      className="mt-2 w-full"
                                      variant="outline"
                                    >
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Regenerate with {template.name}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </TabsContent>
                          ))
                        }
                        
                        <TabsContent value="enhanced" className="mt-4">
                          <div className="space-y-4">
                            {!enhancedPrompt && !isEnhancing ? (
                              <div className="space-y-4">
                                <div className="flex flex-col space-y-2">
                                  <Label htmlFor="llm-provider">LLM Provider</Label>
                                  <Select 
                                    value={llmProvider} 
                                    onValueChange={(value) => setLlmProvider(value as 'openai' | 'anthropic' | 'local')}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="openai">OpenAI</SelectItem>
                                      <SelectItem value="anthropic">Anthropic</SelectItem>
                                      <SelectItem value="local">Local Model</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="flex flex-col space-y-2">
                                  <Label htmlFor="llm-model">LLM Model</Label>
                                  <Select 
                                    value={llmModel} 
                                    onValueChange={setLlmModel}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {llmProvider === 'openai' && (
                                        <>
                                          <SelectItem value="gpt35">GPT-3.5 Turbo</SelectItem>
                                          <SelectItem value="gpt4">GPT-4</SelectItem>
                                          <SelectItem value="gpt4o">GPT-4o</SelectItem>
                                        </>
                                      )}
                                      {llmProvider === 'anthropic' && (
                                        <>
                                          <SelectItem value="claude2">Claude 2</SelectItem>
                                          <SelectItem value="claude3haiku">Claude 3 Haiku</SelectItem>
                                          <SelectItem value="claude3sonnet">Claude 3 Sonnet</SelectItem>
                                          <SelectItem value="claude3opus">Claude 3 Opus</SelectItem>
                                        </>
                                      )}
                                      {llmProvider === 'local' && (
                                        <>
                                          <SelectItem value="llama3">Llama 3</SelectItem>
                                          <SelectItem value="mistral">Mistral</SelectItem>
                                        </>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id="happy-talk"
                                      checked={useHappyTalk}
                                      onCheckedChange={setUseHappyTalk}
                                      className="data-[state=checked]:bg-blue-600"
                                    />
                                    <Label htmlFor="happy-talk">Use Happy Talk</Label>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="h-4 w-4 text-muted-foreground ml-1">
                                            <InfoIcon />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="max-w-xs">
                                            When enabled, makes the LLM respond with encouraging and positive language. 
                                            This can help generate more upbeat prompts with enthusiastic descriptions, 
                                            but may add unnecessary words to your prompt.
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id="compress-prompt"
                                      checked={compressPrompt}
                                      onCheckedChange={setCompressPrompt}
                                      className="data-[state=checked]:bg-blue-600"
                                    />
                                    <Label htmlFor="compress-prompt">Compress Prompt</Label>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="h-4 w-4 text-muted-foreground ml-1">
                                            <InfoIcon />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="max-w-xs">
                                            Reduces token count by compressing similar terms and removing redundancies. 
                                            This makes prompts more efficient for AI image generators while preserving 
                                            the core concepts. Higher compression levels may reduce prompt clarity.
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>
                                
                                {compressPrompt && (
                                  <div className="flex flex-col space-y-2">
                                    <div className="flex justify-between">
                                      <Label htmlFor="compression-level">Compression Level: {compressionLevel}</Label>
                                    </div>
                                    <Slider
                                      id="compression-level"
                                      min={1}
                                      max={10}
                                      step={1}
                                      value={[compressionLevel]}
                                      onValueChange={(value) => setCompressionLevel(value[0])}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>Minimal</span>
                                      <span>Balanced</span>
                                      <span>Maximum</span>
                                    </div>
                                  </div>
                                )}
                                
                                <Collapsible>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex items-center justify-between w-full">
                                      <span>Advanced Options</span>
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="pt-2">
                                    <div className="flex flex-col space-y-4">
                                      <div className="flex flex-col space-y-2">
                                        <Label htmlFor="custom-base-prompt">Custom Base Prompt</Label>
                                        <Textarea
                                          id="custom-base-prompt"
                                          placeholder="Enter a custom system prompt for the LLM"
                                          value={customBasePrompt}
                                          onChange={(e) => setCustomBasePrompt(e.target.value)}
                                          className="min-h-[100px]"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                          This will override the default system prompt for the LLM. Leave empty to use the default.
                                        </p>
                                      </div>
                                      
                                      <div className="border-t pt-2">
                                        <h4 className="text-sm font-medium mb-2">API Key Settings</h4>
                                        {llmProvider === 'openai' && (
                                          <div className="flex flex-col space-y-2">
                                            <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                                            <Input
                                              id="openai-api-key"
                                              type="password"
                                              placeholder="Enter your OpenAI API key"
                                              value={openaiApiKey}
                                              onChange={(e) => setOpenaiApiKey(e.target.value)}
                                            />
                                          </div>
                                        )}
                                        
                                        {llmProvider === 'anthropic' && (
                                          <div className="flex flex-col space-y-2">
                                            <Label htmlFor="anthropic-api-key">Anthropic API Key</Label>
                                            <Input
                                              id="anthropic-api-key"
                                              type="password"
                                              placeholder="Enter your Anthropic API key"
                                              value={anthropicApiKey}
                                              onChange={(e) => setAnthropicApiKey(e.target.value)}
                                            />
                                          </div>
                                        )}
                                        
                                        <div className="flex items-center space-x-2 mt-2">
                                          <Switch
                                            id="save-api-keys"
                                            checked={saveApiKeys}
                                            onCheckedChange={setSaveApiKeys}
                                          />
                                          <Label htmlFor="save-api-keys">Save API keys in browser</Label>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="h-4 w-4 text-muted-foreground ml-1">
                                                  <InfoIcon />
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="max-w-xs">
                                                  When enabled, API keys will be securely saved in your browser's localStorage 
                                                  so you don't need to re-enter them each session. Important: Disable this option 
                                                  when using shared or public computers for security reasons.
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                                
                                <Button 
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                  size="lg"
                                  onClick={() => enhancePromptWithLLMService(generatedPrompt.original, undefined, customBasePrompt)}
                                >
                                  <Wand2 className="mr-2 h-5 w-5" />
                                  Enhance with {llmProvider === 'openai' ? 'GPT' : llmProvider === 'anthropic' ? 'Claude' : 'Local LLM'}
                                </Button>
                              </div>
                            ) : isEnhancing ? (
                              <div className="flex flex-col items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                <p>Enhancing your prompt with {llmProvider} {llmModel}...</p>
                                <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="relative">
                                  <div className="rounded-md border bg-card p-3 text-sm">
                                    {enhancedPrompt}
                                  </div>
                                  <div className="absolute top-2 right-2">
                                    <CopyButton textToCopy={enhancedPrompt || ""} />
                                  </div>
                                </div>
                                
                                <div className="flex justify-between">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setEnhancedPrompt(null)}
                                  >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Try Different Settings
                                  </Button>
                                  
                                  <Button 
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                    onClick={() => enhancePromptWithLLMService(generatedPrompt.original, undefined, customBasePrompt)}
                                  >
                                    <Wand2 className="mr-2 h-5 w-5" />
                                    Enhance Again
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                        </div>
                      )}
                      
                      {/* "Send to Generator" button has been removed */}
                    </CardContent>
                  </Card>
                )}
                
                {/* Generation History Section - Always shown */}
                <GenerationHistory 
                  history={promptGenerationHistory} 
                  onRecall={recallFromHistory} 
                  onClear={clearHistory} 
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="imageAnalysis">
            <div className="space-y-6">
              <Card className="border-gray-800 bg-gray-950/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center">
                    <BrainCircuit className="mr-2 h-5 w-5 text-blue-400" />
                    Image Analysis & Prompt Generation
                  </CardTitle>
                  <CardDescription>
                    Analyze images to extract insights and generate high-quality prompts from visual references
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 mb-6">
                    Upload or provide a URL to an image and our AI will analyze its composition, style, and elements to generate detailed prompt suggestions that you can use in the prompt generator.
                  </p>
                  <EliteImageAnalyzer />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="longform">
            <div className="space-y-6">
              <Card className="border-gray-800 bg-gray-950/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-yellow-400" />
                    Prompt Library
                  </CardTitle>
                  <CardDescription>
                    Create and edit long-form prompts and detailed text content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-gray-400" />
                        <Input 
                          placeholder="Search prompts..." 
                          className="w-64 bg-gray-900/60 border-gray-700" 
                        />
                        <Select defaultValue="all">
                          <SelectTrigger className="w-[180px] bg-gray-900/60 border-gray-700">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="portraits">Portraits</SelectItem>
                            <SelectItem value="landscapes">Landscapes</SelectItem>
                            <SelectItem value="fantasy">Fantasy</SelectItem>
                            <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                            <SelectItem value="anime">Anime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Prompt
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Sample prompt cards - would be populated from API in real implementation */}
                      {[1, 2, 3, 4, 5, 6].map((id) => (
                        <Card key={id} className="overflow-hidden hover:border-gray-600 transition-all cursor-pointer bg-gray-900/60 border-gray-800/50">
                          <div className="h-40 bg-gradient-to-br from-purple-900/40 to-blue-900/40 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <FileText className="h-16 w-16 text-gray-600" />
                            </div>
                          </div>
                          <CardHeader className="p-4">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">
                                {["Cyberpunk City", "Fantasy Portrait", "Anime Character", "Space Explorer", "Medieval Castle", "Underwater Scene"][id % 6]}
                              </CardTitle>
                              <Badge variant="outline" className="bg-gray-800 text-gray-300">
                                {["Midjourney", "Stable Diffusion", "DALL-E", "ComfyUI"][id % 4]}
                              </Badge>
                            </div>
                            <CardDescription className="line-clamp-2 text-gray-400">
                              {`A detailed prompt for generating ${["cyberpunk", "fantasy", "anime", "sci-fi", "medieval", "underwater"][id % 6]} themed images with intricate details and vibrant colors.`}
                            </CardDescription>
                          </CardHeader>
                          <CardFooter className="p-4 pt-0 flex justify-between">
                            <div className="flex items-center text-gray-400 text-sm gap-4">
                              <div className="flex items-center">
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                <span>{(id * 17) % 80 + 5}</span>
                              </div>
                              <div className="flex items-center">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                <span>{(id * 7) % 20 + 1}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="flex justify-center mt-6">
                      <Button variant="outline" className="border-gray-700">
                        Load More
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="output">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>API Key Settings</CardTitle>
                  </div>
                  <CardDescription>
                    Configure your LLM API keys for enhanced prompt generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">OpenAI</h3>
                      <div className="space-y-2">
                        <Label htmlFor="openai-api-key-settings">API Key</Label>
                        <div className="relative">
                          <Input
                            id="openai-api-key-settings"
                            type="password"
                            placeholder="Enter your OpenAI API key"
                            value={openaiApiKey}
                            onChange={(e) => setOpenaiApiKey(e.target.value)}
                            className="pr-10"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-0 top-0 h-full"
                            onClick={() => {
                              const input = document.getElementById('openai-api-key-settings') as HTMLInputElement;
                              if (input) {
                                input.type = input.type === 'password' ? 'text' : 'password';
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Required for using GPT-3.5, GPT-4, or GPT-4o models
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Anthropic</h3>
                      <div className="space-y-2">
                        <Label htmlFor="anthropic-api-key-settings">API Key</Label>
                        <div className="relative">
                          <Input
                            id="anthropic-api-key-settings"
                            type="password"
                            placeholder="Enter your Anthropic API key"
                            value={anthropicApiKey}
                            onChange={(e) => setAnthropicApiKey(e.target.value)}
                            className="pr-10"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-0 top-0 h-full"
                            onClick={() => {
                              const input = document.getElementById('anthropic-api-key-settings') as HTMLInputElement;
                              if (input) {
                                input.type = input.type === 'password' ? 'text' : 'password';
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Required for using Claude 2, Claude 3 Haiku, Sonnet, or Opus models
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-6 border-t">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Llama</h3>
                      <div className="space-y-2">
                        <Label htmlFor="llama-api-key-settings">API Key</Label>
                        <div className="relative">
                          <Input
                            id="llama-api-key-settings"
                            type="password"
                            placeholder="Enter your Llama API key"
                            value={llamaApiKey}
                            onChange={(e) => setLlamaApiKey(e.target.value)}
                            className="pr-10"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-0 top-0 h-full"
                            onClick={() => {
                              const input = document.getElementById('llama-api-key-settings') as HTMLInputElement;
                              if (input) {
                                input.type = input.type === 'password' ? 'text' : 'password';
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Required for using Llama 3 models
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Grok</h3>
                      <div className="space-y-2">
                        <Label htmlFor="grok-api-key-settings">API Key</Label>
                        <div className="relative">
                          <Input
                            id="grok-api-key-settings"
                            type="password"
                            placeholder="Enter your Grok API key"
                            value={grokApiKey}
                            onChange={(e) => setGrokApiKey(e.target.value)}
                            className="pr-10"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-0 top-0 h-full"
                            onClick={() => {
                              const input = document.getElementById('grok-api-key-settings') as HTMLInputElement;
                              if (input) {
                                input.type = input.type === 'password' ? 'text' : 'password';
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Required for using Grok models
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Bluesky</h3>
                      <div className="space-y-2">
                        <Label htmlFor="bluesky-api-key-settings">API Key</Label>
                        <div className="relative">
                          <Input
                            id="bluesky-api-key-settings"
                            type="password"
                            placeholder="Enter your Bluesky API key"
                            value={blueskyApiKey}
                            onChange={(e) => setBlueskyApiKey(e.target.value)}
                            className="pr-10"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-0 top-0 h-full"
                            onClick={() => {
                              const input = document.getElementById('bluesky-api-key-settings') as HTMLInputElement;
                              if (input) {
                                input.type = input.type === 'password' ? 'text' : 'password';
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Required for using Bluesky models
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Mistral</h3>
                      <div className="space-y-2">
                        <Label htmlFor="mistral-api-key-settings">API Key</Label>
                        <div className="relative">
                          <Input
                            id="mistral-api-key-settings"
                            type="password"
                            placeholder="Enter your Mistral API key"
                            value={mistralApiKey}
                            onChange={(e) => setMistralApiKey(e.target.value)}
                            className="pr-10"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-0 top-0 h-full"
                            onClick={() => {
                              const input = document.getElementById('mistral-api-key-settings') as HTMLInputElement;
                              if (input) {
                                input.type = input.type === 'password' ? 'text' : 'password';
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Required for using Mistral models
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-4">
                    <Switch
                      id="save-api-keys-settings"
                      checked={saveApiKeys}
                      onCheckedChange={setSaveApiKeys}
                    />
                    <div>
                      <Label htmlFor="save-api-keys-settings">Save API keys in browser</Label>
                      <p className="text-xs text-muted-foreground">
                        API keys will be saved in your browser's localStorage. Disable this for shared computers.
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      onClick={saveApiKeysToLocalStorage}
                      disabled={!saveApiKeys}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save API Keys
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Rule Templates</CardTitle>
                    {/* Admin mode toggle button removed - using global toggle in navbar */}
                  </div>
                  <CardDescription>
                    Configure custom format templates for different AI models
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* In Admin Mode, show Model-specific Templates */}
                  {isAdminMode && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Model-specific Templates</h3>
                      <div className="flex justify-start gap-2 flex-wrap">
                        {ruleTemplates
                          .filter(template => {
                            // Always remove Pipeline and Longform templates
                            const isPipelineOrLongform = 
                              template.id === 'pipeline' || 
                              template.id === 'longform' ||
                              template.id.includes('pipeline-') || 
                              template.id.includes('longform-');
                            
                            if (isPipelineOrLongform) {
                              return false;
                            }
                            
                            // Don't show custom templates here since they'll be shown separately
                            return !template.id.includes('custom');
                          })
                          .map((template) => (
                            <Button
                              key={template.id}
                              variant="outline"
                              size="sm"
                              onClick={() => openRuleTemplateModal(template)}
                              className="text-xs"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              {template.name}
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Custom Templates Section - Always visible in both modes */}
                  <div className="border rounded-md p-4">
                    <h3 className="text-base font-medium mb-2">Custom Templates</h3>
                    <Tabs defaultValue="custom1" className="w-full">
                      <TabsList className="grid grid-cols-3 mb-4">
                        <TabsTrigger value="custom1">Custom 1</TabsTrigger>
                        <TabsTrigger value="custom2">Custom 2</TabsTrigger>
                        <TabsTrigger value="custom3">Custom 3</TabsTrigger>
                      </TabsList>
                      
                      {['custom1', 'custom2', 'custom3'].map((customId, index) => (
                        <TabsContent key={customId} value={customId} className="space-y-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`custom-name-${index}`}>Template Name</Label>
                              <Input 
                                id={`custom-name-${index}`}
                                placeholder={`Custom Template ${index + 1}`}
                                defaultValue={customTemplateData[index]?.name || `Custom ${index + 1}`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`custom-master-prompt-${index}`}>LLM Master Prompt</Label>
                              <Textarea 
                                id={`custom-master-prompt-${index}`}
                                placeholder="Enter custom master prompt"
                                className="resize-vertical min-h-[150px] h-64"
                                defaultValue={customTemplateData[index]?.masterPrompt || ""}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`custom-format-template-${index}`}>Format Template</Label>
                              <Textarea
                                id={`custom-format-template-${index}`}
                                placeholder="Enter format template for structured responses"
                                className="resize-vertical min-h-[100px]"
                                defaultValue={customTemplateData[index]?.formatTemplate || ""}
                                onChange={(e) => {
                                  setCustomTemplateData(prev => {
                                    const newData = [...prev];
                                    if (!newData[index]) {
                                      newData[index] = { 
                                        name: `Custom ${index + 1}`, 
                                        masterPrompt: "", 
                                        formatTemplate: e.target.value,
                                        llmProvider: "openai", 
                                        llmModel: "gpt4" 
                                      };
                                    } else {
                                      newData[index].formatTemplate = e.target.value;
                                    }
                                    return newData;
                                  });
                                }}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`custom-usage-rules-${index}`}>Usage Rules</Label>
                              <Textarea
                                id={`custom-usage-rules-${index}`}
                                placeholder="Enter usage rules for this template"
                                className="resize-vertical min-h-[100px]"
                                defaultValue={customTemplateData[index]?.usageRules || ""}
                                onChange={(e) => {
                                  setCustomTemplateData(prev => {
                                    const newData = [...prev];
                                    if (!newData[index]) {
                                      newData[index] = { 
                                        name: `Custom ${index + 1}`, 
                                        masterPrompt: "", 
                                        usageRules: e.target.value,
                                        llmProvider: "openai", 
                                        llmModel: "gpt4" 
                                      };
                                    } else {
                                      newData[index].usageRules = e.target.value;
                                    }
                                    return newData;
                                  });
                                }}
                              />
                            </div>
                            
                            <div className="space-y-3 pt-1 border-t">
                              <h4 className="text-sm font-medium mt-2">Prompt Refinement Options</h4>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`custom-happy-talk-${index}`}
                                  checked={customTemplateData[index]?.useHappyTalk || false}
                                  onCheckedChange={(checked) => {
                                    setCustomTemplateData(prev => {
                                      const newData = [...prev];
                                      if (!newData[index]) {
                                        newData[index] = { 
                                          name: `Custom ${index + 1}`, 
                                          masterPrompt: "", 
                                          useHappyTalk: !!checked,
                                          llmProvider: "openai", 
                                          llmModel: "gpt4" 
                                        };
                                      } else {
                                        newData[index].useHappyTalk = !!checked;
                                      }
                                      return newData;
                                    });
                                  }}
                                />
                                <Label 
                                  htmlFor={`custom-happy-talk-${index}`}
                                  className="text-sm"
                                >
                                  Use Happy Talk (add encouraging language to prompts)
                                </Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`custom-compress-prompt-${index}`}
                                  checked={customTemplateData[index]?.compressPrompt || false}
                                  onCheckedChange={(checked) => {
                                    setCustomTemplateData(prev => {
                                      const newData = [...prev];
                                      if (!newData[index]) {
                                        newData[index] = { 
                                          name: `Custom ${index + 1}`, 
                                          masterPrompt: "", 
                                          compressPrompt: !!checked,
                                          compressionLevel: 5,
                                          llmProvider: "openai", 
                                          llmModel: "gpt4" 
                                        };
                                      } else {
                                        newData[index].compressPrompt = !!checked;
                                        if (!newData[index].compressionLevel) {
                                          newData[index].compressionLevel = 5;
                                        }
                                      }
                                      return newData;
                                    });
                                  }}
                                />
                                <Label 
                                  htmlFor={`custom-compress-prompt-${index}`}
                                  className="text-sm"
                                >
                                  Enable Prompt Compression
                                </Label>
                              </div>
                              
                              {customTemplateData[index]?.compressPrompt && (
                                <div className="ml-6 space-y-2">
                                  <Label htmlFor={`custom-compression-level-${index}`}>
                                    Compression Level: {customTemplateData[index]?.compressionLevel || 5}
                                  </Label>
                                  <Slider
                                    id={`custom-compression-level-${index}`}
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={[customTemplateData[index]?.compressionLevel || 5]}
                                    onValueChange={(value) => {
                                      setCustomTemplateData(prev => {
                                        const newData = [...prev];
                                        if (!newData[index]) {
                                          newData[index] = { 
                                            name: `Custom ${index + 1}`, 
                                            masterPrompt: "", 
                                            compressPrompt: true,
                                            compressionLevel: value[0],
                                            llmProvider: "openai", 
                                            llmModel: "gpt4" 
                                          };
                                        } else {
                                          newData[index].compressionLevel = value[0];
                                        }
                                        return newData;
                                      });
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2 pt-2 border-t">
                              <Label htmlFor={`custom-llm-provider-${index}`}>LLM Provider</Label>
                              <Select 
                                defaultValue={customTemplateData[index]?.llmProvider || "openai"} 
                                onValueChange={(value) => {
                                  // When the provider changes, update customTemplateData state
                                  setCustomTemplateData(prev => {
                                    const newData = [...prev];
                                    if (!newData[index]) {
                                      newData[index] = { 
                                        name: `Custom ${index + 1}`, 
                                        masterPrompt: "", 
                                        llmProvider: value, 
                                        llmModel: "gpt4" 
                                      };
                                    } else {
                                      newData[index].llmProvider = value;
                                    }
                                    return newData;
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select LLM provider" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>Providers</SelectLabel>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="anthropic">Anthropic</SelectItem>
                                    <SelectItem value="llama">Llama</SelectItem>
                                    <SelectItem value="mistral">Mistral</SelectItem>
                                    <SelectItem value="grok">Grok</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`custom-llm-model-${index}`}>LLM Model</Label>
                              <Select 
                                defaultValue={customTemplateData[index]?.llmModel || "gpt4"} 
                                onValueChange={(value) => {
                                  // When the model changes, update customTemplateData state
                                  setCustomTemplateData(prev => {
                                    const newData = [...prev];
                                    if (!newData[index]) {
                                      newData[index] = { 
                                        name: `Custom ${index + 1}`, 
                                        masterPrompt: "", 
                                        llmProvider: "openai", 
                                        llmModel: value 
                                      };
                                    } else {
                                      newData[index].llmModel = value;
                                    }
                                    return newData;
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select LLM model" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>OpenAI Models</SelectLabel>
                                    <SelectItem value="gpt-3.5-turbo">ChatGPT (GPT-3.5)</SelectItem>
                                    <SelectItem value="gpt4">GPT-4</SelectItem>
                                    <SelectItem value="gpt4o">GPT-4o</SelectItem>
                                  </SelectGroup>
                                  <SelectGroup>
                                    <SelectLabel>Other Models</SelectLabel>
                                    <SelectItem value="claude-3">Claude 3</SelectItem>
                                    <SelectItem value="llama-3">Llama 3</SelectItem>
                                    <SelectItem value="deepseek-r1">Deepseek R1</SelectItem>
                                    <SelectItem value="kimi-ai">Kimi.ai</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isSavingTemplate}
                            onClick={async () => {
                              // Use the new saveCustomTemplateByIndex function to properly save to database
                              await saveCustomTemplateByIndex(index);
                            }}
                          >
                            {isSavingTemplate ? (
                              <>
                                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Template
                              </>
                            )}
                          </Button>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                  
                  {/* Start of the content that gets hidden when not in admin mode */}
                  {isAdminMode && (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="border rounded-md p-4">
                      <h3 className="text-base font-medium mb-2">Pipeline Template</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="pipeline-master-prompt">LLM Master Prompt</Label>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  const pipelineText = document.getElementById('pipeline-master-prompt') as HTMLTextAreaElement;
                                  if (pipelineText) {
                                    pipelineText.value = ruleTemplates.find(t => t.id === "pipeline")?.rules || "";
                                  }
                                }}
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Reset to Default
                              </Button>
                            </div>
                            <Textarea 
                              id="pipeline-master-prompt"
                              placeholder="Enter master prompt for LLM processing pipeline"
                              className="resize-vertical min-h-[300px] h-96"
                              defaultValue={ruleTemplates.find(t => t.id === "pipeline")?.rules || ""}
                            />
                            
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pipeline-llm-provider">LLM Provider</Label>
                            <Select defaultValue="openai" onValueChange={(value) => {
                              // When the provider changes, update the provider input value
                              const providerInput = document.getElementById('pipeline-llm-provider') as HTMLInputElement;
                              if (providerInput) {
                                providerInput.value = value;
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select LLM provider" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Providers</SelectLabel>
                                  <SelectItem value="openai">OpenAI</SelectItem>
                                  <SelectItem value="anthropic">Anthropic</SelectItem>
                                  <SelectItem value="llama">Llama</SelectItem>
                                  <SelectItem value="mistral">Mistral</SelectItem>
                                  <SelectItem value="grok">Grok</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {/* Hidden input to store the provider value */}
                            <input type="hidden" id="pipeline-llm-provider" value="openai" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="pipeline-llm-model">LLM Model</Label>
                            <Select defaultValue="gpt4" onValueChange={(value) => {
                              // When the model changes, update the model input value
                              const modelInput = document.getElementById('pipeline-llm-model') as HTMLInputElement;
                              if (modelInput) {
                                modelInput.value = value;
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select LLM model" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>OpenAI Models</SelectLabel>
                                  <SelectItem value="gpt-3.5-turbo">ChatGPT (GPT-3.5)</SelectItem>
                                  <SelectItem value="gpt4">GPT-4</SelectItem>
                                  <SelectItem value="gpt4o">GPT-4o</SelectItem>
                                </SelectGroup>
                                <SelectGroup>
                                  <SelectLabel>Other Models</SelectLabel>
                                  <SelectItem value="claude-3">Claude 3</SelectItem>
                                  <SelectItem value="llama-3">Llama 3</SelectItem>
                                  <SelectItem value="deepseek-r1">Deepseek R1</SelectItem>
                                  <SelectItem value="kimi-ai">Kimi.ai</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {/* Hidden input to store the model value */}
                            <input type="hidden" id="pipeline-llm-model" value="gpt4" />
                            <p className="text-xs text-muted-foreground">
                              Select the LLM to process your master prompt
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            try {
                              // Get the values from the form fields
                              const promptInput = document.getElementById('pipeline-master-prompt') as HTMLTextAreaElement;
                              const providerInput = document.getElementById('pipeline-llm-provider') as HTMLInputElement;
                              const modelInput = document.getElementById('pipeline-llm-model') as HTMLInputElement;
                              
                              // Get master prompt from input or build the default if empty
                              let pipelineMasterPrompt = promptInput?.value || '';
                              if (!pipelineMasterPrompt) {
                                pipelineMasterPrompt = elitePromptGenerator.buildMasterPrompt("pipeline");
                                toast({
                                  title: "Using Default Prompt",
                                  description: "No custom prompt provided, using default master prompt.",
                                  variant: "warning"
                                });
                              }
                              
                              // Get LLM provider and model from their specific inputs
                              const pipelineProvider = providerInput?.value || 'openai';
                              const pipelineModel = modelInput?.value || 'gpt4';
                              
                              console.log("Saving pipeline template with values:", {
                                provider: pipelineProvider,
                                model: pipelineModel,
                                masterPrompt: pipelineMasterPrompt.substring(0, 50) + "..." // Log truncated prompt
                              });
                              
                              const templateName = "Pipeline Template";
                              
                              // Create template for database (will update if one already exists)
                              await createTemplate({
                                name: templateName,
                                template: "pipeline",
                                template_type: "pipeline",
                                category: "general",
                                is_default: true,
                                master_prompt: pipelineMasterPrompt,
                                llm_provider: pipelineProvider,
                                llm_model: pipelineModel,
                                user_id: "dev-user" // Add user_id for multi-tenant support
                              });
                              
                              // Update in-memory template
                              elitePromptGenerator.updateRuleTemplate("pipeline", {
                                name: templateName,
                                description: "Pipeline prompt enhancement template",
                                masterPrompt: pipelineMasterPrompt,
                                llmProvider: pipelineProvider as any,
                                llmModel: pipelineModel
                              });
                              
                              // Update rule templates in state
                              setRuleTemplates([...elitePromptGenerator.getRuleTemplates()]);
                              
                              toast({
                                title: "Template Saved",
                                description: "Pipeline template has been saved successfully.",
                              });
                            } catch (error) {
                              console.error("Error saving pipeline template:", error);
                              toast({
                                title: "Error",
                                description: "Failed to save pipeline template.",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Pipeline
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="text-base font-medium mb-2">Longform Template</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="longform-master-prompt">LLM Master Prompt</Label>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  const longformText = document.getElementById('longform-master-prompt') as HTMLTextAreaElement;
                                  if (longformText) {
                                    // Use buildMasterPrompt to get the master prompt (matching Pipeline tab behavior)
                                    longformText.value = elitePromptGenerator.buildMasterPrompt("longform");
                                  }
                                }}
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Reset to Default
                              </Button>
                            </div>
                            <Textarea 
                              id="longform-master-prompt"
                              placeholder="Enter master prompt for longform content generation"
                              className="resize-vertical min-h-[300px] h-96"
                              defaultValue={ruleTemplates.find(t => t.id === "longform")?.masterPrompt || ""}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="longform-format-template">Format Template</Label>
                            <Textarea 
                              id="longform-format-template"
                              placeholder="Enter format template for output structuring"
                              className="resize-vertical min-h-[100px]"
                              defaultValue={ruleTemplates.find(rt => rt.id === "longform")?.formatTemplate || ""}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="longform-usage-rules">Usage Rules</Label>
                            <Textarea 
                              id="longform-usage-rules"
                              placeholder="Enter usage rules for the template"
                              className="resize-vertical min-h-[100px]"
                              defaultValue={ruleTemplates.find(rt => rt.id === "longform")?.usageRules || ""}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="longform-happy-talk" 
                                  defaultChecked={ruleTemplates.find(rt => rt.id === "longform")?.useHappyTalk}
                                />
                                <Label htmlFor="longform-happy-talk">Use Happy Talk</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="longform-compress-prompt" 
                                  defaultChecked={ruleTemplates.find(rt => rt.id === "longform")?.compressPrompt}
                                />
                                <Label htmlFor="longform-compress-prompt">Compress Prompt</Label>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="longform-llm-provider">LLM Provider</Label>
                            <Select defaultValue="openai" onValueChange={(value) => {
                              // When the provider changes, update the provider input value
                              const providerInput = document.getElementById(`longform-llm-provider`) as HTMLInputElement;
                              if (providerInput) {
                                providerInput.value = value;
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select LLM provider" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Providers</SelectLabel>
                                  <SelectItem value="openai">OpenAI</SelectItem>
                                  <SelectItem value="anthropic">Anthropic</SelectItem>
                                  <SelectItem value="llama">Llama</SelectItem>
                                  <SelectItem value="mistral">Mistral</SelectItem>
                                  <SelectItem value="grok">Grok</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {/* Hidden input to store the provider value */}
                            <input type="hidden" id="longform-llm-provider" value="openai" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="longform-llm-model">LLM Model</Label>
                            <Select defaultValue="gpt4o" onValueChange={(value) => {
                              // When the model changes, update the model input value
                              const modelInput = document.getElementById(`longform-llm-model`) as HTMLInputElement;
                              if (modelInput) {
                                modelInput.value = value;
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select LLM model" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>OpenAI Models</SelectLabel>
                                  <SelectItem value="gpt-3.5-turbo">ChatGPT (GPT-3.5)</SelectItem>
                                  <SelectItem value="gpt4">GPT-4</SelectItem>
                                  <SelectItem value="gpt4o">GPT-4o</SelectItem>
                                </SelectGroup>
                                <SelectGroup>
                                  <SelectLabel>Other Models</SelectLabel>
                                  <SelectItem value="claude-3">Claude 3</SelectItem>
                                  <SelectItem value="llama-3">Llama 3</SelectItem>
                                  <SelectItem value="deepseek-r1">Deepseek R1</SelectItem>
                                  <SelectItem value="kimi-ai">Kimi.ai</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {/* Hidden input to store the model value */}
                            <input type="hidden" id="longform-llm-model" value="gpt4o" />
                            <p className="text-xs text-muted-foreground">
                              Select the LLM to process your longform content
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            try {
                              // Get the values from the form fields
                              const promptInput = document.getElementById('longform-master-prompt') as HTMLTextAreaElement;
                              const providerInput = document.getElementById('longform-llm-provider') as HTMLInputElement;
                              const modelInput = document.getElementById('longform-llm-model') as HTMLInputElement;
                              
                              // Get master prompt from input or build the default if empty
                              let longformMasterPrompt = promptInput?.value || '';
                              if (!longformMasterPrompt) {
                                longformMasterPrompt = elitePromptGenerator.buildMasterPrompt("longform");
                                toast({
                                  title: "Using Default Prompt",
                                  description: "No custom prompt provided, using default master prompt.",
                                  variant: "warning"
                                });
                              }
                              
                              // Get LLM provider and model from their specific inputs
                              const longformProvider = providerInput?.value || 'openai';
                              const longformModel = modelInput?.value || 'gpt4o';
                              
                              console.log("Saving longform template with values:", {
                                provider: longformProvider,
                                model: longformModel,
                                masterPrompt: longformMasterPrompt.substring(0, 50) + "..." // Log truncated prompt
                              });
                              
                              const templateName = "Longform Template";
                              
                              // Get format template and usage rules 
                              const formatTemplateInput = document.getElementById('longform-format-template') as HTMLTextAreaElement;
                              const usageRulesInput = document.getElementById('longform-usage-rules') as HTMLTextAreaElement;
                              const useHappyTalkInput = document.getElementById('longform-happy-talk') as HTMLInputElement;
                              const compressPromptInput = document.getElementById('longform-compress-prompt') as HTMLInputElement;
                              
                              // Get values from inputs
                              const formatTemplate = formatTemplateInput?.value || '';
                              const usageRules = usageRulesInput?.value || '';
                              const useHappyTalk = useHappyTalkInput?.checked || false;
                              const compressPrompt = compressPromptInput?.checked || false;
                              const compressionLevel = 2; // Default medium compression
                              
                              // Create template for database (will update if one already exists)
                              await createTemplate({
                                name: templateName,
                                template: "longform",
                                template_type: "longform",
                                category: "general",
                                is_default: true,
                                master_prompt: longformMasterPrompt,
                                format_template: formatTemplate,
                                usage_rules: usageRules,
                                use_happy_talk: useHappyTalk,
                                compress_prompt: compressPrompt,
                                compression_level: compressionLevel,
                                llm_provider: longformProvider,
                                llm_model: longformModel,
                                user_id: "dev-user" // Add user_id for multi-tenant support
                              });
                              
                              // Update in-memory template with all fields
                              elitePromptGenerator.updateRuleTemplate("longform", {
                                name: templateName,
                                description: "Longform content generation template",
                                masterPrompt: longformMasterPrompt,
                                formatTemplate: formatTemplate,
                                usageRules: usageRules,
                                useHappyTalk: useHappyTalk,
                                compressPrompt: compressPrompt,
                                compressionLevel: compressionLevel,
                                llmProvider: longformProvider as any,
                                llmModel: longformModel
                              });
                              
                              // Update rule templates in state
                              setRuleTemplates([...elitePromptGenerator.getRuleTemplates()]);
                              
                              toast({
                                title: "Template Saved",
                                description: "Longform template has been saved successfully.",
                              });
                            } catch (error) {
                              console.error("Error saving longform template:", error);
                              toast({
                                title: "Error",
                                description: "Failed to save longform template.",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Longform Template
                        </Button>
                      </div>
                    </div>
                    
                    {/* Narrative Template */}
                    <div className="border rounded-md p-4">
                      <h3 className="text-base font-medium mb-2">Narrative Template</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="narrative-master-prompt">LLM Master Prompt</Label>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    const textarea = document.getElementById('narrative-master-prompt') as HTMLTextAreaElement;
                                    if (textarea) {
                                      // Find the default template
                                      const template = ruleTemplates.find(t => t.id === "narrative");
                                      if (template?.masterPrompt) {
                                        textarea.value = template.masterPrompt;
                                      }
                                    }
                                  }}
                                >
                                  Reset to Default
                                </Button>
                              </div>
                            </div>
                            <Textarea 
                              id="narrative-master-prompt" 
                              placeholder="Enter the master prompt for the LLM to follow when generating narrative prompts..."
                              rows={10}
                              defaultValue={narrativeRuleTemplate?.masterPrompt}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="narrative-format-template">Format Template</Label>
                            <Textarea 
                              id="narrative-format-template" 
                              placeholder="Enter format template for the LLM..."
                              rows={3}
                              defaultValue={narrativeRuleTemplate?.formatTemplate}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="narrative-usage-rules">Usage Rules</Label>
                            <Textarea 
                              id="narrative-usage-rules" 
                              placeholder="Enter usage rules..."
                              rows={5}
                              defaultValue={narrativeRuleTemplate?.usageRules}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="narrative-provider">LLM Provider</Label>
                              <Select defaultValue={narrativeRuleTemplate?.llmProvider || "openai"}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select LLM Provider" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="openai">OpenAI</SelectItem>
                                  <SelectItem value="anthropic">Anthropic</SelectItem>
                                  <SelectItem value="llama">Llama</SelectItem>
                                  <SelectItem value="mistral">Mistral</SelectItem>
                                  <SelectItem value="local">Local</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="narrative-model">LLM Model</Label>
                              <Input 
                                id="narrative-model" 
                                placeholder="e.g. gpt-4"
                                defaultValue={narrativeRuleTemplate?.llmModel || "gpt4"} 
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="narrative-happy-talk" 
                              defaultChecked={narrativeRuleTemplate?.useHappyTalk || false}
                            />
                            <Label htmlFor="narrative-happy-talk">Use Happy Talk</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button 
                          className="w-full"
                          onClick={async () => {
                            // Get references to inputs
                            const masterPromptInput = document.getElementById('narrative-master-prompt') as HTMLTextAreaElement;
                            const providerSelect = document.querySelector('[id^="narrative-provider"]') as HTMLSelectElement;
                            const modelInput = document.getElementById('narrative-model') as HTMLInputElement;
                            
                            // Get values
                            const narrativeMasterPrompt = masterPromptInput?.value || "";
                            const narrativeProvider = providerSelect?.value || "openai";
                            const narrativeModel = modelInput?.value || "gpt4";
                            
                            if (narrativeMasterPrompt) {
                              toast({
                                title: "Saving Narrative Template",
                                description: `Provider: ${narrativeProvider}, Model: ${narrativeModel}`,
                                duration: 2000,
                              });
                              
                              console.log("Saving Narrative Template:", {
                                provider: narrativeProvider,
                                model: narrativeModel,
                                masterPrompt: narrativeMasterPrompt.substring(0, 50) + "..." // Log truncated prompt
                              });
                              
                              const templateName = "Narrative Template";
                              
                              // Get format template and usage rules 
                              const formatTemplateInput = document.getElementById('narrative-format-template') as HTMLTextAreaElement;
                              const usageRulesInput = document.getElementById('narrative-usage-rules') as HTMLTextAreaElement;
                              const useHappyTalkInput = document.getElementById('narrative-happy-talk') as HTMLInputElement;
                              
                              // Create template for database using saveDefaultTemplate function
                              // This handles both creation and updates
                              await saveDefaultTemplate('narrative', {
                                name: templateName,
                                template: "narrative",
                                template_type: "narrative",
                                category: "template",
                                is_default: true,
                                master_prompt: narrativeMasterPrompt,
                                llm_provider: narrativeProvider,
                                llm_model: narrativeModel,
                                format_template: formatTemplateInput?.value || "",
                                usage_rules: usageRulesInput?.value || "",
                                use_happy_talk: useHappyTalkInput?.checked || false,
                                compress_prompt: false,
                                compression_level: 5
                              });
                            }
                          }}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Narrative Template
                        </Button>
                      </div>
                    </div>
                    
                    {/* Wildcard Template */}
                    <div className="border rounded-md p-4 mt-4">
                      <h3 className="text-base font-medium mb-2">Wildcard Template</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="wildcard-master-prompt">LLM Master Prompt</Label>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    const textarea = document.getElementById('wildcard-master-prompt') as HTMLTextAreaElement;
                                    if (textarea) {
                                      // Find the default template
                                      const template = ruleTemplates.find(t => t.id === "wildcard");
                                      if (template?.masterPrompt) {
                                        textarea.value = template.masterPrompt;
                                      }
                                    }
                                  }}
                                >
                                  Reset to Default
                                </Button>
                              </div>
                            </div>
                            <Textarea 
                              id="wildcard-master-prompt" 
                              placeholder="Enter the master prompt for the LLM to follow when generating wildcard prompts..."
                              rows={10}
                              defaultValue={wildcardRuleTemplate?.masterPrompt}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="wildcard-format-template">Format Template</Label>
                            <Textarea 
                              id="wildcard-format-template" 
                              placeholder="Enter format template for the LLM..."
                              rows={3}
                              defaultValue={wildcardRuleTemplate?.formatTemplate}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="wildcard-usage-rules">Usage Rules</Label>
                            <Textarea 
                              id="wildcard-usage-rules" 
                              placeholder="Enter usage rules..."
                              rows={5}
                              defaultValue={wildcardRuleTemplate?.usageRules}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="wildcard-provider">LLM Provider</Label>
                              <Select defaultValue={wildcardRuleTemplate?.llmProvider || "openai"}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select LLM Provider" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="openai">OpenAI</SelectItem>
                                  <SelectItem value="anthropic">Anthropic</SelectItem>
                                  <SelectItem value="llama">Llama</SelectItem>
                                  <SelectItem value="mistral">Mistral</SelectItem>
                                  <SelectItem value="local">Local</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="wildcard-model">LLM Model</Label>
                              <Input 
                                id="wildcard-model" 
                                placeholder="e.g. gpt-4"
                                defaultValue={wildcardRuleTemplate?.llmModel || "gpt4"} 
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="wildcard-happy-talk" 
                              defaultChecked={wildcardRuleTemplate?.useHappyTalk || true}
                            />
                            <Label htmlFor="wildcard-happy-talk">Use Happy Talk</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button 
                          className="w-full"
                          onClick={async () => {
                            // Get references to inputs
                            const masterPromptInput = document.getElementById('wildcard-master-prompt') as HTMLTextAreaElement;
                            const providerSelect = document.querySelector('[id^="wildcard-provider"]') as HTMLSelectElement;
                            const modelInput = document.getElementById('wildcard-model') as HTMLInputElement;
                            
                            // Get values
                            const wildcardMasterPrompt = masterPromptInput?.value || "";
                            const wildcardProvider = providerSelect?.value || "openai";
                            const wildcardModel = modelInput?.value || "gpt4";
                            
                            if (wildcardMasterPrompt) {
                              toast({
                                title: "Saving Wildcard Template",
                                description: `Provider: ${wildcardProvider}, Model: ${wildcardModel}`,
                                duration: 2000,
                              });
                              
                              console.log("Saving Wildcard Template:", {
                                provider: wildcardProvider,
                                model: wildcardModel,
                                masterPrompt: wildcardMasterPrompt.substring(0, 50) + "..." // Log truncated prompt
                              });
                              
                              const templateName = "Wildcard Template";
                              
                              // Get format template and usage rules 
                              const formatTemplateInput = document.getElementById('wildcard-format-template') as HTMLTextAreaElement;
                              const usageRulesInput = document.getElementById('wildcard-usage-rules') as HTMLTextAreaElement;
                              const useHappyTalkInput = document.getElementById('wildcard-happy-talk') as HTMLInputElement;
                              
                              // Create template for database using saveDefaultTemplate function
                              // This handles both creation and updates
                              await saveDefaultTemplate('wildcard', {
                                name: templateName,
                                template: "wildcard",
                                template_type: "wildcard",
                                category: "template",
                                is_default: true,
                                master_prompt: wildcardMasterPrompt,
                                llm_provider: wildcardProvider,
                                llm_model: wildcardModel,
                                format_template: formatTemplateInput?.value || "",
                                usage_rules: usageRulesInput?.value || "",
                                use_happy_talk: useHappyTalkInput?.checked || true,
                                compress_prompt: false,
                                compression_level: 5
                              });
                            }
                          }}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Wildcard Template
                        </Button>
                      </div>
                    </div>
                    
                    {/* Custom Templates - Visible in both Admin and User mode */}
                    <div className="border rounded-md p-4">
                      <h3 className="text-base font-medium mb-2">Custom Templates</h3>
                      <Tabs defaultValue="custom1" className="w-full">
                        <TabsList className="grid grid-cols-3 mb-4">
                          <TabsTrigger value="custom1">Custom 1</TabsTrigger>
                          <TabsTrigger value="custom2">Custom 2</TabsTrigger>
                          <TabsTrigger value="custom3">Custom 3</TabsTrigger>
                        </TabsList>
                        
                        {['custom1', 'custom2', 'custom3'].map((customId, index) => (
                          <TabsContent key={customId} value={customId} className="space-y-4">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor={`custom-name-${index}`}>Template Name</Label>
                                <Input 
                                  id={`custom-name-${index}`}
                                  placeholder={`Custom Template ${index + 1}`}
                                  defaultValue={customTemplateData[index]?.name || `Custom ${index + 1}`}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`custom-master-prompt-${index}`}>LLM Master Prompt</Label>
                                <Textarea 
                                  id={`custom-master-prompt-${index}`}
                                  placeholder="Enter custom master prompt"
                                  className="resize-vertical min-h-[150px] h-64"
                                  defaultValue={customTemplateData[index]?.masterPrompt || ""}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`custom-format-template-${index}`}>Format Template</Label>
                                <Textarea
                                  id={`custom-format-template-${index}`}
                                  placeholder="Enter format template for structured responses"
                                  className="resize-vertical min-h-[100px]"
                                  defaultValue={customTemplateData[index]?.formatTemplate || ""}
                                  onChange={(e) => {
                                    setCustomTemplateData(prev => {
                                      const newData = [...prev];
                                      if (!newData[index]) {
                                        newData[index] = { 
                                          name: `Custom ${index + 1}`, 
                                          masterPrompt: "", 
                                          formatTemplate: e.target.value,
                                          llmProvider: "openai", 
                                          llmModel: "gpt4" 
                                        };
                                      } else {
                                        newData[index].formatTemplate = e.target.value;
                                      }
                                      return newData;
                                    });
                                  }}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`custom-usage-rules-${index}`}>Usage Rules</Label>
                                <Textarea
                                  id={`custom-usage-rules-${index}`}
                                  placeholder="Enter usage rules for this template"
                                  className="resize-vertical min-h-[100px]"
                                  defaultValue={customTemplateData[index]?.usageRules || ""}
                                  onChange={(e) => {
                                    setCustomTemplateData(prev => {
                                      const newData = [...prev];
                                      if (!newData[index]) {
                                        newData[index] = { 
                                          name: `Custom ${index + 1}`, 
                                          masterPrompt: "", 
                                          usageRules: e.target.value,
                                          llmProvider: "openai", 
                                          llmModel: "gpt4" 
                                        };
                                      } else {
                                        newData[index].usageRules = e.target.value;
                                      }
                                      return newData;
                                    });
                                  }}
                                />
                              </div>
                              
                              <div className="space-y-3 pt-1 border-t">
                                <h4 className="text-sm font-medium mt-2">Prompt Refinement Options</h4>
                                
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`custom-happy-talk-${index}`}
                                    checked={customTemplateData[index]?.useHappyTalk || false}
                                    onCheckedChange={(checked) => {
                                      setCustomTemplateData(prev => {
                                        const newData = [...prev];
                                        if (!newData[index]) {
                                          newData[index] = { 
                                            name: `Custom ${index + 1}`, 
                                            masterPrompt: "", 
                                            useHappyTalk: !!checked,
                                            llmProvider: "openai", 
                                            llmModel: "gpt4" 
                                          };
                                        } else {
                                          newData[index].useHappyTalk = !!checked;
                                        }
                                        return newData;
                                      });
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`custom-happy-talk-${index}`}
                                    className="text-sm"
                                  >
                                    Use Happy Talk (add encouraging language to prompts)
                                  </Label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`custom-compress-prompt-${index}`}
                                    checked={customTemplateData[index]?.compressPrompt || false}
                                    onCheckedChange={(checked) => {
                                      setCustomTemplateData(prev => {
                                        const newData = [...prev];
                                        if (!newData[index]) {
                                          newData[index] = { 
                                            name: `Custom ${index + 1}`, 
                                            masterPrompt: "", 
                                            compressPrompt: !!checked,
                                            compressionLevel: 5,
                                            llmProvider: "openai", 
                                            llmModel: "gpt4" 
                                          };
                                        } else {
                                          newData[index].compressPrompt = !!checked;
                                          if (!newData[index].compressionLevel) {
                                            newData[index].compressionLevel = 5;
                                          }
                                        }
                                        return newData;
                                      });
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`custom-compress-prompt-${index}`}
                                    className="text-sm"
                                  >
                                    Enable Prompt Compression
                                  </Label>
                                </div>
                                
                                {customTemplateData[index]?.compressPrompt && (
                                  <div className="ml-6 space-y-2">
                                    <Label htmlFor={`custom-compression-level-${index}`}>
                                      Compression Level: {customTemplateData[index]?.compressionLevel || 5}
                                    </Label>
                                    <Slider
                                      id={`custom-compression-level-${index}`}
                                      min={1}
                                      max={10}
                                      step={1}
                                      value={[customTemplateData[index]?.compressionLevel || 5]}
                                      onValueChange={(value) => {
                                        setCustomTemplateData(prev => {
                                          const newData = [...prev];
                                          if (!newData[index]) {
                                            newData[index] = { 
                                              name: `Custom ${index + 1}`, 
                                              masterPrompt: "", 
                                              compressPrompt: true,
                                              compressionLevel: value[0],
                                              llmProvider: "openai", 
                                              llmModel: "gpt4" 
                                            };
                                          } else {
                                            newData[index].compressionLevel = value[0];
                                          }
                                          return newData;
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-2 pt-2 border-t">
                                <Label htmlFor={`custom-llm-provider-${index}`}>LLM Provider</Label>
                                <Select 
                                  defaultValue={customTemplateData[index]?.llmProvider || "openai"} 
                                  onValueChange={(value) => {
                                    // When the provider changes, update customTemplateData state
                                    setCustomTemplateData(prev => {
                                      const newData = [...prev];
                                      if (!newData[index]) {
                                        newData[index] = { 
                                          name: `Custom ${index + 1}`, 
                                          masterPrompt: "", 
                                          llmProvider: value, 
                                          llmModel: newData[index]?.llmModel || "gpt4" 
                                        };
                                      } else {
                                        newData[index].llmProvider = value;
                                      }
                                      return newData;
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select LLM provider" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>Providers</SelectLabel>
                                      <SelectItem value="openai">OpenAI</SelectItem>
                                      <SelectItem value="anthropic">Anthropic</SelectItem>
                                      <SelectItem value="llama">Llama</SelectItem>
                                      <SelectItem value="mistral">Mistral</SelectItem>
                                      <SelectItem value="grok">Grok</SelectItem>
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`custom-llm-model-${index}`}>LLM Model</Label>
                                <Select 
                                  defaultValue={customTemplateData[index]?.llmModel || "gpt4"} 
                                  onValueChange={(value) => {
                                    // When the model changes, update customTemplateData state
                                    setCustomTemplateData(prev => {
                                      const newData = [...prev];
                                      if (!newData[index]) {
                                        newData[index] = { 
                                          name: `Custom ${index + 1}`, 
                                          masterPrompt: "", 
                                          llmProvider: newData[index]?.llmProvider || "openai", 
                                          llmModel: value 
                                        };
                                      } else {
                                        newData[index].llmModel = value;
                                      }
                                      return newData;
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select LLM model" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>OpenAI Models</SelectLabel>
                                      <SelectItem value="gpt-3.5-turbo">ChatGPT (GPT-3.5)</SelectItem>
                                      <SelectItem value="gpt4">GPT-4</SelectItem>
                                      <SelectItem value="gpt4o">GPT-4o</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                      <SelectLabel>Other Models</SelectLabel>
                                      <SelectItem value="claude-3">Claude 3</SelectItem>
                                      <SelectItem value="llama-3">Llama 3</SelectItem>
                                      <SelectItem value="deepseek-r1">Deepseek R1</SelectItem>
                                      <SelectItem value="kimi-ai">Kimi.ai</SelectItem>
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={isSavingTemplate}
                                onClick={async () => {
                                  // Use the new saveCustomTemplateByIndex function to properly save to database
                                  await saveCustomTemplateByIndex(index);
                                }}
                              >
                                {isSavingTemplate ? (
                                  <>
                                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Template
                                  </>
                                )}
                              </Button>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  </div>
                  )}
                  
                  {/* Prompt Components Editor Section - Only visible in admin mode */}
                  {isAdminMode && (
                  <div className="pt-8 mt-8 border-t border-gray-800">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Puzzle className="mr-2 h-5 w-5 text-blue-400" />
                        Prompt Components
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage and organize reusable components for your prompts
                      </p>
                    </div>
                    
                    <div className="border rounded-md p-4 bg-gray-900/40">
                      {/* Use the exact PromptComponentsEditor from the Prompting page */}
                      <div className="prompt-components-editor-container">
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                            <div className="flex-1">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <Input
                                  placeholder="Search components..."
                                  className="pl-10 bg-gray-900/60 border-gray-800"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Select defaultValue="default_tag">
                                <SelectTrigger className="w-[180px] bg-gray-900/60 border-gray-800">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default_tag">Default Tags</SelectItem>
                                  <SelectItem value="pose">Poses</SelectItem>
                                  <SelectItem value="lighting">Lighting</SelectItem>
                                  <SelectItem value="style">Style</SelectItem>
                                  <SelectItem value="all">View All</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button className="bg-primary hover:bg-primary/90">
                                <Plus size={16} className="mr-2" /> Add Component
                              </Button>
                            </div>
                          </div>

                          {/* Components Table */}
                          <div className="rounded-md border border-gray-800 overflow-hidden">
                            <Table>
                              <TableHeader className="bg-gray-900/60">
                                <TableRow>
                                  <TableHead className="w-[100px]">#</TableHead>
                                  <TableHead>Value</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {[
                                  { id: 1, order: 1, value: "elegant", description: "Refined and sophisticated style", category: "default_tag" },
                                  { id: 2, order: 2, value: "detailed", description: "High level of intricate details", category: "default_tag" },
                                  { id: 3, order: 3, value: "award-winning", description: "Professional quality photography", category: "default_tag" },
                                  { id: 4, order: 4, value: "hyperrealistic", description: "Extremely lifelike imagery", category: "default_tag" },
                                  { id: 5, order: 5, value: "dramatic lighting", description: "Strong contrast between light and shadow", category: "lighting" },
                                ].map((component, index) => (
                                  <TableRow key={component.id} className="border-t border-gray-800 hover:bg-gray-900/40">
                                    <TableCell className="font-mono text-gray-400">
                                      {component.order}
                                    </TableCell>
                                    <TableCell className="font-medium">{component.value}</TableCell>
                                    <TableCell className="text-gray-400 max-w-md truncate">
                                      {component.description || "-"}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex justify-end space-x-2">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 text-gray-400 hover:text-primary hover:bg-gray-800"
                                        >
                                          <Edit2 size={16} />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8 p-0 text-gray-400 hover:text-destructive hover:bg-gray-800"
                                        >
                                          <Trash2 size={16} />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </CardContent>
              </Card>
            
              {/* The duplicate Generated Prompt section was removed from here */}
              {!generatedPrompt && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No prompt generated yet</h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    Configure your prompt settings and click "Generate Prompt" to see the results
                  </p>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Keep the user on the current tab
                      form.handleSubmit(onSubmit)(e);
                    }}
                    type="button"
                  >
                    Generate Now
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Global Preset Dialog */}
      <Dialog open={presetModalOpen} onOpenChange={setPresetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPreset ? "Edit Global Preset" : "Save as Global Preset"}
            </DialogTitle>
            <DialogDescription>
              {selectedPreset 
                ? "Update the details of your global preset." 
                : "Save your current prompt settings as a global preset for future use."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...presetForm}>
            <form onSubmit={presetForm.handleSubmit(savePreset)} className="space-y-4">
              <FormField
                control={presetForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter preset name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={presetForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this preset is for"
                        className="resize-vertical min-h-[80px] h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={presetForm.control}
                name="favorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Mark as Favorite</FormLabel>
                      <FormDescription>
                        Add this preset to your favorites for quick access
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setPresetModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedPreset ? "Update Global Preset" : "Save Global Preset"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Rule Template Dialog */}
      <Dialog open={ruleTemplateModalOpen} onOpenChange={setRuleTemplateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rule Template</DialogTitle>
            <DialogDescription>
              Customize the rules and format for this template.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...ruleTemplateForm}>
            <form onSubmit={ruleTemplateForm.handleSubmit(updateRuleTemplate)} className="space-y-4">
              <FormField
                control={ruleTemplateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter template name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={ruleTemplateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={ruleTemplateForm.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Template (legacy)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Original template format with {placeholders}"
                        className="resize-vertical min-h-[80px] h-32 font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Legacy field - Use new Format Template field below
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={ruleTemplateForm.control}
                name="formatTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format Template</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Template format with {placeholders}"
                        className="resize-vertical min-h-[80px] h-32 font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use {`{prompt}`}, {`{aspect-ratio}`}, etc. as placeholders
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={ruleTemplateForm.control}
                name="usageRules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Rules</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List rules and tips for this format"
                        className="resize-vertical min-h-[100px] h-60"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add guidelines for using this template effectively
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={ruleTemplateForm.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Rules (legacy)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Legacy rules field"
                        className="resize-vertical min-h-[80px] h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Legacy field - Use Usage Rules field above
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="border-t pt-4 mt-4">
                <h3 className="text-base font-medium mb-3">LLM Enhancement Settings</h3>
                <div className="space-y-4">
                  <FormField
                    control={ruleTemplateForm.control}
                    name="masterPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Master Prompt for LLM</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Instructions for the LLM to enhance prompts"
                            className="resize-vertical min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will be used as the base prompt for LLM enhancement
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={ruleTemplateForm.control}
                      name="llmProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LLM Provider</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="anthropic">Anthropic</SelectItem>
                              <SelectItem value="local">Local (Fallback)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Provider for LLM enhancement
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={ruleTemplateForm.control}
                      name="llmModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LLM Model</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ruleTemplateForm.watch("llmProvider") === 'openai' ? (
                                <>
                                  <SelectItem value="gpt3.5">GPT-3.5 Turbo</SelectItem>
                                  <SelectItem value="gpt4">GPT-4</SelectItem>
                                  <SelectItem value="gpt4o">GPT-4o</SelectItem>
                                </>
                              ) : ruleTemplateForm.watch("llmProvider") === 'anthropic' ? (
                                <>
                                  <SelectItem value="claude2">Claude 2</SelectItem>
                                  <SelectItem value="claude3-haiku">Claude 3 Haiku</SelectItem>
                                </>
                              ) : (
                                <SelectItem value="local">Local Fallback</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Model for LLM enhancement
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={ruleTemplateForm.control}
                      name="useHappyTalk"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Happy Talk</FormLabel>
                            <FormDescription>
                              Add enthusiastic tone to prompts
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={ruleTemplateForm.control}
                      name="compressPrompt"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Compress Prompt</FormLabel>
                            <FormDescription>
                              Reduce redundancy and verbosity
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {ruleTemplateForm.watch("compressPrompt") && (
                    <FormField
                      control={ruleTemplateForm.control}
                      name="compressionLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compression Level: {field.value || 5}</FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={10}
                              step={1}
                              value={[field.value || 5]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Higher values produce more concise prompts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setRuleTemplateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Template
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Character Preset Modal */}
      <Dialog open={characterPresetModalOpen} onOpenChange={setCharacterPresetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCharacterPreset ? "Edit Character Preset" : "Save as Character Preset"}
            </DialogTitle>
            <DialogDescription>
              {selectedCharacterPreset 
                ? "Update the details of your character preset." 
                : "Save your current character settings as a preset for future use."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...characterPresetForm}>
            <form onSubmit={characterPresetForm.handleSubmit(saveCurrentCharacterAsPreset)} className="space-y-3">
              <FormField
                control={characterPresetForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Character Preset" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={characterPresetForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add a short description of your character preset"
                        className="resize-vertical min-h-[60px] h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={characterPresetForm.control}
                name="favorite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Add to Favorites
                      </FormLabel>
                      <FormDescription>
                        Mark this preset as a favorite for quick access
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setCharacterPresetModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Preset
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Prompt Enhancement History Dialog */}
      <Dialog open={promptHistoryOpen} onOpenChange={setPromptHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Prompt Enhancement History</DialogTitle>
            <DialogDescription>
              View your previous LLM-enhanced prompts
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
            {promptHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <p className="text-muted-foreground">No enhancement history yet</p>
                <p className="text-sm text-muted-foreground mt-2">Enhanced prompts will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {promptHistory.map((entry) => (
                  <div key={entry.id} className="border rounded-md p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-medium">
                          Enhanced with {entry.llmProvider} {entry.llmModel}
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                          <div className="flex items-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                const text = navigator.clipboard.writeText(entry.enhancedPrompt);
                                toast({
                                  title: "Copied to clipboard",
                                  description: "The enhanced prompt has been copied to your clipboard",
                                });
                              }}
                            >
                              <CopyButton textToCopy={entry.enhancedPrompt} />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Original Prompt</p>
                          <div className="text-xs border rounded-md p-2 bg-muted/50">
                            {entry.originalPrompt}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Enhanced Prompt</p>
                          <div className="text-xs border rounded-md p-2 bg-primary/5">
                            {entry.enhancedPrompt}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setPromptHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}