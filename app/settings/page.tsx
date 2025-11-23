'use client';

import { useEffect, useState } from 'react';
import { Settings, Waves, CornerDownRight, Minus, Square, Bot, RefreshCw, GitBranch } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import useSettingsStore, { EdgeType } from '@/lib/stores/settingsStore';
import useThemeStore from '@/lib/stores/themeStore';

const EDGE_TYPES: { value: EdgeType; label: string; icon: React.ReactNode }[] = [
  { value: 'default', label: 'Bezier Curves', icon: <Waves className="w-4 h-4" /> },
  { value: 'smoothstep', label: 'Smooth Steps', icon: <CornerDownRight className="w-4 h-4" /> },
  { value: 'straight', label: 'Straight Lines', icon: <Minus className="w-4 h-4" /> },
  { value: 'step', label: 'Step Lines', icon: <Square className="w-4 h-4" /> },
];

const COLOR_PRESETS = [
  { name: 'Gray', light: '#4b5563', dark: '#6b7280' },
  { name: 'Slate', light: '#475569', dark: '#64748b' },
  { name: 'Zinc', light: '#52525b', dark: '#71717a' },
  { name: 'Blue', light: '#2563eb', dark: '#3b82f6' },
  { name: 'Sky', light: '#0284c7', dark: '#0ea5e9' },
  { name: 'Indigo', light: '#4f46e5', dark: '#6366f1' },
  { name: 'Purple', light: '#7c3aed', dark: '#8b5cf6' },
  { name: 'Pink', light: '#db2777', dark: '#ec4899' },
  { name: 'Rose', light: '#e11d48', dark: '#f43f5e' },
  { name: 'Red', light: '#dc2626', dark: '#ef4444' },
  { name: 'Orange', light: '#ea580c', dark: '#f97316' },
  { name: 'Amber', light: '#d97706', dark: '#f59e0b' },
  { name: 'Yellow', light: '#ca8a04', dark: '#eab308' },
  { name: 'Lime', light: '#65a30d', dark: '#84cc16' },
  { name: 'Green', light: '#16a34a', dark: '#22c55e' },
  { name: 'Emerald', light: '#059669', dark: '#10b981' },
  { name: 'Teal', light: '#0d9488', dark: '#14b8a6' },
  { name: 'Cyan', light: '#0891b2', dark: '#06b6d4' },
];

