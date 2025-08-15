import './App.css'
// src/App.tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Robot } from './components/models/Robot'

export default function App() {
  return (
    <Canvas
      camera={{
        position: [10, 10, 10], // Cámara en diagonal, centrada en el origen
        fov: 60,                 // Campo de visión moderado
        near: 0.1,               // Plano de recorte cercano
        far: 1000                // Plano de recorte lejano
      }}
      style={{
        width: '100vw',  // Ocupa todo el ancho
        height: '100vh', // Ocupa todo el alto
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 3]} intensity={1} />

      <mesh rotation={[0.5, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#44aa88" />
      </mesh>

      {/* El robot 👇 */}
      <Robot position={[10, 0, 0]} rotation={[0, Math.PI / 4, 0]} scale={1.2} />

      <OrbitControls enableDamping />
    </Canvas>
  )
}


