import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings2, Eye, EyeOff, GripVertical, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DEFAULT_WIDGETS = [
  { id: 'stats', label: 'Cards de Estatísticas', enabled: true },
  { id: 'deliveries', label: 'Entregas da Semana/Mês', enabled: true },
  { id: 'projects_overview', label: 'Visão Geral de Projetos', enabled: true },
  { id: 'workload', label: 'Carga de Trabalho da Equipe', enabled: true },
  { id: 'trend', label: 'Tendência de Conclusão', enabled: true },
  { id: 'upcoming', label: 'Próximas Entregas', enabled: true },
  { id: 'activity', label: 'Atividade Recente', enabled: true },
];

const STORAGE_KEY = 'dashboard_widgets_v1';

export function loadWidgets() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to add new widgets
      return DEFAULT_WIDGETS.map(def => {
        const found = parsed.find(w => w.id === def.id);
        return found ? { ...def, ...found } : def;
      });
    }
  } catch {}
  return DEFAULT_WIDGETS;
}

export function saveWidgets(widgets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

export default function DashboardCustomizer({ widgets, onChange, onClose }) {
  const [local, setLocal] = useState(widgets);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const toggle = (id) => {
    setLocal(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const handleDragStart = (id) => setDragging(id);
  const handleDragOver = (e, id) => { e.preventDefault(); setDragOver(id); };
  const handleDrop = (targetId) => {
    if (!dragging || dragging === targetId) { setDragging(null); setDragOver(null); return; }
    const from = local.findIndex(w => w.id === dragging);
    const to = local.findIndex(w => w.id === targetId);
    const updated = [...local];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setLocal(updated);
    setDragging(null);
    setDragOver(null);
  };

  const handleSave = () => {
    onChange(local);
    saveWidgets(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Personalizar Dashboard</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">Arraste para reordenar. Clique no olho para mostrar/ocultar.</p>
          <div className="space-y-1.5">
            {local.map(widget => (
              <div
                key={widget.id}
                draggable
                onDragStart={() => handleDragStart(widget.id)}
                onDragOver={e => handleDragOver(e, widget.id)}
                onDrop={() => handleDrop(widget.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing",
                  dragOver === widget.id ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40",
                  !widget.enabled && "opacity-50"
                )}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm">{widget.label}</span>
                <button
                  onClick={() => toggle(widget.id)}
                  className={cn(
                    "p-1 rounded transition-colors shrink-0",
                    widget.enabled ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5">
            <Check className="w-4 h-4" /> Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}