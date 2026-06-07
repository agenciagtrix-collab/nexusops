import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, X } from 'lucide-react';

const RESPONSE_TYPES = [
  { value: 'short_text', label: 'Texto Curto' },
  { value: 'long_text', label: 'Texto Longo' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'file', label: 'Arquivo' },
  { value: 'single_choice', label: 'Múltipla Escolha' },
  { value: 'multiple_choice', label: 'Múltipla Seleção' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'rating', label: 'Avaliação' },
  { value: 'nps', label: 'NPS' },
];

const needsOptions = (kind) => ['single_choice', 'multiple_choice', 'dropdown'].includes(kind);
const isInputBlock = (block) => block?.category === 'input';

function fieldId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

export default function FormPropertiesPanel({ block, onUpdate, onDelete, onClose }) {
  if (!block) {
    return (
      <aside className="flex h-full w-96 shrink-0 items-center justify-center border-l border-white/10 bg-slate-950/95 p-8 text-center text-slate-400">
        <div>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl">✦</div>
          <p className="font-medium text-slate-200">Selecione um bloco</p>
          <p className="mt-1 text-sm">Edite perguntas, lógica, ações e IA no painel lateral.</p>
        </div>
      </aside>
    );
  }

  const updateData = (patch) => onUpdate({ ...block, ...patch });
  const updateValidation = (patch) => updateData({ validation: { ...(block.validation || {}), ...patch } });

  const addOption = () => {
    const optionId = fieldId('opt');
    updateData({
      options: [...(block.options || []), { id: optionId, label: `Opção ${(block.options || []).length + 1}`, value: optionId }],
    });
  };

  const updateOption = (index, patch) => {
    updateData({
      options: (block.options || []).map((option, optionIndex) => optionIndex === index ? { ...option, ...patch } : option),
    });
  };

  const removeOption = (index) => {
    updateData({ options: (block.options || []).filter((_, optionIndex) => optionIndex !== index) });
  };

  return (
    <aside className="flex h-full w-96 shrink-0 flex-col border-l border-white/10 bg-slate-950/95 text-slate-100">
      <div className="flex items-start justify-between border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-xl">{block.icon || '❓'}</div>
          <div>
            <p className="text-sm font-semibold">{block.typeLabel || 'Bloco'}</p>
            <p className="text-xs text-slate-400">ID: {block.id}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <Tabs defaultValue="config" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-white/10 px-5 pt-4">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="config" className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div className="space-y-2">
            <Label className="text-xs text-slate-300">Nome do bloco</Label>
            <Input value={block.label || ''} onChange={(event) => updateData({ label: event.target.value })} className="border-white/10 !bg-slate-900 !text-white" />
          </div>

          {isInputBlock(block) && (
            <>
              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Texto da pergunta</Label>
                <textarea
                  value={block.question || block.label || ''}
                  onChange={(event) => updateData({ question: event.target.value, label: event.target.value })}
                  placeholder="Digite a pergunta..."
                  rows={3}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Descrição opcional</Label>
                <textarea
                  value={block.helpText || ''}
                  onChange={(event) => updateData({ helpText: event.target.value })}
                  placeholder="Explique melhor a pergunta..."
                  rows={3}
                  maxLength={200}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                />
                <div className="text-right text-[11px] text-slate-500">{(block.helpText || '').length}/200</div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Tipo de resposta</Label>
                <select
                  value={block.kind}
                  onChange={(event) => {
                    const responseType = RESPONSE_TYPES.find(type => type.value === event.target.value);
                    updateData({
                      kind: event.target.value,
                      typeLabel: responseType?.label || block.typeLabel,
                      options: needsOptions(event.target.value) ? (block.options?.length ? block.options : [
                        { id: fieldId('opt'), label: 'Opção 1', value: 'opcao_1' },
                        { id: fieldId('opt'), label: 'Opção 2', value: 'opcao_2' },
                      ]) : block.options,
                    });
                  }}
                  className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
                >
                  {RESPONSE_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>

              {needsOptions(block.kind) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-300">Opções</Label>
                    <Button type="button" size="sm" variant="secondary" onClick={addOption} className="h-8 border border-white/10 bg-white/10 text-xs text-white hover:bg-white/15">
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(block.options || []).map((option, index) => (
                      <div key={option.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
                        <Input
                          value={option.label}
                          onChange={(event) => updateOption(index, { label: event.target.value, value: option.value || event.target.value.toLowerCase().replace(/\s+/g, '_') })}
                          className="h-8 border-white/10 !bg-slate-950/60 text-sm !text-white"
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeOption(index)} className="h-8 w-8 text-slate-400 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-sm text-slate-200">Resposta obrigatória</Label>
                  <Switch checked={!!block.required} onCheckedChange={(checked) => updateData({ required: checked })} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-sm text-slate-200">Salvar como variável</Label>
                  <Switch checked={block.saveAsVariable !== false} onCheckedChange={(checked) => updateData({ saveAsVariable: checked })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Nome da variável</Label>
                  <Input value={block.variableName || ''} onChange={(event) => updateData({ variableName: event.target.value })} placeholder="objetivo_principal" className="border-white/10 !bg-slate-950/60 !text-white" />
                </div>
              </div>
            </>
          )}

          {!isInputBlock(block) && block.category !== 'start' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Descrição</Label>
                <textarea
                  value={block.description || ''}
                  onChange={(event) => updateData({ description: event.target.value })}
                  rows={4}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Este bloco visual já pode ser conectado no canvas. Na próxima fase, ele será persistido como regra/automação executável.
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {isInputBlock(block) ? (
            <>
              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Placeholder</Label>
                <Input value={block.placeholder || ''} onChange={(event) => updateData({ placeholder: event.target.value })} placeholder="Ex.: digite aqui..." className="border-white/10 !bg-slate-900 !text-white" />
              </div>

              {['short_text', 'long_text'].includes(block.kind) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-300">Mín. caracteres</Label>
                    <Input type="number" value={block.validation?.minLength || ''} onChange={(event) => updateValidation({ minLength: event.target.value ? Number(event.target.value) : null })} className="border-white/10 !bg-slate-900 !text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-300">Máx. caracteres</Label>
                    <Input type="number" value={block.validation?.maxLength || ''} onChange={(event) => updateValidation({ maxLength: event.target.value ? Number(event.target.value) : null })} className="border-white/10 !bg-slate-900 !text-white" />
                  </div>
                </div>
              )}

              {block.kind === 'number' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-300">Valor mínimo</Label>
                    <Input type="number" value={block.validation?.minValue || ''} onChange={(event) => updateValidation({ minValue: event.target.value ? Number(event.target.value) : null })} className="border-white/10 !bg-slate-900 !text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-300">Valor máximo</Label>
                    <Input type="number" value={block.validation?.maxValue || ''} onChange={(event) => updateValidation({ maxValue: event.target.value ? Number(event.target.value) : null })} className="border-white/10 !bg-slate-900 !text-white" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Expressão regular</Label>
                <Input value={block.validation?.pattern || ''} onChange={(event) => updateValidation({ pattern: event.target.value })} placeholder="Opcional" className="border-white/10 !bg-slate-900 !text-white" />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-slate-400">
                Dica: use conexões no canvas para representar ordem e ramificações. Na próxima etapa, cada conexão poderá virar regra condicional executável.
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Configurações avançadas específicas deste bloco serão liberadas com a execução de lógica visual e automações.
            </div>
          )}

          <Button type="button" variant="outline" onClick={onDelete} className="w-full border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200">
            <Trash2 className="h-4 w-4" /> Excluir bloco
          </Button>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
