import React from 'react';
import { CanvasNode } from '../types';
import { Box, Layers } from 'lucide-react';

interface CanvasMultiSelectionBoundsProps {
  selectedNodeIds: string[];
  nodes: CanvasNode[];
}

export const CanvasMultiSelectionBounds: React.FC<CanvasMultiSelectionBoundsProps> = ({
  selectedNodeIds,
  nodes,
}) => {
  if (selectedNodeIds.length <= 1) return null;

  // Filter selected nodes that exist in the active nodes list
  const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
  if (selectedNodes.length <= 1) return null;

  // Calculate bounding box enclosing all selected nodes
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedNodes.forEach(node => {
    const x = typeof node.x === 'number' && !isNaN(node.x) ? node.x : 0;
    const y = typeof node.y === 'number' && !isNaN(node.y) ? node.y : 0;
    const width = typeof node.width === 'number' && !isNaN(node.width) ? node.width : 260;
    // Estimate collapsed height if necessary
    const rawHeight = node.isCollapsed ? 37 : (node.height || 250);
    const height = typeof rawHeight === 'number' && !isNaN(rawHeight) ? rawHeight : 250;

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + width > maxX) maxX = x + width;
    if (y + height > maxY) maxY = y + height;
  });

  if (minX === Infinity || minY === Infinity || isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY)) return null;

  const width = maxX - minX;
  const height = maxY - minY;

  if (isNaN(width) || isNaN(height)) return null;

  // Render a beautifully styled bounding box with padding, soft glow, corner decorations, and badge
  const padding = 16;
  const boundingStyle: React.CSSProperties = {
    left: minX - padding,
    top: minY - padding,
    width: width + padding * 2,
    height: height + padding * 2,
    zIndex: 15, // Behind cards (zIndex >= 20) but clearly visible
  };

  return (
    <div
      style={boundingStyle}
      className="absolute bg-[#4080FF]/[0.015] rounded-2xl pointer-events-none transition-[left,top,width,height] duration-75 ease-out"
    >
      {/* CORNER BRACKETS */}
      {/* Top Left */}
      <div className="absolute -top-1 -left-1 w-4 h-4 rounded-tl-md" />
      {/* Top Right */}
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-tr-md" />
      {/* Bottom Left */}
      <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-bl-md" />
      {/* Bottom Right */}
      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-br-md" />

      {/* DASHED ACCENT PATH INSIDE */}
      <div className="absolute inset-1 rounded-xl pointer-events-none" />

      {/* FLOATING HUD BADGE ABOVE THE BOX */}
      <div
        className="absolute -top-8 left-0 flex items-center gap-1.5 px-2.5 py-1 bg-[#165DFF]/10 backdrop-blur-md rounded-lg"
        style={{ zIndex: 30 }}
      >
        <Layers size={11} className="text-[#4080FF] animate-pulse" />
        <span className="text-[10px] font-extrabold tracking-wider text-[#4080FF] uppercase select-none">
          已选 {selectedNodes.length} 个节点
        </span>
      </div>

      {/* RESIZE GUIDELINE LINES */}
      <div className="absolute -inset-px rounded-2xl animate-pulse duration-[3000ms] pointer-events-none" />
    </div>
  );
};
