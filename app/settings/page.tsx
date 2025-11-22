'use client';

import { useEffect } from 'react';
import { Settings, Waves, CornerDownRight, Minus, Square } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
    setEdgeType,
    setEdgeColor,
    setEdgeWidth,
    setEdgeAnimated,
    initializeSettings,
  } = useSettingsStore();

  useEffect(() => {
    initializeSettings();
  }, [initializeSettings]);

  const handleColorPreset = (light: string, dark: string) => {
    setEdgeColor({ light, dark });
  };

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
          <h2 className="text-lg font-semibold">Edge Styles</h2>
          
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
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = edgeColor.light === preset.light && edgeColor.dark === preset.dark;
                return (
                  <Button
                    key={preset.name}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1.5 h-8"
                    onClick={() => handleColorPreset(preset.light, preset.dark)}
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: isDarkMode ? preset.dark : preset.light,
                      }}
                    />
                    {preset.name}
                  </Button>
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
            <div className="w-fit bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden">
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

        {/* Placeholder for future settings categories */}
        <div className="space-y-6 max-w-4xl">
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">More settings coming soon...</p>
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
