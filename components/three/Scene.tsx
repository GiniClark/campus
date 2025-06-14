// components/three/Scene.tsx 的修复版本
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Box from './Box';

export default function Scene({ 
  onOpen,
  isOpening
}: { 
  onOpen: () => void;
  isOpening: boolean;
}) {
  return (
    <Canvas 
      shadows
      camera={{ position: [0, 0, 3], fov: 45 }}
      // 移除 pointerEvents: 'none'，而是使用覆盖层方案
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0  // 确保Canvas在最底层
      }}
    >
      <ambientLight intensity={0.8} />
      <pointLight 
        position={[5, 5, 5]} 
        color="#7dd3fc"
        intensity={1.2}
        castShadow
      />
      <Environment preset="park" />
      
      <Box onOpen={onOpen} isOpening={isOpening} />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI/3}
        maxPolarAngle={Math.PI/1.8}
        enableRotate={true}
      />
    </Canvas>
  );
}