/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MayaTool = 'select' | 'move' | 'rotate' | 'scale';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type PrimitiveType = 'cube' | 'sphere' | 'cylinder' | 'shield_dome' | 'group' | 'custom';

export interface ConstructionParams {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  radiusTop?: number;
  radiusBottom?: number;
  widthSegments?: number;
  heightSegments?: number;
  radialSegments?: number;
  arc?: number;
  generatorFrequency?: number;
}

export interface MayaNode {
  id: string;
  name: string;
  type: PrimitiveType;
  parentId: string | null;
  childrenIds: string[];
  position: Vector3D;
  rotation: Vector3D; // in degrees
  scale: Vector3D;
  visibility: boolean;
  color?: string;
  metalness?: number;
  roughness?: number;
  construction?: ConstructionParams;
  isLocked?: boolean;
  isTarget?: boolean;
  isHazard?: boolean;
  isSecret?: boolean;
  description?: string;
}

export interface MissionStep {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  targetObjectId?: string;
  isIndependent?: boolean; // independent demonstration doesn't provide automatic guided handholding
  validate: (scene: Record<string, MayaNode>, actionHistory: MayaActionEvent[]) => boolean;
}

export interface Mission {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  threatLevel: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA' | 'OMEGA';
  estimatedMinutes: number;
  objectives: string[];
  steps: MissionStep[];
}

export type MayaActionEventType =
  | 'SELECT_OBJECT'
  | 'CHANGE_TOOL'
  | 'TRANSFORM_MOVE'
  | 'TRANSFORM_ROTATE'
  | 'TRANSFORM_SCALE'
  | 'CHANNEL_BOX_EDIT'
  | 'ATTRIBUTE_EDITOR_EDIT'
  | 'OUTLINER_RENAME'
  | 'OUTLINER_SELECT'
  | 'CAMERA_ORBIT'
  | 'CAMERA_PAN'
  | 'CAMERA_DOLLY'
  | 'CAMERA_FRAME'
  | 'UNDO'
  | 'REDO'
  | 'SECRET_FOUND';

export interface MayaActionEvent {
  type: MayaActionEventType;
  nodeId?: string;
  nodeName?: string;
  property?: string;
  oldValue?: any;
  newValue?: any;
  isManualDirectInput?: boolean;
  isIndependentMode?: boolean;
  timestamp: number;
}

export interface RubricSkill {
  id: string;
  category: 'NAVIGATION' | 'SELECTION' | 'TRANSFORMATION' | 'CHANNEL_BOX' | 'ATTRIBUTE_EDITOR' | 'OUTLINER' | 'INDEPENDENT_DEFENSE';
  title: string;
  description: string;
  maxPoints: number;
  currentPoints: number;
  isMastered: boolean;
  evidence: string[];
  remainingCriteria: string;
}

export interface StudentReport {
  studentName: string;
  completionDate: string;
  academicScore: number; // 0-100
  arcadeScore: number;
  missionsCompleted: number;
  totalMissions: number;
  skills: RubricSkill[];
  secretsUnlocked: string[];
  evidenceSummary: string[];
}
