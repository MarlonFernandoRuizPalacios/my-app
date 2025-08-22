import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'

export default function GeometryExplorer() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const currentMeshRef = useRef<THREE.Mesh | null>(null)
  const animRef = useRef<number | null>(null)

  const [wireframe, setWireframe] = useState<boolean>(() => localStorage.getItem("wireframe") === "true")
  const [autoRotate, setAutoRotate] = useState<boolean>(() => localStorage.getItem("autoRotate") !== "false")
  const [activeKey, setActiveKey] = useState<string>('sphere')

  const wireframeRef = useRef(wireframe)
  const autoRotateRef = useRef(autoRotate)

  useEffect(() => {
    wireframeRef.current = wireframe
    localStorage.setItem("wireframe", String(wireframe))
  }, [wireframe])

  useEffect(() => {
    autoRotateRef.current = autoRotate
    localStorage.setItem("autoRotate", String(autoRotate))
  }, [autoRotate])

  // Catálogo de geometrías
  const geometries = useMemo(() => ({
    sphere: {
      name: 'Sphere',
      description: 'Esfera',
      create: () => new THREE.SphereGeometry(1, 32, 16),
      color: '#FF6B6B'
    },
    plane: {
      name: 'Plane',
      description: 'Plano',
      create: () => new THREE.PlaneGeometry(2, 2),
      color: '#6BCB77'
    },
    cone: {
      name: 'Cone',
      description: 'Cono',
      create: () => new THREE.ConeGeometry(1, 2, 16),
      color: '#4D96FF'
    },
    cylinder: {
      name: 'Cylinder',
      description: 'Cilindro',
      create: () => new THREE.CylinderGeometry(1,1,2,16),
      color: '#FFD93D'
    },
    torus: {
      name: 'Torus',
      description: 'Toro',
      create: () => new THREE.TorusGeometry(1,0.3,16,64),
      color: '#FF6EC7'
    },
    torusKnot: {
      name: 'Torus Knot',
      description: 'Nudo Toroidal',
      create: () => new THREE.TorusKnotGeometry(1,0.3,100,16),
      color: '#00C2CB'
    },
    circle: {
      name: 'Circle',
      description: 'Círculo',
      create: () => new THREE.CircleGeometry(1,32),
      color: '#FF914D'
    },
    ring: {
      name: 'Ring',
      description: 'Anillo',
      create: () => new THREE.RingGeometry(0.5,1,32),
      color: '#C04CFD'
    }
  }), [])

  useEffect(() => {
    if (!mountRef.current) return

    // Escena
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    // Cámara
    const { width, height } = mountRef.current.getBoundingClientRect()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(3, 2, 4)
    cameraRef.current = camera

    // Renderer limpio
    if (rendererRef.current) {
      rendererRef.current.dispose()
      if (mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
    }
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Luces
    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 5, 5)
    scene.add(ambient, dir)

    // Helpers
    const axes = new THREE.AxesHelper(2)
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(axes, grid)

    // Función para crear mesh activo
    const createMesh = (key: string) => {
      const { create, color } = geometries[key]
      const geometry = create()
      const material = new THREE.MeshPhongMaterial({ color, wireframe: wireframeRef.current })
      const mesh = new THREE.Mesh(geometry, material)
      return mesh
    }

    // Inicial
    const mesh = createMesh(activeKey)
    currentMeshRef.current = mesh
    scene.add(mesh)

    // Animación
    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      if (autoRotateRef.current && currentMeshRef.current) {
        currentMeshRef.current.rotation.x += 0.01
        currentMeshRef.current.rotation.y += 0.015
      }
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const handleResize = () => {
      if (!mountRef.current) return
      const rect = mountRef.current.getBoundingClientRect()
      const w = rect.width || 800
      const h = rect.height || 600
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      renderer.dispose()
      scene.clear()
    }
  }, [])

  // Cambiar geometría activa
  useEffect(() => {
    if (!sceneRef.current || !geometries[activeKey]) return
    const scene = sceneRef.current

    // Quitar mesh anterior
    if (currentMeshRef.current) {
      scene.remove(currentMeshRef.current)
      currentMeshRef.current.geometry.dispose()
      ;(currentMeshRef.current.material as THREE.Material).dispose()
    }

    // Crear y agregar nuevo
    const { create, color } = geometries[activeKey]
    const geometry = create()
    const material = new THREE.MeshPhongMaterial({ color, wireframe: wireframeRef.current })
    const mesh = new THREE.Mesh(geometry, material)
    currentMeshRef.current = mesh
    scene.add(mesh)
  }, [activeKey, geometries])

  // Wireframe dinámico
  useEffect(() => {
    if (!currentMeshRef.current) return
    const mat = currentMeshRef.current.material as THREE.MeshPhongMaterial
    mat.wireframe = wireframe
    mat.needsUpdate = true
  }, [wireframe])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Panel lateral */}
      <div style={{
        position: 'absolute',
        left: 12,
        top: 12,
        display: 'grid',
        gap: 6,
        background: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 8
      }}>
        {Object.entries(geometries).map(([key, g]) => (
          <button
            key={key}
            onClick={() => setActiveKey(key)}
            style={{
              background: activeKey === key ? '#555' : '#222',
              color: 'white',
              padding: '4px 8px',
              border: '1px solid #444',
              cursor: 'pointer'
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Controles Rotar/Wireframe */}
      <div style={{ position: 'absolute', right: 12, top: 12, display: 'grid', gap: 8 }}>
        <button onClick={() => setAutoRotate(!autoRotate)}>
          {autoRotate ? '⏸️ Pausar Rotación' : '▶️ Reanudar Rotación'}
        </button>
        <button onClick={() => setWireframe(!wireframe)}>
          {wireframe ? '🔲 Sólido' : '🔳 Wireframe'}
        </button>
      </div>
    </div>
  )
}
