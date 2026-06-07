import React, { useState } from 'react';
import { X, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BLOCK_CONFIG = {
  start: {
    sections: [
      { key: 'basic', label: 'Básico', fields: ['label', 'description'] },
    ],
  },
  question: {
    sections: [
      { key: 'basic', label: 'Conteúdo', fields: ['label', 'question'] },
      { key: 'config', label: 'Configuração', fields: ['required', 'placeholder', 'helpText'] },
    ],
  },
  text: {
    sections: [
      { key: 'basic', label: 'Conteúdo', fields: ['label', 'content'] },
    ],
  },
  text_input: {
    sections: [
      { key: 'basic', label: 'Conteúdo', fields: ['label', 'placeholder'] },
      { key: 'config', label: 'Configuração', fields: ['required', 'helpText'] },
    ],
  },
  multiple_choice: {
    sections: [
      { key: 'basic', label: 'Conteúdo', fields: ['label', 'question'] },
      { key: 'config', label: 'Opções', fields: ['options', 'required'] },
    ],
  },
  single_choice: {
    sections: [
      { key: 'basic', label: 'Conteúdo', fields: ['label', 'question'] },
      { key: 'config', label: 'Opções', fields: ['options', 'required'] },
    ],
  },
  file_upload: {
    sections: [
      { key: 'basic', label: 'Conteúdo', fields: ['label', 'description'] },
      { key: 'config', label: 'Configuração', fields: ['required', 'acceptedTypes', 'maxSize'] },
    ],
  },
  condition: {
    sections: [
      { key: 'basic', label: 'Condição', fields: ['label', 'field', 'operator', 'value'] },
      { key: 'config', label: 'Rótulos', fields: ['trueLabel', 'falseLabel'] },
    ],
  },
  split: {
    sections: [
      { key: 'basic', label: 'Básico', fields: ['label', 'description'] },
    ],
  },
  wait: {
    sections: [
      { key: 'basic', label: 'Básico', fields: ['label', 'waitDuration'] },
    ],
  },
  end: {
    sections: [
      { key: 'basic', label: 'Básico', fields: ['label', 'message'] },
    ],
  },
  create_project: {
    sections: [
      { key: 'basic', label: 'Básico', fields: ['label'] },
      { key: 'config', label: 'Mapeamento', fields: ['projectName', 'projectDescription'] },
    ],
  },
  create_client: {
    sections: [
      { key: 'basic', label: 'Básico', fields: ['label'] },
      { key: 'config', label: 'Mapeamento', fields: ['clientName', 'clientEmail'] },
    ],
  },
  create_task: {
    sections: [
      { key: 'basic', label: 'Básico', fields: ['label', 'taskTitle'] },
    ],
  },
  send_email: {
    sections: [
      { key: 'basic', label: 'E-mail', fields: ['label', 'to', 'subject', 'body'] },
    ],
  },
  send_whatsapp: {
    sections: [
      { key: 'basic', label: 'WhatsApp', fields: ['label', 'to', 'message'] },
    ],
  },
  notification: {
    sections: [
      { key: 'basic', label: 'Notificação', fields: ['label', 'message'] },
    ],
  },
  ai_ask: {
    sections: [
      { key: 'basic', label: 'Agente IA', fields: ['label', 'prompt'] },
    ],
  },
  ai_analyze: {
    sections: [
      { key: 'basic', label: 'Análise IA', fields: ['label', 'instructions'] },
    ],
  },
};

const FIELD_LABELS = {
  label: 'Nome do Bloco',
  question: 'Pergunta',
  content: 'Conteúdo',
  description: 'Descrição',
  placeholder: 'Placeholder',
  helpText: 'Texto de Ajuda',
  required: 'Obrigatório',
  options: 'Opções',
  acceptedTypes: 'Tipos Aceitos',
  maxSize: 'Tamanho Máximo (MB)',
  field: 'Campo',
  operator: 'Operador',
  value: 'Valor',
  trueLabel: 'Rótulo Verdadeiro',
  falseLabel: 'Rótulo Falso',
  waitDuration: 'Duração (segundos)',
  message: 'Mensagem',
  projectName: 'Nome do Projeto',
  projectDescription: 'Descrição do Projeto',
  clientName: 'Nome do Cliente',
  clientEmail: 'E-mail do Cliente',
  taskTitle: 'Título da Tarefa',
  to: 'Para (e-mail)',
  subject: 'Assunto',
  body: 'Corpo do E-mail',
  prompt: 'Prompt para o Agente',
  instructions: 'Instruções',
  instructions2: 'Instruções de Análise',
};

export default function FlowNodeInspector({ node, onUpdate, onClose, onDelete }) {
  const [expanded, setExpanded] = useState({ basic: true, config: true });

  const nodeType = node.type;
  const config = BLOCK_CONFIG[nodeType] || { sections: [{ key: 'basic', label: 'Básico', fields: ['label', 'description'] }] };
  const data = node.data || node;

  const update = (field, value) => {
    onUpdate({ ...node, data: { ...(node.data || {}), [field]: value } });
  };

  const renderField = (field) => {
    const val = data[field] ?? '';
    const label = FIELD_LABELS[field] || field;

    if (field === 'required') {
      return (
        <div key={field} className="flex items-center justify-between">
          <label className="text-xs text-white/60">{label}</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={val || false} onChange={e => update(field, e.target.checked)} className="sr-only peer" />
            <div className="w-8 h-4 bg-white/10 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        </div>
      );
    }

    if (field === 'operator') {
      return (
        <div key={field}>
          <label className="text-xs text-white/50 block mb-1.5">{label}</label>
          <select value={val} onChange={e => update(field, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary">
            <option value="equals">Igual a</option>
            <option value="not_equals">Diferente de</option>
            <option value="contains">Contém</option>
            <option value="gt">Maior que</option>
            <option value="lt">Menor que</option>
            <option value="gte">Maior ou igual</option>
            <option value="lte">Menor ou igual</option>
          </select>
        </div>
      );
    }

    if (field === 'options') {
      return (
        <div key={field}>
          <label className="text-xs text-white/50 block mb-1.5">{label} <span className="text-white/25">(uma por linha)</span></label>
          <textarea
            value={Array.isArray(val) ? val.join('\n') : (val || '')}
            onChange={e => update(field, e.target.value.split('\n'))}
            rows={4}
            placeholder="Opção A&#10;Opção B&#10;Opção C"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary resize-none"
          />
        </div>
      );
    }

    const isLong = ['question', 'content', 'description', 'body', 'message', 'prompt', 'instructions', 'helpText'].includes(field);

    if (isLong) {
      return (
        <div key={field}>
          <label className="text-xs text-white/50 block mb-1.5">{label}</label>
          <textarea
            value={val}
            onChange={e => update(field, e.target.value)}
            rows={3}
            placeholder={`Digite ${label.toLowerCase()}...`}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary resize-none"
          />
        </div>
      );
    }

    return (
      <div key={field}>
        <label className="text-xs text-white/50 block mb-1.5">{label}</label>
        <input
          value={val}
          onChange={e => update(field, e.target.value)}
          placeholder={`Digite ${label.toLowerCase()}...`}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary"
        />
      </div>
    );
  };

  const color = data.color || '#6366f1';

  return (
    <aside className="w-72 bg-[#13151f] border-l border-white/8 flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2.5 min-w-0">
          <div style={{ background: `${color}22`, color }} className="w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 font-bold">
            {data.emoji || data.type?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{data.label || node.label || node.type}</div>
            <div className="text-[10px] text-white/30">{nodeType}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" onClick={onDelete}
            className="w-7 h-7 text-white/30 hover:text-red-400 hover:bg-red-400/10">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose}
            className="w-7 h-7 text-white/30 hover:text-white hover:bg-white/10">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-2">
        {config.sections.map(section => (
          <div key={section.key} className="mb-1">
            <button
              onClick={() => setExpanded(p => ({ ...p, [section.key]: !p[section.key] }))}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors"
            >
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">{section.label}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-white/30 transition-transform', expanded[section.key] ? '' : '-rotate-90')} />
            </button>
            {expanded[section.key] && (
              <div className="px-4 pb-3 space-y-3">
                {section.fields.map(f => renderField(f))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}