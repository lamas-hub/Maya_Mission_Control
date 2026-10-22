/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  MayaNode,
  MayaTool,
  Vector3D,
  ConstructionParams,
  MayaActionEvent,
  StudentReport,
} from './types/maya.ts';
import { createInitialScene, MISSIONS } from './scene/initialScene.ts';
import { evaluateStudentRubric } from './game/scoring.ts';
import { sound } from './audio/soundFx.ts';

import { TopNav } from './components/TopNav.tsx';
import { Viewport3D } from './components/Viewport3D.tsx';
import { OutlinerPanel } from './components/OutlinerPanel.tsx';
import { ChannelBox } from './components/ChannelBox.tsx';
import { AttributeEditor } from './components/AttributeEditor.tsx';
import { MissionHUD } from './components/MissionHUD.tsx';
import { MayaShortcutBar } from './components/MayaShortcutBar.tsx';
import { PathTo100Modal } from './components/PathTo100Modal.tsx';
import { StudentReportModal } from './components/StudentReportModal.tsx';

export default function App() {
  // Shared 3D Scene State
  const [sceneNodes, setSceneNodes] = useState<Record<string, MayaNode>>(() => createInitialScene());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('turret_alpha');
  const [activeTool, setActiveTool] = useState<MayaTool>('rotate');
  const [activeRightTab, setActiveRightTab] = useState<'channelBox' | 'attributeEditor'>('channelBox');

  // Mission & Assessment State
  const [activeMissionId, setActiveMissionId] = useState<number>(1);
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [actionHistory, setActionHistory] = useState<MayaActionEvent[]>([]);
  const [discoveredSecrets, setDiscoveredSecrets] = useState<string[]>([]);
  const [arcadeScore, setArcadeScore] = useState<number>(1000);
  const [studentName, setStudentName] = useState<string>(() => {
    try {
      return localStorage.getItem('maya_student_name') || 'Cadet Pilot';
    } catch {
      return 'Cadet Pilot';
    }
  });

  // Modals
  const [isRubricOpen, setIsRubricOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Sound State
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Firing laser FX
  const [laserFiring, setLaserFiring] = useState<{ from: Vector3D; to: Vector3D } | null>(null);

  // Undo / Redo History
  const [undoStack, setUndoStack] = useState<Record<string, MayaNode>[]>([]);
  const [redoStack, setRedoStack] = useState<Record<string, MayaNode>[]>([]);

  // Threat timer
  const [threatCountdown, setThreatCountdown] = useState<number>(60);

  // Current Mission Object
  const currentMission = MISSIONS.find((m) => m.id === activeMissionId) || MISSIONS[0];

  // Log action callback for rubric
  const logAction = useCallback((type: any, details: any = {}) => {
    const event: MayaActionEvent = {
      type,
      timestamp: Date.now(),
      ...details,
    };
    setActionHistory((prev) => [...prev, event]);

    if (type === 'SECRET_FOUND' && details.secretName) {
      setDiscoveredSecrets((prev) => {
        if (!prev.includes(details.secretName)) {
          setArcadeScore((s) => s + 2500);
          return [...prev, details.secretName];
        }
        return prev;
      });
    }
  }, []);

  // Save student name
  const handleUpdateStudentName = (name: string) => {
    setStudentName(name);
    try {
      localStorage.setItem('maya_student_name', name);
    } catch {
      // ignore
    }
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  // Hotkey Tool Switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === 'q' || e.key === 'Q') {
        setActiveTool('select');
        sound.playToolSwitch();
        logAction('CHANGE_TOOL', { property: 'select' });
      } else if (e.key === 'w' || e.key === 'W') {
        setActiveTool('move');
        sound.playToolSwitch();
        logAction('CHANGE_TOOL', { property: 'move' });
      } else if (e.key === 'e' || e.key === 'E') {
        setActiveTool('rotate');
        sound.playToolSwitch();
        logAction('CHANGE_TOOL', { property: 'rotate' });
      } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool('scale');
        sound.playToolSwitch();
        logAction('CHANGE_TOOL', { property: 'scale' });
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack]);

  // Push snapshot to undo stack
  const pushUndoSnapshot = () => {
    setUndoStack((prev) => [...prev.slice(-15), JSON.parse(JSON.stringify(sceneNodes))]);
    setRedoStack([]);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(sceneNodes))]);
    setSceneNodes(previous);
    sound.playSelect();
    logAction('UNDO');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(sceneNodes))]);
    setSceneNodes(next);
    sound.playSelect();
    logAction('REDO');
  };

  // Transform node handler
  const handleTransformNode = (
    nodeId: string,
    transform: { position: Vector3D; rotation: Vector3D; scale: Vector3D; visibility?: boolean }
  ) => {
    setSceneNodes((prev) => {
      const target = prev[nodeId];
      if (!target) return prev;
      return {
        ...prev,
        [nodeId]: {
          ...target,
          position: transform.position,
          rotation: transform.rotation,
          scale: transform.scale,
          visibility: transform.visibility !== undefined ? transform.visibility : target.visibility,
        },
      };
    });
  };

  // Update construction parameters in Attribute Editor
  const handleUpdateConstruction = (nodeId: string, construction: ConstructionParams) => {
    pushUndoSnapshot();
    setSceneNodes((prev) => {
      const target = prev[nodeId];
      if (!target) return prev;
      return {
        ...prev,
        [nodeId]: {
          ...target,
          construction: {
            ...target.construction,
            ...construction,
          },
        },
      };
    });
  };

  // Toggle visibility from Outliner
  const handleToggleVisibility = (nodeId: string) => {
    pushUndoSnapshot();
    setSceneNodes((prev) => {
      const target = prev[nodeId];
      if (!target) return prev;
      const nextVis = !target.visibility;
      logAction('CHANNEL_BOX_EDIT', { nodeId, property: 'visibility', newValue: nextVis, isManualDirectInput: true });
      return {
        ...prev,
        [nodeId]: {
          ...target,
          visibility: nextVis,
        },
      };
    });
  };

  // Rename node from Outliner
  const handleRenameNode = (nodeId: string, newName: string) => {
    pushUndoSnapshot();
    setSceneNodes((prev) => {
      const target = prev[nodeId];
      if (!target) return prev;
      return {
        ...prev,
        [nodeId]: {
          ...target,
          name: newName,
        },
      };
    });
  };

  // Check if current mission step is satisfied
  const currentStep = currentMission.steps[0];
  const isStepComplete = Boolean(currentStep?.validate(sceneNodes, actionHistory));

  // Handle stage advance / defensive engagement
  const handleAdvanceStep = () => {
    if (!isStepComplete) return;

    // Fire laser at incoming asteroid
    if (activeMissionId === 1) {
      setLaserFiring({
        from: sceneNodes.turret_alpha?.position || { x: 0, y: 0, z: 8 },
        to: sceneNodes.ASTEROID_ALPHA?.position || { x: 18, y: 14, z: 22 },
      });
      // Hide asteroid after hit
      setTimeout(() => {
        setSceneNodes((prev) => ({
          ...prev,
          ASTEROID_ALPHA: { ...prev.ASTEROID_ALPHA, visibility: false },
        }));
      }, 350);
    } else if (activeMissionId === 2) {
      setLaserFiring({
        from: sceneNodes.interceptor_beacon_1?.position || { x: -12, y: 1, z: 8 },
        to: sceneNodes.ASTEROID_BETA?.position || { x: -20, y: 16, z: 14 },
      });
      setTimeout(() => {
        setSceneNodes((prev) => ({
          ...prev,
          ASTEROID_BETA: { ...prev.ASTEROID_BETA, visibility: false },
        }));
      }, 350);
    } else if (activeMissionId === 3) {
      sound.playShieldHum();
    } else if (activeMissionId === 5) {
      setLaserFiring({
        from: sceneNodes.turret_backup?.position || { x: 8, y: 0, z: -12 },
        to: sceneNodes.METEOR_TITAN?.position || { x: 12, y: 20, z: -22 },
      });
      setTimeout(() => {
        setSceneNodes((prev) => ({
          ...prev,
          METEOR_TITAN: { ...prev.METEOR_TITAN, visibility: false },
          METEOR_SWARM: { ...prev.METEOR_SWARM, visibility: false },
        }));
      }, 350);
    }

    sound.playVictory();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    setArcadeScore((s) => s + 3000);
    setCompletedMissions((prev) => (prev.includes(activeMissionId) ? prev : [...prev, activeMissionId]));

    // Advance to next mission stage or open report if completed
    setTimeout(() => {
      if (activeMissionId < 5) {
        handleSelectMission(activeMissionId + 1);
      } else {
        setIsReportOpen(true);
      }
    }, 1200);
  };

  // Switch mission
  const handleSelectMission = (id: number) => {
    setActiveMissionId(id);
    sound.playSelect();

    // Mission-specific setup adjustments
    if (id === 1) {
      setSelectedNodeId('turret_alpha');
      setActiveTool('rotate');
      setActiveRightTab('channelBox');
    } else if (id === 2) {
      setSelectedNodeId('interceptor_beacon_1');
      setActiveTool('move');
      setActiveRightTab('channelBox');
      setSceneNodes((prev) => ({
        ...prev,
        ASTEROID_BETA: { ...prev.ASTEROID_BETA, visibility: true },
      }));
    } else if (id === 3) {
      setSelectedNodeId('shield_dome_alpha');
      setActiveTool('scale');
      setActiveRightTab('channelBox');
    } else if (id === 4) {
      setSelectedNodeId('comm_relay_array');
      setActiveTool('select');
      setActiveRightTab('channelBox');
    } else if (id === 5) {
      setSelectedNodeId('turret_backup');
      setActiveTool('move');
      setActiveRightTab('channelBox');
      setSceneNodes((prev) => ({
        ...prev,
        METEOR_TITAN: { ...prev.METEOR_TITAN, visibility: true },
        METEOR_SWARM: { ...prev.METEOR_SWARM, visibility: true },
      }));
    }
  };

  // Restart current mission stage
  const handleRestartMission = () => {
    sound.playSelect();
    const freshScene = createInitialScene();
    setSceneNodes(freshScene);
    handleSelectMission(activeMissionId);
  };

  // Frame selected callback
  const handleFrameSelected = () => {
    const evt = new KeyboardEvent('keydown', { key: 'f' });
    window.dispatchEvent(evt);
  };

  // Evaluate live rubric
  const rubricResult = evaluateStudentRubric(actionHistory, completedMissions, discoveredSecrets);

  // Student report object
  const studentReport: StudentReport = {
    studentName,
    completionDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    academicScore: rubricResult.totalScore,
    arcadeScore,
    missionsCompleted: completedMissions.length,
    totalMissions: MISSIONS.length,
    skills: rubricResult.skills,
    secretsUnlocked: discoveredSecrets,
    evidenceSummary: rubricResult.skills.flatMap((s) => s.evidence),
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#060913] text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Navigation */}
      <TopNav
        missions={MISSIONS}
        activeMissionId={activeMissionId}
        onSelectMission={handleSelectMission}
        academicScore={rubricResult.totalScore}
        onOpenRubric={() => setIsRubricOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Maya Outliner Panel */}
        <OutlinerPanel
          sceneNodes={sceneNodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => {
            setSelectedNodeId(id);
            // Default tool if selecting
            if (id?.includes('turret') && activeTool === 'select') {
              setActiveTool('rotate');
            }
          }}
          onToggleVisibility={handleToggleVisibility}
          onRenameNode={handleRenameNode}
          onLogAction={logAction}
        />

        {/* Center: 3D Viewport with Maya controls */}
        <div className="flex-1 relative overflow-hidden">
          {/* Mission HUD Overlay */}
          <MissionHUD
            mission={currentMission}
            activeTool={activeTool}
            onSelectTool={(tool) => {
              setActiveTool(tool);
              logAction('CHANGE_TOOL', { property: tool });
            }}
            onFrameSelected={handleFrameSelected}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onRestartMission={handleRestartMission}
            isStepComplete={isStepComplete}
            onNextStep={handleAdvanceStep}
            arcadeScore={arcadeScore}
            soundMuted={isMuted}
            onToggleSound={handleToggleSound}
            threatCountdown={threatCountdown}
          />

          {/* Interactive Three.js Viewport */}
          <Viewport3D
            sceneNodes={sceneNodes}
            selectedNodeId={selectedNodeId}
            activeTool={activeTool}
            activeMissionId={activeMissionId}
            onSelectNode={(id) => setSelectedNodeId(id)}
            onTransformNode={handleTransformNode}
            onLogAction={logAction}
            laserFiring={laserFiring}
          />

          {/* Bottom Center: Maya Shortcut Bar */}
          <MayaShortcutBar />
        </div>

        {/* Right: Maya Channel Box & Attribute Editor Panel */}
        <div className="w-72 h-full bg-[#0b0f19] border-l border-slate-800 flex flex-col shrink-0 select-none">
          {/* Right Panel Tabs */}
          <div className="flex items-center bg-slate-900 border-b border-slate-800">
            <button
              onClick={() => {
                setActiveRightTab('channelBox');
                sound.playSelect();
              }}
              className={`flex-1 py-2 text-xs font-mono font-semibold transition-colors border-b-2 ${
                activeRightTab === 'channelBox'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-950/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Channel Box
            </button>
            <button
              onClick={() => {
                setActiveRightTab('attributeEditor');
                sound.playSelect();
              }}
              className={`flex-1 py-2 text-xs font-mono font-semibold transition-colors border-b-2 ${
                activeRightTab === 'attributeEditor'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-950/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Attribute Editor
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeRightTab === 'channelBox' ? (
              <ChannelBox
                selectedNode={selectedNodeId ? sceneNodes[selectedNodeId] || null : null}
                onUpdateTransform={(nodeId, transform) => {
                  pushUndoSnapshot();
                  handleTransformNode(nodeId, transform);
                }}
                onLogAction={logAction}
              />
            ) : (
              <AttributeEditor
                selectedNode={selectedNodeId ? sceneNodes[selectedNodeId] || null : null}
                onUpdateConstruction={handleUpdateConstruction}
                onLogAction={logAction}
              />
            )}
          </div>
        </div>
      </div>

      {/* Path to 100 Live Rubric Modal */}
      <PathTo100Modal
        isOpen={isRubricOpen}
        onClose={() => setIsRubricOpen(false)}
        skills={rubricResult.skills}
        totalScore={rubricResult.totalScore}
      />

      {/* Student Proficiency Report Modal */}
      <StudentReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={studentReport}
        onUpdateStudentName={handleUpdateStudentName}
      />
    </div>
  );
}
