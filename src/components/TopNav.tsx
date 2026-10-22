/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mission } from '../types/maya.ts';
import { Award, FileText } from 'lucide-react';

interface TopNavProps {
  missions: Mission[];
  activeMissionId: number;
  onSelectMission: (id: number) => void;
  academicScore: number;
  onOpenRubric: () => void;
  onOpenReport: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  missions,
  activeMissionId,
  onSelectMission,
  academicScore,
  onOpenRubric,
  onOpenReport,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-4 py-2.5 bg-[#0b0f19] border-b border-slate-800 text-xs font-mono select-none z-30 shrink-0">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
          MAYA MISSION CONTROL
        </span>
        <span className="text-[11px] text-cyan-400 font-semibold tracking-wider uppercase hidden sm:inline">
          Operation Lunar Defense
        </span>
      </div>

      {/* Zone 2: 5 single-line stage jump links */}
      <nav className="flex items-center gap-2 overflow-x-auto py-0.5">
        {missions.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelectMission(m.id)}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 text-xs ${
              activeMissionId === m.id
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Stage {m.id}
          </button>
        ))}
      </nav>

      {/* Zone 3: 1 primary action cluster (Rubric score & report) */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenRubric}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 text-xs font-semibold transition-colors whitespace-nowrap"
          title="Open live Path to 100 competency rubric"
        >
          <Award className="w-3.5 h-3.5 text-cyan-400" />
          <span>Path to 100:</span>
          <span className="font-bold text-white">{academicScore}%</span>
        </button>

        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-colors whitespace-nowrap"
          title="View and download student proficiency report for Canvas"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Canvas Report</span>
        </button>
      </div>
    </header>
  );
};
