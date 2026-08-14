"use client";

import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { Float, useTexture } from "@react-three/drei";

const RINPO_IMAGE = "/assets/rinpo-floating.png";

function Rinpo3DModel() {
  const texture = useTexture(RINPO_IMAGE);

  return (
    <Float speed={2} rotationIntensity={0.15} floatIntensity={0.35}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[0.85, 1.15]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.1} depthWrite={false} />
      </mesh>
    </Float>
  );
}

function Rinpo3DScene() {
  return (
    <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 2, 2]} intensity={1} />
      <Rinpo3DModel />
    </Canvas>
  );
}

const Rinpo3DSceneDynamic = dynamic(() => Promise.resolve(Rinpo3DScene), { ssr: false });

export function Rinpo3D() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden" style={{ minHeight: 96 }}>
      <Rinpo3DSceneDynamic />
    </div>
  );
}
