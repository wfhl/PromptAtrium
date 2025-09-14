import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuickPromptPlay from '../../frontend/components/QuickPromptPlay';

/**
 * Advanced Implementation with Image Analysis
 * This example demonstrates advanced features including image analysis and AI enhancement
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    },
  },
});

// Configuration for advanced features
const advancedConfig = {
  features: {
    enableImageAnalysis: true,
    enableSocialCaptions: true,
    enablePromptLibrary: true,
    enableCharacterPresets: true,
    enableRandomGeneration: true,
    enableDebugMode: true,
    enableOfflineMode: true,
    enablePWA: true,
  },
  
  apiConfig: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    endpoints: {
      characterPresets: '/api/character-presets',
      promptTemplates: '/api/prompt-templates',
      imageAnalysis: '/api/analyze-image',
      socialCaption: '/api/generate-social-caption',
      enhancePrompt: '/api/enhance-prompt',
    },
  },
  
  visionProviders: [
    { id: 'openai', name: 'OpenAI GPT-4 Vision', enabled: true },
    { id: 'anthropic', name: 'Claude Vision', enabled: true },
    { id: 'google', name: 'Gemini Vision', enabled: true },
    { id: 'custom', name: 'Custom Vision Server', enabled: false },
  ],
  
  llmProviders: [
    { id: 'openai', name: 'OpenAI GPT-4', models: ['gpt-4', 'gpt-3.5-turbo'] },
    { id: 'anthropic', name: 'Claude', models: ['claude-2', 'claude-instant'] },
    { id: 'google', name: 'Gemini', models: ['gemini-pro'] },
    { id: 'groq', name: 'Groq', models: ['llama2-70b', 'mixtral-8x7b'] },
  ],
};

export default function AdvancedWithImageAnalysis() {
  const [debugMode, setDebugMode] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  
  // Custom event handlers
  const handlePromptGenerated = (promptData: any) => {
    console.log('Prompt generated:', promptData);
    // Custom analytics or logging
  };
  
  const handleImageAnalyzed = (analysisData: any) => {
    console.log('Image analyzed:', analysisData);
    // Process analysis results
  };
  
  const handleError = (error: any) => {
    console.error('Error occurred:', error);
    // Custom error handling
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="container mx-auto max-w-6xl p-4">
          {/* Header with controls */}
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">
              Advanced Quick Prompt with Image Analysis
            </h1>
            
            <div className="flex gap-4">
              {/* Provider selector */}
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg"
              >
                {advancedConfig.llmProviders.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              
              {/* Debug mode toggle */}
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`px-4 py-2 rounded-lg ${
                  debugMode 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Debug: {debugMode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          
          {/* Main Quick Prompt component with advanced configuration */}
          <QuickPromptPlay
            config={advancedConfig}
            debugMode={debugMode}
            defaultProvider={selectedProvider}
            onPromptGenerated={handlePromptGenerated}
            onImageAnalyzed={handleImageAnalyzed}
            onError={handleError}
          />
          
          {/* Debug panel */}
          {debugMode && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Debug Information</h3>
              <div className="text-sm text-gray-400 font-mono">
                <p>Provider: {selectedProvider}</p>
                <p>Image Analysis: {advancedConfig.features.enableImageAnalysis ? 'Enabled' : 'Disabled'}</p>
                <p>API Base URL: {advancedConfig.apiConfig.baseURL}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}

// Additional helper component for image analysis results
export function ImageAnalysisResults({ analysis }: { analysis: any }) {
  if (!analysis) return null;
  
  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
      <h4 className="text-lg font-semibold text-white mb-2">Analysis Results</h4>
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Description:</span>
          <p className="text-white">{analysis.description}</p>
        </div>
        <div>
          <span className="text-gray-400">Suggested Prompt:</span>
          <p className="text-white">{analysis.suggestedPrompt}</p>
        </div>
        {analysis.tags && (
          <div>
            <span className="text-gray-400">Tags:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {analysis.tags.map((tag: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-gray-700 text-white rounded-md text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}