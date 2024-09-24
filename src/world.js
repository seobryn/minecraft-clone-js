import * as THREE from 'three'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'
import { clamp } from './utils/math.utils'
import { RNG } from './utils/rng.utils'
import { blocks, resourcesBlocks } from './block'

const blockGeometry = new THREE.BoxGeometry()

export class World extends THREE.Group {
  /**
   * @type {{
   *  id: number,
   *  instancedId: number
   * }[][][]}
   */
  #mapData = []

  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.5,
      offset: 0.2
    }
  }

  constructor (size = { width: 32, height: 16 }) {
    super()
    this.size = size
  }

  generate () {
    const rng = new RNG(this.params.seed)
    this.#initTerrain()
    this.#generateResources(rng)
    this.#generateTerrain(rng)
    this.#generateMeshes()
  }

  /**
   * Init world terrain data
   */
  #initTerrain () {
    const { width, height } = this.size
    this.#mapData = []

    for (let x = 0; x < width; x += 1) {
      const col = []
      for (let y = 0; y < height; y += 1) {
        const row = []
        for (let z = 0; z < width; z += 1) {
          row.push({
            id: blocks.empty.id,
            instancedId: null
          })
        }
        col.push(row)
      }
      this.#mapData.push(col)
    }
  }

  /**
   * Function to genertate coal, stone, etc... for the world
   */
  #generateResources (rng) {
    const simplex = new SimplexNoise(rng)
    const { width, height } = this.size
    resourcesBlocks.forEach((block) => {
      for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
          for (let z = 0; z < width; z += 1) {
            const val = simplex.noise3d(x / block.scale.x, y / block.scale.y, z / block.scale.z)
            if (val > block.scarcity) {
              this.setBlockId({ x, y, z }, block.id)
            }
          }
        }
      }
    })
  }

  /**
   * Generate world terrain
   */
  #generateTerrain (rng) {
    const simplex = new SimplexNoise(rng)
    const { width, height } = this.size
    const { scale, offset, magnitude } = this.params.terrain

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < width; z++) {
        const val = simplex.noise(x / scale, z / scale)

        const scaledNoise = offset + magnitude * val

        let _height = Math.floor(height * scaledNoise)

        _height = clamp(_height, 0, height - 1)

        for (let y = 0; y <= height; y++) {
          if (y < _height && this.getBlockAt(x, y, z).id === blocks.empty.id) {
            this.setBlockId(
              { x, y, z },
              blocks.dirt.id
            )
          } else if (y === _height) {
            this.setBlockId(
              { x, y, z },
              blocks.grass.id
            )
          } else if (y > _height) {
            this.setBlockId(
              { x, y, z },
              blocks.empty.id
            )
          }
        }
      }
    }
  }

  #generateMeshes () {
    this.clear()

    const { width, height } = this.size
    const maxBlockCount = width * width * height
    const meshes = {}

    Object.values(blocks)
      .filter(b => b.id !== blocks.empty.id)
      .forEach((blockType) => {
        const mesh = new THREE.InstancedMesh(
          blockGeometry,
          blockType.material,
          maxBlockCount
        )
        mesh.name = blockType.name
        mesh.count = 0
        mesh.castShadow = true
        mesh.receiveShadow = true
        meshes[blockType.id] = mesh
      })

    const matrix = new THREE.Matrix4()
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < height; y += 1) {
        for (let z = 0; z < width; z += 1) {
          const blockId = this.getBlockAt(x, y, z).id
          if (blockId === blocks.empty.id) continue

          const mesh = meshes[blockId]

          const instancedId = mesh.count

          if (!this.isBlockObscured({ x, y, z })) {
            matrix.setPosition(x, y, z)
            mesh.setMatrixAt(instancedId, matrix)
            this.setBlockInstancedId({ x, y, z }, instancedId)
            mesh.count += 1
          }
        }
      }
    }

    this.add(...Object.values(meshes))
  }

  // #region Helper Functions
  /**
   * Gets the block at the given position (x, y, z)
   *
   * @param {number} x - block x position
   * @param {number} y - block y position
   * @param {number} z - block z position
   * @returns {{id: number, instancedId: number} | null}
   */
  getBlockAt (x, y, z) {
    if (this.isInBounds(x, y, z)) {
      return this.#mapData[x][y][z]
    } else {
      return null
    }
  }

  /**
   * Verify if the given position (x, y, z) is in bounds
   *
   * @param {number} x - x position
   * @param {number} y - y position
   * @param {number} z - z position
   * @returns {boolean}
   */
  isInBounds (x, y, z) {
    const { width, height } = this.size

    const xIsInBounds = x >= 0 && x < width
    const yIsInBounds = y >= 0 && y < height
    const zIsInBounds = z >= 0 && z < width

    if (xIsInBounds && yIsInBounds && zIsInBounds) {
      return true
    } else {
      return false
    }
  }

  isBlockObscured ({ x, y, z }) {
    const up = this.getBlockAt(x, y + 1, z)?.id ?? blocks.empty.id
    const down = this.getBlockAt(x, y - 1, z)?.id ?? blocks.empty.id
    const left = this.getBlockAt(x - 1, y, z)?.id ?? blocks.empty.id
    const right = this.getBlockAt(x + 1, y, z)?.id ?? blocks.empty.id
    const front = this.getBlockAt(x, y, z + 1)?.id ?? blocks.empty.id
    const back = this.getBlockAt(x, y, z - 1)?.id ?? blocks.empty.id

    if (
      up === blocks.empty.id ||
      down === blocks.empty.id ||
      left === blocks.empty.id ||
      right === blocks.empty.id ||
      front === blocks.empty.id ||
      back === blocks.empty.id
    ) {
      return false
    } else {
      return true
    }
  }

  /**
   * Sets the block Id at the given position (x, y, z)
   *
   * @param {{x: number, y: number, z: number}} postion
   * @param {number} id
   * @returns {void}
   */
  setBlockId (postion, id) {
    const { x, y, z } = postion
    if (this.isInBounds(x, y, z)) {
      this.#mapData[x][y][z].id = id
    }
  }

  /**
   * Sets the block InstancedId at the given position (x, y, z)
   *
   * @param {{x: number, y: number, z: number}} postion
   * @param {number} id
   * @returns {void}
   */
  setBlockInstancedId (postion, id) {
    const { x, y, z } = postion
    if (this.isInBounds(x, y, z)) {
      this.#mapData[x][y][z].instancedId = id
    }
  }
  // #endregion
}
