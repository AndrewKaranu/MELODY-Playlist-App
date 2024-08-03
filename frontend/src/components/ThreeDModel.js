import React, { Suspense, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ThreeDModel = () => {
    const gltf = useLoader(GLTFLoader, '/model/playlistApptest.gltf');
  
    useEffect(() => {
      gltf.scene.traverse((node) => {
        if (node.isMesh) {
          node.material.envMapIntensity = 1; // Adjust this value as needed
        }
      });
    }, [gltf]);
  
    // Rotate the model by 90 degrees around the x-axis
    return (
      <primitive object={gltf.scene} rotation={[Math.PI / 2, 0, 2]} />
    );
  };


  export default function ModelViewer() {
    return (
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }} // Adjust these values as needed
        style={{ width: '100%', height: '100%' }}
        className="model-canvas"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
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
