import React from 'react';
import { Handle, Position } from 'reactflow';

const TYPE_META = {
  start:           { icon: '▶', label: 'Início',            cat: 'Entrada' },
  question:        { icon: '?', label: 'Pergunta',           cat: 'Entrada' },
  text:            { icon: 'T', label: 'Texto',              cat: 'Entrada' },
  text_input:      { icon: '✎', label: 'Campo de Texto',     cat: 'Entrada' },
  multiple_choice: { icon: '⊡', label: 'Múltipla Escolha',   cat: 'Entrada' },
  single_choice:   { icon: '◉', label: 'Única Escolha',      cat: 'Entrada' },
  file_upload:     { icon: '↑', label: 'Upload de Arquivo',  cat: 'Entrada' },
  condition:       { icon: '⚡', label: 'Condição',           cat: 'Lógica' },
  split:           { icon: '⇌', label: 'Divisão de Fluxo',   cat: 'Lógica' },
  wait:            { icon: '⏳', label: 'Aguardar',           cat: 'Lógica' },
  end:             { icon: '■', label: 'Encerrar Fluxo',     cat: 'Lógica' },
  create_project:  { icon: '◧', label: 'Criar Projeto',      cat: 'Ação' },
  create_client:   { icon: '◎', label: 'Criar Cliente',      cat: 'Ação' },
  create_task:     { icon: '✓', label: 'Criar Tarefa',       cat: 'Ação' },
  send_email:      { icon: '✉', label: 'Enviar E-mail',      cat: 'Ação' },
  send_whatsapp:   { icon: '◫', label: 'Enviar WhatsApp',    cat: 'Ação' },
  notification:    { icon: '●', label: 'Notificação',        cat: 'Ação' },
  ai_ask:          { icon: '✦', label: 'Perguntar ao Agente',cat: 'IA' },
  ai_analyze:      { icon: '◈', label: 'Analisar Resposta',  cat: 'IA' },
};

export default function FlowBuilderNode({ data, selected }) {
  const nodeType = data.type || 'text';
  const meta = TYPE_META[nodeType] || { icon: '?', label: nodeType, cat: '' };
  const color = data.color || '#6366f1';
  const label = data.label || meta.label;
  const preview = data.question || data.content || data.description || '';

  return (
    <div
      className="border-2 rounded-xl overflow-hidden transition-all duration-150"
      style={{
        width: 220,
        borderColor: selected ? color : 'rgba(255,255,255,0.1)',
        boxShadow: selected ? `0 0 0 2px ${color}55, 0 4px 20px ${color}22` : '0 2px 12px rgba(0,0,0,0.4)',
        background: '#1a1d27',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: color,
          border: '2px solid #0f1117',
          width: 10,
          height: 10,
          top: -5,
        }}
      />

      {/* Color bar */}
      <div style={{ background: color, height: 3 }} />

      {/* Content */}
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div
            style={{ background: `${color}22`, color }}
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
          >
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white/90 truncate">{label}</div>
            <div style={{ color: `${color}bb` }} className="text-[10px] font-medium">{meta.cat}</div>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="text-[11px] text-white/40 line-clamp-2 leading-relaxed pl-9">
            {preview}
          </div>
        )}

        {/* Options preview for choice nodes */}
        {(nodeType === 'multiple_choice' || nodeType === 'single_choice') && Array.isArray(data.options) && data.options.length > 0 && (
          <div className="mt-2 space-y-1 pl-9">
            {data.options.slice(0, 3).map((opt, i) => (
              <div key={i} className="text-[10px] text-white/30 flex items-center gap-1.5">
                <span style={{ color }} className="text-[8px]">●</span>
                {opt}
              </div>
            ))}
            {data.options.length > 3 && (
              <div className="text-[10px] text-white/20">+{data.options.length - 3} mais</div>
            )}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: color,
          border: '2px solid #0f1117',
          width: 10,
          height: 10,
          bottom: -5,
        }}
      />

      {/* Extra handles for condition */}
      {nodeType === 'condition' && (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Right}
            style={{ background: '#22c55e', border: '2px solid #0f1117', width: 10, height: 10, right: -5 }}
          />
          <Handle
            id="false"
            type="source"
            position={Position.Left}
            style={{ background: '#ef4444', border: '2px solid #0f1117', width: 10, height: 10, left: -5 }}
          />
        </>
      )}
    </div>
  );
}