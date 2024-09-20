import './styles/style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { config } from './config'
import { World } from './world'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { createUI } from './ui'

const { innerHeight, innerWidth, devicePixelRatio } = window
const stats = new Stats()

const renderer = new THREE.WebGLRenderer()
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(devicePixelRatio)
renderer.setClearColor(0x80a0e0)

document.body.appendChild(renderer.domElement)
document.body.appendChild(stats.dom)

// Camera setup
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000)
camera.position.set(-64, 64, -64)
camera.lookAt(0, 0, 0)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(32, 0, 32)

// Scene setup
const scene = new THREE.Scene()

const world = new World(config.mapSize)
world.generate()
scene.add(world)

function setupLights () {
  const light1 = new THREE.DirectionalLight()
  light1.position.set(1, 1, 1)
  scene.add(light1)

  const light2 = new THREE.DirectionalLight()
  light2.position.set(-1, 1, -0.5)
  scene.add(light2)

  const ambient = new THREE.AmbientLight()
  ambient.intensity = 0.1
  scene.add(ambient)
}

// Render Loop
function update (deltaTime) {
  window.requestAnimationFrame(update)
  renderer.render(scene, camera)
  stats.update()
}

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

setupLights()
createUI(world)
update(0)
