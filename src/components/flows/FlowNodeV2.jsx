import React, { useState, useRef } from 'react';

export default function FlowNodeV2({ 
  node, 
  isSelected, 
  onSelect, 
  onDrag, 
  onConnectStart, 
  onConnectEnd, 
  isConnecting,
  connectFromNodeId
}) {
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef(null);

  const blockColors = {
    start: { bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-300', icon: '▶️' },
    text: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '📝' },
    question: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '❓' },
    email: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '✉️' },
    phone: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '📱' },
    number: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '🔢' },
    date: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '📅' },
    single_choice: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '⭕' },
    multiple_choice: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '☑️' },
    nps: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '📊' },
    condition: { bg: 'from-purple-50 to-purple-100/50', border: 'border-purple-300', icon: '❓' },
    split: { bg: 'from-purple-50 to-purple-100/50', border: 'border-purple-300', icon: '🔀' },
    ai_ask: { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-300', icon: '🤖' },
    ai_classify: { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-300', icon: '🏷️' },
    ai_diagnose: { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-300', icon: '🔍' },
    create_project: { bg: 'from-orange-50 to-orange-100/50', border: 'border-orange-300', icon: '📋' },
    create_client: { bg: 'from-orange-50 to-orange-100/50', border: 'border-orange-300', icon: '👤' },
    send_email: { bg: 'from-pink-50 to-pink-100/50', border: 'border-pink-300', icon: '📧' },
    show_result: { bg: 'from-green-50 to-green-100/50', border: 'border-green-300', icon: '🎉' },
    end: { bg: 'from-red-50 to-red-100/50', border: 'border-red-300', icon: '⏹️' },
  };

  const config = blockColors[node.type] || blockColors.text;

  const handleNodeMouseDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect();
    setIsDraggingNode(true);
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const handleNodeMouseMove = (e) => {
    if (!isDraggingNode) return;
    const dx = (e.clientX - dragOffset.x);
    const dy = (e.clientY - dragOffset.y);
    onDrag({ x: node.position.x + dx, y: node.position.y + dy });
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const handleNodeMouseUp = () => {
    setIsDraggingNode(false);
  };

  const handlePortMouseDown = (e) => {
    e.stopPropagation();
    onConnectStart();
  };

  return (
    <div
      ref={nodeRef}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: 240,
      }}
      onMouseDown={handleNodeMouseDown}
      onMouseMove={handleNodeMouseMove}
      onMouseUp={handleNodeMouseUp}
      onMouseLeave={handleNodeMouseUp}
      className={isDraggingNode ? 'cursor-grabbing' : 'cursor-grab'}
    >
      <div
        className={`
          bg-gradient-to-br ${config.bg}
          border-2 ${config.border}
          rounded-xl p-3 shadow-md
          transition-all duration-150
          ${isSelected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 shadow-xl' : 'hover:shadow-lg'}
          ${isDraggingNode ? 'shadow-xl' : ''}
        `}
      >
        <div className="flex items-start gap-2.5 pointer-events-none">
          <span className="text-lg leading-none">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-foreground">{node.label}</div>
            {node.data?.question && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {node.data.question}
              </div>
            )}
            {node.data?.description && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {node.data.description}
              </div>
            )}
          </div>
        </div>

        {/* Output Port (bottom) */}
        <div 
          onMouseDown={handlePortMouseDown}
          className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-white dark:bg-slate-900 border-2 border-primary rounded-full shadow-md cursor-crosshair hover:scale-125 hover:bg-primary transition-all z-10 pointer-events-auto"
          title="Arrastar para conectar a outro bloco"
        />

        {/* Input Port (top) */}
        <div 
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-white dark:bg-slate-900 border-2 border-green-400 rounded-full shadow-md cursor-pointer hover:scale-125 transition-all z-10 pointer-events-auto"
          title="Conectar de outro bloco aqui"
          onMouseUp={(e) => {
            e.stopPropagation();
            if (isConnecting) {
              onConnectEnd(node.id);
            }
          }}
        />
      </div>
    </div>
  );
}