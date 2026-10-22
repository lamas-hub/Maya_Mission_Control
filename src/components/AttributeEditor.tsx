/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ConstructionParams, MayaNode } from '../types/maya.ts';
import { sound } from '../audio/soundFx.ts';
import { Sliders, Info, ShieldAlert, Cpu } from 'lucide-react';

interface AttributeEditorProps {
  selectedNode: MayaNode | null;
  onUpdateConstruction: (nodeId: string, construction: ConstructionParams) => void;
  onLogAction: (type: any, details?: any) => void;
}

export const AttributeEditor: React.FC<AttributeEditorProps> = ({
  selectedNode,
  onUpdateConstruction,
  onLogAction,
}) => {
  const [params, setParams] = useState<ConstructionParams>({});

  useEffect(() => {
    if (selectedNode?.construction) {
      setParams({ ...selectedNode.construction });
    } else {
      setParams({});
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="p-4 text-xs font-mono text-slate-500 italic text-center">
        No object selected. Select an object in the viewport or Outliner to view Attribute Editor.
      </div>
    );
  }

  const handleParamChange = (field: keyof ConstructionParams, valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return;

    sound.playTransformTick();
    const updated = { ...params, [field]: val };
    setParams(updated);
    onUpdateConstruction(selectedNode.id, updated);

    onLogAction('ATTRIBUTE_EDITOR_EDIT', {
      nodeId: selectedNode.id,
      property: field,
      newValue: val,
    });

    // Secret easter egg for generator frequency
    if (field === 'generatorFrequency' && (val === 1969 || val === 42)) {
      sound.playSecret();
      onLogAction('SECRET_FOUND', { secretName: `Cadet Secret: Fusion Resonator Tuned to Frequency ${val}` });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const renderNumberInput = (
    label: string,
    field: keyof ConstructionParams,
    val: number | undefined,
    step = 0.5,
    min = 0.1
  ) => {
    return (
      <div className="flex items-center justify-between py-1.5 px-3 border-b border-slate-800/60 text-xs font-mono">
        <span className="text-slate-400">{label}</span>
        <input
          type="number"
          step={step}
          min={min}
          value={val !== undefined ? val : ''}
          onChange={(e) => setParams((prev) => ({ ...prev, [field]: parseFloat(e.target.value) || 0 }))}
          onBlur={(e) => handleParamChange(field, e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-20 bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:bg-slate-950 text-cyan-200 text-right px-1.5 py-0.5 rounded outline-none font-mono tabular-nums text-xs"
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#0b0f19] select-none text-xs font-mono">
      {/* Node Info Header */}
      <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Shape / Node Attributes</div>
          <div className="font-bold text-cyan-300 truncate">{selectedNode.name}</div>
        </div>
        <div className="px-2 py-0.5 bg-cyan-950/70 border border-cyan-800 text-[10px] text-cyan-400 rounded">
          {selectedNode.type.toUpperCase()}
        </div>
      </div>

      {/* Maya Educational Concept Callout */}
      <div className="m-2.5 p-2.5 rounded bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-indigo-200">
        <div className="flex items-center gap-1.5 font-bold text-indigo-300 mb-1">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Maya Concept: Construction History vs. Transform Scale</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          <strong>Construction Inputs</strong> determine the base shape geometry before transforms.
          Notice how changing cylinder height or radius here maintains unscaled (1, 1, 1) transform scale!
        </p>
      </div>

      {/* Primitive Construction History Inputs */}
      <div className="flex-1 py-1">
        <div className="px-3 py-1.5 text-[10px] text-slate-500 tracking-wider uppercase font-semibold bg-slate-900/50 flex items-center gap-1.5">
          <Sliders className="w-3 h-3 text-cyan-400" />
          <span>Primitive Construction Inputs</span>
        </div>

        {selectedNode.type === 'cube' && (
          <>
            {renderNumberInput('Width', 'width', params.width ?? 2.0)}
            {renderNumberInput('Height', 'height', params.height ?? 2.0)}
            {renderNumberInput('Depth', 'depth', params.depth ?? 2.0)}
          </>
        )}

        {selectedNode.type === 'cylinder' && (
          <>
            {renderNumberInput('Radius Top', 'radiusTop', params.radiusTop ?? 1.0)}
            {renderNumberInput('Radius Bottom', 'radiusBottom', params.radiusBottom ?? 1.0)}
            {renderNumberInput('Height', 'height', params.height ?? 3.0)}
            {renderNumberInput('Subdivisions Axis', 'radialSegments', params.radialSegments ?? 16, 2, 6)}
          </>
        )}

        {selectedNode.type === 'sphere' && (
          <>
            {renderNumberInput('Radius', 'radius', params.radius ?? 2.0)}
            {renderNumberInput('Subdivisions Axis', 'widthSegments', params.widthSegments ?? 16, 2, 6)}
            {renderNumberInput('Subdivisions Height', 'heightSegments', params.heightSegments ?? 12, 2, 4)}
          </>
        )}

        {selectedNode.type === 'shield_dome' && (
          <>
            {renderNumberInput('Dome Radius', 'radius', params.radius ?? 3.0)}
            {renderNumberInput('Subdivisions', 'radialSegments', params.radialSegments ?? 24, 2, 8)}
          </>
        )}

        {/* Generator Frequency (Used for power grid mission) */}
        {selectedNode.construction?.generatorFrequency !== undefined && (
          <div className="mt-2">
            <div className="px-3 py-1 text-[10px] text-purple-400 uppercase font-semibold bg-purple-950/30 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>Core Output Frequency</span>
            </div>
            {renderNumberInput('Frequency (MHz)', 'generatorFrequency', params.generatorFrequency, 25, 10)}
          </div>
        )}

        {/* Material Properties Display */}
        <div className="px-3 py-1.5 mt-3 text-[10px] text-slate-500 tracking-wider uppercase font-semibold bg-slate-900/50">
          Shading & Render Stats
        </div>
        <div className="flex items-center justify-between py-1 px-3 text-slate-400">
          <span>Primary Material</span>
          <span className="text-slate-200">blinn / PBR Standard</span>
        </div>
        <div className="flex items-center justify-between py-1 px-3 text-slate-400">
          <span>Metalness</span>
          <span className="text-slate-200">{selectedNode.metalness ?? 0.5}</span>
        </div>
        <div className="flex items-center justify-between py-1 px-3 text-slate-400">
          <span>Roughness</span>
          <span className="text-slate-200">{selectedNode.roughness ?? 0.5}</span>
        </div>
        <div className="flex items-center justify-between py-1 px-3 text-slate-400">
          <span>Casts Shadows</span>
          <span className="text-emerald-400">Yes</span>
        </div>
      </div>

      {/* Description footer */}
      {selectedNode.description && (
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-slate-400 text-[11px]">
          <div className="text-slate-300 font-semibold mb-0.5">Asset Brief:</div>
          <div>{selectedNode.description}</div>
        </div>
      )}
    </div>
  );
};
