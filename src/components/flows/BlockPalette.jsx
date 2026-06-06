import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';

const BLOCK_GROUPS = {
  input: {
    label: 'Entrada',
    icon: '📝',
    blocks: [
      { id: 'start', label: 'Início', description: 'Ponto de entrada do fluxo' },
      { id: 'text', label: 'Texto', description: 'Campo de texto curto' },
      { id: 'textarea', label: 'Texto Longo', description: 'Área de texto' },
      { id: 'email', label: 'E-mail', description: 'Campo de email' },
      { id: 'phone', label: 'Telefone', description: 'Campo de telefone' },
      { id: 'number', label: 'Número', description: 'Campo numérico' },
      { id: 'date', label: 'Data', description: 'Seletor de data' },
      { id: 'file', label: 'Arquivo', description: 'Upload de arquivo' },
      { id: 'image', label: 'Imagem', description: 'Upload de imagem' },
      { id: 'video', label: 'Vídeo', description: 'Upload de vídeo' },
      { id: 'signature', label: 'Assinatura', description: 'Campo de assinatura' },
      { id: 'single_choice', label: 'Seleção Única', description: 'Múltiplas opções' },
      { id: 'multiple_choice', label: 'Múltipla Escolha', description: 'Várias seleções' },
      { id: 'dropdown', label: 'Dropdown', description: 'Lista suspensa' },
      { id: 'nps', label: 'NPS', description: 'Escala 0-10' },
      { id: 'rating', label: 'Avaliação', description: 'Estrelas' },
    ],
  },
  logic: {
    label: 'Lógica',
    icon: '🔀',
    blocks: [
      { id: 'condition', label: 'Condição', description: 'Se/Então/Senão' },
      { id: 'split', label: 'Divisão', description: 'Dividir fluxo' },
      { id: 'filter', label: 'Filtro', description: 'Filtrar respostas' },
      { id: 'validation', label: 'Validação', description: 'Validar entrada' },
      { id: 'wait', label: 'Aguardar', description: 'Pausa no fluxo' },
      { id: 'loop', label: 'Loop', description: 'Repetir bloco' },
      { id: 'end', label: 'Encerrar', description: 'Fim do fluxo' },
    ],
  },
  ai: {
    label: 'IA',
    icon: '🤖',
    blocks: [
      { id: 'ai_ask', label: 'Perguntar Agente', description: 'Consultar IA' },
      { id: 'ai_classify', label: 'Classificar', description: 'Classificar dados' },
      { id: 'ai_summarize', label: 'Resumir', description: 'Gerar resumo' },
      { id: 'ai_diagnose', label: 'Diagnóstico', description: 'Análise automática' },
      { id: 'ai_report', label: 'Relatório', description: 'Gerar relatório' },
      { id: 'ai_decide', label: 'Decidir', description: 'Tomar decisão IA' },
      { id: 'ai_suggest', label: 'Sugerir', description: 'Próximos passos' },
    ],
  },
  platform: {
    label: 'Plataforma',
    icon: '⚙️',
    blocks: [
      { id: 'create_client', label: 'Criar Cliente', description: 'Nova conta' },
      { id: 'create_project', label: 'Criar Projeto', description: 'Novo projeto' },
      { id: 'create_task', label: 'Criar Tarefa', description: 'Nova tarefa' },
      { id: 'create_process', label: 'Criar Processo', description: 'Novo processo' },
      { id: 'create_contract', label: 'Criar Contrato', description: 'Novo contrato' },
      { id: 'create_document', label: 'Criar Documento', description: 'Novo documento' },
      { id: 'update_status', label: 'Atualizar Status', description: 'Mudar status' },
      { id: 'add_comment', label: 'Adicionar Comentário', description: 'Novo comentário' },
      { id: 'add_tag', label: 'Adicionar Tag', description: 'Nova etiqueta' },
      { id: 'trigger_automation', label: 'Acionar Automação', description: 'Executar automação' },
    ],
  },
  communication: {
    label: 'Comunicação',
    icon: '📢',
    blocks: [
      { id: 'send_email', label: 'Enviar E-mail', description: 'Email automático' },
      { id: 'send_whatsapp', label: 'Enviar WhatsApp', description: 'WhatsApp automático' },
      { id: 'send_sms', label: 'Enviar SMS', description: 'SMS automático' },
      { id: 'send_notification', label: 'Notificação', description: 'Notificação push' },
      { id: 'show_message', label: 'Mensagem', description: 'Exibir mensagem' },
      { id: 'show_result', label: 'Resultado', description: 'Página de resultado' },
    ],
  },
};

export default function BlockPalette({ onBlockAdd }) {
  const [search, setSearch] = useState('');

  const filterBlocks = (blocks) => {
    return blocks.filter(b =>
      b.label.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold mb-3">Blocos</h3>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar blocos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="input" className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="grid grid-cols-3 w-full rounded-none border-b border-border">
          {Object.entries(BLOCK_GROUPS).map(([key, group]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {group.icon}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          {Object.entries(BLOCK_GROUPS).map(([key, group]) => (
            <TabsContent key={key} value={key} className="p-3 space-y-2">
              {filterBlocks(group.blocks).map(block => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('blockType', block.id);
                    e.dataTransfer.setData('blockLabel', block.label);
                  }}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-move border border-border transition-colors"
                >
                  <div className="font-medium text-sm">{block.label}</div>
                  <div className="text-xs text-muted-foreground">{block.description}</div>
                </div>
              ))}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}