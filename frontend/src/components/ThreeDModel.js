import React, { Suspense, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// ThreeDModel.js
const ThreeDModel = () => {
  const gltf = useLoader(GLTFLoader, '/model/playlistApptest.gltf');

  useEffect(() => {
    gltf.scene.traverse((node) => {
      if (node.isMesh) {
        node.material.envMapIntensity = 1;
      }
    });
  }, [gltf]);

  const scale = window.innerWidth <= 768 ? [0.8, 0.8, 0.8] : [1.2, 1.2, 1.2];

  return (
    <primitive 
      object={gltf.scene} 
      rotation={[-Math.PI / 2, 0, Math.PI]}
      // scale={scale}
      position={[0, window.innerWidth <= 768 ? -1 : 0, 0]}
    />
  );
};

export default function ModelViewer() {
  return (
    <Canvas
      camera={{ 
        position: [0, 0, window.innerWidth <= 768 ? 4 : 3], 
        fov: window.innerWidth <= 768 ? 70 : 60 
      }}
      style={{ 
        width: '100%',
        height: '100%'
      }}
      className="model-canvas"
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <Suspense fallback={null}>
        <ThreeDModel />
        <OrbitControls 
          enablePan={false} 
          enableZoom={false}
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.5}
        />
      </Suspense>
    </Canvas>
  );
}