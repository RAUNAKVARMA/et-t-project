'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SpaceSceneProps {
  onBlackHoleClick?: () => void;
  isOpen?: boolean;
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      500
    );
    camera.position.set(0, 2, 32);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // --- Starfield (instanced points) ---
    const starCount = 2800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 45 + Math.random() * 120;
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const sinPhi = Math.sin(phi);
      starPos[i * 3] = r * sinPhi * Math.cos(theta);
      starPos[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0xaaccff,
        size: 0.12,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      })
    );
    scene.add(stars);

    // --- Distant nebula quads (cheap, low opacity) ---
    const nebulaGroup = new THREE.Group();
    const nebulaColors = [0x1a237e, 0x4a148c, 0x006064];
    for (let n = 0; n < 3; n++) {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(120, 80),
        new THREE.MeshBasicMaterial({
          color: nebulaColors[n],
          transparent: true,
          opacity: 0.06,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        })
      );
      plane.position.set((n - 1) * 40, n * 3 - 4, -60 - n * 15);
      plane.rotation.z = n * 0.4;
      nebulaGroup.add(plane);
    }
    scene.add(nebulaGroup);

    // --- Galaxies (rotating disk groups) ---
    const galaxyMeshes: THREE.Group[] = [];
    const galaxySpeeds: number[] = [0.06, 0.045, 0.07];
    const galaxyPalette = [0x00e5ff, 0xff00aa, 0x69f0ae];

    for (let g = 0; g < 3; g++) {
      const group = new THREE.Group();
      const disk = new THREE.Mesh(
        new THREE.CircleGeometry(4 + g * 1.2, 48),
        new THREE.MeshBasicMaterial({
          color: galaxyPalette[g],
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      disk.rotation.x = Math.PI / 2.2;
      group.add(disk);

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.35 + g * 0.05, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.9,
        })
      );
      core.position.y = 0.2;
      group.add(core);

      group.position.set(-14 + g * 14, -2 + g, -8 - g * 4);
      group.rotation.x = 0.35 + g * 0.1;
      group.rotation.z = g * 0.25;
      scene.add(group);
      galaxyMeshes.push(group);
    }

    // --- Pulsars (small emissive spheres) ---
    const pulsars: THREE.Mesh[] = [];
    for (let p = 0; p < 2; p++) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x88ffff, transparent: true, opacity: 0.95 })
      );
      m.position.set(-6 + p * 18, 5 - p * 3, -12);
      scene.add(m);
      pulsars.push(m);
    }

    // --- Black hole + glow ---
    const bhGroup = new THREE.Group();
    const torusGeo = new THREE.TorusGeometry(5, 1.35, 24, 96);
    const torusMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    const blackHole = new THREE.Mesh(torusGeo, torusMat);
    bhGroup.add(blackHole);

    const glowLayers: THREE.Mesh[] = [];
    const glowScales = [1.08, 1.18, 1.32];
    const glowColors = [0x00ffff, 0xff00aa, 0x00ff88];
    for (let i = 0; i < 3; i++) {
      const gMesh = new THREE.Mesh(
        torusGeo.clone(),
        new THREE.MeshBasicMaterial({
          color: glowColors[i],
          transparent: true,
          opacity: 0.12 - i * 0.03,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      gMesh.scale.setScalar(glowScales[i]);
      bhGroup.add(gMesh);
      glowLayers.push(gMesh);
    }

    const eventHorizon = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    bhGroup.add(eventHorizon);

    scene.add(bhGroup);

    const targets: THREE.Object3D[] = [blackHole, eventHorizon, ...glowLayers];

    // --- Shooting stars (pooled line segments) ---
    const SHOOT_COUNT = 8;
    const shooting: {
      line: THREE.Line;
      mat: THREE.LineBasicMaterial;
      active: boolean;
      elapsed: number;
      origin: THREE.Vector3;
      dir: THREE.Vector3;
      speed: number;
    }[] = [];

    for (let s = 0; s < SHOOT_COUNT; s++) {
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geom, mat);
      scene.add(line);
      shooting.push({
        line,
        mat,
        active: false,
        elapsed: 0,
        origin: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        speed: 22 + Math.random() * 14,
      });
    }

    const spawnShootingStar = () => {
      const free = shooting.find((sh) => !sh.active);
      if (!free) return;
      free.active = true;
      free.elapsed = 0;
      const edge = Math.random() > 0.5 ? -1 : 1;
      free.origin.set(
        edge * (35 + Math.random() * 25),
        8 + Math.random() * 18,
        -15 - Math.random() * 25
      );
      free.dir
        .set(-edge * (0.4 + Math.random() * 0.4), -0.35 - Math.random() * 0.35, 0.15 + Math.random() * 0.2)
        .normalize();
      free.speed = 18 + Math.random() * 16;
    };

    let spawnAccumulator = 0;

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0 && clickRef.current) {
        clickRef.current();
      }
    };

    renderer.domElement.style.cursor = 'pointer';
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = Math.max(mountRef.current.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      blackHole.rotation.x += 0.45 * dt;
      blackHole.rotation.y += 0.55 * dt;
      eventHorizon.rotation.y += 0.3 * dt;

      const pulse = 0.85 + Math.sin(clock.elapsedTime * 2.2) * 0.08;
      glowLayers.forEach((g, i) => {
        const base = 0.1 - i * 0.025;
        const mat = g.material as THREE.MeshBasicMaterial;
        mat.opacity = base * pulse + Math.sin(clock.elapsedTime * (1.5 + i * 0.3)) * 0.03;
      });

      galaxyMeshes.forEach((g, i) => {
        g.rotation.z += galaxySpeeds[i] * dt;
      });

      stars.rotation.y += 0.02 * dt;

      pulsars.forEach((p, i) => {
        const s = 0.85 + Math.sin(clock.elapsedTime * (3 + i) + i) * 0.35;
        p.scale.setScalar(s);
        const mat = p.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.75 + Math.sin(clock.elapsedTime * 4 + i) * 0.2;
      });

      nebulaGroup.rotation.z += 0.008 * dt;

      spawnAccumulator += dt;
      if (spawnAccumulator > 0.28 && Math.random() < 0.12) {
        spawnShootingStar();
        spawnAccumulator = 0;
      }

      const streakLen = 9;
      shooting.forEach((sh) => {
        if (!sh.active) return;
        sh.elapsed += dt;
        const traveled = sh.speed * sh.elapsed;
        const dir = sh.dir;
        const start = sh.origin.clone().add(dir.clone().multiplyScalar(traveled));
        const end = start.clone().add(dir.clone().multiplyScalar(streakLen));
        const pos = sh.line.geometry.attributes.position as THREE.BufferAttribute;
        pos.setXYZ(0, start.x, start.y, start.z);
        pos.setXYZ(1, end.x, end.y, end.z);
        pos.needsUpdate = true;
        const fadeIn = Math.min(1, sh.elapsed * 4);
        const fadeOut = traveled > 55 ? Math.max(0, 1 - (traveled - 55) / 25) : 1;
        sh.mat.opacity = fadeIn * fadeOut * 0.88;
        if (traveled > 85 || fadeOut <= 0.02) {
          sh.active = false;
          sh.mat.opacity = 0;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      starGeo.dispose();
      (stars.material as THREE.Material).dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100vw', height: '40vh' }} />;
};

export default SpaceScene;
