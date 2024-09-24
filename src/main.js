import './styles/style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { config } from './config'
import { World } from './world'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { createUI } from './ui'
import { Player } from './player'
import { Physics } from './physics'

const { innerHeight, innerWidth, devicePixelRatio } = window
const stats = new Stats()

const renderer = new THREE.WebGLRenderer()
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(devicePixelRatio)
renderer.setClearColor(0x80a0e0)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

document.body.appendChild(renderer.domElement)
if (config.environment === 'dev') {
  document.body.appendChild(stats.dom)
}

// Camera setup
const orbitCamera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000)
orbitCamera.position.set(-16, 16, -16)
orbitCamera.lookAt(0, 32, 0)

const controls = new OrbitControls(orbitCamera, renderer.domElement)
controls.target.set(64, 0, 64)

// Scene setup
const scene = new THREE.Scene()

const world = new World(config.mapSize)
world.generate()
scene.add(world)

const player = new Player(scene)

const physics = new Physics(scene)

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

  if (config.environment === 'dev') {
    const shadowHelper = new THREE.CameraHelper(sun.shadow.camera)
    scene.add(shadowHelper)
  }
  const ambient = new THREE.AmbientLight()
  ambient.intensity = 0.1
  scene.add(ambient)
}

let prevTime = performance.now()

// Render Loop
function update () {
  const currTime = performance.now()
  const deltaTime = (currTime - prevTime) / 1000

  window.requestAnimationFrame(update)
  physics.update(deltaTime, player, world)
  renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera)
  stats.update()

  prevTime = currTime
}

window.addEventListener('resize', () => {
  player.camera.aspect = innerWidth / innerHeight
  player.camera.updateProjectionMatrix()
  orbitCamera.aspect = innerWidth / innerHeight
  orbitCamera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

setupLights()
createUI(world, player)
update()
