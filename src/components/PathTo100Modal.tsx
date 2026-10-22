/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RubricSkill } from '../types/maya.ts';
import { CheckCircle2, Circle, X, Award, Target, HelpCircle, ShieldCheck } from 'lucide-react';

interface PathTo100ModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: RubricSkill[];
  totalScore: number;
}

export const PathTo100Modal: React.FC<PathTo100ModalProps> = ({
  isOpen,
  onClose,
  skills,
  totalScore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl bg-[#0b0f19] border border-cyan-900/80 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>PATH TO 100: LIVE COMPETENCY RUBRIC</span>
                <span className="text-xs font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">
                  {totalScore} / 100 PTS
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic high school 3D modeling assessment. 100% is achievable through real demonstrations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close Rubric"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Progress Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
              <span>ACADEMIC PROFICIENCY PROGRESS</span>
              <span className="text-cyan-300 font-bold">{totalScore}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, totalScore))}%` }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono text-slate-500 block">CURRENT GRADE</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {totalScore >= 90 ? 'Grade A (Exemplary)' : totalScore >= 80 ? 'Grade B (Proficient)' : totalScore >= 70 ? 'Grade C (Developing)' : 'Emerging Cadet'}
            </span>
          </div>
        </div>

        {/* Skills List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className={`p-4 rounded-lg border transition-all ${
                skill.isMastered
                  ? 'bg-cyan-950/20 border-cyan-800/60'
                  : 'bg-slate-900/40 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2.5">
                  {skill.isMastered ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-white">{skill.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{skill.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {skill.currentPoints} / {skill.maxPoints} pts
                  </span>
                  <div className="text-[10px] font-mono text-slate-500">
                    {skill.isMastered ? 'MASTERED' : 'IN PROGRESS'}
                  </div>
                </div>
              </div>

              {/* Concrete Evidence Section */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col gap-1 text-xs font-mono">
                <div className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Demonstrated Evidence:</span>
                </div>
                {skill.evidence.length > 0 ? (
                  <ul className="list-disc list-inside text-cyan-200/90 pl-1 space-y-0.5">
                    {skill.evidence.map((ev, idx) => (
                      <li key={idx}>{ev}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-500 italic pl-1">No verified demonstration logged yet.</span>
                )}

                {/* Remaining Criteria */}
                {!skill.isMastered && (
                  <div className="mt-1 text-amber-300/90 flex items-start gap-1.5 text-[11px] bg-amber-950/20 p-2 rounded border border-amber-900/30">
                    <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span><strong>Remaining for Full Points:</strong> {skill.remainingCriteria}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-400">
            * Assessment rule: Viewing step instructions or copying solutions does not award points. You must execute genuine 3D viewport actions.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold transition-colors"
          >
            Return to Mission
          </button>
        </div>
      </div>
    </div>
  );
};
