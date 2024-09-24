import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { resourcesBlocks } from './block'

/**
 *
 * @param {import('./world').World} world
 * @param {import('./player').Player} player
 */
export function createUI (world, player) {
  const gui = new GUI()

  const playerFolder = gui.addFolder('Player')
  playerFolder.add(player, 'speed', 1, 16).name('Speed')
  playerFolder.add(player, 'runSpeed', 17, 30).name('Run Speed')
  playerFolder.add(player, 'jumpSpeed', 1, 20).name('Jump Speed')

  gui.add(world, 'asyncLoading').name('Load Chunk Async')
  gui.add(world, 'drawDistance', 0, 5, 1).name('Draw Distance')

  const terrainFolder = gui.addFolder('Terrain')
  terrainFolder.add(world.params, 'seed', 1, 32767, 1).name('Seed')
  terrainFolder.add(world.params.terrain, 'scale', 20, 85, 1).name('Scale')
  terrainFolder.add(world.params.terrain, 'magnitude', 0.1, 1, 0.01).name('Magnitude')
  terrainFolder.add(world.params.terrain, 'offset', 0.1, 1, 0.01).name('Offset')

  const resourcesFolder = gui.addFolder('Resources')
  resourcesFolder.close()
  resourcesBlocks.forEach((block) => {
    const resourceFolder = resourcesFolder.addFolder(block.name)
    resourceFolder.add(block, 'scarcity', 0, 1).name('Scarcity')

    const scaleFolder = resourceFolder.addFolder('Scale')
    scaleFolder.add(block.scale, 'x', 10, 100, 1).name('X')
    scaleFolder.add(block.scale, 'y', 10, 100, 1).name('Y')
    scaleFolder.add(block.scale, 'z', 10, 100, 1).name('Z')
  })

  gui.onChange(() => {
    world.generate()
  })
}
