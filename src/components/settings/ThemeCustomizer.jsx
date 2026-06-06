import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, Moon, Sun, Palette, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PREVIEW_THEMES = {
  default: { label: 'Padrão', light: '#6366f1', dark: false, emoji: '🎨' },
  ocean: { label: 'Oceano', light: '#0ea5e9', dark: false, emoji: '🌊' },
  forest: { label: 'Floresta', light: '#22c55e', dark: false, emoji: '🌿' },
  sunset: { label: 'Pôr do Sol', light: '#f97316', dark: false, emoji: '🌅' },
  dark: { label: 'Escuro', light: '#8b5cf6', dark: true, emoji: '🌙' },
  midnight: { label: 'Meia-Noite', light: '#6366f1', dark: true, emoji: '✨' },
};

export default function ThemeCustomizer() {
  const { themeConfig, setTheme } = useTheme();
  const [customColor, setCustomColor] = useState('#6366f1');

  const handlePreset = (preset) => {
    const isDark = PREVIEW_THEMES[preset]?.dark;
    setTheme({ preset, mode: isDark ? 'dark' : 'light' });
    toast.success(`Tema "${PREVIEW_THEMES[preset]?.label}" aplicado!`);
  };

  const handleMode = (mode) => {
    setTheme({ mode });
    toast.success(mode === 'dark' ? 'Modo escuro ativado' : 'Modo claro ativado');
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Modo de Exibição</Label>
        <div className="flex gap-3">
          {[
            { key: 'light', label: 'Claro', icon: Sun },
            { key: 'dark', label: 'Escuro', icon: Moon },
            { key: 'system', label: 'Sistema', icon: Monitor },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleMode(key)}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                themeConfig.mode === key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <Icon className={cn("w-5 h-5", themeConfig.mode === key ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-xs font-medium", themeConfig.mode === key ? "text-primary" : "text-muted-foreground")}>
                {label}
              </span>
              {themeConfig.mode === key && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Themes */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Temas Predefinidos</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(PREVIEW_THEMES).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => handlePreset(key)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                themeConfig.preset === key
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/40"
              )}
            >
              {themeConfig.preset === key && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm"
                style={{ backgroundColor: theme.light + '20', border: `2px solid ${theme.light}` }}
              >
                {theme.emoji}
              </div>
              <div
                className="w-full h-2 rounded-full"
                style={{ backgroundColor: theme.light }}
              />
              <span className="text-xs font-medium">{theme.label}</span>
              {theme.dark && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Dark</Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Primary Color */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Cor Primária Personalizada
        </Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-12 h-10 rounded-lg border border-border cursor-pointer"
          />
          <div className="flex-1">
            <p className="text-sm font-mono text-muted-foreground">{customColor}</p>
            <p className="text-xs text-muted-foreground">Escolha qualquer cor para o tema</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Convert hex to RGB
              const r = parseInt(customColor.slice(1, 3), 16);
              const g = parseInt(customColor.slice(3, 5), 16);
              const b = parseInt(customColor.slice(5, 7), 16);
              setTheme({
                preset: 'custom',
                custom: { primary: `${r} ${g} ${b}` }
              });
              toast.success('Cor personalizada aplicada!');
            }}
          >
            Aplicar
          </Button>
        </div>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 As preferências de tema são salvas por usuário e aplicadas automaticamente ao fazer login.
        </p>
      </div>
    </div>
  );
}