export default function SettingsPage() {
  const { isDarkMode } = useThemeStore();
  const {
    edgeType,
    edgeColor,
    edgeWidth,
    edgeAnimated,
    ollamaSettings,
    setEdgeType,
    setEdgeColor,
    setEdgeWidth,
    setEdgeAnimated,
    setOllamaSettings,
    initializeSettings,
  } = useSettingsStore();

  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    initializeSettings();
  }, [initializeSettings]);

  const fetchModels = async () => {
    if (!ollamaSettings?.baseUrl) return;
    
    setIsLoadingModels(true);
    try {
      const res = await fetch(`/api/ollama/tags?url=${encodeURIComponent(ollamaSettings.baseUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          const filteredModels = data.models
            .filter((m: any) => {
              const name = m.name.toLowerCase();
              // Filter out common embedding model keywords
              return !name.includes('embed') && !name.includes('bert');
            })
            .map((m: any) => m.name);
          setModels(filteredModels);
        }
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Fetch models on mount or when URL changes (debounced potentially, but simple effect is ok for now)
  useEffect(() => {
    fetchModels();
  }, [ollamaSettings?.baseUrl]);

  const handleColorPreset = (light: string, dark: string) => {
    setEdgeColor({ light, dark });
  };

  if (!ollamaSettings) return null; // Hydration check

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full px-8 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>

        {/* Edge Style Settings Category */}
        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Edge Styles</h2>
          </div>
          
          {/* Edge Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Connection Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {EDGE_TYPES.map((option) => (
                <Button
                  key={option.value}
                  variant={edgeType === option.value ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start gap-2"
                  onClick={() => setEdgeType(option.value)}
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Edge Color */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Color</Label>
            <div className="grid grid-cols-9 gap-2 max-w-md">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = edgeColor.light === preset.light && edgeColor.dark === preset.dark;
                const colorValue = isDarkMode ? preset.dark : preset.light;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleColorPreset(preset.light, preset.dark)}
                    className={`w-10 h-10 rounded-md transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      isSelected 
                        ? 'ring-2 ring-foreground ring-offset-2 shadow-md scale-110' 
                        : 'hover:ring-1 hover:ring-border'
                    }`}
                    style={{
                      backgroundColor: colorValue,
                    }}
                    aria-label={`Select ${preset.name} color`}
                  />
                );
              })}
            </div>
          </div>

          {/* Edge Width */}
          <div className="space-y-3">
            <Label htmlFor="edge-width" className="text-sm font-medium">
              Width
            </Label>
            <div className="flex items-center justify-between">
              <input
                type="range"
                id="edge-width"
                min="1"
                max="5"
                step="0.5"
                value={edgeWidth}
                onChange={(e) => setEdgeWidth(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary mr-4"
              />
              <span className="text-sm text-muted-foreground tabular-nums">
                {edgeWidth}px
              </span>
            </div>
          </div>

          {/* Edge Animation */}
          <div className="space-y-3">
            <Label htmlFor="edge-animation" className="text-sm font-medium">
              Animation
            </Label>
            <div className="w-fit bg-secondary rounded-md overflow-hidden">
              <ToggleGroup
                type="single"
                value={edgeAnimated ? 'on' : 'off'}
                onValueChange={(value) => {
                  if (value === 'on' || value === 'off') {
                    setEdgeAnimated(value === 'on');
                  }
                }}
                className="gap-0"
              >
                <ToggleGroupItem 
                  value="on" 
                  aria-label="Animation On"
                  className="h-9 px-2.5 text-sm rounded-none data-[state=on]:bg-black data-[state=on]:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-black"
                >
                  On
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="off" 
                  aria-label="Animation Off"
                  className="h-9 px-2.5 text-sm rounded-none data-[state=on]:bg-black data-[state=on]:text-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-black"
                >
                  Off
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        <Separator />

        {/* Ollama Settings Category */}
        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Model settings</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchModels} 
              disabled={isLoadingModels}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
              Refresh Models
            </Button>
          </div>
          
          {/* Base URL */}
          <div className="space-y-3">
            <Label htmlFor="ollama-url" className="text-sm font-medium">Ollama URL</Label>
            <Input
              id="ollama-url"
              value={ollamaSettings.baseUrl}
              onChange={(e) => setOllamaSettings({ baseUrl: e.target.value })}
              placeholder="http://localhost:11434"
            />
            <p className="text-xs text-muted-foreground">
              The URL where your Ollama instance is running. Default is http://localhost:11434.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <Label htmlFor="ollama-model" className="text-sm font-medium">Chat Model</Label>
             <select
              id="ollama-model"
              value={ollamaSettings.model}
              onChange={(e) => setOllamaSettings({ model: e.target.value })}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {models.length > 0 ? (
                models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))
              ) : (
                 <option value={ollamaSettings.model}>{ollamaSettings.model} (Custom/Default)</option>
              )}
            </select>
             {models.length === 0 && (
              <p className="text-xs text-amber-500">
                No models detected. Ensure Ollama is running and click "Refresh Models".
              </p>
            )}
          </div>

           {/* Temperature */}
          <div className="space-y-3">
            <Label htmlFor="ollama-temp" className="text-sm font-medium">
              Temperature ({ollamaSettings.temperature})
            </Label>
             <div className="flex items-center justify-between">
              <input
                type="range"
                id="ollama-temp"
                min="0"
                max="1"
                step="0.1"
                value={ollamaSettings.temperature}
                onChange={(e) => setOllamaSettings({ temperature: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary mr-4"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Controls randomness. Lower values are more deterministic, higher values more creative.
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-6 max-w-4xl">
          <h2 className="text-lg font-semibold">Preferences</h2>
          <p className="text-sm text-muted-foreground">More settings coming soon...</p>
        </div>
      </div>
    </div>
  );
}
