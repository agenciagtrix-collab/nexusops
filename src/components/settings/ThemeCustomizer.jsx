import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Label } from '@/components/ui/label';
import { Check, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MODES = [
  { key: 'light', label: 'Claro', icon: Sun },
  { key: 'dark', label: 'Escuro', icon: Moon },
  { key: 'system', label: 'Sistema', icon: Monitor },
];

export default function ThemeCustomizer() {
  const { themeConfig, setTheme } = useTheme();

  const handleMode = (mode) => {
    // system = follow OS
    const resolvedMode = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    setTheme({ mode: resolvedMode, preset: resolvedMode === 'dark' ? 'dark' : 'default' });
    toast.success(mode === 'dark' ? 'Modo escuro ativado' : mode === 'light' ? 'Modo claro ativado' : 'Modo sistema ativado');
  };

  const currentMode = themeConfig.mode === 'dark' ? 'dark' : 'light';

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold mb-3 block">Modo de Exibição</Label>
        <div className="flex gap-3">
          {MODES.map(({ key, label, icon: Icon }) => {
            const isActive = key === 'system'
              ? false
              : currentMode === key;
            return (
              <button
                key={key}
                onClick={() => handleMode(key)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-xs font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                  {label}
                </span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">Cor Primária: #6366f1</p>
            <p className="text-xs text-muted-foreground">Indigo — Paleta oficial da plataforma</p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 As preferências de tema são salvas localmente e aplicadas automaticamente ao entrar.
        </p>
      </div>
    </div>
  );
}