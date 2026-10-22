/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RubricSkill, StudentReport } from '../types/maya.ts';
import { generateCanvasSubmissionText } from '../game/scoring.ts';
import { sound } from '../audio/soundFx.ts';
import { Download, Copy, Check, Printer, X, FileText, Award, Sparkles } from 'lucide-react';

interface StudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: StudentReport;
  onUpdateStudentName: (name: string) => void;
}

export const StudentReportModal: React.FC<StudentReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onUpdateStudentName,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      sound.playSelect();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleCopySummary = () => {
    const text = generateCanvasSubmissionText(report);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopied(true);
          sound.playSelect();
          setTimeout(() => setCopied(false), 2500);
        },
        () => {
          fallbackCopy(text);
        }
      );
    } else {
      fallbackCopy(text);
    }
  };

  const handleDownload = () => {
    const text = generateCanvasSubmissionText(report);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Maya_Lunar_Defense_${(report.studentName || 'Student').replace(/\s+/g, '_')}_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sound.playSelect();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0b0f19] border border-cyan-800 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                STUDENT PROFICIENCY & CANVAS SUBMISSION REPORT
              </h2>
              <p className="text-xs text-slate-400">
                Autodesk Maya 3D Modeling Skills Certification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close Report"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Student Name Input */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col gap-2">
            <label className="text-xs font-mono font-semibold text-cyan-300 uppercase">
              Student / Cadet Name:
            </label>
            <input
              type="text"
              value={report.studentName}
              onChange={(e) => onUpdateStudentName(e.target.value)}
              placeholder="Enter your full name for your grade report"
              className="bg-slate-950 border border-slate-700 focus:border-cyan-400 text-white px-3 py-2 rounded font-mono text-sm outline-none"
            />
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-900/80 border border-cyan-900/60 rounded-lg text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Academic Score</span>
              <span className="text-2xl font-mono font-bold text-cyan-300 tabular-nums">
                {report.academicScore} / 100
              </span>
              <span className="text-[11px] font-mono text-emerald-400 block mt-0.5 font-semibold">
                {report.academicScore >= 90 ? 'Grade A' : report.academicScore >= 80 ? 'Grade B' : report.academicScore >= 70 ? 'Grade C' : 'Cadet'}
              </span>
            </div>

            <div className="p-3 bg-slate-900/80 border border-amber-900/60 rounded-lg text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Arcade Points</span>
              <span className="text-2xl font-mono font-bold text-amber-300 tabular-nums">
                {report.arcadeScore.toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Defensive Rating</span>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Stages Cleared</span>
              <span className="text-2xl font-mono font-bold text-purple-300 tabular-nums">
                {report.missionsCompleted} / {report.totalMissions}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block mt-0.5">60-Min Curriculum</span>
            </div>
          </div>

          {/* Competency Breakdown Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden font-mono text-xs">
            <div className="bg-slate-900 px-3 py-2 text-slate-300 font-semibold flex justify-between border-b border-slate-800">
              <span>MAYA COMPETENCY</span>
              <span>SCORE</span>
            </div>
            <div className="divide-y divide-slate-800/80 bg-slate-950/40">
              {report.skills.map((s) => (
                <div key={s.id} className="p-2.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-slate-200 font-medium flex items-center gap-2">
                      <span>{s.title}</span>
                      {s.isMastered && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded font-semibold">
                          MASTERED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {s.evidence.length > 0 ? s.evidence.join(' · ') : 'No demonstration verified'}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-bold text-cyan-300">
                    {s.currentPoints} / {s.maxPoints}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Easter Eggs Section */}
          {report.secretsUnlocked.length > 0 && (
            <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-xs font-mono">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Discovered Cadet Secrets:</span>
              </div>
              <ul className="list-disc list-inside text-amber-200/90 pl-1 space-y-0.5 text-[11px]">
                {report.secretsUnlocked.map((sec, idx) => (
                  <li key={idx}>{sec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Canvas Manual Notice */}
          <div className="p-3 bg-sky-950/30 border border-sky-800/50 rounded-lg text-[11px] font-mono text-sky-200 leading-relaxed">
            <span className="font-bold text-sky-300 block mb-0.5">Canvas Classroom Submission Notice:</span>
            In Version 1, Canvas integration is manual. Click <strong>"Copy Score Summary"</strong> or <strong>"Download Report for Canvas"</strong> below, and paste or upload the file directly into your Canvas assignment submission box.
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Score Summary'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report for Canvas</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-mono text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
