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
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

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
  const sun = new THREE.DirectionalLight()
  sun.position.set(64, 64, 128)
  sun.castShadow = true
  sun.shadow.camera.left = -128
  sun.shadow.camera.right = 128
  sun.shadow.camera.top = 128
  sun.shadow.camera.bottom = -128
  sun.shadow.camera.near = 0.1
  sun.shadow.camera.far = 200
  sun.shadow.bias = -0.0001
  sun.shadow.mapSize = new THREE.Vector2(512, 512)

  scene.add(sun)

  const shadowHelper = new THREE.CameraHelper(sun.shadow.camera)
  scene.add(shadowHelper)
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
