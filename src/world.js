import * as THREE from 'three'
import { WorldChunk } from './worldChunk'

export class World extends THREE.Group {
  /**
   * Loads chunks async
   */
  asyncLoading = true
  /**
   * The distance in chunks the player can see.
   * Example:
   *  - When is set to 0 only the chunk that the player is currently in will be visible.
   *  - If it is set to 1, the adjacent chunks will be visible.
   *  - If it is set to 2, the 3x3 chunks around the player will be visible.
   */
  drawDistance = 2

  chunkSize = {
    width: 32,
    height: 32
  }

  params = {
    seed: 0,
    terrain: {
      scale: 60,
      magnitude: 0.2,
      offset: 0.2
    }
  }

  constructor (seed = 0) {
    super()
    this.seed = seed
  }

  generate () {
    this.disposeChunks()

    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        this.generateChunk(x, z)
      }
    }
  }

  /**
   *  Updates visible portions of the world based on the player position
   *
   * @param {import('./player').Player} player
   */
  update (player) {
    // 1. Find visibile chunks based on the player position
    const visibleChunks = this.getVisibleChunks(player)
    // 2. Compare with the current set of chunks
    const chunksToAdd = this.getChunksToAdd(visibleChunks)
    // 3. Remove chunks that are no longer visible
    const chunksToRemove = this.getUnusedChunks(visibleChunks)

    for (const chunk of chunksToRemove) {
      chunk.disposeInstances()
      this.remove(chunk)
    }
    // 4. Add chunks that are newly visible
    chunksToAdd.forEach((chunk) => {
      this.generateChunk(chunk.x, chunk.z)
    })
  }

  /**
   * Returns an array containing the coords of the chunks that are not loaded yet
   *
   * @param {{x: number, z: number}[]} visibleChunks
   * @returns {{x: number, z: number}[]}
   */
  getChunksToAdd (visibleChunks) {
    return visibleChunks.filter(
      (chunk) => {
        const chunkExists = this.children
          .map((obj) => obj.userData)
          .find(({ x, z }) => x === chunk.x && z === chunk.z)
        return !chunkExists
      }
    )
  }

  /**
   * Get chunks that are no longer visible
   *
   * @param {{x: number, z: number}[]} visibleChunks
   * @returns {import('./worldChunk').WorldChunk[]}
   */
  getUnusedChunks (visibleChunks) {
    return this.children.filter(
      ({ userData }) => {
        const chunkExists = visibleChunks.find((visibleChunk) => visibleChunk.x === userData.x && visibleChunk.z === userData.z)
        return !chunkExists
      }
    )
  }

  /**
   * Returns an array of coordinates of the visible chunks
   * @param {import("./player").Player} player
   * @returns {{x: number, z: number}[]}
   */
  getVisibleChunks (player) {
    const visibleChunks = []

    const coords = this.worldToChunkCoords(player.pos.x, player.pos.y, player.pos.z)

    const { x: chunkX, z: chunkZ } = coords.chunk
    for (let x = chunkX - this.drawDistance; x <= chunkX + this.drawDistance; x += 1) {
      for (let z = chunkZ - this.drawDistance; z <= chunkZ + this.drawDistance; z += 1) {
        visibleChunks.push({ x, z })
      }
    }

    return visibleChunks
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instancedId: number} | null}
   */
  getBlockAt (x, y, z) {
    const coords = this.worldToChunkCoords(x, y, z)
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z)

    if (chunk && chunk.isLoaded) {
      return chunk.getBlockAt(coords.block.x, coords.block.y, coords.block.z)
    }

    return null
  }

  /**
   * Generate chunk at give position
   *
   * @param {number} x
   * @param {number} z
   */
  generateChunk (x, z) {
    const chunk = new WorldChunk(this.chunkSize, this.params)
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width)
    chunk.userData = { x, z }
    if (this.asyncLoading) {
      window.requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 })
    } else {
      chunk.generate()
    }
    this.add(chunk)
  }

  /**
   * Returns the coordinates of the block at (x,y,z)
   *  - `chunk` is the coordinates of the chunk containing the block
   *  - `block` is the coordinates of the block relative to the chunk
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{
   *  chunk: {x: number, y: number, z: number},
   *  block: {x: number, y: number, z: number}
   * }}
   */
  worldToChunkCoords (x, y, z) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width)
    }

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z
    }

    return { chunk: chunkCoords, block: blockCoords }
  }

  /**
   * Get The chunk at the given coordinates
   *
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk | null}
   */
  getChunk (chunkX, chunkZ) {
    return this.children.find((chunk) => {
      return chunk.userData.x === chunkX && chunk.userData.z === chunkZ
    })
  }

  disposeChunks () {
    this.traverse((chunk) => {
      if (chunk.disposeInstances) {
        chunk.disposeInstances()
      }
    })
    this.clear()
  }
}
