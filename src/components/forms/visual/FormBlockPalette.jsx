import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FORM_BLOCK_GROUPS = [
  {
    id: 'input',
    label: 'Entrada',
    blocks: [
      { kind: 'start', typeLabel: 'Início', label: 'Início', icon: '🏠', category: 'start', description: 'Ponto de entrada do formulário' },
      { kind: 'short_text', typeLabel: 'Campo de Texto', label: 'Texto curto', icon: 'T', category: 'input', description: 'Resposta curta em texto' },
      { kind: 'long_text', typeLabel: 'Texto Longo', label: 'Texto longo', icon: '¶', category: 'input', description: 'Resposta descritiva' },
      { kind: 'email', typeLabel: 'E-mail', label: 'E-mail', icon: '✉️', category: 'input', description: 'Campo validado como e-mail' },
      { kind: 'phone', typeLabel: 'Telefone', label: 'Telefone', icon: '📱', category: 'input', description: 'Número de telefone' },
      { kind: 'number', typeLabel: 'Número', label: 'Número', icon: '#', category: 'input', description: 'Valor numérico' },
      { kind: 'single_choice', typeLabel: 'Escolha Única', label: 'Múltipla escolha', icon: '◉', category: 'input', description: 'Uma opção entre várias' },
      { kind: 'multiple_choice', typeLabel: 'Múltipla Seleção', label: 'Caixas de seleção', icon: '☑️', category: 'input', description: 'Permite múltiplas opções' },
      { kind: 'dropdown', typeLabel: 'Dropdown', label: 'Lista suspensa', icon: '▾', category: 'input', description: 'Seleção em lista' },
      { kind: 'date', typeLabel: 'Data', label: 'Data', icon: '📅', category: 'input', description: 'Campo de data' },
      { kind: 'file', typeLabel: 'Upload', label: 'Upload de arquivo', icon: '📎', category: 'input', description: 'Anexar arquivos' },
      { kind: 'rating', typeLabel: 'Avaliação', label: 'Estrelas', icon: '★', category: 'input', description: 'Avaliação por estrelas' },
      { kind: 'nps', typeLabel: 'NPS', label: 'NPS', icon: '⑩', category: 'input', description: 'Escala 0 a 10' },
    ],
  },
  {
    id: 'logic',
    label: 'Lógica',
    blocks: [
      { kind: 'condition', typeLabel: 'Condição', label: 'Condição (Se)', icon: '↳', category: 'logic', description: 'Ramifica por resposta' },
      { kind: 'split', typeLabel: 'Divisão de Fluxo', label: 'Divisão de fluxo', icon: '🔀', category: 'logic', description: 'Cria múltiplos caminhos' },
      { kind: 'wait', typeLabel: 'Aguardar', label: 'Aguardar', icon: '⏱️', category: 'logic', description: 'Pausa lógica' },
      { kind: 'end', typeLabel: 'Encerrar', label: 'Encerrar formulário', icon: '⏹️', category: 'result', description: 'Fim do formulário' },
    ],
  },
  {
    id: 'action',
    label: 'Ações',
    blocks: [
      { kind: 'create_project', typeLabel: 'Criar Projeto', label: 'Criar projeto', icon: '📁', category: 'action', description: 'Cria projeto com respostas' },
      { kind: 'create_client', typeLabel: 'Criar Cliente', label: 'Criar cliente', icon: '👤', category: 'action', description: 'Cria ou atualiza cliente' },
      { kind: 'create_task', typeLabel: 'Criar Tarefa', label: 'Criar tarefa', icon: '✅', category: 'action', description: 'Cria tarefa automaticamente' },
      { kind: 'send_email', typeLabel: 'Enviar E-mail', label: 'Enviar e-mail', icon: '📨', category: 'action', description: 'Dispara e-mail automático' },
      { kind: 'webhook', typeLabel: 'Webhook', label: 'Enviar webhook', icon: '🔗', category: 'action', description: 'Envia dados para URL' },
    ],
  },
  {
    id: 'ai',
    label: 'IA',
    blocks: [
      { kind: 'ai_question', typeLabel: 'Perguntar ao Agente', label: 'Perguntar ao agente', icon: '🤖', category: 'ai', description: 'Resposta assistida por IA' },
      { kind: 'ai_analyze', typeLabel: 'Analisar Resposta', label: 'Analisar resposta', icon: '✨', category: 'ai', description: 'Classifica ou resume respostas' },
      { kind: 'ai_score', typeLabel: 'Pontuar Lead', label: 'Pontuar com IA', icon: '🎯', category: 'ai', description: 'Gera score inteligente' },
    ],
  },
];

export default function FormBlockPalette({ collapsed, onToggleCollapsed }) {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    if (!query.trim()) return FORM_BLOCK_GROUPS;
    const needle = query.trim().toLowerCase();
    return FORM_BLOCK_GROUPS.map(group => ({
      ...group,
      blocks: group.blocks.filter(block =>
        block.label.toLowerCase().includes(needle) ||
        block.typeLabel.toLowerCase().includes(needle) ||
        block.description.toLowerCase().includes(needle)
      ),
    })).filter(group => group.blocks.length > 0);
  }, [query]);

  if (collapsed) {
    return (
      <aside className="flex h-full w-14 flex-col items-center border-r border-white/10 bg-slate-950/90 py-4 text-white">
        <button onClick={onToggleCollapsed} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white" title="Abrir blocos">
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-white/10 bg-slate-950/95 text-slate-100">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <div>
          <p className="text-sm font-semibold">Adicionar Bloco</p>
          <p className="text-xs text-slate-400">Arraste para o canvas</p>
        </div>
        <button onClick={onToggleCollapsed} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Recolher">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar blocos..."
            className="border-white/10 !bg-slate-900 pl-9 text-sm !text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        {groups.map(group => (
          <section key={group.id}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.label}</h3>
            <div className="space-y-2">
              {group.blocks.map(block => (
                <div
                  key={block.kind}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'copy';
                    event.dataTransfer.setData('application/x-form-block', JSON.stringify(block));
                  }}
                  className={cn(
                    'group cursor-grab rounded-lg border border-white/5 bg-white/[0.07] px-3 py-2.5 transition active:cursor-grabbing',
                    'hover:border-violet-400/50 hover:bg-white/[0.11]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-sm font-semibold">{block.icon}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{block.typeLabel}</p>
                      <p className="truncate text-xs text-slate-400">{block.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
