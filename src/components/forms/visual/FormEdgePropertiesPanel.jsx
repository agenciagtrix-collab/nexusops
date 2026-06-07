import React from 'react';
import { GitBranch, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const OPTION_SOURCE_TYPES = ['single_choice', 'multiple_choice', 'dropdown'];

export default function FormEdgePropertiesPanel({ edge, sourceBlock, targetBlock, onUpdate, onDelete, onClose }) {
  if (!edge) {
    return null;
  }

  const condition = edge.condition || { type: 'always' };
  const options = OPTION_SOURCE_TYPES.includes(sourceBlock?.kind) ? (sourceBlock.options || []) : [];

  const updateCondition = (patch) => {
    const nextCondition = { ...condition, ...patch };
    const label = nextCondition.type === 'always'
      ? ''
      : nextCondition.label || options.find(option => option.value === nextCondition.value)?.label || nextCondition.value || '';

    onUpdate({
      ...edge,
      label,
      condition: nextCondition.type === 'always' ? { type: 'always' } : nextCondition,
    });
  };

  return (
    <aside className="flex h-full w-96 shrink-0 flex-col border-l border-white/10 bg-slate-950/95 text-slate-100">
      <div className="flex items-start justify-between border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Conexao</p>
            <p className="text-xs text-slate-400">
              {sourceBlock?.label || 'Origem'} {'->'} {targetBlock?.label || 'Destino'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <div className="space-y-2">
          <Label className="text-xs text-slate-300">Quando seguir esta conexao</Label>
          <select
            value={condition.type || 'always'}
            onChange={(event) => updateCondition({ type: event.target.value, value: '', label: '' })}
            className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
          >
            <option value="always">Sempre</option>
            <option value="answer_equals">Resposta igual a</option>
            <option value="answer_contains">Resposta contem</option>
          </select>
        </div>

        {condition.type !== 'always' && (
          <>
            {options.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Valor da resposta</Label>
                <select
                  value={condition.value || ''}
                  onChange={(event) => {
                    const option = options.find(item => (item.value || item.label) === event.target.value);
                    updateCondition({
                      value: event.target.value,
                      label: option?.label || event.target.value,
                    });
                  }}
                  className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
                >
                  <option value="">Selecione...</option>
                  {options.map(option => (
                    <option key={option.id} value={option.value || option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs text-slate-300">Valor da resposta</Label>
                <Input
                  value={condition.value || ''}
                  onChange={(event) => updateCondition({ value: event.target.value, label: event.target.value })}
                  placeholder="Ex.: Sim, Marketing, 10"
                  className="border-white/10 !bg-slate-900 !text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-slate-300">Rotulo exibido na linha</Label>
              <Input
                value={condition.label || edge.label || ''}
                onChange={(event) => updateCondition({ label: event.target.value })}
                placeholder="Ex.: Marketing"
                className="border-white/10 !bg-slate-900 !text-white"
              />
            </div>
          </>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-slate-400">
          Conexoes condicionais sao avaliadas antes da conexao marcada como Sempre. Use uma conexao Sempre como caminho padrao.
        </div>
      </div>

      <div className="border-t border-white/10 p-5">
        <Button type="button" variant="outline" onClick={onDelete} className="w-full border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200">
          <Trash2 className="h-4 w-4" /> Excluir conexao
        </Button>
      </div>
    </aside>
  );
}
