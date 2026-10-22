/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MayaNode, Mission } from '../types/maya.ts';

export function createInitialScene(): Record<string, MayaNode> {
  const nodes: Record<string, MayaNode> = {
    // Root Group
    root: {
      id: 'root',
      name: 'LUNAR_BASE_ALPHA',
      type: 'group',
      parentId: null,
      childrenIds: ['DEFENSE_GRID', 'HABITAT_CLUSTER', 'POWER_AND_COMM', 'LUNAR_SURFACE_RELICS', 'INCOMING_HAZARDS'],
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
    },

    // DEFENSE_GRID Group
    DEFENSE_GRID: {
      id: 'DEFENSE_GRID',
      name: 'DEFENSE_GRID',
      type: 'group',
      parentId: 'root',
      childrenIds: ['turret_alpha', 'interceptor_beacon_1', 'turret_backup', 'shield_dome_alpha', 'shield_dome_beta'],
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
    },

    turret_alpha: {
      id: 'turret_alpha',
      name: 'turret_alpha',
      type: 'cylinder',
      parentId: 'DEFENSE_GRID',
      childrenIds: [],
      position: { x: 0, y: 0, z: 8 },
      rotation: { x: 0, y: 0, z: 0 }, // Rotate Y to ~45 deg to align with asteroid
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
      color: '#06b6d4',
      metalness: 0.85,
      roughness: 0.25,
      construction: {
        radiusTop: 0.8,
        radiusBottom: 1.4,
        height: 3.5,
        radialSegments: 16,
      },
      description: 'Primary Lunar Kinetic Cannon. Rotate Y to track incoming ballistic threats.',
    },

    interceptor_beacon_1: {
      id: 'interceptor_beacon_1',
      name: 'interceptor_beacon_1',
      type: 'cube',
      parentId: 'DEFENSE_GRID',
      childrenIds: [],
      position: { x: 2, y: 1, z: 2 }, // Must be translated to x: -12, z: 8
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1.5, y: 1.5, z: 1.5 },
      visibility: true,
      color: '#f59e0b',
      metalness: 0.7,
      roughness: 0.3,
      construction: {
        width: 2.0,
        height: 2.0,
        depth: 2.0,
      },
      description: 'Deployable Gravimetric Interceptor. Move (W) to intercept grid marker.',
    },

    turret_backup: {
      id: 'turret_backup',
      name: 'turret_backup',
      type: 'cylinder',
      parentId: 'DEFENSE_GRID',
      childrenIds: [],
      position: { x: 4, y: 0, z: -6 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
      color: '#38bdf8',
      metalness: 0.8,
      roughness: 0.3,
      construction: {
        radiusTop: 0.7,
        radiusBottom: 1.2,
        height: 3.2,
        radialSegments: 12,
      },
      description: 'Secondary Defense Tower. Rename to turret_sentinel and deploy in Mission 5.',
    },

    shield_dome_alpha: {
      id: 'shield_dome_alpha',
      name: 'shield_dome_alpha',
      type: 'shield_dome',
      parentId: 'DEFENSE_GRID',
      childrenIds: [],
      position: { x: -8, y: 0, z: -4 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }, // Must be scaled to >= 2.2
      visibility: true,
      color: '#0ea5e9',
      metalness: 0.1,
      roughness: 0.1,
      construction: {
        radius: 3.0,
        radialSegments: 24,
      },
      description: 'Plasma Shield Generator Alpha. Scale (R) to encompass the main bio-dome.',
    },

    shield_dome_beta: {
      id: 'shield_dome_beta',
      name: 'shield_dome_beta',
      type: 'shield_dome',
      parentId: 'DEFENSE_GRID',
      childrenIds: [],
      position: { x: 8, y: 0, z: 4 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
      color: '#10b981',
      metalness: 0.1,
      roughness: 0.1,
      construction: {
        radius: 2.5,
        radialSegments: 20,
      },
      description: 'Auxiliary Shield Generator Beta.',
    },

    // HABITAT_CLUSTER Group
    HABITAT_CLUSTER: {
      id: 'HABITAT_CLUSTER',
      name: 'HABITAT_CLUSTER',
      type: 'group',
      parentId: 'root',
      childrenIds: ['habitat_main_dome', 'habitat_living_quarters', 'oxygen_depot'],
      position: { x: -8, y: 0, z: -4 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
    },

    habitat_main_dome: {
      id: 'habitat_main_dome',
      name: 'habitat_main_dome',
      type: 'sphere',
      parentId: 'HABITAT_CLUSTER',
      childrenIds: [],
      position: { x: 0, y: 1.2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
      color: '#cbd5e1',
      metalness: 0.3,
      roughness: 0.6,
      construction: {
        radius: 2.2,
        widthSegments: 20,
        heightSegments: 16,
      },
      description: 'Central Command & Research Habitat.',
    },

    habitat_living_quarters: {
      id: 'habitat_living_quarters',
      name: 'habitat_living_quarters',
      type: 'cube',
      parentId: 'HABITAT_CLUSTER',
      childrenIds: [],
      position: { x: 3, y: 0.8, z: 0 },
      rotation: { x: 0, y: 25, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
      color: '#94a3b8',
      metalness: 0.4,
      roughness: 0.5,
      construction: {
        width: 3.2,
        height: 1.6,
        depth: 2.0,
      },
      description: 'Cadet & Crew Quarters Module.',
    },

    oxygen_depot: {
      id: 'oxygen_depot',
      name: 'oxygen_depot',
      type: 'cylinder',
      parentId: 'HABITAT_CLUSTER',
      childrenIds: [],
      position: { x: -3, y: 1.0, z: 1 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
      color: '#0284c7',
      metalness: 0.6,
      roughness: 0.3,
      construction: {
        radiusTop: 0.9,
        radiusBottom: 0.9,
        height: 2.0,
        radialSegments: 16,
      },
      description: 'Pressurized O2 Reserves.',
    },

    // POWER_AND_COMM Group
    POWER_AND_COMM: {
      id: 'POWER_AND_COMM',
      name: 'POWER_AND_COMM',
      type: 'group',
      parentId: 'root',
      childrenIds: ['generator_core_cylinder', 'comm_relay_array', 'solar_panel_wing'],
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
    },

    generator_core_cylinder: {
      id: 'generator_core_cylinder',
      name: 'generator_core_cylinder',
      type: 'cylinder',
      parentId: 'POWER_AND_COMM',
      childrenIds: [],
      position: { x: 12, y: 1.5, z: -8 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
      color: '#8b5cf6',
      metalness: 0.8,
      roughness: 0.2,
      construction: {
        radiusTop: 1.0,
        radiusBottom: 1.0,
        height: 3.0,
        radialSegments: 20,
        generatorFrequency: 100,
      },
      description: 'Fusion Generator Core. Modify shape height & radius in Attribute Editor to expand output.',
    },

    comm_relay_array: {
      id: 'comm_relay_array',
      name: 'comm_relay_array',
      type: 'cylinder',
      parentId: 'POWER_AND_COMM',
      childrenIds: [],
      position: { x: 8, y: 2, z: -14 },
      rotation: { x: 0, y: 15, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true, // will be tested for precision coordinates
      color: '#f43f5e',
      metalness: 0.9,
      roughness: 0.2,
      construction: {
        radiusTop: 0.3,
        radiusBottom: 0.8,
        height: 4.2,
        radialSegments: 14,
      },
      description: 'Deep Space Communications Dish.',
    },

    solar_panel_wing: {
      id: 'solar_panel_wing',
      name: 'solar_panel_wing',
      type: 'cube',
      parentId: 'POWER_AND_COMM',
      childrenIds: [],
      position: { x: 14, y: 1.5, z: -3 },
      rotation: { x: 30, y: 45, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
      color: '#1e3a8a',
      metalness: 0.95,
      roughness: 0.1,
      construction: {
        width: 5.0,
        height: 0.1,
        depth: 2.2,
      },
      description: 'Photovoltaic Array.',
    },

    // LUNAR_SURFACE_RELICS (Easter Egg Node Group)
    LUNAR_SURFACE_RELICS: {
      id: 'LUNAR_SURFACE_RELICS',
      name: 'LUNAR_SURFACE_RELICS',
      type: 'group',
      parentId: 'root',
      childrenIds: ['Apollo_11_Descent_Stage', 'Secret_Alien_Monolith'],
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
    },

    Apollo_11_Descent_Stage: {
      id: 'Apollo_11_Descent_Stage',
      name: 'Apollo_11_Descent_Stage',
      type: 'cube',
      parentId: 'LUNAR_SURFACE_RELICS',
      childrenIds: [],
      position: { x: -22, y: 0.6, z: -18 },
      rotation: { x: 0, y: 19.69, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
      color: '#eab308',
      metalness: 0.95,
      roughness: 0.2,
      construction: {
        width: 2.2,
        height: 1.2,
        depth: 2.2,
      },
      isSecret: true,
      description: 'Historic Apollo 11 Lunar Module descent stage left at Sea of Tranquility in July 1969.',
    },

    Secret_Alien_Monolith: {
      id: 'Secret_Alien_Monolith',
      name: 'Secret_Alien_Monolith',
      type: 'cube',
      parentId: 'LUNAR_SURFACE_RELICS',
      childrenIds: [],
      position: { x: 24, y: 2.5, z: 20 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
      color: '#09090b',
      metalness: 0.98,
      roughness: 0.05,
      construction: {
        width: 1.0,
        height: 5.0,
        depth: 0.25,
      },
      isSecret: true,
      description: 'Extraterrestrial crystalline slab in 1:4:9 proportions. Emits faint radio pulse.',
    },

    // INCOMING_HAZARDS Group
    INCOMING_HAZARDS: {
      id: 'INCOMING_HAZARDS',
      name: 'INCOMING_HAZARDS',
      type: 'group',
      parentId: 'root',
      childrenIds: ['ASTEROID_ALPHA', 'ASTEROID_BETA', 'METEOR_TITAN', 'METEOR_SWARM'],
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visibility: true,
    },

    ASTEROID_ALPHA: {
      id: 'ASTEROID_ALPHA',
      name: 'ASTEROID_ALPHA',
      type: 'sphere',
      parentId: 'INCOMING_HAZARDS',
      childrenIds: [],
      position: { x: 24, y: 18, z: -26 },
      rotation: { x: 15, y: 30, z: 45 },
      scale: { x: 2.2, y: 1.8, z: 2.0 },
      visibility: true,
      color: '#78716c',
      metalness: 0.3,
      roughness: 0.9,
      isHazard: true,
      construction: {
        radius: 2.0,
        widthSegments: 12,
        heightSegments: 10,
      },
      description: 'Incoming Class-C asteroid on collision course with Lunar Base Alpha.',
    },

    ASTEROID_BETA: {
      id: 'ASTEROID_BETA',
      name: 'ASTEROID_BETA',
      type: 'sphere',
      parentId: 'INCOMING_HAZARDS',
      childrenIds: [],
      position: { x: -26, y: 20, z: 18 },
      rotation: { x: 10, y: 40, z: 20 },
      scale: { x: 2.6, y: 2.2, z: 2.4 },
      visibility: false, // appears in mission 2
      color: '#57534e',
      metalness: 0.4,
      roughness: 0.9,
      isHazard: true,
      construction: {
        radius: 2.4,
        widthSegments: 12,
        heightSegments: 10,
      },
      description: 'Heavy ferromag asteroid approaching Western quadrant.',
    },

    METEOR_TITAN: {
      id: 'METEOR_TITAN',
      name: 'METEOR_TITAN',
      type: 'sphere',
      parentId: 'INCOMING_HAZARDS',
      childrenIds: [],
      position: { x: 20, y: 24, z: -28 },
      rotation: { x: 20, y: 60, z: 10 },
      scale: { x: 3.5, y: 3.2, z: 3.4 },
      visibility: false,
      color: '#44403c',
      metalness: 0.5,
      roughness: 0.95,
      isHazard: true,
      construction: {
        radius: 3.2,
        widthSegments: 14,
        heightSegments: 12,
      },
      description: 'Titan-class hypervelocity meteoroid.',
    },

    METEOR_SWARM: {
      id: 'METEOR_SWARM',
      name: 'METEOR_SWARM',
      type: 'sphere',
      parentId: 'INCOMING_HAZARDS',
      childrenIds: [],
      position: { x: -22, y: 22, z: -24 },
      rotation: { x: 45, y: 10, z: 30 },
      scale: { x: 2.0, y: 2.0, z: 2.0 },
      visibility: false,
      color: '#713f12',
      metalness: 0.2,
      roughness: 0.9,
      isHazard: true,
      construction: {
        radius: 1.8,
        widthSegments: 10,
        heightSegments: 8,
      },
      description: 'Secondary debris cluster heading towards oxygen depot.',
    },
  };

  return nodes;
}

export const MISSIONS: Mission[] = [
  {
    id: 1,
    name: 'STAGE 1: DEFENSE TURRET ROTATION (E)',
    subtitle: 'Kinetic Cannon Bearing Lock',
    description: 'Incoming asteroid detected at bearing ~45°. Select the defense turret and rotate its targeting axis to achieve a firing solution.',
    threatLevel: 'ALPHA',
    estimatedMinutes: 8,
    objectives: [
      'Select turret_alpha in viewport or Outliner (Hotkey: Q)',
      'Activate Rotate manipulator (Hotkey: E)',
      'Rotate turret_alpha around the green Y-axis to 45° (between 35° and 55°), or enter 45 in Channel Box Rotate Y',
    ],
    steps: [
      {
        id: 'm1_s1',
        title: 'Aim Kinetic Cannon',
        instruction: 'Select turret_alpha. Press E to activate Rotate tool. Rotate on the green Y-ring to ~45° (between 35° and 55°) towards ASTEROID_ALPHA.',
        hint: 'You can also type 45 into Rotate Y in the Channel Box for precision targeting.',
        targetObjectId: 'turret_alpha',
        validate: (scene) => {
          const raw = scene.turret_alpha?.rotation?.y || 0;
          const rotY = ((raw % 360) + 360) % 360;
          return rotY >= 35 && rotY <= 55;
        },
      },
    ],
  },
  {
    id: 2,
    name: 'STAGE 2: POSITIONING INTERCEPT DEFENSES (W)',
    subtitle: 'Gravimetric Beacon Deployment',
    description: 'A second heavy asteroid is tracking towards Sector 4. Move interceptor_beacon_1 to the defensive grid target marker.',
    threatLevel: 'BRAVO',
    estimatedMinutes: 10,
    objectives: [
      'Select interceptor_beacon_1 (Hotkey: Q)',
      'Activate Move manipulator (Hotkey: W)',
      'Translate beacon along X and Z into the tactical zone (X: -14 to -10, Z: 6 to 10)',
    ],
    steps: [
      {
        id: 'm2_s1',
        title: 'Deploy Interceptor Beacon',
        instruction: 'Select interceptor_beacon_1 and press W to activate Move. Drag the red (X) and blue (Z) arrows to the glowing target zone.',
        hint: 'Target coordinates are approximately X = -12, Z = 8. Check Channel Box Translate values.',
        targetObjectId: 'interceptor_beacon_1',
        validate: (scene) => {
          const pos = scene.interceptor_beacon_1.position;
          return pos.x >= -14 && pos.x <= -10 && pos.z >= 6 && pos.z <= 10;
        },
      },
    ],
  },
  {
    id: 3,
    name: 'STAGE 3: SCALING PROTECTIVE SHIELDS (R)',
    subtitle: 'Plasma Envelope Calibration',
    description: 'Debris cloud incoming over Habitat Cluster Alpha. Scale shield_dome_alpha so it fully encapsulates the living quarters.',
    threatLevel: 'CHARLIE',
    estimatedMinutes: 10,
    objectives: [
      'Select shield_dome_alpha in the viewport or Outliner',
      'Activate Scale manipulator (Hotkey: R)',
      'Scale shield uniformly or on X/Z to at least 2.2x to cover all habitats without exceeding reactor limit (max 4.0x)',
    ],
    steps: [
      {
        id: 'm3_s1',
        title: 'Envelop Habitat Complex',
        instruction: 'Select shield_dome_alpha. Press R to activate the Scale tool. Drag the manipulator outward until scale is >= 2.2 on X and Z.',
        hint: 'Use the center yellow box for uniform scale, or enter 2.5 in Channel Box Scale X, Y, Z.',
        targetObjectId: 'shield_dome_alpha',
        validate: (scene) => {
          const sc = scene.shield_dome_alpha.scale;
          return sc.x >= 2.2 && sc.z >= 2.2 && sc.x <= 4.0;
        },
      },
    ],
  },
  {
    id: 4,
    name: 'STAGE 4: PRECISION REPAIR & ATTRIBUTE EDITOR',
    subtitle: 'Node Construction vs. Transform Scale',
    description: 'Repair damaged comms and upgrade the generator core. Learn the key Maya principle: modifying shape node construction parameters vs. object transform scale.',
    threatLevel: 'DELTA',
    estimatedMinutes: 12,
    objectives: [
      'Use Channel Box numeric inputs to calibrate comm_relay_array position to X: 15, Y: 4.5, Z: -10',
      'Select generator_core_cylinder and open the Attribute Editor tab',
      'Increase primitive construction height to >= 5.0 and radius to >= 1.8 without altering transform scale',
    ],
    steps: [
      {
        id: 'm4_s1',
        title: 'Channel Box Precision Alignment',
        instruction: 'Select comm_relay_array. In the Channel Box on the right, type exactly: Translate X: 15, Translate Y: 4.5, Translate Z: -10.',
        hint: 'Typing in Channel Box allows exact sub-millimeter placement without mouse drag drift.',
        targetObjectId: 'comm_relay_array',
        validate: (scene) => {
          const p = scene.comm_relay_array.position;
          return Math.abs(p.x - 15) < 0.5 && Math.abs(p.y - 4.5) < 0.5 && Math.abs(p.z - (-10)) < 0.5;
        },
      },
      {
        id: 'm4_s2',
        title: 'Attribute Editor Construction Parameters',
        instruction: 'Select generator_core_cylinder, switch to the Attribute Editor tab, and set Height to >= 5.0 and Radius to >= 1.8.',
        hint: 'Notice that editing construction parameters alters the actual geometry dimensions while leaving Transform Scale at (1, 1, 1)!',
        targetObjectId: 'generator_core_cylinder',
        validate: (scene) => {
          const c = scene.generator_core_cylinder.construction;
          return Boolean(c && (c.height || 0) >= 5.0 && (c.radiusTop || 0) >= 1.8);
        },
      },
    ],
  },
  {
    id: 5,
    name: 'STAGE 5: INDEPENDENT LUNAR DEFENSE CERTIFICATION',
    subtitle: 'Comprehensive Tactical Defense Exam',
    description: 'Dual asteroid wave detected! Apply all Maya controls (Q, W, E, R, F, Outliner, Channel Box, Attribute Editor) without guided step-by-step assistance.',
    threatLevel: 'OMEGA',
    estimatedMinutes: 15,
    objectives: [
      'In Outliner: Rename turret_backup to turret_sentinel',
      'Position turret_sentinel at defense coordinates (X: 8 to 12, Z: -14 to -10)',
      'Aim turret_sentinel towards METEOR_TITAN (Rotate Y between -75° and -45°)',
      'Scale shield_dome_beta to >= 2.0 to protect the secondary facilities',
      'Set generator_core_cylinder frequency in Attribute Editor to >= 150 MHz to power the defense grid',
    ],
    steps: [
      {
        id: 'm5_s1',
        title: 'Tactical Deployment (Independent)',
        instruction: 'Execute all 5 tactical steps described in the mission briefing to neutralize the incoming asteroid wave.',
        hint: 'Independent challenge: Rely on your knowledge of Maya navigation (Alt+drag, F), manipulators (W, E, R), and panels!',
        isIndependent: true,
        validate: (scene) => {
          // Check renaming
          const sentinelNode = Object.values(scene).find(
            (n) => n.id === 'turret_backup' && (n.name.toLowerCase() === 'turret_sentinel' || n.name.toLowerCase().includes('sentinel'))
          );
          if (!sentinelNode) return false;

          // Check position
          const p = sentinelNode.position;
          const posOk = p.x >= 6 && p.x <= 14 && p.z >= -16 && p.z <= -8;
          if (!posOk) return false;

          // Check rotation
          const rawRot = sentinelNode.rotation.y;
          const normRot = ((((rawRot % 360) + 360) % 360) > 180) ? ((((rawRot % 360) + 360) % 360) - 360) : (((rawRot % 360) + 360) % 360);
          const rotOk = (normRot >= -85 && normRot <= -35) || (normRot >= 275 && normRot <= 325);
          if (!rotOk) return false;

          // Check shield scale
          const shieldBeta = scene.shield_dome_beta;
          if (!shieldBeta || shieldBeta.scale.x < 1.8 || shieldBeta.scale.z < 1.8) return false;

          // Check generator frequency
          const freq = scene.generator_core_cylinder?.construction?.generatorFrequency || 0;
          if (freq < 150) return false;

          return true;
        },
      },
    ],
  },
];
