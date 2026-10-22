/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mission, MayaTool } from '../types/maya.ts';
import { sound } from '../audio/soundFx.ts';
import {
  MousePointer,
  Move,
  RotateCw,
  Maximize2,
  Focus,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  Play,
  Rotate3D,
  CheckCircle2,
} from 'lucide-react';

interface MissionHUDProps {
  mission: Mission;
  activeTool: MayaTool;
  onSelectTool: (tool: MayaTool) => void;
  onFrameSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onRestartMission: () => void;
  isStepComplete: boolean;
  onNextStep: () => void;
  arcadeScore: number;
  soundMuted: boolean;
  onToggleSound: () => void;
  threatCountdown: number;
}

export const MissionHUD: React.FC<MissionHUDProps> = ({
  mission,
  activeTool,
  onSelectTool,
  onFrameSelected,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onRestartMission,
  isStepComplete,
  onNextStep,
  arcadeScore,
  soundMuted,
  onToggleSound,
  threatCountdown,
}) => {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none w-[92%] max-w-4xl">
      {/* Top Mission Banner & Tool Toolbar */}
      <div className="w-full flex items-center justify-between bg-slate-950/90 border border-slate-800 backdrop-blur-md px-4 py-2.5 rounded-lg shadow-2xl pointer-events-auto">
        {/* Left: Mission Indicator & Threat Level */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                {mission.name}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-mono text-amber-400 font-semibold">
                THREAT LEVEL {mission.threatLevel}
              </span>
            </div>
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>{mission.subtitle}</span>
            </div>
          </div>
        </div>

        {/* Center: Maya Hotkey Tool Picker (Q, W, E, R, F) */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-md border border-slate-800">
          <button
            onClick={() => {
              onSelectTool('select');
              sound.playToolSwitch();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
              activeTool === 'select'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Select Tool (Hotkey: Q)"
            aria-label="Select tool Q"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Q</span>
          </button>

          <button
            onClick={() => {
              onSelectTool('move');
              sound.playToolSwitch();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
              activeTool === 'move'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Move Tool (Hotkey: W)"
            aria-label="Move tool W"
          >
            <Move className="w-3.5 h-3.5" />
            <span>W</span>
          </button>

          <button
            onClick={() => {
              onSelectTool('rotate');
              sound.playToolSwitch();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
              activeTool === 'rotate'
                ? 'bg-emerald-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Rotate Tool (Hotkey: E)"
            aria-label="Rotate tool E"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>E</span>
          </button>

          <button
            onClick={() => {
              onSelectTool('scale');
              sound.playToolSwitch();
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
              activeTool === 'scale'
                ? 'bg-sky-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Scale Tool (Hotkey: R)"
            aria-label="Scale tool R"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>R</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-1" />

          <button
            onClick={onFrameSelected}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Frame Selected (Hotkey: F)"
            aria-label="Frame selected F"
          >
            <Focus className="w-3.5 h-3.5 text-cyan-400" />
            <span>F</span>
          </button>
        </div>

        {/* Right: Actions, Score & Audio */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded transition-colors ${
                canUndo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRestartMission}
              className="text-[11px] font-mono px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors"
              title="Restart current mission stage"
            >
              Restart Stage
            </button>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Arcade Points</span>
            <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
              {arcadeScore.toLocaleString()} PTS
            </span>
          </div>

          <button
            onClick={onToggleSound}
            className="p-1.5 rounded text-slate-400 hover:text-cyan-300 transition-colors"
            title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-slate-600" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Objective Card & Solution Banner */}
      <div className="w-full flex items-center justify-between bg-slate-950/85 border border-cyan-900/50 backdrop-blur-md px-4 py-2 rounded-lg pointer-events-auto">
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold shrink-0">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>OBJECTIVE:</span>
          </div>
          <span className="text-slate-200">{mission.steps[0]?.instruction}</span>
        </div>

        {/* Dynamic Solution Action Button */}
        {isStepComplete ? (
          <button
            onClick={onNextStep}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all shrink-0 animate-pulse"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>FIRING SOLUTION CONFIRMED - NEUTRALIZE THREAT</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400/90 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ALIGN 3D TARGET COORDINATES</span>
          </div>
        )}
      </div>
    </div>
  );
};
