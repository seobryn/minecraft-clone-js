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
  playerFolder.add(player, 'maxSpeed', 1, 20).name('Max Speed')
  playerFolder.add(player.camHelper, 'visible').name('Show Camera Helper')

  gui.add(world.size, 'width', 16, 128, 1).name('Width')
  gui.add(world.size, 'height', 16, 128, 1).name('Height')

  const terrainFolder = gui.addFolder('Terrain')
  terrainFolder.add(world.params, 'seed', 1, 32767, 1).name('Seed')
  terrainFolder.add(world.params.terrain, 'scale', 20, 85, 1).name('Scale')
  terrainFolder.add(world.params.terrain, 'magnitude', 0.1, 1, 0.01).name('Magnitude')
  terrainFolder.add(world.params.terrain, 'offset', 0.1, 1, 0.01).name('Offset')

  const resourcesFolder = gui.addFolder('Resources')
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
