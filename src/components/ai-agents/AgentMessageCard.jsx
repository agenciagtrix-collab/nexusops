import React from 'react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, Lightbulb, CheckSquare, ArrowRight, BarChart2,
  FileText, Zap, Target, TrendingUp, Star,
} from 'lucide-react';

// Detects if message content has a special type marker and returns card config
function detectCardType(content) {
  const lower = content.toLowerCase();
  if (lower.includes('## risco') || lower.includes('**risco') || lower.includes('risco identificado') || lower.includes('riscos identificados'))
    return 'risk';
  if (lower.includes('## recomendação') || lower.includes('recomendação final') || lower.includes('## conclusão'))
    return 'recommendation';
  if (lower.includes('## oportunidade') || lower.includes('oportunidade identificada'))
    return 'opportunity';
  if (lower.includes('## próximos passos') || lower.includes('plano de ação') || lower.includes('## checklist'))
    return 'action';
  if (lower.includes('resumo executivo') || lower.includes('## síntese'))
    return 'summary';
  if (lower.includes('decisão sugerida') || lower.includes('## recomendação final'))
    return 'decision';
  return null;
}

const CARD_TYPES = {
  risk: {
    label: 'Risco Detectado',
    icon: AlertTriangle,
    headerCls: 'bg-red-50 border-red-200 text-red-700',
    borderCls: 'border-red-200',
    iconCls: 'text-red-500',
    dot: 'bg-red-500',
  },
  recommendation: {
    label: 'Recomendação',
    icon: Star,
    headerCls: 'bg-violet-50 border-violet-200 text-violet-700',
    borderCls: 'border-violet-200',
    iconCls: 'text-violet-500',
    dot: 'bg-violet-500',
  },
  opportunity: {
    label: 'Oportunidade',
    icon: TrendingUp,
    headerCls: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    borderCls: 'border-emerald-200',
    iconCls: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  action: {
    label: 'Plano de Ação',
    icon: CheckSquare,
    headerCls: 'bg-blue-50 border-blue-200 text-blue-700',
    borderCls: 'border-blue-200',
    iconCls: 'text-blue-500',
    dot: 'bg-blue-500',
  },
  summary: {
    label: 'Resumo Executivo',
    icon: FileText,
    headerCls: 'bg-amber-50 border-amber-200 text-amber-700',
    borderCls: 'border-amber-200',
    iconCls: 'text-amber-500',
    dot: 'bg-amber-500',
  },
  decision: {
    label: 'Decisão Sugerida',
    icon: Target,
    headerCls: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    borderCls: 'border-indigo-200',
    iconCls: 'text-indigo-500',
    dot: 'bg-indigo-500',
  },
};

export function getCardType(content) {
  return detectCardType(content);
}

export default function AgentMessageCard({ cardType, agentColor, children }) {
  const cfg = CARD_TYPES[cardType];
  if (!cfg) return children;

  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-2xl rounded-tl-sm border overflow-hidden", cfg.borderCls)}>
      {/* Card header badge */}
      <div className={cn("flex items-center gap-2 px-4 py-2 border-b text-xs font-semibold", cfg.headerCls)}>
        <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
        <Icon className={cn("w-3.5 h-3.5", cfg.iconCls)} />
        {cfg.label}
      </div>
      {/* Content */}
      <div className="px-4 py-3 bg-card text-sm">
        {children}
      </div>
    </div>
  );
}