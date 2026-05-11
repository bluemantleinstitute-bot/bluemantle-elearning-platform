"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

extend({ UnrealBloomPass });

const ParticleSwarm = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 30000;
  const speedMult = 1;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);
  const color = pColor;
  
  const positions = useMemo(() => {
     const pos = [];
     for(let i=0; i<count; i++) pos.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
     return pos;
  }, []);

  // Material & Geom
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0x00a2cf }), []);
  const geometry = useMemo(() => new THREE.ConeGeometry(0.1, 0.5, 4).rotateX(Math.PI / 2), []);

  const fieldStrength = 1.2;
  const morph = 0.4;
  const flowSpeed = 0.5;
  const jitter = 1.0;

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speedMult;

    for (let i = 0; i < count; i++) {
        const n = i / count;
        const t = time * 0.2 * flowSpeed;
        
        // Spiral with dynamic radius
        const angle = n * Math.PI * 100 + t;
        const radius = 25 + Math.sin(angle * 0.1) * 10;
        
        // Base coordinates
        let x = Math.cos(angle) * radius;
        let z = Math.sin(angle) * radius;
        let y = (n - 0.5) * 180;
        
        // Fractal noise
        const noiseX = Math.sin(n * 50 + t) * Math.cos(n * 20) * fieldStrength * 10;
        const noiseY = Math.cos(n * 40 + t) * fieldStrength * 10;
        const noiseZ = Math.tan(Math.sin(n * 10 + t)) * fieldStrength * 2;
        
        // Micro-animation (vibration)
        const vibX = Math.sin(time * 3.0 + i) * jitter;
        const vibY = Math.cos(time * 2.5 + i * 0.5) * jitter;
        const vibZ = Math.sin(time * 4.0 - i) * jitter;
        
        // Mix and move
        const finalX = x + (noiseX * (1.0 - morph)) + vibX;
        const finalY = y + noiseY + vibY;
        const finalZ = z + (noiseZ * (1.0 - morph)) + vibZ;
        
        // Scale
        const finalZoom = 1.8;
        target.set(finalX * finalZoom, finalY * finalZoom, finalZ * finalZoom);
        
        // Color Palette: Matches Bluemantle branding (Cyan/Azure #00a2cf & #00658d)
        const pulse = Math.sin(time * 2.0 + n * 10.0) * 0.2 + 0.6;
        const lightness = 0.3 + (Math.pow(Math.sin(n * Math.PI + t * 2.0), 4) * 0.4);
        
        if (i % 10 === 0) {
            // Highlight nodes - primary color #00a2cf (Hue: ~0.536)
            color.setHSL(0.536, 1.0, lightness + 0.2);
        } else {
            // Main mass - secondary color #00658d (Hue: ~0.547)
            color.setHSL(0.547, 1.0, lightness * pulse);
        }
        
        positions[i].lerp(target, 0.1);
        dummy.position.copy(positions[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, pColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export function DNABackground() {
  return (
    <div className="hidden dark:block fixed inset-0 w-full h-full z-0 opacity-100 pointer-events-none overflow-hidden transition-opacity duration-700">
      <Canvas camera={{ position: [0, 0, 100], fov: 60 }} gl={{ alpha: true }}>
        <ParticleSwarm />
        <OrbitControls autoRotate={true} autoRotateSpeed={0.5} enableZoom={false} enablePan={false} />
        <Effects disableGamma>
          {/* @ts-ignore */}
          <unrealBloomPass threshold={0} strength={1.8} radius={0.4} />
        </Effects>
      </Canvas>
    </div>
  );
}
