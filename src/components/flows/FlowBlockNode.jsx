import React from 'react';
import { Handle, Position } from 'reactflow';

export default function FlowBlockNode({ data, selected }) {
  const blockColors = {
    start: { bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-300' },
    text: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300' },
    question: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300' },
    email: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300' },
    phone: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300' },
    number: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300' },
    date: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300' },
    single_choice: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300' },
    multiple_choice: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300' },
    condition: { bg: 'from-purple-50 to-purple-100/50', border: 'border-purple-300' },
    split: { bg: 'from-purple-50 to-purple-100/50', border: 'border-purple-300' },
    ai_ask: { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-300' },
    create_project: { bg: 'from-orange-50 to-orange-100/50', border: 'border-orange-300' },
    create_client: { bg: 'from-orange-50 to-orange-100/50', border: 'border-orange-300' },
    send_email: { bg: 'from-pink-50 to-pink-100/50', border: 'border-pink-300' },
    show_result: { bg: 'from-green-50 to-green-100/50', border: 'border-green-300' },
    end: { bg: 'from-red-50 to-red-100/50', border: 'border-red-300' },
  };

  const config = blockColors[data.type] || blockColors.text;
  const emoji = data.emoji || '📝';

  return (
    <div
      className={`
        bg-gradient-to-br ${config.bg}
        border-2 ${config.border}
        rounded-xl p-4 shadow-md min-w-max
        transition-all duration-150
        ${selected ? 'ring-2 ring-primary ring-offset-2 shadow-xl' : 'hover:shadow-lg'}
      `}
      style={{ width: 220 }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground">{data.label}</div>
          {data.question && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {data.question}
            </div>
          )}
          {data.description && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {data.description}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}