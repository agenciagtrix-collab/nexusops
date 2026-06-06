import React from 'react';

export default function ConnectionLinesRenderer({
  edges,
  nodes,
  zoom,
  isConnecting,
  connectFromNodeId,
  connectionLine,
  selectedEdgeId,
  onEdgeSelect,
  onEdgeHover,
  hoveredEdgeId
}) {
  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {});

  const getPortPosition = (nodeId, portType = 'bottom') => {
    const node = nodeMap[nodeId];
    if (!node) return { x: 0, y: 0 };

    const nodeWidth = 240;
    const nodeHeight = 140;
    const centerX = node.position.x + nodeWidth / 2;
    const centerY = node.position.y + nodeHeight / 2;

    switch (portType) {
      case 'bottom':
        return { x: centerX, y: node.position.y + nodeHeight };
      case 'top':
        return { x: centerX, y: node.position.y };
      case 'left':
        return { x: node.position.x, y: centerY };
      case 'right':
        return { x: node.position.x + nodeWidth, y: centerY };
      default:
        return { x: centerX, y: centerY };
    }
  };

  const createSmoothPath = (x1, y1, x2, y2) => {
    // Bezier curve for smooth connections
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const controlDistance = Math.max(distance * 0.3, 50);

    return `
      M ${x1} ${y1}
      C ${x1 + controlDistance} ${y1},
        ${x2 - controlDistance} ${y2},
        ${x2} ${y2}
    `;
  };

  const renderEdges = () => {
    return edges.map((edge) => {
      const sourcePos = getPortPosition(edge.source, 'bottom');
      const targetPos = getPortPosition(edge.target, 'top');

      const isSelected = selectedEdgeId === edge.id;
      const isHovered = hoveredEdgeId === edge.id;

      return (
        <g key={edge.id}>
          {/* Shadow effect for selected edges */}
          {isSelected && (
            <path
              d={createSmoothPath(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y)}
              stroke="hsl(239 84% 67%)"
              strokeWidth={8}
              fill="none"
              opacity="0.2"
            />
          )}

          {/* Main line */}
          <path
            d={createSmoothPath(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y)}
            stroke={isSelected ? 'hsl(239 84% 67%)' : isHovered ? 'hsl(239 84% 67%)' : '#94a3b8'}
            strokeWidth={isSelected || isHovered ? 2.5 : 2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-200"
            onMouseEnter={() => onEdgeHover?.(edge.id)}
            onMouseLeave={() => onEdgeHover?.(null)}
            onClick={(e) => {
              e.stopPropagation();
              onEdgeSelect?.(edge.id);
            }}
            style={{ cursor: 'pointer' }}
          />

          {/* Arrow head */}
          <defs>
            <marker
              id={`arrowhead-${edge.id}`}
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill={isSelected || isHovered ? 'hsl(239 84% 67%)' : '#94a3b8'}
              />
            </marker>
          </defs>

          <path
            d={createSmoothPath(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y)}
            stroke="none"
            fill="none"
            markerEnd={`url(#arrowhead-${edge.id})`}
          />

          {/* Edge label if exists */}
          {edge.label && (
            <text
              x={(sourcePos.x + targetPos.x) / 2}
              y={(sourcePos.y + targetPos.y) / 2 - 8}
              textAnchor="middle"
              fill="#64748b"
              fontSize="12"
              fontWeight="500"
              pointerEvents="none"
              className="select-none"
            >
              {edge.label}
            </text>
          )}
        </g>
      );
    });
  };

  const renderConnectionInProgress = () => {
    if (!isConnecting || !connectFromNodeId || !connectionLine) return null;

    const sourcePos = getPortPosition(connectFromNodeId, 'bottom');

    return (
      <path
        d={createSmoothPath(sourcePos.x, sourcePos.y, connectionLine.x, connectionLine.y)}
        stroke="hsl(239 84% 67%)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5,5"
        opacity="0.7"
        strokeLinecap="round"
      />
    );
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-auto"
      style={{
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    >
      {/* Render all edges */}
      {renderEdges()}

      {/* Render connection in progress */}
      {renderConnectionInProgress()}
    </svg>
  );
}