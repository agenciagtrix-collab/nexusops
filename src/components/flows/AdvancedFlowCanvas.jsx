import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Copy, Trash2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FlowNodeV2 from './FlowNodeV2';
import ConnectionLinesRenderer from './ConnectionLinesRenderer';

export default function AdvancedFlowCanvas({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  selectedNodeId,
  onNodeSelect,
  onNodeDrag,
  onConnectStart,
  onConnectEnd,
  isConnecting,
  connectFromNodeId,
  onAddNode,
  onDeleteNode,
  onDeleteEdge
}) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [connectionLine, setConnectionLine] = useState(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const gridSize = 20;

  // Handle wheel zoom
  const handleWheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.2, Math.min(3, zoom * delta));
    setZoom(newZoom);
  };

  // Handle pan with middle mouse or space+drag
  const handleMouseDown = (e) => {
    if (e.button === 2 || (e.button === 0 && e.spaceKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }

    // Update connection line during connection
    if (isConnecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setConnectionLine({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      onNodeSelect(null);
    }
  };

  const handleZoom = (delta) => {
    const newZoom = Math.max(0.2, Math.min(3, zoom * delta));
    setZoom(newZoom);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const snapToGrid = (value) => {
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
      {/* Grid Background */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(148, 163, 184, 0.1) 25%, rgba(148, 163, 184, 0.1) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.1) 75%, rgba(148, 163, 184, 0.1) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(148, 163, 184, 0.1) 25%, rgba(148, 163, 184, 0.1) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.1) 75%, rgba(148, 163, 184, 0.1) 76%, transparent 77%, transparent)
          `,
          backgroundSize: `${gridSize * zoom * 2}px ${gridSize * zoom * 2}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Canvas */}
      <div
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onDragOver={(e) => e.preventDefault()}
        className="relative w-full h-full overflow-hidden"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {/* Zoom/Pan Transform */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* Connection Lines SVG */}
          <ConnectionLinesRenderer
            edges={edges}
            nodes={nodes}
            zoom={zoom}
            isConnecting={isConnecting}
            connectFromNodeId={connectFromNodeId}
            connectionLine={connectionLine}
            selectedEdgeId={null}
          />

          {/* Nodes */}
          <div className="relative" style={{ width: '100%', height: '100%' }}>
            {nodes.map((node) => (
              <FlowNodeV2
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={() => onNodeSelect(node.id)}
                onDrag={(newPos) => {
                  const snappedPos = {
                    x: snapToGrid(newPos.x),
                    y: snapToGrid(newPos.y)
                  };
                  onNodeDrag(node.id, snappedPos);
                }}
                onConnectStart={() => onConnectStart(node.id)}
                onConnectEnd={(targetId) => {
                  if (targetId !== connectFromNodeId) {
                    onConnectEnd(node.id, targetId);
                    setConnectionLine(null);
                  }
                }}
                isConnecting={isConnecting}
                connectFromNodeId={connectFromNodeId}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2 flex gap-1 border border-border">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleZoom(1.1)}
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="flex items-center px-2 text-sm font-medium text-muted-foreground">
            {Math.round(zoom * 100)}%
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleZoom(0.9)}
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="w-px bg-border" />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleReset}
            title="Reset zoom and pan"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Info */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-white/80 dark:bg-slate-800/80 px-3 py-2 rounded-lg">
        <div>Nodes: {nodes.length}</div>
        <div>Connections: {edges.length}</div>
        {snapEnabled && <div>Snap: ON</div>}
      </div>
    </div>
  );
}