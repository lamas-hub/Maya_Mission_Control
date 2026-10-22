/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MayaNode, Vector3D } from '../types/maya.ts';
import { sound } from '../audio/soundFx.ts';

interface ChannelBoxProps {
  selectedNode: MayaNode | null;
  onUpdateTransform: (nodeId: string, transform: { position: Vector3D; rotation: Vector3D; scale: Vector3D; visibility?: boolean }) => void;
  onLogAction: (type: any, details?: any) => void;
}

export const ChannelBox: React.FC<ChannelBoxProps> = ({
  selectedNode,
  onUpdateTransform,
  onLogAction,
}) => {
  // Local edit states to prevent rubber-banding while typing
  const [localValues, setLocalValues] = useState<{
    tx: string;
    ty: string;
    tz: string;
    rx: string;
    ry: string;
    rz: string;
    sx: string;
    sy: string;
    sz: string;
  }>({
    tx: '0',
    ty: '0',
    tz: '0',
    rx: '0',
    ry: '0',
    rz: '0',
    sx: '1',
    sy: '1',
    sz: '1',
  });

  useEffect(() => {
    if (selectedNode) {
      setLocalValues({
        tx: selectedNode.position.x.toFixed(2),
        ty: selectedNode.position.y.toFixed(2),
        tz: selectedNode.position.z.toFixed(2),
        rx: selectedNode.rotation.x.toFixed(1),
        ry: selectedNode.rotation.y.toFixed(1),
        rz: selectedNode.rotation.z.toFixed(1),
        sx: selectedNode.scale.x.toFixed(2),
        sy: selectedNode.scale.y.toFixed(2),
        sz: selectedNode.scale.z.toFixed(2),
      });
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="p-4 text-xs font-mono text-slate-500 italic text-center">
        No object selected. Select an object in the viewport or Outliner to view Channel Box.
      </div>
    );
  }

  const handleCommit = (property: string, valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return;

    sound.playTransformTick();

    const newPos = { ...selectedNode.position };
    const newRot = { ...selectedNode.rotation };
    const newScale = { ...selectedNode.scale };

    if (property === 'translateX') newPos.x = val;
    else if (property === 'translateY') newPos.y = val;
    else if (property === 'translateZ') newPos.z = val;
    else if (property === 'rotateX') newRot.x = val;
    else if (property === 'rotateY') newRot.y = val;
    else if (property === 'rotateZ') newRot.z = val;
    else if (property === 'scaleX') newScale.x = Math.max(0.01, val);
    else if (property === 'scaleY') newScale.y = Math.max(0.01, val);
    else if (property === 'scaleZ') newScale.z = Math.max(0.01, val);

    onUpdateTransform(selectedNode.id, {
      position: newPos,
      rotation: newRot,
      scale: newScale,
    });

    onLogAction('CHANNEL_BOX_EDIT', {
      nodeId: selectedNode.id,
      property,
      newValue: val,
      isManualDirectInput: true,
    });

    // Check Easter Egg coordinates (e.g. setting comm array to specific coordinate or rotation)
    if (selectedNode.id === 'comm_relay_array' && Math.round(val) === 77 && property === 'rotateY') {
      sound.playSecret();
      onLogAction('SECRET_FOUND', { secretName: 'Deep Space Beacon Frequency 77° Established' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, property: string) => {
    // Stop propagation so Maya viewport hotkeys (W, E, R, Q) are never triggered while typing
    e.stopPropagation();
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const renderField = (
    label: string,
    key: keyof typeof localValues,
    propName: string,
    step: number = 0.5
  ) => {
    return (
      <div className="flex items-center justify-between py-1 px-2 border-b border-slate-800/60 text-xs font-mono">
        <span className="text-slate-400 font-medium">{label}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step={step}
            value={localValues[key]}
            onChange={(e) => setLocalValues((prev) => ({ ...prev, [key]: e.target.value }))}
            onBlur={() => handleCommit(propName, localValues[key])}
            onKeyDown={(e) => handleKeyDown(e, propName)}
            className="w-20 bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:bg-slate-950 text-cyan-200 text-right px-1.5 py-0.5 rounded outline-none font-mono tabular-nums text-xs"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0b0f19] select-none text-xs font-mono">
      {/* Node Header */}
      <div className="p-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Selected Transform</div>
          <div className="font-bold text-cyan-300 truncate max-w-[180px]">{selectedNode.name}</div>
        </div>
        <button
          onClick={() => {
            const nextVis = !selectedNode.visibility;
            onUpdateTransform(selectedNode.id, {
              position: selectedNode.position,
              rotation: selectedNode.rotation,
              scale: selectedNode.scale,
              visibility: nextVis,
            });
            onLogAction('CHANNEL_BOX_EDIT', {
              nodeId: selectedNode.id,
              property: 'visibility',
              newValue: nextVis,
              isManualDirectInput: true,
            });
            sound.playSelect();
          }}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
            selectedNode.visibility
              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/60 text-rose-300'
          }`}
        >
          {selectedNode.visibility ? 'VIS: ON' : 'VIS: OFF'}
        </button>
      </div>

      {/* Transform Attributes */}
      <div className="flex-1 py-1">
        <div className="px-2 py-1 text-[10px] text-slate-500 tracking-wider uppercase font-semibold bg-slate-900/40">
          Translate
        </div>
        {renderField('Translate X', 'tx', 'translateX')}
        {renderField('Translate Y', 'ty', 'translateY')}
        {renderField('Translate Z', 'tz', 'translateZ')}

        <div className="px-2 py-1 mt-2 text-[10px] text-slate-500 tracking-wider uppercase font-semibold bg-slate-900/40">
          Rotate (Deg)
        </div>
        {renderField('Rotate X', 'rx', 'rotateX', 5)}
        {renderField('Rotate Y', 'ry', 'rotateY', 5)}
        {renderField('Rotate Z', 'rz', 'rotateZ', 5)}

        <div className="px-2 py-1 mt-2 text-[10px] text-slate-500 tracking-wider uppercase font-semibold bg-slate-900/40">
          Scale
        </div>
        {renderField('Scale X', 'sx', 'scaleX', 0.2)}
        {renderField('Scale Y', 'sy', 'scaleY', 0.2)}
        {renderField('Scale Z', 'sz', 'scaleZ', 0.2)}
      </div>

      {/* Classroom Guide Note */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/80 text-[10px] text-slate-400">
        <span className="text-amber-400 font-semibold">Maya Tip:</span> The Channel Box gives rapid access to keyable transform attributes. Press Enter after typing to commit changes.
      </div>
    </div>
  );
};
