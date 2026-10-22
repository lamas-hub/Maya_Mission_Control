/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MayaActionEvent, RubricSkill, StudentReport } from '../types/maya.ts';

export const BASE_RUBRIC_SKILLS: Omit<RubricSkill, 'currentPoints' | 'isMastered' | 'evidence'>[] = [
  {
    id: 'nav_maya_camera',
    category: 'NAVIGATION',
    title: 'Maya Camera Navigation & Framing',
    description: 'Demonstrate fluent Maya viewport navigation using Alt + LMB (Orbit), Alt + MMB (Pan), Alt + RMB (Dolly), and F (Frame Selected).',
    maxPoints: 15,
    remainingCriteria: 'Perform camera Orbit, Pan, Dolly, and press F to frame a target in the 3D viewport.',
  },
  {
    id: 'select_q_tool',
    category: 'SELECTION',
    title: 'Selection Tool & Viewport Picking (Q)',
    description: 'Select objects using Q Select tool, 3D viewport raycast picking, and verify selection synchronization across Outliner and Channel Box.',
    maxPoints: 10,
    remainingCriteria: 'Activate Select Tool (Q) and select at least 3 distinct base structures in the viewport.',
  },
  {
    id: 'transform_manipulators',
    category: 'TRANSFORMATION',
    title: 'Interactive Manipulators (W, E, R)',
    description: 'Utilize 3D transform manipulators to Translate (W), Rotate (E), and Scale (R) game objects to intercept asteroids and align defenses.',
    maxPoints: 20,
    remainingCriteria: 'Use Move (W), Rotate (E), and Scale (R) manipulators to reposition and aim defenses.',
  },
  {
    id: 'channel_box_precision',
    category: 'CHANNEL_BOX',
    title: 'Channel Box Precision Edits',
    description: 'Perform exact numeric entry for Translate, Rotate, Scale coordinates and toggle Visibility via the Channel Box.',
    maxPoints: 15,
    remainingCriteria: 'Directly type numeric transform values and toggle visibility in the Channel Box.',
  },
  {
    id: 'attr_editor_construction',
    category: 'ATTRIBUTE_EDITOR',
    title: 'Attribute Editor & Construction History',
    description: 'Modify shape construction parameters (primitive radius, width, depth, height) and distinguish from transform scaling.',
    maxPoints: 15,
    remainingCriteria: 'Modify primitive construction dimensions in the Attribute Editor without scaling.',
  },
  {
    id: 'outliner_hierarchy',
    category: 'OUTLINER',
    title: 'Outliner Hierarchy & Organization',
    description: 'Navigate the scene tree hierarchy, expand groups, select nodes, and rename lunar defense assets in the Outliner.',
    maxPoints: 10,
    remainingCriteria: 'Select objects through the Outliner, expand groups, and rename at least one defense node.',
  },
  {
    id: 'independent_certification',
    category: 'INDEPENDENT_DEFENSE',
    title: 'Independent Lunar Defense Certification',
    description: 'Solve the Mission 5 lunar invasion scenario independently without guided hints, combining all Maya tools.',
    maxPoints: 15,
    remainingCriteria: 'Successfully complete Mission 5 (Independent Defense) without relying on guided hints.',
  },
];

export interface EvaluationResult {
  skills: RubricSkill[];
  totalScore: number; // 0 - 100
  masteredCount: number;
  unlockedSecrets: string[];
}

