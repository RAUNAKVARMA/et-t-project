'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SpaceSceneProps {
  onBlackHoleClick?: () => void;
}

const SpaceScene: React.FC<SpaceSceneProps> = ({ onBlackHoleClick }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const clickRef = useRef(onBlackHoleClick);

  useEffect(() => {
    clickRef.current = onBlackHoleClick;
  }, [onBlackHoleClick]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = Math.max(mount.clientHeight, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000005);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 800);
    camera.position.set(0, 18, 28);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // ─── Background stars ───────────────────────────────────────────
    const BG_STARS = 4500;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(BG_STARS * 3);
    const bgCol = new Float32Array(BG_STARS * 3);
    for (let i = 0; i < BG_STARS; i++) {
      const r = 80 + Math.random() * 300;
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const sp = Math.sin(phi);
      bgPos[i * 3] = r * sp * Math.cos(theta);
      bgPos[i * 3 + 1] = r * sp * Math.sin(theta);
      bgPos[i * 3 + 2] = r * Math.cos(phi);
      const temp = 0.6 + Math.random() * 0.4;
      bgCol[i * 3] = 0.7 + temp * 0.3;
      bgCol[i * 3 + 1] = 0.75 + temp * 0.25;
      bgCol[i * 3 + 2] = 0.9 + temp * 0.1;
    }
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute('color', new THREE.BufferAttribute(bgCol, 3));
    scene.add(
      new THREE.Points(
        bgGeo,
        new THREE.PointsMaterial({
          size: 0.15,
          vertexColors: true,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
        })
      )
    );

    // ─── Spiral-arm galaxy ──────────────────────────────────────────
    const ARM_COUNT = 4;
    const STARS_PER_ARM = 3200;
    const BULGE_STARS = 4000;
    const GALAXY_RADIUS = 22;

    const totalGalaxy = ARM_COUNT * STARS_PER_ARM + BULGE_STARS;
    const gPos = new Float32Array(totalGalaxy * 3);
    const gCol = new Float32Array(totalGalaxy * 3);
    const gSize = new Float32Array(totalGalaxy);

    let idx = 0;
    const armColor = new THREE.Color();
    const bulgeColor = new THREE.Color();

    for (let arm = 0; arm < ARM_COUNT; arm++) {
      const armOffset = (arm / ARM_COUNT) * Math.PI * 2;
      for (let s = 0; s < STARS_PER_ARM; s++) {
        const t = Math.pow(Math.random(), 0.6);
        const r = t * GALAXY_RADIUS;
        const twist = 2.8;
        const angle = armOffset + t * twist + (Math.random() - 0.5) * 0.45;
        const scatter = (1 - t * 0.3) * 1.8;
        const x = Math.cos(angle) * r + (Math.random() - 0.5) * scatter;
        const z = Math.sin(angle) * r + (Math.random() - 0.5) * scatter;
        const diskThickness = 0.3 + (1 - t) * 0.6;
        const y = (Math.random() - 0.5) * diskThickness;

        gPos[idx * 3] = x;
        gPos[idx * 3 + 1] = y;
        gPos[idx * 3 + 2] = z;

        const tNorm = r / GALAXY_RADIUS;
        armColor.setHSL(0.58 + tNorm * 0.08, 0.65 + (1 - tNorm) * 0.3, 0.5 + (1 - tNorm) * 0.35);
        gCol[idx * 3] = armColor.r;
        gCol[idx * 3 + 1] = armColor.g;
        gCol[idx * 3 + 2] = armColor.b;
        gSize[idx] = 0.06 + Math.random() * 0.1 + (1 - tNorm) * 0.12;
        idx++;
      }
    }

    for (let b = 0; b < BULGE_STARS; b++) {
      const r = Math.pow(Math.random(), 2.5) * 5;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = (Math.random() - 0.5) * (0.8 - r * 0.08);

      gPos[idx * 3] = x;
      gPos[idx * 3 + 1] = y;
      gPos[idx * 3 + 2] = z;

      const bNorm = r / 5;
      bulgeColor.setHSL(0.1 + bNorm * 0.05, 0.5 - bNorm * 0.2, 0.85 - bNorm * 0.3);
      gCol[idx * 3] = bulgeColor.r;
      gCol[idx * 3 + 1] = bulgeColor.g;
      gCol[idx * 3 + 2] = bulgeColor.b;
      gSize[idx] = 0.08 + (1 - bNorm) * 0.18;
      idx++;
    }

    const galaxyGeo = new THREE.BufferGeometry();
    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    galaxyGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
    galaxyGeo.setAttribute('size', new THREE.BufferAttribute(gSize, 1));

    const galaxyMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    scene.add(galaxy);

    // ─── Dust / nebula glow in arms ─────────────────────────────────
    const DUST = 600;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(DUST * 3);
    const dustCol = new Float32Array(DUST * 3);
    const dc = new THREE.Color();
    for (let d = 0; d < DUST; d++) {
      const arm = Math.floor(Math.random() * ARM_COUNT);
      const armOff = (arm / ARM_COUNT) * Math.PI * 2;
      const t = 0.15 + Math.random() * 0.7;
      const r = t * GALAXY_RADIUS;
      const angle = armOff + t * 2.8 + (Math.random() - 0.5) * 0.55;
      dustPos[d * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 2.5;
      dustPos[d * 3 + 1] = (Math.random() - 0.5) * 0.4;
      dustPos[d * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 2.5;
      dc.setHSL(0.55 + Math.random() * 0.15, 0.7, 0.35);
      dustCol[d * 3] = dc.r;
      dustCol[d * 3 + 1] = dc.g;
      dustCol[d * 3 + 2] = dc.b;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
    scene.add(
      new THREE.Points(
        dustGeo,
        new THREE.PointsMaterial({
          size: 1.1,
          vertexColors: true,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      )
    );

    // ─── Black hole ─────────────────────────────────────────────────
    const bhGroup = new THREE.Group();

    const eventHorizon = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    bhGroup.add(eventHorizon);

    const diskInner = 1.0;
    const diskOuter = 3.8;
    const diskGeo = new THREE.RingGeometry(diskInner, diskOuter, 128, 4);
    const diskColors = new Float32Array(diskGeo.attributes.position.count * 3);
    const posAttr = diskGeo.attributes.position;
    const dColor = new THREE.Color();
    for (let i = 0; i < posAttr.count; i++) {
      const px = posAttr.getX(i);
      const py = posAttr.getY(i);
      const dist = Math.sqrt(px * px + py * py);
      const norm = (dist - diskInner) / (diskOuter - diskInner);
      if (norm < 0.3) {
        dColor.setHSL(0.52, 0.95, 0.85 - norm * 1.5);
      } else if (norm < 0.6) {
        dColor.setHSL(0.08 + norm * 0.05, 0.9, 0.65 - norm * 0.3);
      } else {
        dColor.setHSL(0.02, 0.8 - norm * 0.4, 0.4 - norm * 0.25);
      }
      diskColors[i * 3] = dColor.r;
      diskColors[i * 3 + 1] = dColor.g;
      diskColors[i * 3 + 2] = dColor.b;
    }
    diskGeo.setAttribute('color', new THREE.BufferAttribute(diskColors, 3));

    const accretionDisk = new THREE.Mesh(
      diskGeo,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    accretionDisk.rotation.x = -Math.PI / 2;
    bhGroup.add(accretionDisk);

    const glowLayers: THREE.Mesh[] = [];
    const glowConf: [number, number, number, number][] = [
      [0.9, 4.2, 0x00e5ff, 0.18],
      [0.7, 5.0, 0xff6600, 0.08],
      [0.5, 5.8, 0xff00aa, 0.04],
    ];
    for (const [inner, outer, color, opacity] of glowConf) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 64),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
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
      new THREE.TorusGeometry(0.85, 0.04, 16, 96),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    photonRing.rotation.x = Math.PI / 2;
    bhGroup.add(photonRing);

    scene.add(bhGroup);

    const clickTargets: THREE.Object3D[] = [
      eventHorizon,
      accretionDisk,
      photonRing,
      ...glowLayers,
    ];

    // ─── Interaction ────────────────────────────────────────────────
    let hovered = false;

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickTargets, false);
      const over = hits.length > 0;
      if (over !== hovered) {
        hovered = over;
        renderer.domElement.style.cursor = over ? 'pointer' : 'default';
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickTargets, false);
      if (hits.length > 0 && clickRef.current) {
        clickRef.current();
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // ─── Resize ─────────────────────────────────────────────────────
    const onResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = Math.max(mountRef.current.clientHeight, 1);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // ─── Animate ────────────────────────────────────────────────────
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      galaxy.rotation.y += 0.012 * dt;

      accretionDisk.rotation.z += 0.6 * dt;
      photonRing.rotation.z -= 1.2 * dt;

      const pulse = 0.85 + Math.sin(t * 1.8) * 0.15;
      glowLayers.forEach((g, i) => {
        const m = g.material as THREE.MeshBasicMaterial;
        m.opacity = glowConf[i][3] * pulse + Math.sin(t * (1.2 + i * 0.4)) * 0.015;
      });
      (photonRing.material as THREE.MeshBasicMaterial).opacity =
        0.5 + Math.sin(t * 3) * 0.15;

      const bhScale = 1 + (hovered ? Math.sin(t * 4) * 0.04 : 0);
      bhGroup.scale.setScalar(bhScale);

      renderer.render(scene, camera);
    };
    animate();

    // ─── Cleanup ────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      galaxyGeo.dispose();
      galaxyMat.dispose();
      bgGeo.dispose();
      dustGeo.dispose();
      diskGeo.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};

export default SpaceScene;
