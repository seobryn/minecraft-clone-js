import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { $ } from './utils/domUtils'
import { config } from './config'

const { innerHeight, innerWidth } = window

const defaultPos = [32, 16, 32]

export class Player {
  // Player size for collisions
  radius = 0.5
  height = 1.75

  isOnGround = false

  jumpSpeed = 10
  speed = 10
  runSpeed = 20

  input = new THREE.Vector3()
  velocity = new THREE.Vector3()
  #worldVel = new THREE.Vector3()

  camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 200)
  camHelper = new THREE.CameraHelper(this.camera)
  controls = new PointerLockControls(this.camera, document.body)

  /**
   *
   * @param {THREE.Scene} scene
   */
  constructor (scene) {
    this.camera.position.set(...defaultPos)
    scene.add(this.camera)
    if (config.environment === 'dev') {
      scene.add(this.camHelper)
    }

    this.$info = $('#player-position')
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    if (config.environment === 'dev') {
      this.boundsHelper = new THREE.Mesh(
        new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
        new THREE.MeshBasicMaterial({ wireframe: true })
      )
      scene.add(this.boundsHelper)
    }
  }

  get worldVel () {
    this.#worldVel.copy(this.velocity)
    this.#worldVel.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0))
    return this.#worldVel
  }

  /**
   * Applies a change in velocity that us specified in the world frame
   *
   * @param {THREE.Vector3} dv
   */
  applyWorldVel (dv) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0))
    this.velocity.add(dv)
  }

  update (dt) {
    const { x, z } = this.input
    if (this.controls.isLocked) {
      this.velocity.x = x
      this.velocity.z = z
      this.controls.moveRight(this.velocity.x * dt)
      this.controls.moveForward(this.velocity.z * dt)
      this.pos.y += this.velocity.y * dt

      this.$info.textContent = this.toString()
    }
    if (config.environment === 'dev') {
      this.#updateBoundsHelper()
    }
  }

  #updateBoundsHelper () {
    this.boundsHelper.position.copy(this.pos)
    this.boundsHelper.position.y -= this.height / 2
  }

  /**
   * Get the camera position
   * @type {THREE.Vector3}
   */
  get pos () {
    return this.camera.position
  }

  /**
   * Handle keyboard down events
   * @param {KeyboardEvent} event
   */
  onKeyDown (event) {
    if (!this.controls.isLocked) {
      this.controls.lock()
    }

    const _speed = event.shiftKey ? this.runSpeed : this.speed

    switch (event.code) {
      case 'KeyW':
        this.input.z = _speed
        break
      case 'KeyA':
        this.input.x = -_speed
        break
      case 'KeyS':
        this.input.z = -_speed
        break
      case 'KeyD':
        this.input.x = _speed
        break
      case 'KeyR':
        if (event.shiftKey) {
          this.camera.position.set(...defaultPos)
          this.velocity.set(0, 0, 0)
        }
        break
    }

    if (event.code === 'Space' && this.isOnGround) {
      this.velocity.y = this.jumpSpeed
    }
  }

  /**
   * Handle keyboard up events
   * @param {KeyboardEvent} event
   */
  onKeyUp (event) {
    switch (event.code) {
      case 'KeyW':
        this.input.z = 0
        break
      case 'KeyA':
        this.input.x = 0
        break
      case 'KeyS':
        this.input.z = 0
        break
      case 'KeyD':
        this.input.x = 0
        break
    }
  }

  toString () {
    return `X: ${this.pos.x.toFixed(3)} Y: ${this.pos.y.toFixed(3)} Z: ${this.pos.z.toFixed(3)}`
  }
}
