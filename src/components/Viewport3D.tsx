/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MayaNode, MayaTool, Vector3D } from '../types/maya.ts';
import { sound } from '../audio/soundFx.ts';

interface Viewport3DProps {
  sceneNodes: Record<string, MayaNode>;
  selectedNodeId: string | null;
  activeTool: MayaTool;
  activeMissionId: number;
  onSelectNode: (nodeId: string | null) => void;
  onTransformNode: (nodeId: string, transform: { position: Vector3D; rotation: Vector3D; scale: Vector3D }) => void;
  onLogAction: (type: any, details?: any) => void;
  laserFiring: { from: Vector3D; to: Vector3D } | null;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  sceneNodes,
  selectedNodeId,
  activeTool,
  activeMissionId,
  onSelectNode,
  onTransformNode,
  onLogAction,
  laserFiring,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedNodeIdRef = useRef(selectedNodeId);
  selectedNodeIdRef.current = selectedNodeId;

  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  const sceneNodesRef = useRef(sceneNodes);
  sceneNodesRef.current = sceneNodes;

  const onTransformNodeRef = useRef(onTransformNode);
  onTransformNodeRef.current = onTransformNode;

  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;

  const onLogActionRef = useRef(onLogAction);
  onLogActionRef.current = onLogAction;

  // Refs for 3D state
  const threeStateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    transformControls: TransformControls;
    objectMeshes: Map<string, THREE.Object3D>;
    selectionBox: THREE.BoxHelper | null;
    isSoftwareGl: boolean;
    frameId: number;
    camTarget: THREE.Vector3;
    isAltDown: boolean;
    activeDragMode: 'orbit' | 'pan' | 'dolly' | null;
    lastMouseX: number;
    lastMouseY: number;
    cameraDampingTarget: THREE.Vector3 | null;
    cameraPositionTarget: THREE.Vector3 | null;
    targetZoneMesh: THREE.Mesh | null;
    laserLine: THREE.Line | null;
    explosionParticles: { mesh: THREE.Points; velocities: THREE.Vector3[]; age: number }[];
  } | null>(null);

  const [fps, setFps] = useState<number>(60);
  const [altStatus, setAltStatus] = useState<boolean>(false);

  // Setup Three.js scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913); // Deep space navy
    scene.fog = new THREE.FogExp2(0x060913, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    camera.position.set(22, 18, 28);
    const camTarget = new THREE.Vector3(0, 1.5, 0);
    camera.lookAt(camTarget);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio lighting & Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Key Light (warm directional)
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.5);
    keyLight.position.set(30, 45, 25);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 10;
      keyLight.shadow.camera.far = 100;
      keyLight.shadow.camera.left = -30;
      keyLight.shadow.camera.right = 30;
      keyLight.shadow.camera.top = 30;
      keyLight.shadow.camera.bottom = -30;
    }
    scene.add(keyLight);

    // Fill Light (cool hemisphere)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090d1a, 1.2);
    scene.add(hemiLight);

    // Rim Light
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.0);
    rimLight.position.set(-25, 20, -25);
    scene.add(rimLight);

    // Lunar Ground Plane & Maya Grid
    const groundGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    // Add subtle lunar crater displacement
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const dist = Math.sqrt(vx * vx + vy * vy);
      const crater = Math.sin(vx * 0.15) * Math.cos(vy * 0.15) * 0.4 - (dist > 25 ? Math.sin(dist * 0.2) * 0.3 : 0);
      posAttr.setZ(i, crater);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = !isSoftwareGl;
    groundMesh.name = '__ground__';
    scene.add(groundMesh);

    // Maya Grid (Grey lines with prominent origin axes)
    const gridHelper = new THREE.GridHelper(80, 80, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Axis Helper (X: Red, Y: Green, Z: Blue)
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.position.set(0, 0.05, 0);
    axesHelper.renderOrder = 1;
    scene.add(axesHelper);

    // Target Intercept Zone Indicator (Mission 2 & 5)
    const targetRingGeo = new THREE.RingGeometry(2.5, 3.2, 32);
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const targetZoneMesh = new THREE.Mesh(targetRingGeo, targetRingMat);
    targetZoneMesh.rotation.x = -Math.PI / 2;
    targetZoneMesh.position.set(-12, 0.04, 8);
    targetZoneMesh.visible = false;
    scene.add(targetZoneMesh);

    // TransformControls (Maya W, E, R manipulators)
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 1.0;
    scene.add(transformControls.getHelper());

    transformControls.addEventListener('dragging-changed', (event) => {
      // While dragging transform handles, disable camera interactions
      if (event.value) {
        sound.playTransformTick();
      }
    });

    transformControls.addEventListener('change', () => {
      const targetObj = transformControls.object;
      if (!targetObj || !targetObj.userData?.nodeId) return;
      const nodeId = targetObj.userData.nodeId;

      const p = targetObj.position;
      const r = targetObj.rotation;
      const s = targetObj.scale;

      const rotDeg = {
        x: THREE.MathUtils.radToDeg(r.x),
        y: THREE.MathUtils.radToDeg(r.y),
        z: THREE.MathUtils.radToDeg(r.z),
      };

      onTransformNodeRef.current(nodeId, {
        position: { x: p.x, y: p.y, z: p.z },
        rotation: rotDeg,
        scale: { x: s.x, y: s.y, z: s.z },
      });

      // Log transform action for rubric
      const mode = transformControls.getMode();
      if (mode === 'translate') {
        onLogActionRef.current('TRANSFORM_MOVE', { nodeId });
      } else if (mode === 'rotate') {
        onLogActionRef.current('TRANSFORM_ROTATE', { nodeId });
      } else if (mode === 'scale') {
        onLogActionRef.current('TRANSFORM_SCALE', { nodeId });
      }
    });

    // Object Meshes map
    const objectMeshes = new Map<string, THREE.Object3D>();

    // Laser Line for shots
    const laserMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 3 });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    const laserLine = new THREE.Line(laserGeo, laserMat);
    laserLine.visible = false;
    scene.add(laserLine);

    threeStateRef.current = {
      renderer,
      scene,
      camera,
      transformControls,
      objectMeshes,
      selectionBox: null,
      isSoftwareGl,
      frameId: 0,
      camTarget,
      isAltDown: false,
      activeDragMode: null,
      lastMouseX: 0,
      lastMouseY: 0,
      cameraDampingTarget: null,
      cameraPositionTarget: null,
      targetZoneMesh,
      laserLine,
      explosionParticles: [],
    };

    // Maya Camera Input Listeners (Alt+LMB = Orbit, Alt+MMB = Pan, Alt+RMB = Dolly)
    const dom = renderer.domElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is typing in an input or textarea, NEVER handle Maya hotkeys!
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === 'Alt') {
        if (threeStateRef.current) threeStateRef.current.isAltDown = true;
        setAltStatus(true);
      } else if (e.key === 'q' || e.key === 'Q') {
        onLogActionRef.current('CHANGE_TOOL', { property: 'select' });
      } else if (e.key === 'w' || e.key === 'W') {
        onLogActionRef.current('CHANGE_TOOL', { property: 'move' });
      } else if (e.key === 'e' || e.key === 'E') {
        onLogActionRef.current('CHANGE_TOOL', { property: 'rotate' });
      } else if (e.key === 'r' || e.key === 'R') {
        onLogActionRef.current('CHANGE_TOOL', { property: 'scale' });
      } else if (e.key === 'f' || e.key === 'F') {
        // Frame Selected
        frameSelectedObject();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        if (threeStateRef.current) {
          threeStateRef.current.isAltDown = false;
          threeStateRef.current.activeDragMode = null;
        }
        setAltStatus(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Pointer events on canvas
    const handlePointerDown = (e: PointerEvent) => {
      if (!threeStateRef.current) return;
      const state = threeStateRef.current;

      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;

      if (e.altKey || state.isAltDown) {
        // Maya camera navigation
        e.preventDefault();
        if (e.button === 0) {
          state.activeDragMode = 'orbit';
          onLogActionRef.current('CAMERA_ORBIT');
        } else if (e.button === 1) {
          state.activeDragMode = 'pan';
          onLogActionRef.current('CAMERA_PAN');
        } else if (e.button === 2) {
          state.activeDragMode = 'dolly';
          onLogActionRef.current('CAMERA_DOLLY');
        }
        dom.setPointerCapture(e.pointerId);
      } else {
        // Standard Viewport Picking (Selection)
        if (e.button === 0) {
          // If transform controls is being dragged, don't raycast
          if (state.transformControls.dragging) return;

          const rect = dom.getBoundingClientRect();
          const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
          );

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, state.camera);

          const meshes: THREE.Object3D[] = [];
          state.objectMeshes.forEach((mesh) => {
            if (mesh.visible) meshes.push(mesh);
          });

          const intersects = raycaster.intersectObjects(meshes, true);
          if (intersects.length > 0) {
            // Find root user node
            let hitObj: THREE.Object3D | null = intersects[0].object;
            while (hitObj && !hitObj.userData?.nodeId && hitObj.parent) {
              hitObj = hitObj.parent;
            }
            if (hitObj?.userData?.nodeId) {
              const selectedId = hitObj.userData.nodeId;
              onSelectNodeRef.current(selectedId);
              sound.playSelect();
              onLogActionRef.current('SELECT_OBJECT', { nodeId: selectedId });
            }
          } else {
            // Clicked empty ground: deselect if not clicking ground intentionally
            onSelectNodeRef.current(null);
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!threeStateRef.current) return;
      const state = threeStateRef.current;
      if (!state.activeDragMode) return;

      const dx = e.clientX - state.lastMouseX;
      const dy = e.clientY - state.lastMouseY;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;

      const { camera, camTarget } = state;

      if (state.activeDragMode === 'orbit') {
        // Maya Orbit (spherical angle rotation around target)
        const offset = camera.position.clone().sub(camTarget);
        let radius = offset.length();
        let theta = Math.atan2(offset.x, offset.z);
        let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));

        theta -= dx * 0.008;
        phi -= dy * 0.008;
        phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.02, phi)); // keep above ground

        offset.x = radius * Math.sin(phi) * Math.sin(theta);
        offset.y = radius * Math.cos(phi);
        offset.z = radius * Math.sin(phi) * Math.cos(theta);

        camera.position.copy(camTarget).add(offset);
        camera.lookAt(camTarget);
      } else if (state.activeDragMode === 'pan') {
        // Maya Pan (move target and camera along camera's right & up vectors)
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const factor = camera.position.distanceTo(camTarget) * 0.0018;

        const panOffset = right.clone().multiplyScalar(-dx * factor).add(up.clone().multiplyScalar(dy * factor));
        camera.position.add(panOffset);
        camTarget.add(panOffset);
      } else if (state.activeDragMode === 'dolly') {
        // Maya Dolly (move camera towards/away from target)
        const dir = camera.position.clone().sub(camTarget).normalize();
        const dist = camera.position.distanceTo(camTarget);
        const delta = (dx - dy) * 0.08 * (dist * 0.05);
        const newDist = Math.max(3, Math.min(120, dist + delta));

        camera.position.copy(camTarget).add(dir.multiplyScalar(newDist));
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!threeStateRef.current) return;
      threeStateRef.current.activeDragMode = null;
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!threeStateRef.current) return;
      const { camera, camTarget } = threeStateRef.current;
      const dir = camera.position.clone().sub(camTarget).normalize();
      const dist = camera.position.distanceTo(camTarget);
      const delta = e.deltaY * 0.04;
      const newDist = Math.max(4, Math.min(140, dist + delta));
      camera.position.copy(camTarget).add(dir.multiplyScalar(newDist));
      onLogActionRef.current('CAMERA_DOLLY');
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Prevent browser context menu on Alt+Right click dolly
      e.preventDefault();
    };

    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointermove', handlePointerMove);
    dom.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('contextmenu', handleContextMenu);

    // Frame selected helper
    function frameSelectedObject() {
      if (!threeStateRef.current) return;
      const state = threeStateRef.current;
      const selectedId = selectedNodeIdRef.current;
      if (!selectedId) return;

      const mesh = state.objectMeshes.get(selectedId);
      if (!mesh) return;

      const box = new THREE.Box3().setFromObject(mesh);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      const radius = Math.max(sphere.radius, 2.5);

      const offset = state.camera.position.clone().sub(state.camTarget).normalize().multiplyScalar(radius * 3.2);

      state.cameraPositionTarget = center.clone().add(offset);
      state.cameraDampingTarget = center.clone();
      sound.playSelect();
      onLogActionRef.current('CAMERA_FRAME', { nodeId: selectedId });
    }

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: nw, height: nh } = entry.contentRect;
        if (nw > 0 && nh > 0 && threeStateRef.current) {
          threeStateRef.current.camera.aspect = nw / nh;
          threeStateRef.current.camera.updateProjectionMatrix();
          threeStateRef.current.renderer.setSize(nw, nh);
        }
      }
    });
    resizeObserver.observe(container);

    // Render loop with software-WebGL pacing
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    function renderLoop() {
      if (!threeStateRef.current) return;
      const state = threeStateRef.current;
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // FPS tracking
      frameCount++;
      if (now - fpsTimer > 1000) {
        setFps(Math.round((frameCount * 1000) / (now - fpsTimer)));
        frameCount = 0;
        fpsTimer = now;
      }

      // Smooth camera framing interpolation
      if (state.cameraPositionTarget && state.cameraDampingTarget) {
        state.camera.position.lerp(state.cameraPositionTarget, 0.12);
        state.camTarget.lerp(state.cameraDampingTarget, 0.12);
        state.camera.lookAt(state.camTarget);

        if (state.camera.position.distanceTo(state.cameraPositionTarget) < 0.05) {
          state.cameraPositionTarget = null;
          state.cameraDampingTarget = null;
        }
      }

      // Subtle asteroid tumbling animation & threat pulsation
      const asteroidAlpha = state.objectMeshes.get('ASTEROID_ALPHA');
      if (asteroidAlpha && asteroidAlpha.visible) {
        asteroidAlpha.rotation.x += 0.005;
        asteroidAlpha.rotation.y += 0.008;
      }
      const asteroidBeta = state.objectMeshes.get('ASTEROID_BETA');
      if (asteroidBeta && asteroidBeta.visible) {
        asteroidBeta.rotation.x += 0.004;
        asteroidBeta.rotation.z += 0.006;
      }
      const meteorTitan = state.objectMeshes.get('METEOR_TITAN');
      if (meteorTitan && meteorTitan.visible) {
        meteorTitan.rotation.y += 0.009;
      }

      // Update explosion particles
      for (let i = state.explosionParticles.length - 1; i >= 0; i--) {
        const p = state.explosionParticles[i];
        p.age += dt;
        const posArr = p.mesh.geometry.attributes.position;
        for (let j = 0; j < p.velocities.length; j++) {
          const vx = posArr.getX(j) + p.velocities[j].x * dt;
          const vy = posArr.getY(j) + p.velocities[j].y * dt;
          const vz = posArr.getZ(j) + p.velocities[j].z * dt;
          posArr.setXYZ(j, vx, vy, vz);
        }
        posArr.needsUpdate = true;
        (p.mesh.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - p.age / 0.8);

        if (p.age > 0.8) {
          state.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          (p.mesh.material as THREE.Material).dispose();
          state.explosionParticles.splice(i, 1);
        }
      }

      // Render
      state.renderer.render(state.scene, state.camera);

      if (state.isSoftwareGl) {
        // Paced software WebGL loop
        const gl = state.renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const syncState = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (syncState === gl.UNSIGNALED) {
            state.frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            state.frameId = window.setTimeout(renderLoop, 60);
          }
        };
        state.frameId = window.setTimeout(poll, 5);
      } else {
        state.frameId = requestAnimationFrame(renderLoop);
      }
    }

    renderLoop();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointermove', handlePointerMove);
      dom.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('contextmenu', handleContextMenu);
      resizeObserver.disconnect();

      if (threeStateRef.current) {
        cancelAnimationFrame(threeStateRef.current.frameId);
        clearTimeout(threeStateRef.current.frameId);
        threeStateRef.current.renderer.dispose();
      }
      container.innerHTML = '';
      threeStateRef.current = null;
    };
  }, []);

  // Sync sceneNodes with Three.js scene meshes
  useEffect(() => {
    if (!threeStateRef.current) return;
    const { scene, objectMeshes } = threeStateRef.current;

    // Build or update meshes for each node
    Object.values(sceneNodes).forEach((node) => {
      let mesh = objectMeshes.get(node.id);

      if (!mesh) {
        // Construct mesh based on node primitive type
        if (node.type === 'group') {
          mesh = new THREE.Group();
        } else if (node.type === 'cube') {
          const w = node.construction?.width || 2;
          const h = node.construction?.height || 2;
          const d = node.construction?.depth || 2;
          const geo = new THREE.BoxGeometry(w, h, d);
          const mat = new THREE.MeshStandardMaterial({
            color: node.color ? new THREE.Color(node.color) : 0x94a3b8,
            metalness: node.metalness ?? 0.5,
            roughness: node.roughness ?? 0.4,
          });
          mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        } else if (node.type === 'cylinder') {
          const rt = node.construction?.radiusTop || 1;
          const rb = node.construction?.radiusBottom || 1;
          const h = node.construction?.height || 3;
          const seg = node.construction?.radialSegments || 16;
          const geo = new THREE.CylinderGeometry(rt, rb, h, seg);
          const mat = new THREE.MeshStandardMaterial({
            color: node.color ? new THREE.Color(node.color) : 0x06b6d4,
            metalness: node.metalness ?? 0.7,
            roughness: node.roughness ?? 0.3,
          });
          mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // If turret, add visual barrel to make orientation obvious
          if (node.id.includes('turret')) {
            const barrelGeo = new THREE.CylinderGeometry(0.2, 0.25, 2.8, 8);
            barrelGeo.rotateX(Math.PI / 2);
            barrelGeo.translate(0, h * 0.35, 1.4);
            const barrelMat = new THREE.MeshStandardMaterial({
              color: 0x38bdf8,
              metalness: 0.9,
              roughness: 0.2,
            });
            const barrelMesh = new THREE.Mesh(barrelGeo, barrelMat);
            mesh.add(barrelMesh);
          }
        } else if (node.type === 'shield_dome') {
          const rad = node.construction?.radius || 3;
          const seg = node.construction?.radialSegments || 24;
          const geo = new THREE.SphereGeometry(rad, seg, Math.floor(seg / 2), 0, Math.PI * 2, 0, Math.PI / 2);
          const mat = new THREE.MeshStandardMaterial({
            color: node.color ? new THREE.Color(node.color) : 0x0ea5e9,
            transparent: true,
            opacity: 0.28,
            roughness: 0.2,
            metalness: 0.1,
            depthWrite: false,
            side: THREE.DoubleSide,
            wireframe: false,
          });
          mesh = new THREE.Mesh(geo, mat);
          mesh.renderOrder = 2;
        } else {
          // Default Sphere
          const rad = node.construction?.radius || 2;
          const wSeg = node.construction?.widthSegments || 16;
          const hSeg = node.construction?.heightSegments || 12;
          const geo = new THREE.SphereGeometry(rad, wSeg, hSeg);
          const mat = new THREE.MeshStandardMaterial({
            color: node.color ? new THREE.Color(node.color) : 0x64748b,
            metalness: node.metalness ?? 0.3,
            roughness: node.roughness ?? 0.7,
          });
          mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }

        mesh.userData = { nodeId: node.id };
        mesh.name = node.name;
        scene.add(mesh);
        objectMeshes.set(node.id, mesh);
      }

      // Update geometry if construction parameters changed
      if (mesh instanceof THREE.Mesh && node.construction) {
        if (node.type === 'cylinder') {
          const rt = node.construction.radiusTop || 1;
          const rb = node.construction.radiusBottom || 1;
          const h = node.construction.height || 3;
          const seg = node.construction.radialSegments || 16;
          mesh.geometry.dispose();
          mesh.geometry = new THREE.CylinderGeometry(rt, rb, h, seg);
        } else if (node.type === 'cube') {
          const w = node.construction.width || 2;
          const h = node.construction.height || 2;
          const d = node.construction.depth || 2;
          mesh.geometry.dispose();
          mesh.geometry = new THREE.BoxGeometry(w, h, d);
        } else if (node.type === 'sphere') {
          const rad = node.construction.radius || 2;
          const wSeg = node.construction.widthSegments || 16;
          const hSeg = node.construction.heightSegments || 12;
          mesh.geometry.dispose();
          mesh.geometry = new THREE.SphereGeometry(rad, wSeg, hSeg);
        }
      }

      // Update transforms
      mesh.position.set(node.position.x, node.position.y, node.position.z);
      mesh.rotation.set(
        THREE.MathUtils.degToRad(node.rotation.x),
        THREE.MathUtils.degToRad(node.rotation.y),
        THREE.MathUtils.degToRad(node.rotation.z)
      );
      mesh.scale.set(node.scale.x, node.scale.y, node.scale.z);
      mesh.visible = node.visibility;
    });

    // Toggle target zone visibility based on active mission
    if (threeStateRef.current.targetZoneMesh) {
      threeStateRef.current.targetZoneMesh.visible = activeMissionId === 2;
    }
  }, [sceneNodes, activeMissionId]);

  // Sync active tool & selected object with TransformControls & Selection Box
  useEffect(() => {
    if (!threeStateRef.current) return;
    const { transformControls, objectMeshes, scene } = threeStateRef.current;

    // Remove existing selection box
    if (threeStateRef.current.selectionBox) {
      scene.remove(threeStateRef.current.selectionBox);
      threeStateRef.current.selectionBox.dispose();
      threeStateRef.current.selectionBox = null;
    }

    if (selectedNodeId) {
      const mesh = objectMeshes.get(selectedNodeId);
      if (mesh && mesh.visible) {
        // Attach Selection Helper Box
        const box = new THREE.BoxHelper(mesh, 0x06b6d4);
        box.renderOrder = 999;
        (box.material as THREE.LineBasicMaterial).depthTest = false;
        scene.add(box);
        threeStateRef.current.selectionBox = box;

        // Attach TransformControls if active tool is move, rotate, or scale
        if (activeTool === 'move') {
          transformControls.attach(mesh);
          transformControls.setMode('translate');
          transformControls.enabled = true;
        } else if (activeTool === 'rotate') {
          transformControls.attach(mesh);
          transformControls.setMode('rotate');
          transformControls.enabled = true;
        } else if (activeTool === 'scale') {
          transformControls.attach(mesh);
          transformControls.setMode('scale');
          transformControls.enabled = true;
        } else {
          // 'select' tool - no handles, just selection box
          transformControls.detach();
          transformControls.enabled = false;
        }
      } else {
        transformControls.detach();
      }
    } else {
      transformControls.detach();
    }
  }, [selectedNodeId, activeTool]);

  // Handle Laser Firing & Explosions
  useEffect(() => {
    if (!laserFiring || !threeStateRef.current) return;
    const { scene, laserLine, explosionParticles } = threeStateRef.current;
    if (!laserLine) return;

    // Set laser coordinates
    const pos = laserLine.geometry.attributes.position;
    pos.setXYZ(0, laserFiring.from.x, laserFiring.from.y + 1.2, laserFiring.from.z);
    pos.setXYZ(1, laserFiring.to.x, laserFiring.to.y, laserFiring.to.z);
    pos.needsUpdate = true;
    laserLine.visible = true;

    sound.playLaserFire();

    const t = setTimeout(() => {
      if (laserLine) laserLine.visible = false;

      // Spawn explosion particles at asteroid position
      sound.playExplosion();
      const pCount = 45;
      const pGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(pCount * 3);
      const velocities: THREE.Vector3[] = [];

      for (let i = 0; i < pCount; i++) {
        pPositions[i * 3] = laserFiring.to.x;
        pPositions[i * 3 + 1] = laserFiring.to.y;
        pPositions[i * 3 + 2] = laserFiring.to.z;

        const speed = 6 + Math.random() * 12;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        velocities.push(
          new THREE.Vector3(
            speed * Math.sin(phi) * Math.cos(theta),
            speed * Math.sin(phi) * Math.sin(theta),
            speed * Math.cos(phi)
          )
        );
      }

      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0xf59e0b,
        size: 0.6,
        transparent: true,
        opacity: 1.0,
      });
      const points = new THREE.Points(pGeo, pMat);
      scene.add(points);
      explosionParticles.push({ mesh: points, velocities, age: 0 });
    }, 280);

    return () => clearTimeout(t);
  }, [laserFiring]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#060913]">
      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Viewport Overlay HUD (Top-Left / Top-Right telemetry) */}
      <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-3 text-xs font-mono text-cyan-400/80 bg-slate-950/70 border border-cyan-900/40 px-3 py-1.5 rounded">
        <span className="font-semibold text-cyan-300">VIEWPORT 3D</span>
        <span className="text-slate-500">|</span>
        <span>MAYA COORD: PERSPECTIVE</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">{fps} FPS</span>
      </div>

      {/* Axis Guide Badge (Top-Left under Viewport Title) */}
      <div className="absolute top-12 left-4 pointer-events-none flex items-center gap-2 text-[11px] font-mono bg-slate-950/80 border border-slate-800 px-3 py-1 rounded">
        <span className="text-slate-400">AXES:</span>
        <span className="text-red-400 font-bold">X (R)</span>
        <span className="text-emerald-400 font-bold">Y (G)</span>
        <span className="text-sky-400 font-bold">Z (B)</span>
        <span className="text-slate-600">|</span>
        <span className={altStatus ? 'text-amber-300 font-bold' : 'text-slate-400'}>
          {altStatus ? 'ALT ACTIVE: ORBIT / PAN / DOLLY' : 'HOLD ALT: MAYA NAV'}
        </span>
      </div>

      {/* Selected Object Indicator in Viewport */}
      {selectedNodeId && sceneNodes[selectedNodeId] && (
        <div className="absolute top-3 right-4 pointer-events-none flex items-center gap-2 text-xs font-mono bg-slate-950/80 border border-cyan-500/50 px-3 py-1.5 rounded text-cyan-300">
          <span className="text-slate-400">SELECTED:</span>
          <span className="font-bold">{sceneNodes[selectedNodeId].name}</span>
          <span className="text-slate-500">({sceneNodes[selectedNodeId].type.toUpperCase()})</span>
        </div>
      )}
    </div>
  );
};
