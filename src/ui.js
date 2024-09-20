import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

export function createUI (world) {
  const gui = new GUI()

  gui.add(world.size, 'width', 16, 128, 1).name('Width')
  gui.add(world.size, 'height', 16, 128, 1).name('Height')

  const terrainFolder = gui.addFolder('Terrain')
  terrainFolder.add(world.params, 'seed', 1, 32767, 1).name('Seed')
  terrainFolder.add(world.params.terrain, 'scale', 20, 85, 1).name('Scale')
  terrainFolder.add(world.params.terrain, 'magnitude', 0.1, 1, 0.01).name('Magnitude')
  terrainFolder.add(world.params.terrain, 'offset', 0.1, 1, 0.01).name('Offset')

  gui.onChange(() => {
    world.generate()
  })
}
