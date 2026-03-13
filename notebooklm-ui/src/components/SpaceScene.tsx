import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SpaceScene: React.FC<{ onBlackHoleClick?: () => void; isOpen?: boolean }> = ({ onBlackHoleClick, isOpen }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000');

    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Black hole
    const blackHoleGeometry = new THREE.TorusGeometry(5, 2, 16, 100);
    const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
    scene.add(blackHole);

    // Animate
    function animate() {
      requestAnimationFrame(animate);
      blackHole.rotation.x += 0.01;
      blackHole.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    animate();

    // Click handler
    renderer.domElement.addEventListener('click', () => {
      if (onBlackHoleClick) onBlackHoleClick();
    });

    return () => {
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [onBlackHoleClick]);

  return <div ref={mountRef} style={{ width: '100vw', height: '40vh' }} />;
};

export default SpaceScene;
