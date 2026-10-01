import * as THREE from 'three'

/** A deterministic icefield: the live scene and the exported poster use the same geometry. */
export function createIcefield(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  const world = new THREE.Scene()
  world.background = new THREE.Color('#859fa4')
  world.fog = new THREE.FogExp2('#93a9ab', 0.006)
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 450)
  const cameraOrigin = new THREE.Vector3(36, 17, 69)
  const target = new THREE.Vector3(0, 16, -7)
  camera.position.copy(cameraOrigin)
  camera.lookAt(target)
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const instances = new Set<THREE.InstancedMesh>()
  let seed = 95
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  function material(color: string, metalness = 0, roughness = 0.8) {
    const result = new THREE.MeshStandardMaterial({ color, metalness, roughness, flatShading: true })
    materials.add(result)
    return result
  }
  const ice = material('#b2c6c9')
  const darkRock = material('#60797e')
  const hull = material('#35484d', 0.68, 0.37)
  const rim = material('#8d9e9c', 0.7, 0.3)
  const glass = material('#192e34', 0.8, 0.18)
  const light = new THREE.MeshBasicMaterial({ color: '#fd8a46', toneMapped: false })
  materials.add(light)
  function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D = world) {
    geometries.add(geometry)
    const result = new THREE.Mesh(geometry, mat)
    parent.add(result)
    return result
  }
  world.add(new THREE.HemisphereLight('#dcecf0', '#344649', 3))
  const sun = new THREE.DirectionalLight('#fff1d1', 4)
  sun.position.set(-30, 50, 25)
  world.add(sun)
  const blueLight = new THREE.DirectionalLight('#a4dbe7', 2)
  blueLight.position.set(25, 12, -30)
  world.add(blueLight)

  // Faceted terrain with a clear valley beneath the station.
  const terrain = new THREE.PlaneGeometry(440, 420, 100, 90)
  terrain.rotateX(-Math.PI / 2)
  const vertices = terrain.attributes.position!
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i)
    const z = vertices.getZ(i)
    const wave = Math.sin(x * 0.038 + z * 0.027) * 3 + Math.cos(z * 0.06) * 2
    const peaks = Math.abs(Math.sin(x * 0.024 + 1.2) * Math.cos(z * 0.02)) ** 4 * 24
    const valley = Math.max(0.08, Math.min(1, (Math.abs(x - 8) + Math.abs(z + 5)) / 95))
    vertices.setY(i, (peaks + wave + random() * 1.2) * valley - 5)
  }
  terrain.computeVertexNormals()
  mesh(terrain, ice)

  // Monumental glacial walls behind the station.
  for (let i = 0; i < 24; i++) {
    const radius = 12 + random() * 22
    const height = 28 + random() * 50
    const rock = mesh(new THREE.IcosahedronGeometry(1, 1), i % 3 ? ice : darkRock)
    rock.position.set((i - 12) * 16, height * 0.25 - 10, -75 - random() * 55)
    rock.rotation.set(random() * 0.5, random() * Math.PI, random() * 0.5)
    rock.scale.set(radius, height, radius * (0.65 + random()))
  }

  function station(x: number, y: number, z: number, scale: number) {
    const group = new THREE.Group()
    group.position.set(x, y, z)
    group.scale.setScalar(scale)
    world.add(group)
    const pillar = mesh(new THREE.CylinderGeometry(2.2, 3.8, 26, 24), hull, group)
    pillar.position.y = 7
    for (let i = 0; i < 10; i++) {
      const theta = i / 10 * Math.PI * 2
      const strut = mesh(new THREE.CylinderGeometry(0.15, 0.2, 27, 6), rim, group)
      strut.position.set(Math.cos(theta) * 2.6, 7, Math.sin(theta) * 2.6)
    }
    // A shallow saucer silhouette, machined rims and luminous observation decks.
    const levels = [
      { y: 18, top: 13, bottom: 5, height: 3, mat: hull },
      { y: 20, top: 17.5, bottom: 13, height: 1.3, mat: rim },
      { y: 21.2, top: 18.5, bottom: 17.5, height: 1.1, mat: hull },
      { y: 22, top: 18.7, bottom: 18.5, height: 0.28, mat: light },
      { y: 22.8, top: 17.8, bottom: 18.8, height: 1.35, mat: glass },
      { y: 23.6, top: 18.4, bottom: 18.5, height: 0.28, mat: rim },
      { y: 24.3, top: 13.5, bottom: 18.3, height: 1.2, mat: hull },
      { y: 25, top: 11.5, bottom: 13.5, height: 0.22, mat: light },
      { y: 25.6, top: 8, bottom: 12.5, height: 1, mat: rim },
      { y: 26.2, top: 3, bottom: 8, height: 0.5, mat: hull },
    ]
    for (const level of levels) {
      mesh(new THREE.CylinderGeometry(level.top, level.bottom, level.height, 100), level.mat, group).position.y = level.y
    }
    const dividerGeometry = new THREE.BoxGeometry(0.12, 1.3, 0.4)
    geometries.add(dividerGeometry)
    const dividers = new THREE.InstancedMesh(dividerGeometry, hull, 100)
    const dividerTransform = new THREE.Object3D()
    for (let i = 0; i < 100; i++) {
      const theta = i / 100 * Math.PI * 2
      dividerTransform.position.set(Math.sin(theta) * 18.35, 22.8, Math.cos(theta) * 18.35)
      dividerTransform.rotation.y = theta
      dividerTransform.updateMatrix()
      dividers.setMatrixAt(i, dividerTransform.matrix)
    }
    group.add(dividers)
    instances.add(dividers)
    for (let i = 0; i < 6; i++) {
      const ring = mesh(new THREE.TorusGeometry(6 + i * 1.3, 0.045, 4, 80), rim, group)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 17 + i * 0.38
    }
    for (let i = 0; i < 5; i++) {
      const antenna = mesh(new THREE.CylinderGeometry(0.035, 0.09, 5 + i % 3 * 2, 6), rim, group)
      antenna.position.set((i - 2) * 1.8, 29, 0)
      const beacon = mesh(new THREE.SphereGeometry(0.13, 8, 6), light, group)
      beacon.position.copy(antenna.position)
      beacon.position.y += (5 + i % 3 * 2) / 2
    }
    const platform = mesh(new THREE.CylinderGeometry(7, 9, 1, 40), hull, group)
    platform.position.y = -3
    return group
  }
  station(17, 0, -8, 1)
  station(-25, -1, -30, 0.55)
  station(51, -3, -62, 0.6)

  // Approach lights establish scale without adding foreground clutter.
  for (let i = 0; i < 24; i++) {
    const z = 48 - i * 2.6
    for (const x of [9, 15]) {
      const post = mesh(new THREE.BoxGeometry(0.13, 0.8, 0.13), hull)
      post.position.set(x, -2.4, z)
      const lamp = mesh(new THREE.BoxGeometry(0.22, 0.1, 0.22), light)
      lamp.position.set(x, -1.95, z)
    }
  }

  const nextCameraPosition = new THREE.Vector3()
  function render(time = 0, pointerX = 0, pointerY = 0) {
    nextCameraPosition.set(cameraOrigin.x + pointerX * 1.5 + Math.sin(time * 0.08) * 0.6, cameraOrigin.y - pointerY * 0.7, cameraOrigin.z)
    camera.position.lerp(nextCameraPosition, 0.035)
    camera.lookAt(target)
    renderer.render(world, camera)
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect()
    if (!width || !height) {
      return
    }
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    render()
  }
  host.appendChild(renderer.domElement)
  resize()
  return {
    render,
    resize,
    dispose() {
      instances.forEach(instance => instance.dispose())
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(mat => mat.dispose())
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
}
