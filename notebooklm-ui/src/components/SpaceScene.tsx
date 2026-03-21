'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SpaceSceneProps {
  onBlackHoleClick?: () => void;
}

/* ─── helpers ──────────────────────────────────────────────────────── */

function starTemp(hue: number, sat: number, lum: number, out: THREE.Color): void {
  out.setHSL(hue, sat, lum);
}

function spiralXZ(
  armOffset: number,
  t: number,
  twist: number,
  scatter: number,
): [number, number] {
  const angle = armOffset + t * twist + (Math.random() - 0.5) * scatter;
  const r = t;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

/* ─── component ────────────────────────────────────────────────────── */

const SpaceScene: React.FC<SpaceSceneProps> = ({ onBlackHoleClick }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const clickRef = useRef(onBlackHoleClick);

  useEffect(() => {
    clickRef.current = onBlackHoleClick;
  }, [onBlackHoleClick]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = Math.max(mount.clientHeight, 1);

    /* renderer */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000003);
    scene.fog = new THREE.FogExp2(0x000003, 0.0012);

    /* camera */
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 2000);
    camera.position.set(0, 22, 32);

    /* orbit controls — zoom & pan */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4;
    controls.maxDistance = 250;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.15;
    controls.target.set(0, 0, 0);
    controls.enablePan = false;

    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const c = new THREE.Color();

    /* ── 1. Deep-field background stars ──────────────────────────── */
    const BG = 9000;
    const bgGeo = new THREE.BufferGeometry();
    const bgP = new Float32Array(BG * 3);
    const bgC = new Float32Array(BG * 3);
    for (let i = 0; i < BG; i++) {
      const r = 120 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const sp = Math.sin(phi);
      bgP[i * 3] = r * sp * Math.cos(theta);
      bgP[i * 3 + 1] = r * sp * Math.sin(theta);
      bgP[i * 3 + 2] = r * Math.cos(phi);
      const k = Math.random();
      if (k < 0.15) starTemp(0.0, 0.8, 0.55 + Math.random() * 0.2, c);       // red dwarfs
      else if (k < 0.5) starTemp(0.12, 0.35, 0.7 + Math.random() * 0.2, c);   // sun-like
      else if (k < 0.8) starTemp(0.55, 0.25, 0.8 + Math.random() * 0.15, c);  // white
      else starTemp(0.6, 0.6, 0.85 + Math.random() * 0.1, c);                  // blue giants
      bgC[i * 3] = c.r;
      bgC[i * 3 + 1] = c.g;
      bgC[i * 3 + 2] = c.b;
    }
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgP, 3));
    bgGeo.setAttribute('color', new THREE.BufferAttribute(bgC, 3));
    scene.add(
      new THREE.Points(bgGeo, new THREE.PointsMaterial({
        size: 0.18,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }))
    );

    /* ── 2. Distant galaxies (visible when zoomed out) ───────────── */
    const distGalGroup = new THREE.Group();
    const DIST_GAL = 22;
    for (let g = 0; g < DIST_GAL; g++) {
      const count = 180 + Math.floor(Math.random() * 220);
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const galR = 2 + Math.random() * 4;
      const isSpiral = Math.random() > 0.35;
      const arms = isSpiral ? (2 + Math.floor(Math.random() * 3)) : 0;
      const hue = 0.05 + Math.random() * 0.55;

      for (let s = 0; s < count; s++) {
        let lx: number, lz: number;
        if (isSpiral && arms > 0) {
          const arm = s % arms;
          const t = Math.pow(Math.random(), 0.5) * galR;
          const off = (arm / arms) * Math.PI * 2;
          const a = off + (t / galR) * 2.5 + (Math.random() - 0.5) * 0.6;
          lx = Math.cos(a) * t + (Math.random() - 0.5) * 0.6;
          lz = Math.sin(a) * t + (Math.random() - 0.5) * 0.6;
        } else {
          const t = Math.pow(Math.random(), 1.8) * galR;
          const a = Math.random() * Math.PI * 2;
          lx = Math.cos(a) * t;
          lz = Math.sin(a) * t * (0.4 + Math.random() * 0.6);
        }
        pos[s * 3] = lx;
        pos[s * 3 + 1] = (Math.random() - 0.5) * 0.3;
        pos[s * 3 + 2] = lz;
        c.setHSL(hue + (Math.random() - 0.5) * 0.08, 0.4 + Math.random() * 0.3, 0.5 + Math.random() * 0.35);
        col[s * 3] = c.r;
        col[s * 3 + 1] = c.g;
        col[s * 3 + 2] = c.b;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.22,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      const dist = 70 + Math.random() * 160;
      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.5) * 80;
      pts.position.set(Math.cos(angle) * dist, elev, Math.sin(angle) * dist);
      pts.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      distGalGroup.add(pts);
    }
    scene.add(distGalGroup);

    /* ── 3. Nebulae (emission, reflection, planetary) ────────────── */
    const nebulaGroup = new THREE.Group();
    interface NebulaConf { cx: number; cy: number; cz: number; r: number; count: number; hue: number; sat: number; lum: number; size: number; opacity: number; }
    const nebulae: NebulaConf[] = [
      { cx: 45, cy: 8, cz: -30, r: 18, count: 900, hue: 0.95, sat: 0.7, lum: 0.35, size: 3.5, opacity: 0.06 },   // emission (pink)
      { cx: -55, cy: -5, cz: 20, r: 14, count: 700, hue: 0.6, sat: 0.55, lum: 0.4, size: 3.0, opacity: 0.05 },    // reflection (blue)
      { cx: 20, cy: -18, cz: 50, r: 10, count: 500, hue: 0.45, sat: 0.65, lum: 0.38, size: 2.8, opacity: 0.055 },  // planetary (teal)
      { cx: -35, cy: 22, cz: -55, r: 22, count: 1000, hue: 0.08, sat: 0.6, lum: 0.3, size: 4.0, opacity: 0.04 },   // supernova remnant (orange)
      { cx: 60, cy: -12, cz: -60, r: 16, count: 600, hue: 0.78, sat: 0.5, lum: 0.32, size: 3.2, opacity: 0.045 },  // dark-edge violet
    ];
    for (const nb of nebulae) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(nb.count * 3);
      const col = new Float32Array(nb.count * 3);
      for (let i = 0; i < nb.count; i++) {
        const rr = Math.pow(Math.random(), 0.7) * nb.r;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const sp = Math.sin(phi);
        pos[i * 3] = nb.cx + rr * sp * Math.cos(theta);
        pos[i * 3 + 1] = nb.cy + rr * sp * Math.sin(theta) * 0.6;
        pos[i * 3 + 2] = nb.cz + rr * Math.cos(phi);
        c.setHSL(nb.hue + (Math.random() - 0.5) * 0.06, nb.sat + Math.random() * 0.15, nb.lum + Math.random() * 0.15);
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      nebulaGroup.add(new THREE.Points(geo, new THREE.PointsMaterial({
        size: nb.size,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: nb.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })));
    }
    scene.add(nebulaGroup);

    /* ── 4. Neutron stars / pulsars ──────────────────────────────── */
    const pulsarGroup = new THREE.Group();
    const pulsarData: { mesh: THREE.Mesh; beam1: THREE.Mesh; beam2: THREE.Mesh }[] = [];
    const pulsarPositions: [number, number, number][] = [
      [32, 3, -18], [-28, -6, 25], [15, 14, -42],
    ];
    for (const [px, py, pz] of pulsarPositions) {
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xccffff, transparent: true, opacity: 1 })
      );
      core.position.set(px, py, pz);
      pulsarGroup.add(core);

      const beamGeo = new THREE.CylinderGeometry(0.02, 0.15, 6, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x88ddff,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const b1 = new THREE.Mesh(beamGeo, beamMat.clone());
      b1.position.set(px, py + 3, pz);
      pulsarGroup.add(b1);
      const b2 = new THREE.Mesh(beamGeo, beamMat.clone());
      b2.position.set(px, py - 3, pz);
      b2.rotation.z = Math.PI;
      pulsarGroup.add(b2);
      pulsarData.push({ mesh: core, beam1: b1, beam2: b2 });
    }
    scene.add(pulsarGroup);

    /* ── 5. Main spiral galaxy ───────────────────────────────────── */
    const ARM_COUNT = 5;
    const STARS_PER_ARM = 4200;
    const BULGE_STARS = 5500;
    const HII_REGIONS = 400;
    const GALAXY_R = 24;
    const TWIST = 3.2;

    const totalG = ARM_COUNT * STARS_PER_ARM + BULGE_STARS + HII_REGIONS;
    const gP = new Float32Array(totalG * 3);
    const gC = new Float32Array(totalG * 3);
    let gi = 0;

    for (let arm = 0; arm < ARM_COUNT; arm++) {
      const off = (arm / ARM_COUNT) * Math.PI * 2;
      for (let s = 0; s < STARS_PER_ARM; s++) {
        const t = Math.pow(Math.random(), 0.55) * GALAXY_R;
        const [lx, lz] = spiralXZ(off, t, TWIST / GALAXY_R, 0.4 + t * 0.015);
        const scatter = (1 - (t / GALAXY_R) * 0.35) * 1.6;
        gP[gi * 3] = lx + (Math.random() - 0.5) * scatter;
        gP[gi * 3 + 1] = (Math.random() - 0.5) * (0.25 + (1 - t / GALAXY_R) * 0.5);
        gP[gi * 3 + 2] = lz + (Math.random() - 0.5) * scatter;

        const n = t / GALAXY_R;
        if (n < 0.35) starTemp(0.6 + n * 0.05, 0.7, 0.75 - n * 0.4, c);
        else if (n < 0.7) starTemp(0.58, 0.5 + n * 0.15, 0.5 + (1 - n) * 0.3, c);
        else starTemp(0.55 + n * 0.12, 0.6, 0.4 + Math.random() * 0.2, c);
        gC[gi * 3] = c.r;
        gC[gi * 3 + 1] = c.g;
        gC[gi * 3 + 2] = c.b;
        gi++;
      }
    }

    for (let b = 0; b < BULGE_STARS; b++) {
      const r = Math.pow(Math.random(), 2.8) * 5.5;
      const a = Math.random() * Math.PI * 2;
      gP[gi * 3] = Math.cos(a) * r;
      gP[gi * 3 + 1] = (Math.random() - 0.5) * Math.max(0.15, 0.8 - r * 0.1);
      gP[gi * 3 + 2] = Math.sin(a) * r;
      const n = r / 5.5;
      starTemp(0.1 + n * 0.04, 0.5 - n * 0.25, 0.9 - n * 0.35, c);
      gC[gi * 3] = c.r;
      gC[gi * 3 + 1] = c.g;
      gC[gi * 3 + 2] = c.b;
      gi++;
    }

    for (let h = 0; h < HII_REGIONS; h++) {
      const arm = Math.floor(Math.random() * ARM_COUNT);
      const off = (arm / ARM_COUNT) * Math.PI * 2;
      const t = 0.3 + Math.random() * 0.5;
      const rt = t * GALAXY_R;
      const [lx, lz] = spiralXZ(off, rt, TWIST / GALAXY_R, 0.35);
      gP[gi * 3] = lx + (Math.random() - 0.5) * 1.2;
      gP[gi * 3 + 1] = (Math.random() - 0.5) * 0.15;
      gP[gi * 3 + 2] = lz + (Math.random() - 0.5) * 1.2;
      c.setHSL(0.93 + Math.random() * 0.05, 0.8, 0.55 + Math.random() * 0.15);
      gC[gi * 3] = c.r;
      gC[gi * 3 + 1] = c.g;
      gC[gi * 3 + 2] = c.b;
      gi++;
    }

    const galaxyGeo = new THREE.BufferGeometry();
    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(gP, 3));
    galaxyGeo.setAttribute('color', new THREE.BufferAttribute(gC, 3));
    const galaxyMat = new THREE.PointsMaterial({
      size: 0.11,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    scene.add(galaxy);

    /* ── 6. Galaxy dust lanes ────────────────────────────────────── */
    const DUST = 1200;
    const dustGeo = new THREE.BufferGeometry();
    const dP = new Float32Array(DUST * 3);
    const dC = new Float32Array(DUST * 3);
    for (let d = 0; d < DUST; d++) {
      const arm = Math.floor(Math.random() * ARM_COUNT);
      const off = (arm / ARM_COUNT) * Math.PI * 2;
      const t = 0.12 + Math.random() * 0.75;
      const rt = t * GALAXY_R;
      const [lx, lz] = spiralXZ(off, rt, TWIST / GALAXY_R, 0.5);
      dP[d * 3] = lx + (Math.random() - 0.5) * 2.5;
      dP[d * 3 + 1] = (Math.random() - 0.5) * 0.3;
      dP[d * 3 + 2] = lz + (Math.random() - 0.5) * 2.5;
      const h = 0.55 + Math.random() * 0.12;
      c.setHSL(h, 0.6, 0.3 + Math.random() * 0.1);
      dC[d * 3] = c.r;
      dC[d * 3 + 1] = c.g;
      dC[d * 3 + 2] = c.b;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dP, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dC, 3));
    scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })));

    /* ── 7. Black hole ───────────────────────────────────────────── */
    const bhGroup = new THREE.Group();

    const eventHorizon = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    bhGroup.add(eventHorizon);

    const diskIn = 0.9;
    const diskOut = 4.0;
    const diskGeo = new THREE.RingGeometry(diskIn, diskOut, 160, 6);
    const diskC = new Float32Array(diskGeo.attributes.position.count * 3);
    const dpa = diskGeo.attributes.position;
    for (let i = 0; i < dpa.count; i++) {
      const dist = Math.sqrt(dpa.getX(i) ** 2 + dpa.getY(i) ** 2);
      const n = (dist - diskIn) / (diskOut - diskIn);
      const ang = Math.atan2(dpa.getY(i), dpa.getX(i));
      const doppler = 0.85 + Math.sin(ang) * 0.15;
      if (n < 0.25) c.setHSL(0.53, 0.95, (0.9 - n * 2) * doppler);
      else if (n < 0.55) c.setHSL(0.09 + n * 0.04, 0.9, (0.7 - n * 0.4) * doppler);
      else c.setHSL(0.02, 0.75 - n * 0.3, (0.35 - n * 0.2) * doppler);
      diskC[i * 3] = c.r;
      diskC[i * 3 + 1] = c.g;
      diskC[i * 3 + 2] = c.b;
    }
    diskGeo.setAttribute('color', new THREE.BufferAttribute(diskC, 3));

    const accDisk = new THREE.Mesh(diskGeo, new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    accDisk.rotation.x = -Math.PI / 2;
    bhGroup.add(accDisk);

    const glowLayers: THREE.Mesh[] = [];
    const glowConf: [number, number, number, number][] = [
      [0.8, 4.5, 0x00e5ff, 0.2],
      [0.6, 5.2, 0xff7700, 0.09],
      [0.4, 6.0, 0xff00aa, 0.04],
    ];
    for (const [inner, outer, color, opacity] of glowConf) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 80),
        new THREE.MeshBasicMaterial({
          color, transparent: true, opacity,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      bhGroup.add(ring);
      glowLayers.push(ring);
    }

    const photonRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.035, 16, 128),
      new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.65,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    photonRing.rotation.x = Math.PI / 2;
    bhGroup.add(photonRing);

    const jetMat = new THREE.MeshBasicMaterial({
      color: 0x44aaff, transparent: true, opacity: 0.08,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const jetGeo = new THREE.ConeGeometry(0.6, 12, 16, 1, true);
    const jetUp = new THREE.Mesh(jetGeo, jetMat);
    jetUp.position.y = 6;
    bhGroup.add(jetUp);
    const jetDown = new THREE.Mesh(jetGeo, jetMat.clone());
    jetDown.position.y = -6;
    jetDown.rotation.z = Math.PI;
    bhGroup.add(jetDown);

    scene.add(bhGroup);

    const clickTargets: THREE.Object3D[] = [eventHorizon, accDisk, photonRing, ...glowLayers];

    /* ── Interaction (distinguish click from drag) ───────────────── */
    let pointerDownPos = new THREE.Vector2();
    let hovered = false;

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (event: PointerEvent) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const over = raycaster.intersectObjects(clickTargets, false).length > 0;
      if (over !== hovered) {
        hovered = over;
        renderer.domElement.style.cursor = over ? 'pointer' : 'grab';
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerDownPos.set(event.clientX, event.clientY);
    };

    const onPointerUp = (event: PointerEvent) => {
      const dx = event.clientX - pointerDownPos.x;
      const dy = event.clientY - pointerDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return;
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.intersectObjects(clickTargets, false).length > 0 && clickRef.current) {
        clickRef.current();
      }
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    /* ── Resize ──────────────────────────────────────────────────── */
    const onResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = Math.max(mountRef.current.clientHeight, 1);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    /* ── Animate ─────────────────────────────────────────────────── */
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      controls.update();

      galaxy.rotation.y += 0.01 * dt;

      accDisk.rotation.z += 0.55 * dt;
      photonRing.rotation.z -= 1.0 * dt;

      const pulse = 0.85 + Math.sin(t * 1.6) * 0.15;
      glowLayers.forEach((g, i) => {
        (g.material as THREE.MeshBasicMaterial).opacity =
          glowConf[i][3] * pulse + Math.sin(t * (1.1 + i * 0.35)) * 0.015;
      });
      (photonRing.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t * 2.5) * 0.15;

      const jOpacity = 0.04 + Math.sin(t * 1.2) * 0.03;
      (jetUp.material as THREE.MeshBasicMaterial).opacity = jOpacity;
      (jetDown.material as THREE.MeshBasicMaterial).opacity = jOpacity;

      const bhS = 1 + (hovered ? Math.sin(t * 4) * 0.04 : 0);
      bhGroup.scale.setScalar(bhS);

      pulsarData.forEach((p, i) => {
        const freq = 4 + i * 1.5;
        const s = 0.7 + Math.abs(Math.sin(t * freq)) * 0.6;
        p.mesh.scale.setScalar(s);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.abs(Math.sin(t * freq)) * 0.4;
        const bOp = 0.08 + Math.abs(Math.sin(t * freq + 0.2)) * 0.2;
        (p.beam1.material as THREE.MeshBasicMaterial).opacity = bOp;
        (p.beam2.material as THREE.MeshBasicMaterial).opacity = bOp;
        p.beam1.rotation.y += 2.5 * dt;
        p.beam2.rotation.y += 2.5 * dt;
      });

      distGalGroup.children.forEach((child, i) => {
        child.rotation.y += (0.003 + i * 0.0003) * dt;
      });

      renderer.render(scene, camera);
    };
    animate();

    /* ── Cleanup ──────────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(raf);
      controls.dispose();
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
    />
  );
};

export default SpaceScene;
