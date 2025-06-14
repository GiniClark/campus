// 'use client';

// import { useRef, useEffect } from 'react';
// import { useFrame } from '@react-three/fiber';
// import { Group, Vector3, Mesh, BufferGeometry, MeshBasicMaterial, Color } from 'three';

// export default function Particles({ count = 100 }: { count?: number }) {
//   const groupRef = useRef<Group>(null);
//   const particles = useRef<Mesh<BufferGeometry, MeshBasicMaterial>[]>([]);

//   useEffect(() => {
//     if (groupRef.current) {
//       // 初始化粒子位置
//       groupRef.current.children.forEach((particle) => {
//         const p = particle as Mesh<BufferGeometry, MeshBasicMaterial>;
//         p.position.set(0, 0, 0);
//         p.scale.set(1, 1, 1);
//         p.material.color.setHSL(Math.random(), 1, 0.5);
//       });
//     }
//     return () => {
//       if (groupRef.current) {
//         groupRef.current.children.forEach((p) => {
//           (p as Mesh).geometry.dispose();
//           (p as Mesh).material.dispose();
//         });
//       }
//     };
//   }, []);

//   useFrame(() => {
//     if (!groupRef.current) return;
    
//     groupRef.current.children.forEach((particle, i) => {
//       const p = particle as Mesh<BufferGeometry, MeshBasicMaterial>;
//       p.position.x += (Math.random() - 0.5) * 0.2;
//       p.position.y += (Math.random() - 0.5) * 0.2;
//       p.position.z += (Math.random() - 0.5) * 0.2;
//       p.scale.multiplyScalar(0.97);
//       p.material.opacity *= 0.98;
//     });
//   });

//   return (
//     <group ref={groupRef}>
//       {Array.from({ length: count }).map((_, i) => (
//         <mesh key={i} position={[0, 0, 0]}>
//           <sphereGeometry args={[0.1, 8, 8]} />
//           <meshBasicMaterial 
//             color={new Color().setHSL(Math.random(), 1, 0.5)} 
//             transparent 
//             opacity={1}
//           />
//         </mesh>
//       ))}
//     </group>
//   );
// }