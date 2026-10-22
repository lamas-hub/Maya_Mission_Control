/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStudentRubric, generateCanvasSubmissionText } from './scoring.ts';
import { MayaActionEvent } from '../types/maya.ts';

test('initial student state has 0 points and clearly states criteria remaining', () => {
  const result = evaluateStudentRubric([], []);
  assert.equal(result.totalScore, 0);
  assert.equal(result.masteredCount, 0);
  assert.equal(result.skills.length, 7);
  assert.ok(result.skills[0].remainingCriteria.includes('Alt+LMB'));
});

test('camera navigation awards up to 15 points deterministically', () => {
  const events: MayaActionEvent[] = [
    { type: 'CAMERA_ORBIT', timestamp: 100 },
    { type: 'CAMERA_PAN', timestamp: 200 },
    { type: 'CAMERA_DOLLY', timestamp: 300 },
    { type: 'CAMERA_FRAME', timestamp: 400 },
  ];
  const result = evaluateStudentRubric(events, []);
  const navSkill = result.skills.find((s) => s.id === 'nav_maya_camera')!;
  assert.equal(navSkill.currentPoints, 15);
  assert.equal(navSkill.isMastered, true);
});

test('transforms (W, E, R) award full 20 points only when all 3 tools used', () => {
  const partialEvents: MayaActionEvent[] = [
    { type: 'TRANSFORM_MOVE', timestamp: 100 },
  ];
  const partialResult = evaluateStudentRubric(partialEvents, []);
  const partialSkill = partialResult.skills.find((s) => s.id === 'transform_manipulators')!;
  assert.equal(partialSkill.currentPoints, 7);
  assert.equal(partialSkill.isMastered, false);

  const fullEvents: MayaActionEvent[] = [
    { type: 'TRANSFORM_MOVE', timestamp: 100 },
    { type: 'TRANSFORM_ROTATE', timestamp: 200 },
    { type: 'TRANSFORM_SCALE', timestamp: 300 },
  ];
  const fullResult = evaluateStudentRubric(fullEvents, []);
  const fullSkill = fullResult.skills.find((s) => s.id === 'transform_manipulators')!;
  assert.equal(fullSkill.currentPoints, 20);
  assert.equal(fullSkill.isMastered, true);
});

test('complete demonstration yields 100% total score', () => {
  const allEvents: MayaActionEvent[] = [
    // Navigation (15)
    { type: 'CAMERA_ORBIT', timestamp: 10 },
    { type: 'CAMERA_PAN', timestamp: 20 },
    { type: 'CAMERA_DOLLY', timestamp: 30 },
    { type: 'CAMERA_FRAME', timestamp: 40 },
    // Selection (10)
    { type: 'CHANGE_TOOL', property: 'select', timestamp: 50 },
    { type: 'SELECT_OBJECT', nodeId: 'node_1', timestamp: 60 },
    { type: 'SELECT_OBJECT', nodeId: 'node_2', timestamp: 70 },
    { type: 'SELECT_OBJECT', nodeId: 'node_3', timestamp: 80 },
    // Transforms (20)
    { type: 'TRANSFORM_MOVE', timestamp: 90 },
    { type: 'TRANSFORM_ROTATE', timestamp: 100 },
    { type: 'TRANSFORM_SCALE', timestamp: 110 },
    // Channel Box (15)
    { type: 'CHANNEL_BOX_EDIT', property: 'translateX', isManualDirectInput: true, timestamp: 120 },
    { type: 'CHANNEL_BOX_EDIT', property: 'translateY', isManualDirectInput: true, timestamp: 130 },
    { type: 'CHANNEL_BOX_EDIT', property: 'visibility', isManualDirectInput: true, timestamp: 140 },
    // Attribute Editor (15)
    { type: 'ATTRIBUTE_EDITOR_EDIT', property: 'radius', timestamp: 150 },
    { type: 'ATTRIBUTE_EDITOR_EDIT', property: 'height', timestamp: 160 },
    // Outliner (10)
    { type: 'OUTLINER_SELECT', nodeId: 'turret_alpha', timestamp: 170 },
    { type: 'OUTLINER_RENAME', oldValue: 'turret_alpha', newValue: 'turret_primary', timestamp: 180 },
  ];

  const result = evaluateStudentRubric(allEvents, [5]);
  assert.equal(result.totalScore, 100);
  assert.equal(result.masteredCount, 7);
});

test('generates Canvas report text with manual upload notice', () => {
  const result = evaluateStudentRubric([], []);
  const reportText = generateCanvasSubmissionText({
    studentName: 'Alex Rivera',
    completionDate: '2026-10-22',
    academicScore: 95,
    arcadeScore: 14200,
    missionsCompleted: 5,
    totalMissions: 5,
    skills: result.skills,
    secretsUnlocked: ['Discovered Hidden Apollo Monolith in Outliner'],
    evidenceSummary: ['All 5 missions cleared'],
  });

  assert.ok(reportText.includes('Alex Rivera'));
  assert.ok(reportText.includes('95 / 100'));
  assert.ok(reportText.includes('In Version 1, Canvas upload is manual'));
});
