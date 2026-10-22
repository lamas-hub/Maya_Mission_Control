/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Keyboard } from 'lucide-react';

export const MayaShortcutBar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center transition-transform duration-200 select-none ${
        collapsed ? 'translate-y-12' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-t bg-slate-950/80 border-t border-x border-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 backdrop-blur-md shadow"
        aria-label={collapsed ? 'Show Maya shortcuts' : 'Hide Maya shortcuts'}
      >
        <Keyboard className="w-3 h-3 text-cyan-400" />
        <span>{collapsed ? '▴ Show Maya Shortcuts' : '▾ Maya Hotkeys'}</span>
      </button>

      {/* Shortcut Badges Dock */}
      <div className="flex items-center gap-4 bg-slate-950/90 border border-slate-800 backdrop-blur-md px-4 py-2 rounded-lg text-xs font-mono text-slate-300 shadow-2xl">
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded font-bold text-[11px]">Q</span>
          <span className="text-slate-400">Select</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded font-bold text-[11px]">W</span>
          <span className="text-slate-400">Move</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-slate-800 text-emerald-300 rounded font-bold text-[11px]">E</span>
          <span className="text-slate-400">Rotate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-slate-800 text-sky-300 rounded font-bold text-[11px]">R</span>
          <span className="text-slate-400">Scale</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-slate-800 text-purple-300 rounded font-bold text-[11px]">F</span>
          <span className="text-slate-400">Frame</span>
        </div>

        <div className="w-[1px] h-4 bg-slate-800" />

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span><strong className="text-slate-200">Alt + LMB:</strong> Orbit</span>
          <span><strong className="text-slate-200">Alt + MMB:</strong> Pan</span>
          <span><strong className="text-slate-200">Alt + RMB:</strong> Dolly</span>
        </div>
      </div>
    </div>
  );
};
