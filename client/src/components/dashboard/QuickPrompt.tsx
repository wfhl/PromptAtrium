import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useQuickPrompt } from '@/hooks/useQuickPrompt';
import { Link } from 'wouter';
import { 
  Sparkles, 
  Copy, 
  ExternalLink, 
  Zap,
  Palette,
  Camera,
  Brush,
  Sun,
  Grid3x3,
  RefreshCw,
  ChevronRight,
  Wand2
} from 'lucide-react';

export function QuickPrompt() {
  const {
    isGenerating,
    generatedPrompt,
    popularTemplates,
    quickComponents,
    generateQuickPrompt,
    copyToClipboard,
    clearPrompt
  } = useQuickPrompt();

  const [subject, setSubject] = useState('');
  const [template, setTemplate] = useState('standard');
  const [selectedComponents, setSelectedComponents] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = () => {
    generateQuickPrompt({
      subject,
      template,
      artform: selectedComponents.artform,
      photoType: selectedComponents.photoType,
      style: selectedComponents.style,
      mood: selectedComponents.mood,
      lighting: selectedComponents.lighting,
      composition: selectedComponents.composition
    });
  };

  const handleComponentSelect = (category: string, value: string) => {
    setSelectedComponents(prev => ({
      ...prev,
      [category]: prev[category] === value ? '' : value
    }));
  };

  const handleReset = () => {
    setSubject('');
    setTemplate('standard');
    setSelectedComponents({});
    clearPrompt();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'artforms': return <Palette className="h-4 w-4" />;
      case 'photoTypes': return <Camera className="h-4 w-4" />;
      case 'styles': return <Brush className="h-4 w-4" />;
      case 'moods': return <Sparkles className="h-4 w-4" />;
      case 'lighting': return <Sun className="h-4 w-4" />;
      case 'composition': return <Grid3x3 className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/10" data-testid="card-quick-prompt">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl -ml-24 -mb-24" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Quick Prompt Generator</CardTitle>
              <CardDescription>Generate AI prompts instantly with popular templates</CardDescription>
            </div>
          </div>
          <Link href="/new-prompt-generator">
            <Button variant="ghost" size="sm" className="gap-1" data-testid="button-open-full-generator">
              Advanced Generator
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Subject Input */}
        <div className="space-y-2">
          <Label htmlFor="quick-subject" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Subject
          </Label>
          <Input
            id="quick-subject"
            placeholder="e.g., A mystical forest, Portrait of a warrior, Futuristic city..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-background/50 backdrop-blur-sm"
            data-testid="input-quick-subject"
          />
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label htmlFor="quick-template" className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Template Style
          </Label>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger id="quick-template" className="bg-background/50 backdrop-blur-sm" data-testid="select-quick-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {popularTemplates.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{t.name}</span>
                    {t.description && (
                      <span className="text-xs text-muted-foreground">{t.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Components Toggle */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-between"
            data-testid="button-toggle-advanced"
          >
            <span className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Style Components
            </span>
            <ChevronRight className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
          </Button>

          {showAdvanced && (
            <div className="space-y-3 mt-3 p-3 bg-background/30 backdrop-blur-sm rounded-lg">
              {/* Art Form & Photo Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    Art Form
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {quickComponents.artforms.slice(0, 4).map(item => (
                      <Badge
                        key={item}
                        variant={selectedComponents.artform === item ? 'default' : 'outline'}
                        className="cursor-pointer text-xs py-0.5"
                        onClick={() => handleComponentSelect('artform', item)}
                        data-testid={`badge-artform-${item.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    Photo Type
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {quickComponents.photoTypes.slice(0, 4).map(item => (
                      <Badge
                        key={item}
                        variant={selectedComponents.photoType === item ? 'default' : 'outline'}
                        className="cursor-pointer text-xs py-0.5"
                        onClick={() => handleComponentSelect('photoType', item)}
                        data-testid={`badge-phototype-${item.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Style & Mood */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Brush className="h-3 w-3" />
                    Style
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {quickComponents.styles.slice(0, 4).map(item => (
                      <Badge
                        key={item}
                        variant={selectedComponents.style === item ? 'default' : 'outline'}
                        className="cursor-pointer text-xs py-0.5"
                        onClick={() => handleComponentSelect('style', item)}
                        data-testid={`badge-style-${item.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Mood
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {quickComponents.moods.slice(0, 4).map(item => (
                      <Badge
                        key={item}
                        variant={selectedComponents.mood === item ? 'default' : 'outline'}
                        className="cursor-pointer text-xs py-0.5"
                        onClick={() => handleComponentSelect('mood', item)}
                        data-testid={`badge-mood-${item.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !subject.trim()}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            data-testid="button-generate-quick"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Prompt
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            disabled={isGenerating}
            data-testid="button-reset-quick"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Generated Prompt Display */}
        {generatedPrompt && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Separator />
            
            {/* Main Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Generated Prompt</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedPrompt.original)}
                  className="h-7"
                  data-testid="button-copy-prompt"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  value={generatedPrompt.original}
                  readOnly
                  className="min-h-[80px] text-sm bg-background/50 backdrop-blur-sm resize-none"
                  data-testid="textarea-generated-prompt"
                />
              </div>
            </div>

            {/* Negative Prompt (if exists) */}
            {generatedPrompt.negativePrompt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-muted-foreground">Negative Prompt</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedPrompt.negativePrompt || '')}
                    className="h-7"
                    data-testid="button-copy-negative"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={generatedPrompt.negativePrompt}
                  readOnly
                  className="min-h-[60px] text-sm bg-background/50 backdrop-blur-sm resize-none opacity-75"
                  data-testid="textarea-negative-prompt"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {template} template
                </Badge>
                {Object.keys(selectedComponents).filter(k => selectedComponents[k]).length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {Object.keys(selectedComponents).filter(k => selectedComponents[k]).length} components
                  </Badge>
                )}
              </div>
              <Link href="/new-prompt-generator">
                <Button variant="link" size="sm" className="text-xs h-auto p-0" data-testid="link-edit-full">
                  Edit in advanced generator →
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}