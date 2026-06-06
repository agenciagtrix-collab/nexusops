import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    key: 'prompt_base',
    label: 'Quem é o Agente',
    description: 'Defina a identidade, expertise e papel do agente. Ex: "Você é um especialista em gestão de projetos com 20 anos de experiência..."',
    placeholder: 'Você é [nome], especialista em [área]. Sua função é...',
    rows: 5,
    icon: '🧠',
  },
  {
    key: 'objective',
    label: 'Objetivo Principal',
    description: 'O que este agente deve alcançar? Qual é sua missão central?',
    placeholder: 'Meu objetivo é ajudar equipes a...',
    rows: 3,
    icon: '🎯',
  },
  {
    key: 'prompt_behavior',
    label: 'Como Deve Responder',
    description: 'Defina o estilo, formato e abordagem das respostas. Ex: estruturar em tópicos, usar exemplos, dar recomendações práticas...',
    placeholder: 'Sempre estruture suas respostas com... Use exemplos quando possível... Dê recomendações acionáveis...',
    rows: 5,
    icon: '💬',
  },
  {
    key: 'prompt_limitations',
    label: 'Tópicos Proibidos',
    description: 'O que o agente NÃO deve responder ou abordar.',
    placeholder: 'Não responda sobre... Evite... Não forneça...',
    rows: 3,
    icon: '🚫',
  },
  {
    key: 'prompt_rules',
    label: 'Regras Obrigatórias',
    description: 'Regras que o agente SEMPRE deve seguir, sem exceção.',
    placeholder: 'Sempre cite fontes quando... Nunca tome decisões sem antes... Sempre avise quando...',
    rows: 4,
    icon: '📋',
  },
];

function Section({ section, value, onChange }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/50 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-lg">{section.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{section.label}</p>
          <p className="text-xs text-muted-foreground hidden sm:block">{section.description}</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-card">
          <p className="text-xs text-muted-foreground mb-2 sm:hidden">{section.description}</p>
          <Textarea
            rows={section.rows}
            placeholder={section.placeholder}
            value={value || ''}
            onChange={e => onChange(section.key, e.target.value)}
            className="resize-none text-sm font-mono"
          />
        </div>
      )}
    </div>
  );
}

export default function PromptEditor({ values, onChange }) {
  const [showPreview, setShowPreview] = useState(false);

  const buildPreview = () => {
    let p = '';
    if (values.prompt_base) p += `${values.prompt_base}\n\n`;
    if (values.objective) p += `OBJETIVO: ${values.objective}\n\n`;
    if (values.prompt_behavior) p += `COMO RESPONDER:\n${values.prompt_behavior}\n\n`;
    if (values.prompt_limitations) p += `NÃO ABORDAR:\n${values.prompt_limitations}\n\n`;
    if (values.prompt_rules) p += `REGRAS:\n${values.prompt_rules}\n`;
    return p || '(Preencha as seções acima para ver o preview do prompt)';
  };

  return (
    <div className="space-y-3">
      {SECTIONS.map(section => (
        <Section
          key={section.key}
          section={section}
          value={values[section.key]}
          onChange={onChange}
        />
      ))}

      {/* Preview */}
      <div className="border border-dashed border-primary/30 rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left"
          onClick={() => setShowPreview(o => !o)}
        >
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Preview do Prompt Completo</span>
          {showPreview ? <ChevronDown className="w-4 h-4 text-primary ml-auto" /> : <ChevronRight className="w-4 h-4 text-primary ml-auto" />}
        </button>
        {showPreview && (
          <div className="px-4 pb-4">
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {buildPreview()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}