export function evaluateStudentRubric(
  events: MayaActionEvent[],
  completedMissions: number[],
  secretCodesDiscovered: string[] = []
): EvaluationResult {
  // Navigation
  const hasOrbit = events.some((e) => e.type === 'CAMERA_ORBIT');
  const hasPan = events.some((e) => e.type === 'CAMERA_PAN');
  const hasDolly = events.some((e) => e.type === 'CAMERA_DOLLY');
  const hasFrame = events.some((e) => e.type === 'CAMERA_FRAME');
  const navEvs: string[] = [];
  if (hasOrbit) navEvs.push('Alt+LMB Orbit performed');
  if (hasPan) navEvs.push('Alt+MMB Pan performed');
  if (hasDolly) navEvs.push('Alt+RMB Dolly performed');
  if (hasFrame) navEvs.push('Hotkey F (Frame Selected) executed');

  let navPts = 0;
  if (hasOrbit) navPts += 4;
  if (hasPan) navPts += 4;
  if (hasDolly) navPts += 4;
  if (hasFrame) navPts += 3;

  // Selection
  const selectEvents = events.filter((e) => e.type === 'SELECT_OBJECT');
  const distinctSelected = new Set(selectEvents.map((e) => e.nodeId).filter(Boolean));
  const hasQ = events.some((e) => e.type === 'CHANGE_TOOL' && e.property === 'select');
  const selectEvs: string[] = [];
  if (hasQ) selectEvs.push('Select Tool (Q) hotkey activated');
  if (distinctSelected.size > 0) {
    selectEvs.push(`Selected ${distinctSelected.size} distinct 3D objects in viewport`);
  }
  let selectPts = 0;
  if (hasQ) selectPts += 3;
  if (distinctSelected.size >= 1) selectPts += 3;
  if (distinctSelected.size >= 3) selectPts += 4;

  // Transformations (W, E, R)
  const hasMove = events.some((e) => e.type === 'TRANSFORM_MOVE');
  const hasRotate = events.some((e) => e.type === 'TRANSFORM_ROTATE');
  const hasScale = events.some((e) => e.type === 'TRANSFORM_SCALE');
  const transformEvs: string[] = [];
  if (hasMove) transformEvs.push('Move Tool (W) used to translate defense structures');
  if (hasRotate) transformEvs.push('Rotate Tool (E) used to aim defense turrets');
  if (hasScale) transformEvs.push('Scale Tool (R) used to resize lunar shields');

  let transformPts = 0;
  if (hasMove) transformPts += 7;
  if (hasRotate) transformPts += 7;
  if (hasScale) transformPts += 6;

  // Channel Box
  const cbEdits = events.filter((e) => e.type === 'CHANNEL_BOX_EDIT' && e.isManualDirectInput);
  const cbProperties = new Set(cbEdits.map((e) => e.property));
  const cbEvs: string[] = [];
  if (cbEdits.length > 0) {
    cbEvs.push(`${cbEdits.length} direct numeric coordinate inputs in Channel Box`);
  }
  if (cbProperties.has('visibility')) {
    cbEvs.push('Toggled object visibility attribute');
  }

  let cbPts = 0;
  if (cbEdits.length >= 1) cbPts += 5;
  if (cbEdits.length >= 3) cbPts += 5;
  if (cbProperties.has('visibility') || cbProperties.size >= 2) cbPts += 5;

  // Attribute Editor & Construction History
  const attrEdits = events.filter((e) => e.type === 'ATTRIBUTE_EDITOR_EDIT');
  const attrEvs: string[] = [];
  if (attrEdits.length > 0) {
    attrEvs.push(`Adjusted ${attrEdits.length} primitive construction history parameters`);
  }
  let attrPts = 0;
  if (attrEdits.length >= 1) attrPts += 7;
  if (attrEdits.length >= 2) attrPts += 8;

  // Outliner Hierarchy
  const outlinerSelects = events.filter((e) => e.type === 'OUTLINER_SELECT');
  const outlinerRenames = events.filter((e) => e.type === 'OUTLINER_RENAME');
  const outlinerEvs: string[] = [];
  if (outlinerSelects.length > 0) {
    outlinerEvs.push('Navigated scene graph and selected nodes from Outliner');
  }
  if (outlinerRenames.length > 0) {
    outlinerEvs.push(`Renamed node in Outliner: "${outlinerRenames[0]?.oldValue}" -> "${outlinerRenames[0]?.newValue}"`);
  }
  let outlinerPts = 0;
  if (outlinerSelects.length >= 1) outlinerPts += 5;
  if (outlinerRenames.length >= 1) outlinerPts += 5;

  // Independent Certification (Mission 5)
  const isMission5Complete = completedMissions.includes(5);
  const indepEvs: string[] = [];
  let indepPts = 0;
  if (isMission5Complete) {
    indepEvs.push('Completed Mission 5 (Independent Lunar Defense Certification) successfully');
    indepPts = 15;
  }

  // Compile final skills
  const skills: RubricSkill[] = [
    {
      ...BASE_RUBRIC_SKILLS[0],
      currentPoints: Math.min(navPts, 15),
      isMastered: navPts >= 15,
      evidence: navEvs,
      remainingCriteria:
        navPts >= 15
          ? 'Full proficiency demonstrated.'
          : `Missing: ${[!hasOrbit && 'Alt+LMB Orbit', !hasPan && 'Alt+MMB Pan', !hasDolly && 'Alt+RMB Dolly', !hasFrame && 'Hotkey F'].filter(Boolean).join(', ')}.`,
    },
    {
      ...BASE_RUBRIC_SKILLS[1],
      currentPoints: Math.min(selectPts, 10),
      isMastered: selectPts >= 10,
      evidence: selectEvs,
      remainingCriteria:
        selectPts >= 10
          ? 'Full proficiency demonstrated.'
          : `Activate Q hotkey and select at least ${Math.max(0, 3 - distinctSelected.size)} more unique objects in the 3D viewport.`,
    },
    {
      ...BASE_RUBRIC_SKILLS[2],
      currentPoints: Math.min(transformPts, 20),
      isMastered: transformPts >= 20,
      evidence: transformEvs,
      remainingCriteria:
        transformPts >= 20
          ? 'Full proficiency demonstrated.'
          : `Missing transform manipulators: ${[!hasMove && 'Move (W)', !hasRotate && 'Rotate (E)', !hasScale && 'Scale (R)'].filter(Boolean).join(', ')}.`,
    },
    {
      ...BASE_RUBRIC_SKILLS[3],
      currentPoints: Math.min(cbPts, 15),
      isMastered: cbPts >= 15,
      evidence: cbEvs,
      remainingCriteria:
        cbPts >= 15
          ? 'Full proficiency demonstrated.'
          : 'Enter numeric coordinates directly into Channel Box inputs and toggle visibility.',
    },
    {
      ...BASE_RUBRIC_SKILLS[4],
      currentPoints: Math.min(attrPts, 15),
      isMastered: attrPts >= 15,
      evidence: attrEvs,
      remainingCriteria:
        attrPts >= 15
          ? 'Full proficiency demonstrated.'
          : 'Edit primitive construction parameters (radius, height, width) in the Attribute Editor tab.',
    },
    {
      ...BASE_RUBRIC_SKILLS[5],
      currentPoints: Math.min(outlinerPts, 10),
      isMastered: outlinerPts >= 10,
      evidence: outlinerEvs,
      remainingCriteria:
        outlinerPts >= 10
          ? 'Full proficiency demonstrated.'
          : `Missing Outliner demonstrations: ${[!outlinerSelects.length && 'Select node in Outliner', !outlinerRenames.length && 'Rename node in Outliner'].filter(Boolean).join(', ')}.`,
    },
    {
      ...BASE_RUBRIC_SKILLS[6],
      currentPoints: Math.min(indepPts, 15),
      isMastered: indepPts >= 15,
      evidence: indepEvs,
      remainingCriteria:
        indepPts >= 15
          ? 'Full proficiency demonstrated.'
          : 'Complete Mission 5: Independent Lunar Defense scenario to earn certification credit.',
    },
  ];

  const totalScore = skills.reduce((sum, s) => sum + s.currentPoints, 0);
  const masteredCount = skills.filter((s) => s.isMastered).length;

  return {
    skills,
    totalScore,
    masteredCount,
    unlockedSecrets: secretCodesDiscovered,
  };
}

