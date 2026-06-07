import React from 'react';
import { Handle, Position } from 'reactflow';
import { cn } from '@/lib/utils';

const toneStyles = {
  start: 'border-emerald-500/80 bg-emerald-950/30 text-emerald-100 shadow-emerald-950/30',
  input: 'border-violet-500/80 bg-violet-950/35 text-violet-50 shadow-violet-950/30',
  logic: 'border-blue-500/80 bg-blue-950/35 text-blue-50 shadow-blue-950/30',
  action: 'border-amber-500/80 bg-amber-950/35 text-amber-50 shadow-amber-950/30',
  ai: 'border-fuchsia-500/80 bg-fuchsia-950/35 text-fuchsia-50 shadow-fuchsia-950/30',
  result: 'border-rose-500/80 bg-rose-950/35 text-rose-50 shadow-rose-950/30',
};

export default function FormVisualNode({ data, selected }) {
  const block = data.block || {};
  const tone = block.category || 'input';
  const subtitle = block.question || block.description || block.label || 'Configure este bloco';

  return (
    <div
      className={cn(
        'min-w-[210px] max-w-[260px] rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition-all',
        toneStyles[tone] || toneStyles.input,
        selected && 'ring-2 ring-violet-300 ring-offset-2 ring-offset-slate-950'
      )}
    >
      {tone !== 'start' && <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-slate-950 !bg-slate-100" />}

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg">
          {block.icon || '❓'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold uppercase tracking-wide opacity-80">
              {block.typeLabel || block.kind || 'Bloco'}
            </p>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug">
            {subtitle}
          </p>
        </div>
      </div>

      {block.variableName && (
        <div className="mt-3 rounded-md bg-black/20 px-2 py-1 text-[11px] opacity-80">
          variável: {block.variableName}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-slate-950 !bg-slate-100" />
    </div>
  );
}
