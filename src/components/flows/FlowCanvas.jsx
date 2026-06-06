import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

export default function FlowCanvas({
  nodes, edges, onNodeSelect, onNodeDrag, onEdgeCreate,
}) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  // Handle canvas zoom
  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
  };

  // Handle pan with mouse
  const handleCanvasMouseDown = (e) => {
    if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
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

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-muted/5 to-muted/20 overflow-hidden">
      {/* Canvas */}
      <svg
        ref={canvasRef}
        width="100%"
        height="100%"
        className="absolute inset-0 cursor-move"
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
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
          </pattern>
        </defs>

        {/* Grid Background */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <rect width="10000" height="10000" fill="url(#grid)" x="-5000" y="-5000" />

          {/* Edges (connections) */}
          {edges?.map(edge => {
            const sourceNode = nodes?.find(n => n.id === edge.source);
            const targetNode = nodes?.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <g key={edge.id}>
                <path
                  d={`M ${sourceNode.position.x + 120} ${sourceNode.position.y + 60} Q ${(sourceNode.position.x + targetNode.position.x) / 2} ${(sourceNode.position.y + targetNode.position.y) / 2 + 40} ${targetNode.position.x} ${targetNode.position.y}`}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text
                    x={(sourceNode.position.x + targetNode.position.x) / 2}
                    y={(sourceNode.position.y + targetNode.position.y) / 2}
                    textAnchor="middle"
                    fontSize="12"
                    fill="currentColor"
                    className="text-muted-foreground"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Marker for arrows */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--primary))" />
            </marker>
          </defs>
        </g>
      </svg>

      {/* Nodes overlay */}
      <div
        className="absolute inset-0"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
      >
        {nodes?.map(node => (
          <div
            key={node.id}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{
              left: node.position.x,
              top: node.position.y,
              width: 240,
            }}
            onClick={() => onNodeSelect(node.id)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const newPos = {
                x: node.position.x + (e.clientX / zoom),
                y: node.position.y + (e.clientY / zoom),
              };
              onNodeDrag(node.id, newPos);
            }}
          >
            <FlowBlockNode node={node} />
          </div>
        ))}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => handleZoom(0.1)}
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="text-xs text-center text-muted-foreground bg-card px-2 py-1 rounded">
          {Math.round(zoom * 100)}%
        </div>
        <Button
          size="icon"
          variant="secondary"
          onClick={() => handleZoom(-0.1)}
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Pan Hint */}
      <div className="absolute bottom-6 left-6 text-xs text-muted-foreground">
        <Move className="w-3 h-3 inline mr-1" />
        Clique + arraste para mover
      </div>
    </div>
  );
}

function FlowBlockNode({ node }) {
  const blockTypeColors = {
    start: 'bg-green-500/10 border-green-500',
    input: 'bg-blue-500/10 border-blue-500',
    logic: 'bg-purple-500/10 border-purple-500',
    ai: 'bg-indigo-500/10 border-indigo-500',
    platform: 'bg-orange-500/10 border-orange-500',
    communication: 'bg-pink-500/10 border-pink-500',
    end: 'bg-red-500/10 border-red-500',
  };

  return (
    <div className={`border-2 rounded-lg p-3 bg-card shadow-lg ${blockTypeColors[node.type] || 'border-border'}`}>
      <div className="font-semibold text-sm truncate">{node.label}</div>
      {node.data?.description && (
        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {node.data.description}
        </div>
      )}
      
      {/* Connection points */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-card cursor-crosshair" />
    </div>
  );
}