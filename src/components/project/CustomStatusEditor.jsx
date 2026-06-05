import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#64748b',
];

const DEFAULT_STATUSES = [
  { name: 'A Fazer', color: '#64748b' },
  { name: 'Em Andamento', color: '#3b82f6' },
  { name: 'Revisão', color: '#f97316' },
  { name: 'Concluído', color: '#22c55e' },
];

export default function CustomStatusEditor({ value = [], onChange }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const statuses = value.length > 0 ? value : [];

  const addStatus = () => {
    if (!newName.trim()) return;
    const updated = [...statuses, { name: newName.trim(), color: newColor, order: statuses.length }];
    onChange(updated);
    setNewName('');
  };

  const removeStatus = (index) => {
    onChange(statuses.filter((_, i) => i !== index));
  };

  const updateStatus = (index, field, val) => {
    const updated = statuses.map((s, i) => i === index ? { ...s, [field]: val } : s);
    onChange(updated);
  };

  const loadDefaults = () => {
    onChange(DEFAULT_STATUSES.map((s, i) => ({ ...s, order: i })));
  };

  return (
    <div className="space-y-3">
      {/* Existing statuses */}
      {statuses.length === 0 ? (
        <div className="text-center py-4 border-2 border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground mb-2">Nenhum status personalizado</p>
          <Button type="button" variant="outline" size="sm" onClick={loadDefaults} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Usar padrão
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {statuses.map((s, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
              <div
                className="w-5 h-5 rounded-full shrink-0 cursor-pointer border-2 border-white shadow-sm"
                style={{ backgroundColor: s.color }}
              />
              <Input
                value={s.name}
                onChange={e => updateStatus(i, 'name', e.target.value)}
                className="h-7 text-xs flex-1"
              />
              <div className="flex gap-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateStatus(i, 'color', c)}
                    className={cn(
                      "w-4 h-4 rounded-full transition-transform hover:scale-125",
                      s.color === c && "ring-2 ring-offset-1 ring-primary scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => removeStatus(i)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-dashed border-border">
        <Input
          placeholder="Nome do status..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStatus())}
          className="h-8 text-sm flex-1"
        />
        <div className="flex gap-1">
          {PRESET_COLORS.slice(0, 6).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className={cn(
                "w-4 h-4 rounded-full transition-transform hover:scale-125",
                newColor === c && "ring-2 ring-offset-1 ring-primary scale-110"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <Button type="button" size="sm" onClick={addStatus} className="h-8 gap-1 px-2.5">
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </Button>
      </div>
    </div>
  );
}