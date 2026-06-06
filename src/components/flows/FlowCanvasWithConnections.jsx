import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';

export default function FlowCanvasWithConnections({
  nodes, edges, onNodeSelect, onNodeDrag, selectedNodeId, onEdgeCreate,
}) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const BLOCK_WIDTH = 240;
  const BLOCK_HEIGHT = 100;

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.3, Math.min(2, prev + delta)));
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button === 2 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: dragStart.panX + dx, y: dragStart.panY + dy });
    }
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const getBlockPosition = (node) => ({
    x: node.position.x,
    y: node.position.y,
    cx: node.position.x + BLOCK_WIDTH / 2,
    cy: node.position.y + BLOCK_HEIGHT / 2,
  });

  const drawConnections = () => {
    return edges.map(edge => {
      const source = nodes?.find(n => n.id === edge.source);
      const target = nodes?.find(n => n.id === edge.target);
      if (!source || !target) return null;

      const srcPos = getBlockPosition(source);
      const tgtPos = getBlockPosition(target);

      // Start from right side of source, end at left side of target
      const sx = srcPos.x + BLOCK_WIDTH;
      const sy = srcPos.cy;
      const tx = tgtPos.x;
      const ty = tgtPos.cy;

      const cp1x = sx + 60;
      const cp2x = tx - 60;

      return (
        <g key={edge.id}>
          <path
            d={`M ${sx} ${sy} C ${cp1x} ${sy}, ${cp2x} ${ty}, ${tx} ${ty}`}
            fill="none"
            stroke="hsl(var(--primary) / 0.5)"
            strokeWidth="2.5"
            markerEnd="url(#arrowhead)"
            className="hover:stroke-primary transition-colors"
          />
          {edge.label && (
            <text
              x={(sx + tx) / 2}
              y={(sy + ty) / 2 - 8}
              textAnchor="middle"
              fontSize="11"
              fill="hsl(var(--muted-foreground))"
              fontWeight="600"
              className="pointer-events-none"
            >
              {edge.label}
            </text>
          )}
        </g>
      );
    });
  };

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <svg
        ref={canvasRef}
        width="100%"
        height="100%"
        className="absolute inset-0"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        onWheel={(e) => {
          e.preventDefault();
          handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
        }}
      >
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="currentColor" opacity="0.05" />
          </pattern>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--primary) / 0.5)" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <rect width="5000" height="5000" fill="url(#grid)" x="-2500" y="-2500" />
          {drawConnections()}

          {/* Temporary connection line while connecting */}
          {connecting && (
            <line
              x1={getBlockPosition(nodes.find(n => n.id === connecting.nodeId)).x + BLOCK_WIDTH}
              y1={getBlockPosition(nodes.find(n => n.id === connecting.nodeId)).cy}
              x2={(mousePos.x - pan.x) / zoom}
              y2={(mousePos.y - pan.y) / zoom}
              stroke="hsl(var(--primary) / 0.3)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </g>
      </svg>

      {/* Nodes */}
      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', pointerEvents: 'auto' }}>
        {nodes?.map(node => (
          <FlowNodeV2
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onSelect={() => onNodeSelect(node.id)}
            onDrag={(pos) => onNodeDrag(node.id, pos)}
            onConnectStart={() => setConnecting({ nodeId: node.id })}
            onConnectEnd={(targetId) => {
              if (connecting && targetId !== connecting.nodeId) {
                onEdgeCreate(connecting.nodeId, targetId);
              }
              setConnecting(null);
            }}
            isConnecting={connecting?.nodeId === node.id}
          />
        ))}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-1 bg-card rounded-xl shadow-lg p-1.5 z-20">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleZoom(0.1)}
          className="h-9 w-9 hover:bg-muted"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="text-xs text-center text-muted-foreground font-medium px-2 py-1.5">
          {Math.round(zoom * 100)}%
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleZoom(-0.1)}
          className="h-9 w-9 hover:bg-muted"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Pan hint */}
      <div className="absolute bottom-6 left-6 text-xs text-muted-foreground flex items-center gap-1">
        Cmd + arraste para mover
      </div>
    </div>
  );
}

function FlowNodeV2({ node, isSelected, onSelect, onDrag, onConnectStart, onConnectEnd, isConnecting }) {
  const blockColors = {
    start: { bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-300', icon: '▶️', label: 'Início' },
    text: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '📝', label: 'Texto' },
    email: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '✉️', label: 'E-mail' },
    phone: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-300', icon: '📱', label: 'Telefone' },
    condition: { bg: 'from-purple-50 to-purple-100/50', border: 'border-purple-300', icon: '❓', label: 'Condição' },
    split: { bg: 'from-purple-50 to-purple-100/50', border: 'border-purple-300', icon: '🔀', label: 'Divisão' },
    ai_ask: { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-300', icon: '🤖', label: 'Perguntar IA' },
    create_project: { bg: 'from-orange-50 to-orange-100/50', border: 'border-orange-300', icon: '📋', label: 'Criar Projeto' },
    send_email: { bg: 'from-pink-50 to-pink-100/50', border: 'border-pink-300', icon: '📧', label: 'Enviar E-mail' },
    end: { bg: 'from-red-50 to-red-100/50', border: 'border-red-300', icon: '⏹️', label: 'Encerrar' },
  };

  const config = blockColors[node.type] || blockColors.text;

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: 240,
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('nodeId', node.id);
      }}
      onDragEnd={(e) => {
        const newX = node.position.x + (e.clientX - e.screenX) / 1.2;
        const newY = node.position.y + (e.clientY - e.screenY) / 1.2;
        onDrag({ x: newX, y: newY });
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <div
        className={`
          bg-gradient-to-br ${config.bg}
          border-2 ${config.border}
          rounded-xl p-3 shadow-md hover:shadow-lg
          transition-all duration-200
          ${isSelected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 shadow-lg' : ''}
        `}
      >
        <div className="flex items-start gap-2.5">
          <span className="text-xl mt-0.5">{config.icon}</span>
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

        {/* Connection ports */}
        <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-white dark:bg-slate-900 border-2 border-primary rounded-full shadow-md cursor-crosshair" />
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            onConnectStart();
          }}
          className="absolute top-1/2 -right-2.5 transform -translate-y-1/2 w-5 h-5 bg-white dark:bg-slate-900 border-2 border-primary rounded-full shadow-md hover:bg-primary hover:border-primary transition-colors"
          title="Conectar a outro bloco"
        />
      </div>
    </div>
  );
}