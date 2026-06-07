import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export const BLOCK_CATALOG = {
  entrada: {
    label: 'Entrada',
    color: '#6366f1',
    items: [
      { id: 'start', label: 'Início', emoji: '▶', desc: 'Ponto de entrada do fluxo' },
      { id: 'question', label: 'Pergunta', emoji: '?', desc: 'Pergunta aberta' },
      { id: 'text', label: 'Texto', emoji: 'T', desc: 'Bloco de texto informativo' },
      { id: 'text_input', label: 'Campo de Texto', emoji: '✎', desc: 'Entrada de texto livre' },
      { id: 'multiple_choice', label: 'Múltipla Escolha', emoji: '⊡', desc: 'Selecionar várias opções' },
      { id: 'single_choice', label: 'Única Escolha', emoji: '◉', desc: 'Selecionar uma opção' },
      { id: 'file_upload', label: 'Upload de Arquivo', emoji: '↑', desc: 'Envio de arquivo' },
    ],
  },
  logica: {
    label: 'Lógica',
    color: '#8b5cf6',
    items: [
      { id: 'condition', label: 'Condição (Se)', emoji: '⚡', desc: 'Desvio condicional' },
      { id: 'split', label: 'Divisão de Fluxo', emoji: '⇌', desc: 'Dividir em ramificações' },
      { id: 'wait', label: 'Aguardar', emoji: '⏳', desc: 'Pausa no fluxo' },
      { id: 'end', label: 'Encerrar Fluxo', emoji: '■', desc: 'Fim do fluxo' },
    ],
  },
  acoes: {
    label: 'Ações',
    color: '#f59e0b',
    items: [
      { id: 'create_project', label: 'Criar Projeto', emoji: '◧', desc: 'Novo projeto no NexusOps' },
      { id: 'create_client', label: 'Criar Cliente', emoji: '◎', desc: 'Novo cliente no sistema' },
      { id: 'create_task', label: 'Criar Tarefa', emoji: '✓', desc: 'Nova tarefa vinculada' },
      { id: 'send_email', label: 'Enviar E-mail', emoji: '✉', desc: 'Disparo de e-mail' },
      { id: 'send_whatsapp', label: 'Enviar WhatsApp', emoji: '◫', desc: 'Mensagem WhatsApp' },
      { id: 'notification', label: 'Notificação', emoji: '🔔', desc: 'Notificação interna' },
    ],
  },
  ia: {
    label: 'IA',
    color: '#10b981',
    items: [
      { id: 'ai_ask', label: 'Perguntar ao Agente', emoji: '✦', desc: 'Consultar agente IA' },
      { id: 'ai_analyze', label: 'Analisar Resposta', emoji: '◈', desc: 'Análise com IA' },
    ],
  },
};

export default function FlowBlockPalette() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({ entrada: true });

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  const filtered = (items) => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(b => b.label.toLowerCase().includes(q) || b.desc.toLowerCase().includes(q));
  };

  return (
    <aside className="w-60 flex flex-col bg-[#13151f] border-r border-white/8 shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/8">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Blocos</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            placeholder="Buscar bloco..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {Object.entries(BLOCK_CATALOG).map(([key, group]) => {
          const items = filtered(group.items);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <button
                onClick={() => toggle(key)}
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">{group.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-white/30 transition-transform ${expanded[key] ? '' : '-rotate-90'}`}
                />
              </button>

              {expanded[key] && (
                <div className="space-y-0.5 mb-1">
                  {items.map(block => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('blockType', block.id);
                        e.dataTransfer.setData('blockLabel', block.label);
                        e.dataTransfer.setData('blockCategory', key);
                      }}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/8 cursor-grab active:cursor-grabbing transition-colors group"
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: `${group.color}22`, color: group.color }}
                      >
                        {block.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white/80 group-hover:text-white truncate">{block.label}</div>
                        <div className="text-[10px] text-white/30 truncate">{block.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}