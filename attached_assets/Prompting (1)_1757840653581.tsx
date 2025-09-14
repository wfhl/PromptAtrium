import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  BookOpen,
  Sparkles,
  Code,
  ExternalLink,
  List,
  Zap,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ResourceCard from "@/components/shared/ResourceCard";
import PromptingGuide from "@/components/content/PromptingGuide";

import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { Resource, PromptGuide } from "@shared/schema";
import { useLocation } from "wouter";
import { getMobilePageConfig } from "@/utils/pageConfig";

export default function Prompting() {
  const [activeTab, setActiveTab] = useState("anatomy");
  const [location] = useLocation();

  // Get page config for header
  const pageConfig = getMobilePageConfig(location);

  // Split page name to handle gradient on last word
  const words = pageConfig.label.split(' ');
  const lastWord = words[words.length - 1];
  const firstWords = words.slice(0, -1).join(' ');

  const { data: resources, isLoading: loadingResources } = useQuery<Resource[]>(
    {
      queryKey: ["/api/resources/category/prompting"],
    },
  );

  const { data: syntaxGuides, isLoading: loadingSyntaxGuides } = useQuery<
    PromptGuide[]
  >({
    queryKey: ["/api/system-data/prompt-guides/category/syntax"],
  });

  const { data: anatomyGuides, isLoading: loadingAnatomyGuides } = useQuery<
    PromptGuide[]
  >({
    queryKey: ["/api/system-data/prompt-guides/category/anatomy"],
  });

  // Loading skeletons
  const renderCardSkeletons = (count: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="flex items-start pb-4 border-b border-gray-800/30 p-3">
          <Skeleton className="flex-shrink-0 w-10 h-10 rounded-full mr-3 bg-gray-800/50" />
          <div className="space-y-2 flex-grow">
            <Skeleton className="h-5 w-3/4 bg-gray-800/50" />
            <Skeleton className="h-4 w-full bg-gray-800/50" />
            <Skeleton className="h-4 w-1/4 mt-1 bg-gray-800/50" />
          </div>
        </div>
      </div>
    ));
  };

  const renderGuideSkeletons = (count: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-gray-900/30 rounded-lg p-5 mb-4 border border-gray-800/50"
      >
        <div className="flex items-center mb-3">
          <Skeleton className="w-7 h-7 rounded-full mr-3 bg-gray-800/50" />
          <Skeleton className="h-5 w-1/3 bg-gray-800/50" />
        </div>
        <Skeleton className="h-4 w-full mb-2 bg-gray-800/50" />
        <Skeleton className="h-4 w-5/6 mb-2 bg-gray-800/50" />
        <Skeleton className="h-4 w-full bg-gray-800/50" />
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Page Header */}
      <div className="flex items-center justify-between p-4 pt-0 border-transparent ml-48">
        <div className="flex items-center gap-3">
          {/* Page Icon */}
          <div 
            className="w-8 h-8 flex items-center justify-center"
            style={{ color: pageConfig.color }}
          >
            {pageConfig.icon}
          </div>
          {/* Page Title with Gradient */}
          <h1 className="text-2xl font-bold">
            {firstWords && (
              <span className="text-white mr-1">{firstWords}</span>
            )}
            <span 
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(45deg, ${pageConfig.color}, ${pageConfig.color}dd)`
              }}
            >
              {lastWord}
            </span>
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <section id="prompting" className="mb-16">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="anatomy" className="flex items-center">
              <Sparkles className="mr-2 h-4 w-4" /> Prompt Anatomy
            </TabsTrigger>
            <TabsTrigger value="syntax" className="flex items-center">
              <Code className="mr-2 h-4 w-4" /> Syntax Guide
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" /> Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resources">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="dark-card bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-heading font-semibold text-xl text-white">
                      Prompt Resources
                    </h3>
                    <Button
                      onClick={() =>
                        (window.location.href = "/add-entry?type=prompting")
                      }
                      className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow-lg shadow-purple-900/30 border border-purple-500 font-medium"
                      size="default"
                    >
                      <span className="hidden sm:inline">Add Resource</span>
                      <span className="sm:hidden">Add</span>
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-primary-400 font-medium mb-4 text-lg">
                      Tutorials & Guides
                    </h4>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-900/60 border border-purple-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="text-purple-400 h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-white mb-1 group-hover:text-purple-400 transition-colors">
                              Midjourney Documentation
                            </h4>
                            <FavoriteButton
                              itemId={1}
                              itemType="tutorial"
                              className="mt-1 mr-1"
                            />
                          </div>
                          <p className="text-gray-400 text-sm">
                            Official guide to Midjourney prompt structure and
                            parameters
                          </p>
                          <a
                            href="https://docs.midjourney.com/docs/prompt-guide"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 text-sm hover:text-purple-300 mt-2 inline-flex items-center"
                          >
                            View Resource{" "}
                            <span className="ml-1 text-xs">→</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-900/60 border border-blue-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="text-blue-400 h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">
                              Stable Diffusion Prompt Guide
                            </h4>
                            <FavoriteButton
                              itemId={2}
                              itemType="tutorial"
                              className="mt-1 mr-1"
                            />
                          </div>
                          <p className="text-gray-400 text-sm">
                            Comprehensive guide to SD prompting syntax and
                            techniques
                          </p>
                          <a
                            href="https://stable-diffusion-art.com/prompt-guide/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm hover:text-blue-300 mt-2 inline-flex items-center"
                          >
                            View Resource{" "}
                            <span className="ml-1 text-xs">→</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-emerald-900/60 border border-emerald-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="text-emerald-400 h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-white mb-1 group-hover:text-emerald-400 transition-colors">
                              Civitai Prompt Guide
                            </h4>
                            <FavoriteButton
                              itemId={3}
                              itemType="tutorial"
                              className="mt-1 mr-1"
                            />
                          </div>
                          <p className="text-gray-400 text-sm">
                            Community-driven tips and best practices for
                            prompting
                          </p>
                          <a
                            href="https://civitai.com/articles/741/sd-prompt-building-guide"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 text-sm hover:text-emerald-300 mt-2 inline-flex items-center"
                          >
                            View Resource{" "}
                            <span className="ml-1 text-xs">→</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-amber-400 font-medium mb-4 text-lg">
                      Community Resources
                    </h4>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-amber-900/60 border border-amber-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="text-amber-400 h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-white mb-1 group-hover:text-amber-400 transition-colors">
                              Midjourney Community Showcase
                            </h4>
                            <FavoriteButton
                              itemId={1}
                              itemType="community-resource"
                              className="mt-1 mr-1"
                            />
                          </div>
                          <p className="text-gray-400 text-sm">
                            Browse top Midjourney creations with prompts
                          </p>
                          <a
                            href="https://www.midjourney.com/showcase/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 text-sm hover:text-amber-300 mt-2 inline-flex items-center"
                          >
                            View Resource{" "}
                            <span className="ml-1 text-xs">→</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-rose-900/60 border border-rose-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="text-rose-400 h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-white mb-1 group-hover:text-rose-400 transition-colors">
                              PromptHero
                            </h4>
                            <FavoriteButton
                              itemId={2}
                              itemType="community-resource"
                              className="mt-1 mr-1"
                            />
                          </div>
                          <p className="text-gray-400 text-sm">
                            Database of AI art prompts across multiple models
                          </p>
                          <a
                            href="https://prompthero.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-400 text-sm hover:text-rose-300 mt-2 inline-flex items-center"
                          >
                            View Resource{" "}
                            <span className="ml-1 text-xs">→</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-indigo-400 font-medium mb-4 text-lg">
                      Tools & Applications
                    </h4>
                    <div className="space-y-4">
                      {loadingResources ? (
                        <div className="space-y-4 mb-6">
                          {renderCardSkeletons(2)}
                        </div>
                      ) : resources?.length ? (
                        <div className="space-y-4 mb-6">
                          {resources.map((resource) => (
                            <div
                              key={resource.id}
                              className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group"
                            >
                              <div className="flex-shrink-0 w-10 h-10 bg-indigo-900/60 border border-indigo-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                                <BookOpen className="text-indigo-400 h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-white mb-1 group-hover:text-indigo-400 transition-colors">
                                    {resource.name}
                                  </h4>
                                  <FavoriteButton
                                    itemId={resource.id}
                                    itemType="resources"
                                    className="mt-1 mr-1"
                                  />
                                </div>
                                <p className="text-gray-400 text-sm">
                                  {resource.description}
                                </p>
                                {resource.website && (
                                  <a
                                    href={resource.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-400 text-sm hover:text-indigo-300 mt-2 inline-flex items-center"
                                  >
                                    View Resource{" "}
                                    <span className="ml-1 text-xs">→</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">
                          No additional prompt tools found.
                        </p>
                      )}
                    </div>

                    <h4 className="text-purple-400 font-medium mb-4 text-lg mt-8">
                      Prompt Building Tools
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary-900/60 border border-primary-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <Sparkles className="text-primary-400 h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-white mb-1 group-hover:text-primary-400 transition-colors">
                              Elite{" "}
                              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Prompt Generator
                              </span>
                            </h4>
                            <FavoriteButton
                              itemId={1}
                              itemType="prompt-tool"
                              className="mt-1 mr-1"
                            />
                          </div>
                          <p className="text-gray-400 text-sm">
                            Our built-in advanced prompt generator with
                            templates and AI enhancement
                          </p>
                          <Link
                            to="/new-prompt-generator"
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition-all mt-2 inline-flex items-center"
                          >
                            Open Generator <Zap className="ml-1 h-3 w-3" />
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-900/60 border border-blue-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <Sparkles className="text-blue-400 h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">
                              FLUX Prompt Generator
                            </h4>
                            <FavoriteButton
                              itemId={2}
                              itemType="prompt-tool"
                              className="mt-1 mr-1"
                            />
                          </div>
                          <p className="text-gray-400 text-sm">
                            Original prompt generator with comprehensive
                            category options
                          </p>
                          <a
                            href="https://huggingface.co/spaces/gokaygokay/FLUX-Prompt-Generator"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm hover:text-blue-300 mt-2 inline-flex items-center"
                          >
                            Visit Generator{" "}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start border-b border-gray-800/50 pb-4 hover:bg-gray-900/30 p-3 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 w-10 h-10 bg-emerald-900/60 border border-emerald-700/40 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                          <Sparkles className="text-emerald-400 h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-white mb-1 group-hover:text-emerald-400 transition-colors">
                              Promptomania Builder
                            </h4>
                            <FavoriteButton
                              itemId={3}
                              itemType="prompt-tool"
                              className="mt-1 mr-1"
                            />
                          </div>
                          <p className="text-gray-400 text-sm">
                            Visual prompt builder with structured workflow and
                            categories
                          </p>
                          <a
                            href="https://promptomania.com/prompt-builder/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 text-sm hover:text-emerald-300 mt-2 inline-flex items-center"
                          >
                            Visit Builder{" "}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="dark-card bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 p-6 mb-6">
                  <h3 className="font-heading font-semibold text-xl mb-5 text-white">
                    Learning Resources
                  </h3>
                  <ul className="space-y-4 mb-6 text-gray-300">
                    <li className="flex items-start group">
                      <span className="inline-block bg-indigo-900/60 border border-indigo-700/40 text-indigo-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <a
                        href="https://www.youtube.com/c/MidJourneyAI"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-hover:text-white transition-colors"
                      >
                        Midjourney Official Channel
                      </a>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-blue-900/60 border border-blue-700/40 text-blue-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <a
                        href="https://lexica.art"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-hover:text-white transition-colors"
                      >
                        Lexica Prompt Search Engine
                      </a>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-amber-900/60 border border-amber-700/40 text-amber-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <a
                        href="https://github.com/Maks-s/sd-akashic"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-hover:text-white transition-colors"
                      >
                        SD Akashic Knowledge Guide
                      </a>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-emerald-900/60 border border-emerald-700/40 text-emerald-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <a
                        href="https://promptomania.com/prompt-builder/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-hover:text-white transition-colors"
                      >
                        Promptomania Builder
                      </a>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-rose-900/60 border border-rose-700/40 text-rose-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <a
                        href="https://www.reddit.com/r/StableDiffusion/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-hover:text-white transition-colors"
                      >
                        Reddit Stable Diffusion Community
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="dark-card bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                  <h3 className="font-heading font-semibold text-xl mb-5 text-white">
                    Quick Tips
                  </h3>
                  <ul className="space-y-4 mb-6 text-gray-300">
                    <li className="flex items-start group">
                      <span className="inline-block bg-primary-900/60 border border-primary-700/40 text-primary-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <span className="group-hover:text-white transition-colors">
                        Use parentheses to group related concepts
                      </span>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-primary-900/60 border border-primary-700/40 text-primary-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <span className="group-hover:text-white transition-colors">
                        Add weights to important elements:{" "}
                        <code className="bg-gray-950/80 px-1.5 py-0.5 rounded text-primary-300 text-xs">
                          (roses:1.3)
                        </code>
                      </span>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-primary-900/60 border border-primary-700/40 text-primary-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <span className="group-hover:text-white transition-colors">
                        Separate prompt sections logically
                      </span>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-primary-900/60 border border-primary-700/40 text-primary-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <span className="group-hover:text-white transition-colors">
                        Begin with subject, then add details
                      </span>
                    </li>
                    <li className="flex items-start group">
                      <span className="inline-block bg-primary-900/60 border border-primary-700/40 text-primary-400 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center mr-3 mt-0.5 group-hover:scale-110 transition-transform">
                        •
                      </span>
                      <span className="group-hover:text-white transition-colors">
                        Specify style and quality at the end
                      </span>
                    </li>
                  </ul>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="justify-center border-primary-700 bg-primary-900/30 hover:bg-primary-900/50 text-primary-300 hover:text-primary-200"
                      onClick={() => setActiveTab("syntax")}
                    >
                      Syntax Guide
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-center border-purple-700 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 hover:text-purple-200"
                      onClick={() => setActiveTab("anatomy")}
                    >
                      Prompt Anatomy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="syntax">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-primary-900/60 border border-primary-700/40 flex items-center justify-center mr-4">
                  <Code className="text-primary-400 h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-xl text-white">
                  Stable Diffusion Syntax Guide
                </h3>
              </div>

              <p className="text-gray-300 mb-4 max-w-3xl">
                Master the power of Stable Diffusion by learning these essential
                prompt syntax techniques. Each section below explains a specific
                feature that gives you greater control over your generated
                images.
              </p>

              {!loadingSyntaxGuides &&
                syntaxGuides &&
                syntaxGuides.length > 0 && (
                  <div className="bg-gray-950/50 rounded-lg border border-gray-800/50 p-4 mb-8">
                    <h4 className="text-white font-medium mb-4 flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary-900/80 border border-primary-700 flex items-center justify-center mr-2.5">
                        <List className="h-3.5 w-3.5 text-primary-300" />
                      </div>
                      <span className="bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
                        Quick Reference Guide
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {syntaxGuides
                        .sort((a, b) => {
                          const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
                          const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                          return orderA - orderB;
                        })
                        .map((guide, index) => {
                          // Assign different colors based on index for visual distinction
                          const colorClasses = [
                            "text-blue-400 hover:text-blue-300",
                            "text-purple-4400 hover:text-purple-300",
                            "text-green-400 hover:text-green-300",
                            "text-amber-400 hover:text-amber-300",
                            "text-rose-400 hover:text-rose-300",
                            "text-teal-400 hover:text-teal-300",
                            "text-indigo-400 hover:text-indigo-300",
                            "text-orange-400 hover:text-orange-300",
                          ];
                          const colorClass =
                            colorClasses[index % colorClasses.length];

                          // Matching background color for the bullet point with lower opacity
                          const bulletColorClasses = [
                            "bg-blue-500/20 text-blue-500",
                            "bg-purple-500/20 text-purple-500",
                            "bg-green-500/20 text-green-500",
                            "bg-amber-500/20 text-amber-500",
                            "bg-rose-500/20 text-rose-500",
                            "bg-teal-500/20 text-teal-500",
                            "bg-indigo-500/20 text-indigo-500",
                            "bg-orange-500/20 text-orange-500",
                          ];
                          const bulletColorClass =
                            bulletColorClasses[
                              index % bulletColorClasses.length
                            ];

                          return (
                            <a
                              key={`summary-${guide.id}`}
                              href={`#syntax-${guide.id}`}
                              className={`text-sm ${colorClass} transition-colors flex items-center group`}
                            >
                              <span
                                className={`${bulletColorClass} w-4 h-4 flex items-center justify-center rounded-full mr-1.5 group-hover:scale-110 transition-transform`}
                              >
                                •
                              </span>
                              {guide.title}
                            </a>
                          );
                        })}
                    </div>
                  </div>
                )}

              {loadingSyntaxGuides ? (
                <div className="space-y-4">{renderGuideSkeletons(5)}</div>
              ) : syntaxGuides?.length ? (
                <div id="syntax-guides">
                  <PromptingGuide
                    guides={syntaxGuides}
                    category="syntax"
                    useIds={true}
                  />
                </div>
              ) : (
                <p className="text-gray-400">No syntax guides available.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="anatomy">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-primary-900/60 border border-primary-700/40 flex items-center justify-center mr-4">
                  <Sparkles className="text-primary-400 h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-xl text-white">
                  Anatomy of a Great Prompt
                </h3>
              </div>

              <p className="text-gray-300 mb-4 max-w-3xl">
                Creating exceptional AI art starts with well-structured prompts.
                This guide breaks down the key components that will transform
                your ideas into stunning visuals.
              </p>

              {!loadingAnatomyGuides &&
                anatomyGuides &&
                anatomyGuides.length > 0 && (
                  <div className="bg-gray-950/50 rounded-lg border border-gray-800/50 p-4 mb-8">
                    <h4 className="text-white font-medium mb-4 flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary-900/80 border border-primary-700 flex items-center justify-center mr-2.5">
                        <List className="h-3.5 w-3.5 text-primary-300" />
                      </div>
                      <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                        Quick Reference Guide
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {anatomyGuides
                        .sort((a, b) => {
                          const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
                          const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                          return orderA - orderB;
                        })
                        .map((guide, index) => {
                          // Assign different colors based on index for visual distinction
                          const colorClasses = [
                            "text-blue-400 hover:text-blue-300",
                            "text-purple-400 hover:text-purple-300",
                            "text-green-400 hover:text-green-300",
                            "text-amber-400 hover:text-amber-300",
                            "text-rose-400 hover:text-rose-300",
                            "text-teal-400 hover:text-teal-300",
                            "text-indigo-400 hover:text-indigo-300",
                            "text-orange-400 hover:text-orange-300",
                          ];
                          const colorClass =
                            colorClasses[index % colorClasses.length];

                          // Matching background color for the bullet point with lower opacity
                          const bulletColorClasses = [
                            "bg-blue-500/20 text-blue-500",
                            "bg-purple-500/20 text-purple-500",
                            "bg-green-500/20 text-green-500",
                            "bg-amber-500/20 text-amber-500",
                            "bg-rose-500/20 text-rose-500",
                            "bg-teal-500/20 text-teal-500",
                            "bg-indigo-500/20 text-indigo-500",
                            "bg-orange-500/20 text-orange-500",
                          ];
                          const bulletColorClass =
                            bulletColorClasses[
                              index % bulletColorClasses.length
                            ];

                          return (
                            <a
                              key={`summary-${guide.id}`}
                              href={`#anatomy-${guide.id}`}
                              className={`text-sm ${colorClass} transition-colors flex items-center group`}
                            >
                              <span
                                className={`${bulletColorClass} w-4 h-4 flex items-center justify-center rounded-full mr-1.5 group-hover:scale-110 transition-transform`}
                              >
                                •
                              </span>
                              {guide.title}
                            </a>
                          );
                        })}
                    </div>
                  </div>
                )}

              {loadingAnatomyGuides ? (
                <div className="space-y-4">{renderGuideSkeletons(6)}</div>
              ) : anatomyGuides?.length ? (
                <div id="anatomy-guides">
                  <PromptingGuide
                    guides={anatomyGuides}
                    category="anatomy"
                    useIds={true}
                  />
                </div>
              ) : (
                <p className="text-gray-400">No anatomy guides available.</p>
              )}
            </div>
          </TabsContent>


        </Tabs>
        </section>
      </div>
    </div>
  );
}