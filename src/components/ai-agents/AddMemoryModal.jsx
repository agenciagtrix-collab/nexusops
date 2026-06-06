import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Brain } from 'lucide-react';
import { toast } from 'sonner';

const MEMORY_TYPES = [
  { value: 'decision', label: '🎯 Decisão tomada' },
  { value: 'discussion', label: '💬 Discussão importante' },
  { value: 'milestone', label: '🏁 Marco do projeto' },
  { value: 'risk', label: '⚠️ Risco identificado' },
  { value: 'context', label: '📋 Contexto geral' },
  { value: 'instruction', label: '📌 Instrução permanente' },
];

export default function AddMemoryModal({ projectId, agents = [], onClose, onSaved }) {
  const [form, setForm] = useState({
    memory_type: 'context',
    content: '',
    importance: 'medium',
    agent_id: agents[0]?.id || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.content.trim()) { toast.error('Preencha o conteúdo'); return; }
    setSaving(true);
    await base44.entities.AIAgentMemory.create({
      ...form,
      project_id: projectId,
    });
    toast.success('Memória registrada!');
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-600" />
            Adicionar Memória ao Projeto
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Tipo</Label>
              <Select value={form.memory_type} onValueChange={v => setForm(f => ({ ...f, memory_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEMORY_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Importância</Label>
              <Select value={form.importance} onValueChange={v => setForm(f => ({ ...f, importance: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🔵 Baixa</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {agents.length > 0 && (
            <div>
              <Label className="text-xs mb-1.5 block">Agente (opcional)</Label>
              <Select value={form.agent_id} onValueChange={v => setForm(f => ({ ...f, agent_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhum agente específico" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos os agentes</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.avatar_emoji} {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs mb-1.5 block">Conteúdo *</Label>
            <Textarea
              placeholder="Ex: Decidimos usar a tecnologia X por causa do requisito Y. Esta decisão impacta..."
              rows={4}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="resize-none text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              Salvar Memória
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}