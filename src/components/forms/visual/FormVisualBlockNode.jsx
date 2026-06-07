import React from 'react';
import { Handle, Position } from 'reactflow';
import {
  Bot,
  CheckSquare,
  CircleDot,
  FileText,
  GitBranch,
  Mail,
  PenLine,
  Play,
  Square,
  Star,
  StopCircle,
  Upload,
  UserPlus,
  Workflow,
  Zap,
} from 'lucide-react';

const TYPE_META = {
  start: { icon: Play, label: 'Inicio', tone: 'emerald' },
  short_text: { icon: PenLine, label: 'Texto curto', tone: 'sky' },
  long_text: { icon: FileText, label: 'Texto longo', tone: 'sky' },
  email: { icon: Mail, label: 'E-mail', tone: 'sky' },
  phone: { icon: Square, label: 'Telefone', tone: 'sky' },
  number: { icon: Square, label: 'Numero', tone: 'sky' },
  date: { icon: Square, label: 'Data', tone: 'sky' },
  file: { icon: Upload, label: 'Arquivo', tone: 'sky' },
  image: { icon: Upload, label: 'Imagem', tone: 'sky' },
  signature: { icon: PenLine, label: 'Assinatura', tone: 'sky' },
  single_choice: { icon: CircleDot, label: 'Escolha unica', tone: 'violet' },
  multiple_choice: { icon: CheckSquare, label: 'Multipla escolha', tone: 'violet' },
  dropdown: { icon: CircleDot, label: 'Dropdown', tone: 'violet' },
  scale: { icon: Star, label: 'Escala', tone: 'amber' },
  nps: { icon: Star, label: 'NPS', tone: 'amber' },
  rating: { icon: Star, label: 'Avaliacao', tone: 'amber' },
  condition: { icon: GitBranch, label: 'Condicao', tone: 'purple' },
  split: { icon: GitBranch, label: 'Divisao', tone: 'purple' },
  result: { icon: Workflow, label: 'Resultado', tone: 'teal' },
  create_client: { icon: UserPlus, label: 'Criar cliente', tone: 'blue' },
  create_project: { icon: FileText, label: 'Criar projeto', tone: 'blue' },
  create_task: { icon: CheckSquare, label: 'Criar tarefa', tone: 'blue' },
  send_email: { icon: Mail, label: 'Enviar e-mail', tone: 'orange' },
  automation: { icon: Zap, label: 'Automacao', tone: 'orange' },
  ai_analyze: { icon: Bot, label: 'Analisar IA', tone: 'indigo' },
  end: { icon: StopCircle, label: 'Encerrar', tone: 'rose' },
};

const TONE_CLASSES = {
  emerald: 'border-emerald-500/70 bg-emerald-500/10 text-emerald-300',
  sky: 'border-sky-500/70 bg-sky-500/10 text-sky-300',
  violet: 'border-violet-500/70 bg-violet-500/10 text-violet-300',
  amber: 'border-amber-500/70 bg-amber-500/10 text-amber-300',
  purple: 'border-purple-500/70 bg-purple-500/10 text-purple-300',
  teal: 'border-teal-500/70 bg-teal-500/10 text-teal-300',
  blue: 'border-blue-500/70 bg-blue-500/10 text-blue-300',
  orange: 'border-orange-500/70 bg-orange-500/10 text-orange-300',
  indigo: 'border-indigo-500/70 bg-indigo-500/10 text-indigo-300',
  rose: 'border-rose-500/70 bg-rose-500/10 text-rose-300',
};

export default function FormVisualBlockNode({ data, selected }) {
  const meta = TYPE_META[data.type] || TYPE_META.short_text;
  const Icon = meta.icon;
  const toneClasses = TONE_CLASSES[meta.tone];
  const title = data.label || data.question || meta.label;
  const subtitle = data.description || data.helpText || data.placeholder;

  return (
    <div
      className={[
        'w-[220px] rounded-lg border bg-slate-950/95 p-3 shadow-lg backdrop-blur',
        selected ? 'border-primary ring-2 ring-primary/40' : 'border-slate-700 hover:border-slate-500',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-slate-950 !bg-slate-300" />
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${toneClasses}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-normal text-slate-400">
            {meta.label}
          </div>
          <div className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-slate-100">
            {title}
          </div>
          {subtitle && (
            <div className="mt-1 line-clamp-2 text-xs leading-snug text-slate-400">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-slate-950 !bg-slate-300" />
    </div>
  );
}
