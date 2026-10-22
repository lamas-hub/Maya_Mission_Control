/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MayaNode } from '../types/maya.ts';
import { sound } from '../audio/soundFx.ts';
import { ChevronRight, ChevronDown, Eye, EyeOff, Folder, Box, Cylinder, Globe, Shield, Edit2, Check, Sparkles } from 'lucide-react';

interface OutlinerPanelProps {
  sceneNodes: Record<string, MayaNode>;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onToggleVisibility: (nodeId: string) => void;
  onRenameNode: (nodeId: string, newName: string) => void;
  onLogAction: (type: any, details?: any) => void;
}

export const OutlinerPanel: React.FC<OutlinerPanelProps> = ({
  sceneNodes,
  selectedNodeId,
  onSelectNode,
  onToggleVisibility,
  onRenameNode,
  onLogAction,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    root: true,
    DEFENSE_GRID: true,
    HABITAT_CLUSTER: true,
    POWER_AND_COMM: true,
    LUNAR_SURFACE_RELICS: false,
    INCOMING_HAZARDS: true,
  });

  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');

  const toggleGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    sound.playSelect();
  };

  const handleSelect = (nodeId: string) => {
    onSelectNode(nodeId);
    sound.playSelect();
    onLogAction('OUTLINER_SELECT', { nodeId });

    const node = sceneNodes[nodeId];
    if (node?.isSecret) {
      sound.playSecret();
      onLogAction('SECRET_FOUND', { secretName: `Discovered Lunar Relic in Outliner: ${node.name}` });
    }
  };

  const startRename = (nodeId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingNodeId(nodeId);
    setRenameInput(currentName);
  };

  const commitRename = (nodeId: string) => {
    if (renameInput.trim().length > 0) {
      const oldName = sceneNodes[nodeId]?.name;
      onRenameNode(nodeId, renameInput.trim());
      sound.playSelect();
      onLogAction('OUTLINER_RENAME', { nodeId, oldValue: oldName, newValue: renameInput.trim() });
    }
    setRenamingNodeId(null);
  };

  const getNodeIcon = (node: MayaNode) => {
    if (node.isSecret) return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    switch (node.type) {
      case 'group':
        return <Folder className="w-3.5 h-3.5 text-cyan-400" />;
      case 'cube':
        return <Box className="w-3.5 h-3.5 text-amber-300" />;
      case 'cylinder':
        return <Cylinder className="w-3.5 h-3.5 text-emerald-400" />;
      case 'sphere':
        return <Globe className="w-3.5 h-3.5 text-purple-400" />;
      case 'shield_dome':
        return <Shield className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Box className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const renderNode = (nodeId: string, depth = 0) => {
    const node = sceneNodes[nodeId];
    if (!node) return null;

    const isGroup = node.type === 'group';
    const isExpanded = expandedGroups[nodeId] ?? false;
    const isSelected = selectedNodeId === nodeId;
    const isEditing = renamingNodeId === nodeId;

    return (
      <div key={nodeId} className="flex flex-col">
        <div
          onClick={() => handleSelect(nodeId)}
          className={`flex items-center justify-between px-2 py-1 text-xs font-mono cursor-pointer transition-colors border-l-2 ${
            isSelected
              ? 'bg-cyan-950/70 text-cyan-200 border-cyan-400 font-medium'
              : 'text-slate-300 hover:bg-slate-800/60 border-transparent hover:text-white'
          }`}
          style={{ paddingLeft: `${Math.max(6, depth * 14 + 6)}px` }}
        >
          <div className="flex items-center gap-1.5 truncate mr-2">
            {isGroup ? (
              <button
                onClick={(e) => toggleGroup(nodeId, e)}
                className="p-0.5 text-slate-400 hover:text-white focus:outline-none"
                aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            ) : (
              <span className="w-3" />
            )}

            {getNodeIcon(node)}

            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  commitRename(nodeId);
                }}
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  onBlur={() => commitRename(nodeId)}
                  autoFocus
                  className="bg-slate-900 text-cyan-200 text-xs px-1 py-0.5 border border-cyan-500 rounded outline-none font-mono"
                />
                <button
                  type="submit"
                  className="text-emerald-400 hover:text-emerald-300 p-0.5"
                  aria-label="Confirm rename"
                >
                  <Check className="w-3 h-3" />
                </button>
              </form>
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100">
            {!isEditing && (
              <button
                onClick={(e) => startRename(nodeId, node.name, e)}
                className="p-0.5 text-slate-500 hover:text-cyan-300"
                title="Rename node"
                aria-label={`Rename ${node.name}`}
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(nodeId);
                sound.playSelect();
              }}
              className="p-0.5 text-slate-400 hover:text-slate-200"
              title={node.visibility ? 'Hide object' : 'Show object'}
              aria-label={node.visibility ? `Hide ${node.name}` : `Show ${node.name}`}
            >
              {node.visibility ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Children if group is expanded */}
        {isGroup && isExpanded && (
          <div className="flex flex-col">
            {node.childrenIds.map((childId) => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 h-full bg-[#0b0f19] border-r border-slate-800 flex flex-col select-none shrink-0">
      {/* Header */}
      <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase font-mono">Outliner</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">SCENE GRAPH</span>
      </div>

      {/* Node Hierarchy List */}
      <div className="flex-1 overflow-y-auto py-1">
        {sceneNodes.root && renderNode('root', 0)}
      </div>

      {/* Outliner Footer Guide */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/60 text-[10px] text-slate-400 font-mono flex flex-col gap-0.5">
        <div className="text-slate-300 font-semibold">TIPS:</div>
        <div>• Click to select in viewport</div>
        <div>• Pencil icon to rename</div>
        <div>• Eye icon to toggle visibility</div>
      </div>
    </div>
  );
};
