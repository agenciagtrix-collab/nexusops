import React, { useMemo, useState } from 'react';
import {
  Bot,
  Calendar,
  CheckSquare,
  CircleDot,
  FileText,
  GitBranch,
  Mail,
  MessageSquareText,
  PenLine,
  Phone,
  Play,
  Plus,
  Search,
  Star,
  StopCircle,
  Upload,
  UserPlus,
  Workflow,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const GROUPS = [
  {
    title: 'Entrada',
    items: [
      { type: 'start', label: 'Inicio', description: 'Ponto de entrada', icon: Play },
      { type: 'short_text', label: 'Campo de texto', description: 'Resposta curta', icon: PenLine },
      { type: 'long_text', label: 'Texto longo', description: 'Resposta descritiva', icon: MessageSquareText },
      { type: 'email', label: 'E-mail', description: 'Endereco de e-mail', icon: Mail },
      { type: 'phone', label: 'Telefone', description: 'Contato do respondente', icon: Phone },
      { type: 'number', label: 'Numero', description: 'Valor numerico', icon: Plus },
      { type: 'date', label: 'Data', description: 'Seletor de data', icon: Calendar },
      { type: 'file', label: 'Upload de arquivo', description: 'Anexos e documentos', icon: Upload },
      { type: 'signature', label: 'Assinatura', description: 'Confirmacao visual', icon: PenLine },
      { type: 'single_choice', label: 'Escolha unica', description: 'Uma opcao', icon: CircleDot },
      { type: 'multiple_choice', label: 'Multipla escolha', description: 'Varias opcoes', icon: CheckSquare },
      { type: 'dropdown', label: 'Dropdown', description: 'Lista compacta', icon: CircleDot },
      { type: 'nps', label: 'NPS', description: 'Escala 0 a 10', icon: Star },
      { type: 'rating', label: 'Avaliacao', description: 'Estrelas', icon: Star },
    ],
  },
  {
    title: 'Logica',
    items: [
      { type: 'condition', label: 'Condicao (Se)', description: 'Regra condicional', icon: GitBranch },
      { type: 'split', label: 'Divisao de fluxo', description: 'Ramificar caminhos', icon: GitBranch },
      { type: 'result', label: 'Resultado', description: 'Pagina final', icon: Workflow },
      { type: 'end', label: 'Encerrar formulario', description: 'Fim do caminho', icon: StopCircle },
    ],
  },
  {
    title: 'Acoes',
    items: [
      { type: 'create_client', label: 'Criar cliente', description: 'Novo cliente', icon: UserPlus },
      { type: 'create_project', label: 'Criar projeto', description: 'Projeto automatico', icon: FileText },
      { type: 'create_task', label: 'Criar tarefa', description: 'Tarefa inicial', icon: CheckSquare },
      { type: 'send_email', label: 'Enviar e-mail', description: 'Mensagem automatica', icon: Mail },
      { type: 'automation', label: 'Automacao', description: 'Acionar regra', icon: Zap },
    ],
  },
  {
    title: 'IA',
    items: [
      { type: 'ai_analyze', label: 'Analisar resposta', description: 'Classificar com IA', icon: Bot },
      { type: 'ai_suggest', label: 'Sugerir resultado', description: 'Gerar recomendacao', icon: Bot },
    ],
  },
];

export default function FormBlockPalette({ onAddBlock }) {
  const [search, setSearch] = useState('');

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return GROUPS;

    return GROUPS.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      ),
    })).filter(group => group.items.length > 0);
  }, [search]);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 p-4">
        <div className="text-sm font-semibold">Adicionar bloco</div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar blocos..."
            className="h-9 border-slate-800 bg-slate-900 pl-9 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {groups.map(group => (
          <section key={group.title} className="mb-5">
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-normal text-slate-500">
              {group.title}
            </div>
            <div className="space-y-2">
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    draggable
                    onClick={() => onAddBlock(item.type)}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'copy';
                      event.dataTransfer.setData('formBlockType', item.type);
                    }}
                    className="flex w-full items-center gap-3 rounded-md border border-slate-800 bg-slate-900/80 p-3 text-left transition hover:border-slate-600 hover:bg-slate-800"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/15 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-100">{item.label}</span>
                      <span className="block truncate text-xs text-slate-500">{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
