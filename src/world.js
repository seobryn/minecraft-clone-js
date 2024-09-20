import * as THREE from 'three'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'
import { clamp } from './utils/math.utils'
import { RNG } from './utils/rng.utils'

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
    this.#initTerrain()
    this.#generateTerrain()
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
            id: 0,
            instancedId: null
          })
        }
        col.push(row)
      }
      this.#mapData.push(col)
    }
  }

  /**
   * Generate world terrain
   */
  #generateTerrain () {
    const simplex = new SimplexNoise(new RNG(this.params.seed))
    const { width, height } = this.size
    const { scale, offset, magnitude } = this.params.terrain

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < width; z++) {
        const val = simplex.noise(
          x / scale,
          z / scale
        )

        const scaledNoise = offset + magnitude * val

        let _height = Math.floor(height * scaledNoise)

        _height = clamp(_height, 0, height - 1)

        for (let y = 0; y <= _height; y++) {
          this.setBlockId({ x, y, z }, 1)
        }
      }
    }
  }

  #generateMeshes () {
    this.clear()

    const { width, height } = this.size
    const maxBlockCount = width * width * height
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1)
    const blockMaterial = new THREE.MeshLambertMaterial({ color: '#127324' })
    const mesh = new THREE.InstancedMesh(blockGeometry, blockMaterial, maxBlockCount)
    mesh.count = 0

    const matrix = new THREE.Matrix4()
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < height; y += 1) {
        for (let z = 0; z < width; z += 1) {
          const blockId = this.getBlockAt(x, y, z).id
          const instancedId = mesh.count

          if (blockId !== 0) {
            matrix.setPosition(x + 0.5, y + 0.5, z + 0.5)
            mesh.setMatrixAt(instancedId, matrix)
            this.setBlockInstancedId({ x, y, z }, instancedId)
            mesh.count += 1
          }
        }
      }
    }

    this.add(mesh)
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
