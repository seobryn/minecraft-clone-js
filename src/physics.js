import { blocks } from './block'
import * as THREE from 'three'
import { clamp } from './utils/math.utils'
import { config } from './config'

const collisionMat = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.2
})
const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001)

const contactMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
const contactGeometry = new THREE.SphereGeometry(0.05, 6, 6)

export class Physics {
  simulationRate = 200
  timeStep = 1 / this.simulationRate
  accumulator = 0

  gravity = 32

  /**
   *
   * @param {THREE.Scene} scene
   */
  constructor (scene) {
    this.helpers = new THREE.Group()
    scene.add(this.helpers)
  }

  /**
   * Moves the physics simulation forward in time by (delta)
   * @param {number} delta
   * @param {import("./player").Player} player
   * @param {import("./world").World} world
   */
  update (delta, player, world) {
    this.accumulator += delta

    while (this.accumulator >= this.timeStep) {
      if (config.environment === 'dev') {
        this.helpers.clear()
      }
      player.velocity.y -= this.gravity * this.timeStep
      player.update(this.timeStep)
      this.detectCollisions(player, world)
      this.accumulator -= this.timeStep
    }
  }

  /**
   *
   * @param {import('./player').Player} player - The player object
   * @param {import('./world').World} world - The world object
   */
  detectCollisions (player, world) {
    player.isOnGround = false
    const candidates = this.#broadPhase(player, world)

    const collisions = this.#narrowPhase(candidates, player)

    if (collisions.length > 0) {
      this.#resolveCollisions(collisions, player)
    }
  }

  /**
   *
   * @param {import('./player').Player} player
   * @param {import('./world').World} world
   * @returns
   */
  #broadPhase (player, world) {
    const candidates = []

    const extents = {
      x: {
        min: Math.floor(player.pos.x - player.radius),
        max: Math.ceil(player.pos.x + player.radius)
      },
      y: {
        min: Math.floor(player.pos.y - player.height),
        max: Math.ceil(player.pos.y)
      },
      z: {
        min: Math.floor(player.pos.z - player.radius),
        max: Math.ceil(player.pos.z + player.radius)
      }
    }

    // Loop Blocks within the player's bounding box
    for (let x = extents.x.min; x <= extents.x.max; x++) {
      for (let y = extents.y.min; y <= extents.y.max; y++) {
        for (let z = extents.z.min; z <= extents.z.max; z++) {
          const block = world.getBlockAt(x, y, z)
          if (block && block.id !== blocks.empty.id) {
            const blockPos = { x, y, z }
            candidates.push(blockPos)
            if (config.environment === 'dev') {
              this.#addCollisionHelper(blockPos)
            }
          }
        }
      }
    }

    return candidates
  }

  /**
   *
   * @param {{x: number, y: number, z: number}[]} candidates
   * @param {import('./player').Player} player
   * @return {*}
   */
  #narrowPhase (candidates, player) {
    const collisions = []
    for (const block of candidates) {
      const p = player.pos

      // 1. Determine the closes point to the block
      const closestPoint = {
        x: clamp(p.x, block.x - 0.5, block.x + 0.5),
        y: clamp(p.y - (player.height / 2), block.y - 0.5, block.y + 0.5),
        z: clamp(p.z, block.z - 0.5, block.z + 0.5)
      }

      // 2. Check if the point is inside player bounding cylinder
      // Get the distance along each axis between closest point and the center of the player cylinder
      const dx = closestPoint.x - p.x
      const dy = closestPoint.y - (p.y - (player.height / 2))
      const dz = closestPoint.z - p.z

      if (this.isInsidePlayer(closestPoint, player)) {
        const overlapY = (player.height / 2) - Math.abs(dy)
        const overlapXZ = player.radius - Math.sqrt(dx * dx + dz * dz)

        // Calculate the normal of the collision
        let normal, overlap
        if (overlapY < overlapXZ) {
          normal = new THREE.Vector3(0, -Math.sign(dy), 0)
          overlap = overlapY
          player.isOnGround = true
        } else {
          normal = new THREE.Vector3(-dx, 0, -dz).normalize()
          overlap = overlapXZ
        }

        // Add the collision
        collisions.push({
          block,
          contactPoint: closestPoint,
          normal,
          overlap
        })
        if (config.environment === 'dev') {
          this.#addContactHelper(closestPoint)
        }
      }
    }

    return collisions
  }

  /**
   *
   * @param {any[]} collisions
   * @param {import("./player").Player"} player
   */
  #resolveCollisions (collisions, player) {
    // 1. Sort collisions from the smallest overlap to the largest
    collisions.sort((a, b) => a.overlap < b.overlap)

    // 2. Resolve the collision
    for (const collision of collisions) {
      // Avoid to re Check if the player is colliding with other blocks
      if (!this.isInsidePlayer(collision.contactPoint, player)) continue

      // 2.1. Adjust the player position so the block is no longer overlapping
      const deltaPos = collision.normal.clone()
      deltaPos.multiplyScalar(collision.overlap)
      player.pos.add(deltaPos)

      // 2.2 Negate player's velocity along the collision normal
      const magnitude = player.worldVel.dot(collision.normal)
      // 2.3 Remove that part of the velocity from the player's velocity
      const velAdjustment = collision.normal.clone().multiplyScalar(magnitude)
      player.applyWorldVel(velAdjustment.negate())
    }
  }

  /**
   * Visual collision helper
   * @param {THREE.Object3D} block
   */
  #addCollisionHelper (block) {
    const blockMesh = new THREE.Mesh(collisionGeometry, collisionMat)
    blockMesh.position.copy(block)
    this.helpers.add(blockMesh)
  }

  /**
   * Show the contact to the point 'p'
   * @param {{x: number, y: number, z: number}} p
   */
  #addContactHelper (p) {
    const contactMesh = new THREE.Mesh(contactGeometry, contactMat)
    contactMesh.position.copy(p)
    this.helpers.add(contactMesh)
  }

  /**
   * Returns if the point is inside the player bounding cylinder
   *
   * @param {{x: number, y: number, z: number}} p
   * @param {import("./player").Player} player
   * @returns {boolean}
   */
  isInsidePlayer (p, player) {
    const dx = p.x - player.pos.x
    const dy = p.y - (player.pos.y - (player.height / 2))
    const dz = p.z - player.pos.z

    const rSQ = dx * dx + dz * dz

    return (Math.abs(dy) < player.height / 2) && (rSQ < player.radius * player.radius)
  }
}
