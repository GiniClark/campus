'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Group, Mesh, BoxGeometry, MeshStandardMaterial, Vector3, RepeatWrapping, LinearFilter } from 'three';

// 生成带文字的Canvas纹理
const createTextTexture = (text: string, isQuestionMark: boolean = false, isTopFace: boolean = false) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const size = 512;
  
  canvas.width = size;
  canvas.height = size;

  // 绘制全息背景
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#c4b5fd');
  gradient.addColorStop(0.5, '#ddd6fe');
  gradient.addColorStop(1, '#a78bfa');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // 添加网格纹理
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  
  // 绘制网格线
  const gridSize = 32;
  for (let i = 0; i <= size; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  
  // 绘制黑色边框
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, size, 24);
  ctx.fillRect(0, size - 24, size, 24);
  
  // 在黑色边框上添加小字
  ctx.font = 'bold 16px "Microsoft YaHei"';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DAO DUI KU RUAN QIAN TI GONG', size/2, 12);
  
  if (isQuestionMark) {
    // 绘制问号
    ctx.font = 'bold 180px Arial';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', size/2, size/2);
    
    // 问号外描边
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 4;
    ctx.strokeText('?', size/2, size/2);
  }
  
  if (isTopFace) {
    // 绘制100%得奖文字
    ctx.font = 'bold 80px "Microsoft YaHei"';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('100%得奖', size/2, size/2);
  }

  return canvas;
};

export default function Box({ onOpen, isOpening }: any) {
  const boxRef = useRef<Group>(null);
  
  const materials = useMemo(() => {
    // 生成纹理
    const textures = [
      createTextTexture('', false, true), // 顶面 - 100%得奖
      createTextTexture('', false, false), // 底面 - 只有全息背景
      createTextTexture('', true, false), // 侧面1 - 问号
      createTextTexture('', true, false), // 侧面2 - 问号
      createTextTexture('', true, false), // 侧面3 - 问号
      createTextTexture('', true, false), // 侧面4 - 问号
    ];
    
    return textures.map((canvas, i) => {
      const texture = new CanvasTexture(canvas);
      texture.minFilter = LinearFilter;
      return new MeshStandardMaterial({
        map: texture,
        roughness: 0.3,
        metalness: 0.5
      });
    });
  }, []);

  useFrame((state) => {
    if (!boxRef.current) return;
    
    if (!isOpening) {
      boxRef.current.rotation.y += 0.008;
      boxRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    } else {
      boxRef.current.rotation.x += 0.05;
      boxRef.current.rotation.z += 0.03;
      boxRef.current.scale.lerp(new Vector3(0.5, 0.5, 0.5), 0.1);
    }
  });

  return (
    <group
      ref={boxRef}
      onClick={onOpen}
      scale={isOpening ? 0.8 : 1}
    >
      <mesh
        geometry={new BoxGeometry(1, 1, 1)}
        material={materials}
        castShadow
        receiveShadow
      >
        {/* 添加宝石装饰 */}
        <mesh position={[0, -0.51, 0]} rotation={[Math.PI/2, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.01]} />
          <meshStandardMaterial color="black" metalness={0.8} roughness={0.2} />
        </mesh>
      </mesh>
    </group>
  );
}