import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ChevronDown } from 'lucide-react';

const BLOCKS = {
  entrada: {
    label: 'Entrada',
    emoji: '📝',
    items: [
      { id: 'start', label: 'Início', emoji: '▶️', desc: 'Ponto de entrada' },
      { id: 'text', label: 'Texto', emoji: '📝', desc: 'Campo de texto' },
      { id: 'question', label: 'Pergunta', emoji: '❓', desc: 'Pergunta aberta' },
      { id: 'email', label: 'E-mail', emoji: '✉️', desc: 'Campo de email' },
      { id: 'phone', label: 'Telefone', emoji: '📱', desc: 'Campo de telefone' },
      { id: 'number', label: 'Número', emoji: '🔢', desc: 'Campo numérico' },
      { id: 'date', label: 'Data', emoji: '📅', desc: 'Seletor de data' },
      { id: 'file', label: 'Arquivo', emoji: '📎', desc: 'Upload de arquivo' },
      { id: 'image', label: 'Imagem', emoji: '🖼️', desc: 'Upload de imagem' },
      { id: 'signature', label: 'Assinatura', emoji: '✍️', desc: 'Campo de assinatura' },
      { id: 'single_choice', label: 'Única Escolha', emoji: '⭕', desc: 'Uma opção' },
      { id: 'multiple_choice', label: 'Múltipla Escolha', emoji: '☑️', desc: 'Várias opções' },
      { id: 'dropdown', label: 'Dropdown', emoji: '▼', desc: 'Menu suspenso' },
      { id: 'nps', label: 'NPS', emoji: '📊', desc: 'Escala 0-10' },
      { id: 'rating', label: 'Avaliação', emoji: '⭐', desc: 'Estrelas' },
    ],
  },
  logica: {
    label: 'Lógica',
    emoji: '🔀',
    items: [
      { id: 'condition', label: 'Condição', emoji: '❓', desc: 'Se/Então' },
      { id: 'split', label: 'Divisão', emoji: '🔀', desc: 'Dividir fluxo' },
      { id: 'filter', label: 'Filtro', emoji: '🎯', desc: 'Filtrar dados' },
      { id: 'validation', label: 'Validação', emoji: '✔️', desc: 'Validar entrada' },
      { id: 'wait', label: 'Aguardar', emoji: '⏳', desc: 'Pausa temporária' },
      { id: 'loop', label: 'Loop', emoji: '🔄', desc: 'Repetição' },
      { id: 'end', label: 'Encerrar', emoji: '⏹️', desc: 'Fim do fluxo' },
    ],
  },
  ia: {
    label: 'IA & Agentes',
    emoji: '🤖',
    items: [
      { id: 'ai_ask', label: 'Perguntar IA', emoji: '💬', desc: 'Consultar agente' },
      { id: 'ai_analyze', label: 'Analisar', emoji: '🔬', desc: 'Analisar resposta' },
      { id: 'ai_classify', label: 'Classificar', emoji: '🏷️', desc: 'Classificar lead' },
      { id: 'ai_diagnose', label: 'Diagnóstico', emoji: '🔍', desc: 'Gerar diagnóstico' },
      { id: 'ai_summarize', label: 'Resumir', emoji: '📄', desc: 'Gerar resumo' },
      { id: 'ai_report', label: 'Relatório', emoji: '📊', desc: 'Gerar relatório' },
      { id: 'ai_decide', label: 'Decidir', emoji: '⚖️', desc: 'Tomar decisão' },
      { id: 'ai_suggest', label: 'Sugerir', emoji: '💡', desc: 'Próximos passos' },
    ],
  },
  plataforma: {
    label: 'Plataforma',
    emoji: '⚙️',
    items: [
      { id: 'create_client', label: 'Criar Cliente', emoji: '👤', desc: 'Nova conta' },
      { id: 'create_project', label: 'Criar Projeto', emoji: '📋', desc: 'Novo projeto' },
      { id: 'create_task', label: 'Criar Tarefa', emoji: '✅', desc: 'Nova tarefa' },
      { id: 'create_process', label: 'Criar Processo', emoji: '🔄', desc: 'Novo processo' },
      { id: 'create_contract', label: 'Criar Contrato', emoji: '📝', desc: 'Novo contrato' },
      { id: 'create_document', label: 'Criar Doc', emoji: '📄', desc: 'Novo documento' },
      { id: 'create_portal', label: 'Portal Cliente', emoji: '🌐', desc: 'Portal de acesso' },
      { id: 'update_status', label: 'Atualizar Status', emoji: '🔄', desc: 'Mudar status' },
      { id: 'add_comment', label: 'Comentário', emoji: '💬', desc: 'Adicionar nota' },
      { id: 'add_tag', label: 'Etiqueta', emoji: '🏷️', desc: 'Adicionar tag' },
      { id: 'trigger_automation', label: 'Automação', emoji: '⚡', desc: 'Acionar automação' },
    ],
  },
  comunicacao: {
    label: 'Comunicação',
    emoji: '💌',
    items: [
      { id: 'send_email', label: 'Enviar E-mail', emoji: '✉️', desc: 'Email automático' },
      { id: 'send_whatsapp', label: 'WhatsApp', emoji: '💬', desc: 'Mensagem WhatsApp' },
      { id: 'send_sms', label: 'SMS', emoji: '📱', desc: 'Enviar SMS' },
      { id: 'send_notification', label: 'Notificação', emoji: '🔔', desc: 'Notificação push' },
      { id: 'show_message', label: 'Mensagem', emoji: '💭', desc: 'Mostrar mensagem' },
      { id: 'show_result', label: 'Resultado', emoji: '🎉', desc: 'Tela de resultado' },
    ],
  },
};

export default function BlockPaletteV2({ onBlockAdd }) {
  const [search, setSearch] = useState('');
  const [expandedTab, setExpandedTab] = useState('entrada');

  const filterBlocks = (items) => {
    if (!search) return items;
    return items.filter(b =>
      b.label.toLowerCase().includes(search.toLowerCase()) ||
      b.desc.toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-card to-card/50 border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-bold text-lg mb-3">Blocos</h3>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm h-9"
          />
        </div>
      </div>

      {/* Blocks */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-3">
          {Object.entries(BLOCKS).map(([key, group]) => (
            <div key={key}>
              <button
                onClick={() => setExpandedTab(expandedTab === key ? null : key)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors font-medium text-sm"
              >
                <span>
                  {group.emoji} {group.label}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expandedTab === key ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedTab === key && (
                <div className="space-y-2 pl-2">
                  {filterBlocks(group.items).map(block => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('blockType', block.id);
                        e.dataTransfer.setData('blockLabel', block.label);
                        e.dataTransfer.setData('blockEmoji', block.emoji);
                      }}
                      className="p-3 rounded-lg bg-muted/30 hover:bg-muted/60 cursor-move border border-border/50 hover:border-border transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{block.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">{block.label}</div>
                          <div className="text-xs text-muted-foreground">{block.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}