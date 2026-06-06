import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Copy } from 'lucide-react';

export default function ImprovedFlowCanvas({
  nodes, edges, onNodeSelect, onNodeDrag, selectedNodeId,
}) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [connecting, setConnecting] = useState(null);

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
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    onNodeSelect(nodeId);
  };

  const drawEdges = () => {
    return edges.map(edge => {
      const source = nodes?.find(n => n.id === edge.source);
      const target = nodes?.find(n => n.id === edge.target);
      if (!source || !target) return null;

      const sx = source.position.x + 120;
      const sy = source.position.y + 50;
      const tx = target.position.x;
      const ty = target.position.y + 50;

      const cp1x = sx + 100;
      const cp1y = sy;
      const cp2x = tx - 100;
      const cp2y = ty;

      return (
        <g key={edge.id}>
          <path
            d={`M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`}
            fill="none"
            stroke="hsl(var(--primary) / 0.6)"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            className="pointer-events-none"
          />
          {edge.label && (
            <text
              x={(sx + tx) / 2}
              y={(sy + ty) / 2 - 10}
              textAnchor="middle"
              fontSize="12"
              fill="hsl(var(--muted-foreground))"
              className="pointer-events-none font-medium"
            >
              {edge.label}
            </text>
          )}
        </g>
      );
    });
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
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
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.5" fill="currentColor" opacity="0.1" />
          </pattern>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--primary) / 0.6)" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <rect width="10000" height="10000" fill="url(#grid)" x="-5000" y="-5000" />
          {drawEdges()}
        </g>
      </svg>

      {/* Nodes */}
      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
        {nodes?.map(node => (
          <FlowNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onDrag={(pos) => onNodeDrag(node.id, pos)}
          />
        ))}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10 bg-card rounded-lg shadow-lg p-2">
        <Button size="icon" variant="ghost" onClick={() => handleZoom(0.1)} className="h-9 w-9">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="text-xs text-center text-muted-foreground font-medium px-2">
          {Math.round(zoom * 100)}%
        </div>
        <Button size="icon" variant="ghost" onClick={() => handleZoom(-0.1)} className="h-9 w-9">
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function FlowNode({ node, isSelected, onMouseDown, onDrag }) {
  const blockConfig = {
    start: { bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-300 dark:border-emerald-700', icon: '▶' },
    input: { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-300 dark:border-blue-700', icon: '📝' },
    logic: { bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-300 dark:border-purple-700', icon: '🔀' },
    ai: { bg: 'bg-indigo-50 dark:bg-indigo-950', border: 'border-indigo-300 dark:border-indigo-700', icon: '🤖' },
    platform: { bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-300 dark:border-orange-700', icon: '⚙' },
    communication: { bg: 'bg-pink-50 dark:bg-pink-950', border: 'border-pink-300 dark:border-pink-700', icon: '📢' },
    end: { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-300 dark:border-red-700', icon: '⏹' },
  };

  const config = blockConfig[node.type] || blockConfig.input;

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
      }}
      onDragEnd={(e) => {
        onDrag({
          x: node.position.x + e.clientX / 1.2,
          y: node.position.y + e.clientY / 1.2,
        });
      }}
      onMouseDown={onMouseDown}
      className="cursor-move"
    >
      <div
        className={`${config.bg} border-2 ${config.border} rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 ${
          isSelected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl mt-1">{config.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-foreground truncate">{node.label}</div>
            {node.data?.description && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {node.data.description}
              </div>
            )}
          </div>
        </div>

        {/* Connection points */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-primary rounded-full border-3 border-card shadow-lg cursor-crosshair" />
        <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-5 h-5 bg-primary rounded-full border-3 border-card shadow-lg cursor-crosshair opacity-0 hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}