export function generateCanvasSubmissionText(report: StudentReport): string {
  const line = '------------------------------------------------------------';
  return [
    `MAYA MISSION CONTROL: OPERATION LUNAR DEFENSE - STUDENT REPORT`,
    line,
    `Student Name:     ${report.studentName || 'Classroom Cadet'}`,
    `Date Completed:   ${report.completionDate}`,
    `Academic Grade:   ${report.academicScore} / 100 (${report.academicScore >= 90 ? 'EXEMPLARY (A)' : report.academicScore >= 80 ? 'PROFICIENT (B)' : report.academicScore >= 70 ? 'DEVELOPING (C)' : 'EMERGING'})`,
    `Arcade Points:    ${report.arcadeScore.toLocaleString()} PTS`,
    `Missions Cleared: ${report.missionsCompleted} / ${report.totalMissions}`,
    line,
    `DETAILED COMPETENCY RUBRIC BREAKDOWN (Deterministic Assessment):`,
    ...report.skills.map(
      (s) =>
        `[${s.currentPoints.toString().padStart(2, ' ')} / ${s.maxPoints.toString().padStart(2, ' ')} pts] ${s.title.padEnd(42, ' ')} ${s.isMastered ? '[MASTERED]' : '[IN PROGRESS]'}\n  Evidence: ${s.evidence.length > 0 ? s.evidence.join('; ') : 'None yet recorded'}\n  Criteria Status: ${s.remainingCriteria}`
    ),
    line,
    `DISCOVERED EASTER EGGS / CADET SECRETS:`,
    report.secretsUnlocked.length > 0
      ? report.secretsUnlocked.map((sec) => `* ${sec}`).join('\n')
      : '* None discovered (Secrets are optional and do not penalize academic grade)',
    line,
    `* NOTE FOR STUDENTS & TEACHERS:`,
    `In Version 1, Canvas upload is manual. Please copy this text summary`,
    `or save your downloaded report, then paste it into your Canvas assignment submission box.`,
    line,
  ].join('\n');
}
